/**
 * Moves shoot-type-specific content out of the service area `content` JSON and
 * onto each `ShootType` row.
 *
 * The legacy `*ByOption` maps were keyed inconsistently (option id, trimmed
 * label, raw label, or `option-{index}`), so key lookup here mirrors the exact
 * fallback order the readers used before this refactor. Every resolution is
 * logged with the key it matched so the result can be audited.
 *
 * Idempotent: a service area whose content no longer carries any legacy key is
 * skipped. Supports `--dry-run`.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/prisma";

const DRY_RUN = process.argv.includes("--dry-run");

type GalleryMedia = {
  url: string;
  alt?: string;
  type?: "image" | "video";
};

type DetailSection = {
  id: string;
  title: string;
  body: string;
  tags?: string[];
  sortOrder: number;
};

type WorkflowStage = {
  id: string;
  label: string;
  kind: "builtin" | "custom";
  builtinKey?: string;
  daysAfterPrevious?: number;
};

type LegacyContent = {
  services?: unknown;
  requestFieldLabels?: unknown;
  scheduleType?: "outdoor" | "indoor";
  highlightTags?: string[];
  highlightTagsByOption?: Record<string, string[]>;
  optionIconKeys?: Record<string, string>;
  galleryImages?: unknown;
  galleryMediaByOption?: Record<string, GalleryMedia[]>;
  detailSections?: DetailSection[];
  detailSectionsByOption?: Record<string, DetailSection[]>;
  inspectEnabledByOption?: Record<string, boolean>;
  workflowStageTagsByOption?: Record<string, Record<string, string[]>>;
  workflowStages?: WorkflowStage[];
  workflowStagesByOption?: Record<string, WorkflowStage[]>;
  serviceGridColor?: string;
  serviceTextColor?: string;
  serviceSubTextColor?: string;
};

type ShootTypeContent = {
  galleryMedia?: GalleryMedia[];
  detailSections?: DetailSection[];
  inspectEnabled?: boolean;
  workflowStages?: WorkflowStage[];
  workflowStageTags?: Record<string, string[]>;
};

/** Keys removed from ServiceArea.content once their data lives on ShootType. */
const LEGACY_CONTENT_KEYS = [
  "highlightTags",
  "highlightTagsByOption",
  "optionIconKeys",
  "galleryImages",
  "galleryMediaByOption",
  "detailSections",
  "detailSectionsByOption",
  "inspectEnabledByOption",
  "workflowStageTagsByOption",
  "workflowStages",
  "workflowStagesByOption",
  "scheduleType",
  "serviceGridColor",
  "serviceTextColor",
  "serviceSubTextColor",
] as const satisfies readonly (keyof LegacyContent)[];

const BUILTIN_STAGE_ORDER = [
  "rezervasyon",
  "cekim",
  "dijital",
  "secim",
  "duzenleme",
  "baski",
] as const;

const BUILTIN_LABELS: Record<string, string> = {
  rezervasyon: "Rezervasyon",
  cekim: "Çekim",
  dijital: "Dijital",
  secim: "Seçim",
  duzenleme: "Düzenleme",
  baski: "Baskı",
};

function defaultBuiltinStages(
  scheduleType: "outdoor" | "indoor",
): WorkflowStage[] {
  return BUILTIN_STAGE_ORDER.filter(
    (id) => id !== "baski" || scheduleType === "outdoor",
  ).map((builtinKey) => ({
    id: builtinKey,
    label: BUILTIN_LABELS[builtinKey],
    kind: "builtin" as const,
    builtinKey,
  }));
}

/** Candidate keys in the same order the legacy readers tried them. */
function candidateKeys(shootTypeId: string, label: string): string[] {
  return [shootTypeId, label.trim(), label].filter(
    (key, index, all) => Boolean(key) && all.indexOf(key) === index,
  );
}

/** Presence-based lookup (id → trimmed label → raw label → tr-lowercase label). */
function lookup<T>(
  source: Record<string, T> | undefined,
  shootTypeId: string,
  label: string,
): { value: T; key: string } | null {
  if (!source) return null;

  for (const key of candidateKeys(shootTypeId, label)) {
    if (source[key] !== undefined) {
      return { value: source[key], key };
    }
  }

  const lower = label.trim().toLocaleLowerCase("tr");
  if (!lower) return null;
  for (const [key, value] of Object.entries(source)) {
    if (key.trim().toLocaleLowerCase("tr") === lower) {
      return { value, key };
    }
  }
  return null;
}

