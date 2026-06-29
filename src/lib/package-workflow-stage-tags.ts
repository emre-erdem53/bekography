import type { PackageCategoryContent } from "@/lib/package-seed-data";
import {
  emptyItemWorkflowStageTags,
  type ItemWorkflowStageTags,
} from "@/lib/item-workflow-stage-tags";
import type { TrackingWorkflowStageId } from "@/lib/tracking-workflow";

function pickOptionRecord<T>(
  source: Record<string, T> | undefined,
  optionId: string,
  optionLabel?: string,
): T | undefined {
  if (!source) return undefined;
  const labelKey = optionLabel?.trim();
  return (
    source[optionId] ??
    (labelKey ? source[labelKey] : undefined)
  );
}

export function resolvePackageWorkflowStageTags(
  content: Partial<PackageCategoryContent> | undefined,
  packageOptionId: string,
  optionLabel?: string,
): Record<string, string[]> {
  const stored = pickOptionRecord(
    content?.workflowStageTagsByOption,
    packageOptionId,
    optionLabel,
  );

  if (!stored) return {};

  const tags: Record<string, string[]> = {};
  for (const [stageId, pills] of Object.entries(stored)) {
    if (Array.isArray(pills)) {
      tags[stageId] = pills.filter(Boolean);
    }
  }
  return tags;
}

export function hasAnyWorkflowStageTags(
  tags: Record<string, string[]>,
): boolean {
  return Object.values(tags).some((entries) => entries.length > 0);
}
