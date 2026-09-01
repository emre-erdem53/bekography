import type { PackageDetailSection } from "@/lib/package-seed-data";
import type {
  ScheduleType,
  ServiceAreaData,
  ShootTypeData,
} from "@/lib/package-types";
import {
  hasAnyWorkflowStageTags,
  resolveShootTypeWorkflowStageTags,
} from "@/lib/package-workflow-stage-tags";
import {
  adminOptionsFromStageDefinitions,
  resolveWorkflowStages,
} from "@/lib/package-workflow-stages";
import { findShootTypeContext } from "@/lib/shoot-type-context";
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

export function buildItemStageTagsFromShootType(
  shootTypeId: string,
  serviceAreas: ServiceAreaData[],
): ItemWorkflowStageTags {
  const context = findShootTypeContext(serviceAreas, shootTypeId);
  if (!context) return emptyItemWorkflowStageTags();

  const fromShootType = resolveShootTypeWorkflowStageTags(context.shootType);
  if (hasAnyWorkflowStageTags(fromShootType)) {
    return fromShootType;
  }

  return emptyItemWorkflowStageTags();
}

export function getEditableStagesForScheduleType(
  scheduleType?: ScheduleType,
): TrackingWorkflowStageId[] {
  if (scheduleType === "outdoor") {
    return [...TRACKING_WORKFLOW_STAGE_ORDER];
  }
  return TRACKING_WORKFLOW_STAGE_ORDER.filter((stage) => stage !== "baski");
}

export function getEditableStagesForShootType(
  shootType: Pick<ShootTypeData, "content"> | undefined,
  scheduleType?: ScheduleType,
): Array<{ id: string; label: string }> {
  const definitions = resolveWorkflowStages(shootType, scheduleType);
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
  items: Array<{ itemKey: string; shootTypeId: string }>,
  serviceAreas: ServiceAreaData[],
  options?: { forceReset?: boolean },
): Record<string, ItemWorkflowStageTags> {
  const next: Record<string, ItemWorkflowStageTags> = {};

  for (const item of items) {
    if (current?.[item.itemKey] && !options?.forceReset) {
      next[item.itemKey] = current[item.itemKey];
      continue;
    }

    next[item.itemKey] = buildItemStageTagsFromShootType(
      item.shootTypeId,
      serviceAreas,
    );
  }

  return next;
}
