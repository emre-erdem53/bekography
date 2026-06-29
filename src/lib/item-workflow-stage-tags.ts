import type { PackageCategoryContent, PackageDetailSection } from "@/lib/package-seed-data";
import {
  hasAnyWorkflowStageTags,
  resolvePackageWorkflowStageTags,
} from "@/lib/package-workflow-stage-tags";
import {
  adminOptionsFromStageDefinitions,
  resolveWorkflowStagesForOption,
} from "@/lib/package-workflow-stages";
import type { InspectCategory } from "@/lib/post-shoot-from-inspect";
import {
  TRACKING_WORKFLOW_STAGE_ORDER,
  type TrackingWorkflowStageId,
} from "@/lib/tracking-workflow";
import { mapSectionTitleToWorkflowStage } from "@/lib/tracking-stage-tags";

export type ItemWorkflowStageTags = Record<string, string[]>;

export const WORKFLOW_STAGE_TAG_LABELS: Record<TrackingWorkflowStageId, string> = {
  rezervasyon: "Rezervasyon",
  cekim: "Çekim",
  dijital: "Dijital",
  secim: "Seçim",
  duzenleme: "Düzenleme",
  baski: "Baskı",
};

export function emptyItemWorkflowStageTags(): ItemWorkflowStageTags {
  return {
    rezervasyon: [],
    cekim: [],
    dijital: [],
    secim: [],
    duzenleme: [],
    baski: [],
  };
}

export function extractStageTagsFromDetailSections(
  sections: PackageDetailSection[],
): ItemWorkflowStageTags {
  const tags = emptyItemWorkflowStageTags();

  for (const section of sections) {
    const stageId = mapSectionTitleToWorkflowStage(section.title);
    if (!stageId) continue;
    tags[stageId] = [...(section.tags ?? [])].filter(Boolean);
  }

  return tags;
}

export function applyStageTagsToDetailSections(
  sections: PackageDetailSection[],
  stageTags: ItemWorkflowStageTags,
): PackageDetailSection[] {
  return sections.map((section) => {
    const stageId = mapSectionTitleToWorkflowStage(section.title);
    if (!stageId || !(stageId in stageTags)) return section;
    return { ...section, tags: [...stageTags[stageId]] };
  });
}

export function buildItemStageTagsFromPackage(
  packageOptionId: string,
  categories: InspectCategory[],
  categoryTitle?: string,
): ItemWorkflowStageTags {
  const category = categories.find((entry) =>
    entry.options?.some((option) => option.id === packageOptionId),
  );
  if (!category) return emptyItemWorkflowStageTags();

  const option = category.options?.find((entry) => entry.id === packageOptionId);
  const fromPackage = resolvePackageWorkflowStageTags(
    category.content,
    packageOptionId,
    option?.label ?? categoryTitle,
  );

  if (hasAnyWorkflowStageTags(fromPackage)) {
    return fromPackage;
  }

  return emptyItemWorkflowStageTags();
}

export function getEditableStagesForScheduleType(
  scheduleType?: PackageCategoryContent["scheduleType"],
): TrackingWorkflowStageId[] {
  if (scheduleType === "outdoor") {
    return [...TRACKING_WORKFLOW_STAGE_ORDER];
  }
  return TRACKING_WORKFLOW_STAGE_ORDER.filter((stage) => stage !== "baski");
}

export function getEditableStagesForCategory(
  categorySlug: string,
): TrackingWorkflowStageId[] {
  if (categorySlug === "dis-cekim") {
    return [...TRACKING_WORKFLOW_STAGE_ORDER];
  }
  return TRACKING_WORKFLOW_STAGE_ORDER.filter((stage) => stage !== "baski");
}

export function getEditableStagesForPackage(
  content: Partial<PackageCategoryContent> | undefined,
  packageOptionId: string,
  optionLabel?: string,
): Array<{ id: string; label: string }> {
  const definitions = resolveWorkflowStagesForOption(
    content,
    packageOptionId,
    optionLabel,
  );
  return adminOptionsFromStageDefinitions(definitions);
}

export function remapItemStageTagsByKeys(
  itemStageTags: Record<string, ItemWorkflowStageTags> | undefined,
  keyToId: Map<string, string>,
): Record<string, ItemWorkflowStageTags> | undefined {
  if (!itemStageTags) return undefined;

  const next: Record<string, ItemWorkflowStageTags> = {};
  for (const [key, tags] of Object.entries(itemStageTags)) {
    next[keyToId.get(key) ?? key] = tags;
  }
  return next;
}

export function syncItemStageTagsForItems(
  current: Record<string, ItemWorkflowStageTags> | undefined,
  items: Array<{
    itemKey: string;
    packageOptionId: string;
    categoryTitle: string;
  }>,
  categories: InspectCategory[],
  options?: { forceReset?: boolean },
): Record<string, ItemWorkflowStageTags> {
  const next: Record<string, ItemWorkflowStageTags> = {};

  for (const item of items) {
    if (current?.[item.itemKey] && !options?.forceReset) {
      next[item.itemKey] = current[item.itemKey];
      continue;
    }

    next[item.itemKey] = buildItemStageTagsFromPackage(
      item.packageOptionId,
      categories,
      item.categoryTitle,
    );
  }

  return next;
}
