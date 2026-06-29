import type { PackageCategoryContent } from "@/lib/package-seed-data";
import {
  TRACKING_WORKFLOW_STAGE_ORDER,
  type TrackingWorkflowStageId,
} from "@/lib/tracking-workflow";

export type PackageWorkflowBuiltinKey = TrackingWorkflowStageId;

export type PackageWorkflowStageDefinition = {
  id: string;
  label: string;
  kind: "builtin" | "custom";
  builtinKey?: PackageWorkflowBuiltinKey;
  daysAfterPrevious?: number;
};

const BUILTIN_LABELS: Record<PackageWorkflowBuiltinKey, string> = {
  rezervasyon: "Rezervasyon",
  cekim: "Çekim",
  dijital: "Dijital",
  secim: "Seçim",
  duzenleme: "Düzenleme",
  baski: "Baskı",
};

export function slugifyWorkflowStageId(label: string) {
  return label
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/[^a-z0-9ğüşıöç]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function defaultBuiltinStageDefinitions(
  scheduleType: PackageCategoryContent["scheduleType"] = "indoor",
): PackageWorkflowStageDefinition[] {
  const order = TRACKING_WORKFLOW_STAGE_ORDER.filter(
    (id) => id !== "baski" || scheduleType === "outdoor",
  );

  return order.map((builtinKey) => ({
    id: builtinKey,
    label: BUILTIN_LABELS[builtinKey],
    kind: "builtin" as const,
    builtinKey,
  }));
}

export function resolveWorkflowStagesForOption(
  content: Partial<PackageCategoryContent> | undefined,
  optionId: string,
  optionLabel?: string,
): PackageWorkflowStageDefinition[] {
  const labelKey = optionLabel?.trim();
  const fromOption =
    content?.workflowStagesByOption?.[optionId] ??
    (labelKey ? content?.workflowStagesByOption?.[labelKey] : undefined);

  if (fromOption?.length) return fromOption;

  if (content?.workflowStages?.length) return content.workflowStages;

  return defaultBuiltinStageDefinitions(content?.scheduleType ?? "indoor");
}

export function packageHasPrintingStage(
  stages: PackageWorkflowStageDefinition[],
): boolean {
  return stages.some((stage) => stage.builtinKey === "baski");
}

export function getStageDefinitionById(
  stages: PackageWorkflowStageDefinition[],
  stageId: string,
): PackageWorkflowStageDefinition | undefined {
  return stages.find((stage) => stage.id === stageId);
}

export function createCustomWorkflowStage(
  label: string,
): PackageWorkflowStageDefinition {
  const trimmed = label.trim();
  const baseId = slugifyWorkflowStageId(trimmed) || "ozel-asama";
  return {
    id: baseId,
    label: trimmed,
    kind: "custom",
    daysAfterPrevious: undefined,
  };
}

export function ensureUniqueCustomStageId(
  stages: PackageWorkflowStageDefinition[],
  label: string,
): PackageWorkflowStageDefinition {
  const stage = createCustomWorkflowStage(label);
  if (!stages.some((entry) => entry.id === stage.id)) {
    return stage;
  }
  let suffix = 2;
  while (stages.some((entry) => entry.id === `${stage.id}-${suffix}`)) {
    suffix += 1;
  }
  return { ...stage, id: `${stage.id}-${suffix}` };
}

export function adminOptionsFromStageDefinitions(
  stages: PackageWorkflowStageDefinition[],
): Array<{ id: string; label: string }> {
  return stages.map((stage) => ({
    id: stage.id,
    label:
      stage.kind === "builtin" && stage.builtinKey
        ? BUILTIN_LABELS[stage.builtinKey] ?? stage.label
        : stage.label,
  }));
}

export function resolveStageTagsForDefinition(
  tagsByStage: Record<string, string[]> | undefined,
  stageId: string,
  builtinKey?: PackageWorkflowBuiltinKey,
): string[] {
  if (!tagsByStage) return [];
  const direct = tagsByStage[stageId];
  if (direct?.length) return direct;
  if (builtinKey) {
    const legacy = tagsByStage[builtinKey];
    if (legacy?.length) return legacy;
  }
  return [];
}
