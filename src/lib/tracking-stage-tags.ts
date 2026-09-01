import type { PackageDetailSection } from "@/lib/package-seed-data";
import type { ScheduleType, ShootTypeData } from "@/lib/package-types";
import { getShootTypeDetailSections } from "@/lib/package-detail-section";
import {
  buildPackageInspectSections,
  hasRichInspectSections,
} from "@/lib/package-inspect-templates";
import {
  hasAnyWorkflowStageTags,
  resolveShootTypeWorkflowStageTags,
} from "@/lib/package-workflow-stage-tags";
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

export { mapSectionTitleToWorkflowStage };

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

function sectionsHaveBodyText(sections: PackageDetailSection[]): boolean {
  return sections.some((section) => Boolean(section.body?.trim()));
}

function pickInspectSectionBase(
  fromLivePackage: PackageDetailSection[],
  fromTemplate: PackageDetailSection[],
): PackageDetailSection[] {
  if (hasRichInspectSections(fromLivePackage) && sectionsHaveBodyText(fromLivePackage)) {
    return fromLivePackage;
  }
  if (hasRichInspectSections(fromTemplate) && sectionsHaveBodyText(fromTemplate)) {
    return fromTemplate;
  }
  if (fromLivePackage.length > 0) return fromLivePackage;
  return fromTemplate;
}

/** Satın alınan ürün detayı için inceleme metinlerini tamamlar. */
export function resolveDetailSectionsForStageTags(input: {
  detailSections: PackageDetailSection[];
  serviceAreaSlug: string;
  serviceAreaTitle: string;
  shootTypeLabel: string;
  scheduleType?: ScheduleType;
  shootType?: Pick<ShootTypeData, "content">;
}): PackageDetailSection[] {
  if (
    hasRichInspectSections(input.detailSections) &&
    sectionsHaveBodyText(input.detailSections)
  ) {
    return input.detailSections;
  }

  const fromLivePackage = input.shootType
    ? getShootTypeDetailSections(input.shootType)
    : [];

  const fromTemplate = buildPackageInspectSections({
    slug: input.serviceAreaSlug,
    categoryTitle: input.serviceAreaTitle,
    optionLabel: input.shootTypeLabel,
    scheduleType: input.scheduleType ?? "indoor",
  });

  const base = pickInspectSectionBase(fromLivePackage, fromTemplate);

  if (input.detailSections.length === 0) {
    return base;
  }

  return mergeSnapshotSectionTags(base, input.detailSections);
}

/** Rezervasyon / çekim türü tanımından süreç etiketlerini çözümler. */
export function buildWorkflowStageTags(
  postShoot?: PostShootSnapshot,
  shootType?: Pick<ShootTypeData, "content">,
  itemId?: string,
): Record<string, string[]> {
  if (itemId && postShoot?.itemStageTags?.[itemId]) {
    const overrides = postShoot.itemStageTags[itemId];
    const tags = tagsFromItemOverrides(overrides);
    if (hasAnyWorkflowStageTags(tags)) return tags;
  }

  if (shootType) {
    const fromShootType = resolveShootTypeWorkflowStageTags(shootType);
    if (hasAnyWorkflowStageTags(fromShootType)) {
      return fromShootType;
    }
  }

  return { ...EMPTY_STAGE_TAGS };
}

function tagsFromItemOverrides(
  overrides: Record<string, string[]>,
): Record<string, string[]> {
  const result: Record<string, string[]> = { ...EMPTY_STAGE_TAGS };
  for (const [key, value] of Object.entries(overrides)) {
    if (Array.isArray(value)) {
      result[key] = value.filter(Boolean);
    }
  }
  return result;
}

function emptyStageTagsFromOverrides(
  overrides: Record<string, string[]>,
): Record<string, string[]> {
  return tagsFromItemOverrides(overrides);
}

export function getStageTagsForWorkflow(
  stageTags: Record<string, string[]>,
  stageId: string,
): string[] {
  if (stageTags[stageId]?.length) return stageTags[stageId];
  const legacy = stageTags[stageId as TrackingWorkflowStageId];
  return legacy ?? [];
}