/** Same as `lookup` but skips empty arrays, matching the `?.length` guards. */
function lookupList<T>(
  source: Record<string, T[]> | undefined,
  shootTypeId: string,
  label: string,
): { value: T[]; key: string } | null {
  if (!source) return null;

  for (const key of candidateKeys(shootTypeId, label)) {
    if (source[key]?.length) {
      return { value: source[key], key };
    }
  }

  const lower = label.trim().toLocaleLowerCase("tr");
  if (!lower) return null;
  for (const [key, value] of Object.entries(source)) {
    if (!value?.length) continue;
    if (key.trim().toLocaleLowerCase("tr") === lower) {
      return { value, key };
    }
  }
  return null;
}

function parseDetailSectionTitle(title: string): {
  title: string;
  tags: string[];
} {
  const tags: string[] = [];
  const tagPattern = /\(([^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = tagPattern.exec(title)) !== null) {
    const tag = match[1]?.trim();
    if (tag) tags.push(tag);
  }
  const cleanTitle = title.replace(/\s*\([^)]+\)/g, "").trim();
  return { title: cleanTitle || title.trim(), tags };
}

function normalizeDetailSection(section: DetailSection): DetailSection {
  const existingTags = section.tags ?? [];
  if (existingTags.length > 0) return { ...section, tags: existingTags };
  if (!section.title.includes("(")) return { ...section, tags: [] };
  const parsed = parseDetailSectionTitle(section.title);
  return { ...section, title: parsed.title, tags: parsed.tags };
}

