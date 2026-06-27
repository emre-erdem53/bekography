"use client";

import {
  getEditableStagesForCategory,
  WORKFLOW_STAGE_TAG_LABELS,
  type ItemWorkflowStageTags,
} from "@/lib/item-workflow-stage-tags";
import type { TrackingWorkflowStageId } from "@/lib/tracking-workflow";
import { PostShootTagsEditor } from "@/components/admin/post-shoot-section-editor";

type ReservationPackageStageTagsEditorProps = {
  categoryTitle: string;
  optionLabel: string;
  categorySlug: string;
  accentColor?: string;
  stageTags: ItemWorkflowStageTags;
  onChange: (stageTags: ItemWorkflowStageTags) => void;
};

export function ReservationPackageStageTagsEditor({
  categoryTitle,
  optionLabel,
  categorySlug,
  accentColor,
  stageTags,
  onChange,
}: ReservationPackageStageTagsEditorProps) {
  const stages = getEditableStagesForCategory(categorySlug);

  function updateStageTags(stage: TrackingWorkflowStageId, tags: string[]) {
    onChange({
      ...stageTags,
      [stage]: tags,
    });
  }

  return (
    <div
      className="rounded-xl border p-4"
      style={{
        borderColor: accentColor ? `${accentColor}55` : "rgba(255,255,255,0.1)",
        backgroundColor: accentColor ? `${accentColor}08` : "rgba(255,255,255,0.03)",
      }}
    >
      <h3
        className="text-sm font-semibold"
        style={{ color: accentColor ?? "#ffffff" }}
      >
        {categoryTitle} · {optionLabel}
      </h3>
      <div className="mt-4 space-y-4">
        {stages.map((stage) => (
          <PostShootTagsEditor
            key={stage}
            title={WORKFLOW_STAGE_TAG_LABELS[stage]}
            tags={stageTags[stage] ?? []}
            onChange={(tags) => updateStageTags(stage, tags)}
          />
        ))}
      </div>
    </div>
  );
}
