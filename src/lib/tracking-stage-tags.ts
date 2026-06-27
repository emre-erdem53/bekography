import type {
  PackageCategoryContent,
  PackageDetailSection,
} from "@/lib/package-seed-data";
import { resolveDetailSectionsForOption } from "@/lib/package-detail-section";
import {
  buildPackageInspectSections,
  hasRichInspectSections,
} from "@/lib/package-inspect-templates";
import { normalizePostShootSectionTitle } from "@/lib/post-shoot-from-inspect";
import type { PostShootSnapshot } from "@/lib/post-shoot";
import type { TrackingWorkflowStageId } from "@/lib/tracking-workflow";

const EMPTY_STAGE_TAGS: Record<TrackingWorkflowStageId, string[]> = {
  rezervasyon: [],
  cekim: [],
  dijital: [],
  secim: [],
  duzenleme: [],
  baski: [],
};

function mapSectionTitleToWorkflowStage(
  title: string,
): TrackingWorkflowStageId | null {
  const key = title.trim().toLocaleLowerCase("tr");

  if (key.includes("rezervasyon")) return "rezervasyon";
  if (key.includes("seçim") || key.includes("secim")) return "secim";
  if (key === "çekim") return "cekim";

  const postShootKind = normalizePostShootSectionTitle(title);
  if (postShootKind === "digital") return "dijital";
  if (postShootKind === "editing") return "duzenleme";
  if (postShootKind === "printing") return "baski";

  return null;
}

type PackageInspectContextScheduleType = "outdoor" | "indoor";

function scheduleTypeForSlug(slug: string): PackageInspectContextScheduleType {
  return slug === "dis-cekim" ? "outdoor" : "indoor";
}

/** Snapshot'taki etiketleri aynı aşamaya denk gelen tam inceleme bölümüne yazar. */
function mergeSnapshotSectionTags(
  base: PackageDetailSection[],
  snapshotSections: PackageDetailSection[],
): PackageDetailSection[] {
  const snapshotTagsByStage = new Map<TrackingWorkflowStageId, string[]>();

  for (const section of snapshotSections) {
    const stageId = mapSectionTitleToWorkflowStage(section.title);
    const tags = (section.tags ?? []).filter(Boolean);
    if (stageId && tags.length > 0) {
      snapshotTagsByStage.set(stageId, tags);
    }
  }

  if (snapshotTagsByStage.size === 0) return base;

  return base.map((section) => {
    const stageId = mapSectionTitleToWorkflowStage(section.title);
    if (!stageId || !snapshotTagsByStage.has(stageId)) return section;
    return { ...section, tags: snapshotTagsByStage.get(stageId)! };
  });
}

/** Takip ekranı için en eksiksiz inceleme bölüm listesini seçer. */
export function resolveDetailSectionsForStageTags(input: {
  detailSections: PackageDetailSection[];
  categorySlug: string;
  categoryTitle: string;
  optionLabel: string;
  packageOptionId?: string;
  categoryContent?: Partial<PackageCategoryContent>;
}): PackageDetailSection[] {
  const fromLivePackage =
    input.categoryContent && input.packageOptionId
      ? resolveDetailSectionsForOption(
          input.categoryContent,
          input.packageOptionId,
          input.optionLabel,
        )
      : [];

  if (hasRichInspectSections(fromLivePackage)) {
    return fromLivePackage;
  }

  if (hasRichInspectSections(input.detailSections)) {
    return input.detailSections;
  }

  const fromTemplate = buildPackageInspectSections({
    slug: input.categorySlug,
    categoryTitle: input.categoryTitle,
    optionLabel: input.optionLabel,
    scheduleType: scheduleTypeForSlug(input.categorySlug),
  });

  if (input.detailSections.length === 0) {
    return fromTemplate;
  }

  return mergeSnapshotSectionTags(fromTemplate, input.detailSections);
}

function appendUniqueTags(
  target: Record<TrackingWorkflowStageId, string[]>,
  stageId: TrackingWorkflowStageId,
  tags: string[],
) {
  if (tags.length === 0) return;
  const existing = new Set(target[stageId]);
  for (const tag of tags) {
    const trimmed = tag.trim();
    if (!trimmed || existing.has(trimmed)) continue;
    existing.add(trimmed);
    target[stageId].push(trimmed);
  }
}

/** Paket incele bölümlerindeki etiketleri sipariş süreci aşamalarına eşler. */
export function buildWorkflowStageTags(
  detailSections: PackageDetailSection[],
  postShoot?: PostShootSnapshot,
  context?: {
    categorySlug: string;
    categoryTitle: string;
    optionLabel: string;
    packageOptionId?: string;
    categoryContent?: Partial<PackageCategoryContent>;
  },
): Record<TrackingWorkflowStageId, string[]> {
  const sections = context
    ? resolveDetailSectionsForStageTags({
        detailSections,
        ...context,
      })
    : detailSections;

  const tags: Record<TrackingWorkflowStageId, string[]> = {
    rezervasyon: [],
    cekim: [],
    dijital: [],
    secim: [],
    duzenleme: [],
    baski: [],
  };

  for (const section of sections) {
    const stageId = mapSectionTitleToWorkflowStage(section.title);
    if (!stageId) continue;
    appendUniqueTags(tags, stageId, section.tags ?? []);
  }

  if (postShoot) {
    if (tags.dijital.length === 0) {
      appendUniqueTags(tags, "dijital", postShoot.digital.pills);
    }
    if (tags.duzenleme.length === 0) {
      appendUniqueTags(tags, "duzenleme", postShoot.editing.pills);
    }
    if (tags.baski.length === 0) {
      appendUniqueTags(tags, "baski", postShoot.printing.pills);
    }
  }

  return tags;
}

export function getStageTagsForWorkflow(
  stageTags: Record<TrackingWorkflowStageId, string[]>,
  stageId: TrackingWorkflowStageId,
): string[] {
  return stageTags[stageId] ?? EMPTY_STAGE_TAGS[stageId];
}