function normalizeDetailSections(
  sections: DetailSection[] | undefined,
): DetailSection[] {
  return (sections ?? [])
    .map(normalizeDetailSection)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * `resolveDetailSectionsForOption` collected every matching key and kept the
 * longest list, so the same tie-break is applied here.
 */
function resolveDetailSections(
  byOption: Record<string, DetailSection[]> | undefined,
  shootTypeId: string,
  label: string,
): { value: DetailSection[]; key: string } | null {
  if (!byOption) return null;

  const matches: Array<{ value: DetailSection[]; key: string }> = [];
  for (const key of candidateKeys(shootTypeId, label)) {
    if (byOption[key]?.length) matches.push({ value: byOption[key], key });
  }

  if (matches.length === 0) {
    const lower = label.trim().toLocaleLowerCase("tr");
    for (const [key, sections] of Object.entries(byOption)) {
      if (!sections?.length) continue;
      if (
        key === shootTypeId ||
        (lower && key.trim().toLocaleLowerCase("tr") === lower)
      ) {
        matches.push({ value: sections, key });
      }
    }
  }

  if (matches.length === 0) return null;
  return matches.reduce((best, current) =>
    current.value.length > best.value.length ? current : best,
  );
}

function inferIconKey(label: string): string {
  const lower = label.toLowerCase();
  const hasPhoto = lower.includes("fotoğraf") || lower.includes("fotograf");
  const hasVideo = lower.includes("video") || lower.includes("film");
  if (hasVideo) return "Video";
  if (hasPhoto) return "Camera";
  return "Package";
}

function stripLegacyKeys(content: LegacyContent): Record<string, unknown> {
  const next: Record<string, unknown> = { ...content };
  for (const key of LEGACY_CONTENT_KEYS) {
    delete next[key];
  }
  return next;
}

function hasLegacyKeys(content: LegacyContent): boolean {
  return LEGACY_CONTENT_KEYS.some(
    (key) => (content as Record<string, unknown>)[key] !== undefined,
  );
}

async function main() {
  console.log(
    DRY_RUN
      ? "— DRY RUN — no writes will be performed\n"
      : "— APPLYING CHANGES —\n",
  );

  const serviceAreas = await prisma.serviceArea.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      packages: {
        orderBy: { sortOrder: "asc" },
        include: { shootTypes: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  let migratedShootTypes = 0;
  let skippedAreas = 0;
  let migratedAreas = 0;

  for (const serviceArea of serviceAreas) {
    const content = (serviceArea.content ?? {}) as LegacyContent;

    if (!hasLegacyKeys(content)) {
      skippedAreas += 1;
      console.log(
        `SKIP  ${serviceArea.slug} — no legacy content keys (already migrated)`,
      );
      continue;
    }

    migratedAreas += 1;
    console.log(`\n=== ${serviceArea.slug} (${serviceArea.title}) ===`);

    for (const pkg of serviceArea.packages) {
      for (const shootType of pkg.shootTypes) {
        const label = shootType.label;
        const sources: string[] = [];

        const gallery = lookupList(
          content.galleryMediaByOption,
          shootType.id,
          label,
        );
        if (gallery) {
          sources.push(`galleryMedia←"${gallery.key}"(${gallery.value.length})`);
        }

        const detail = resolveDetailSections(
          content.detailSectionsByOption,
          shootType.id,
          label,
        );
        const detailSections = detail
          ? normalizeDetailSections(detail.value)
          : normalizeDetailSections(content.detailSections);
        if (detail) {
          sources.push(`detailSections←"${detail.key}"(${detail.value.length})`);
        } else if (detailSections.length) {
          sources.push(`detailSections←category(${detailSections.length})`);
        }

        const inspect = lookup(
          content.inspectEnabledByOption,
          shootType.id,
          label,
        );
        const inspectEnabled = inspect ? Boolean(inspect.value) : true;
        if (inspect) {
          sources.push(`inspectEnabled←"${inspect.key}"(${inspectEnabled})`);
        }

        // Stage resolution only ever tried id then trimmed label, never a
        // case-insensitive sweep, so `lookupList` order is a superset; the
        // extra sweep can only help where the strict lookup found nothing.
        const stages = lookupList(
          content.workflowStagesByOption,
          shootType.id,
          label,
        );
        let workflowStages: WorkflowStage[];
        if (stages) {
          workflowStages = stages.value;
          sources.push(`workflowStages←"${stages.key}"(${stages.value.length})`);
        } else if (content.workflowStages?.length) {
          workflowStages = content.workflowStages;
          sources.push(`workflowStages←category(${workflowStages.length})`);
        } else {
          workflowStages = defaultBuiltinStages(serviceArea.scheduleType);
          sources.push(
            `workflowStages←default(${serviceArea.scheduleType},${workflowStages.length})`,
          );
        }

        const stageTags = lookup(
          content.workflowStageTagsByOption,
          shootType.id,
          label,
        );
        const workflowStageTags: Record<string, string[]> = {};
        if (stageTags?.value) {
          for (const [stageId, pills] of Object.entries(stageTags.value)) {
            if (Array.isArray(pills)) {
              workflowStageTags[stageId] = pills.filter(Boolean);
            }
          }
          sources.push(
            `workflowStageTags←"${stageTags.key}"(${Object.keys(workflowStageTags).length})`,
          );
        }

        const icon = lookup(content.optionIconKeys, shootType.id, label);
        const iconKey = icon?.value || inferIconKey(label);
        if (icon) sources.push(`iconKey←"${icon.key}"(${iconKey})`);

        const highlight = lookupList(
          content.highlightTagsByOption,
          shootType.id,
          label,
        );
        const tags = (highlight?.value ?? [])
          .map((tag) => String(tag).trim())
          .filter(Boolean)
          .slice(0, 5);
        if (highlight) sources.push(`tags←"${highlight.key}"(${tags.length})`);

        const shootTypeContent: ShootTypeContent = {
          galleryMedia: gallery?.value ?? [],
          detailSections,
          inspectEnabled,
          workflowStages,
          workflowStageTags,
        };

        console.log(
          `  · ${label} [${shootType.id}]\n      ${sources.join("\n      ") || "no legacy data found"}`,
        );

        if (!DRY_RUN) {
          await prisma.shootType.update({
            where: { id: shootType.id },
            data: {
              content: shootTypeContent as unknown as Prisma.InputJsonObject,
              iconKey,
              tags,
            },
          });
        }
        migratedShootTypes += 1;
      }
    }

    const nextContent = stripLegacyKeys(content);
    const removed = LEGACY_CONTENT_KEYS.filter(
      (key) => (content as Record<string, unknown>)[key] !== undefined,
    );
    console.log(`  content keys removed: ${removed.join(", ")}`);

    if (!DRY_RUN) {
      await prisma.serviceArea.update({
        where: { id: serviceArea.id },
        data: { content: nextContent as Prisma.InputJsonObject },
      });
    }
  }

  console.log(
    `\nDone. Service areas migrated: ${migratedAreas}, skipped: ${skippedAreas}, shoot types written: ${migratedShootTypes}.`,
  );
  if (DRY_RUN) {
    console.log("Dry run — nothing was persisted.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
