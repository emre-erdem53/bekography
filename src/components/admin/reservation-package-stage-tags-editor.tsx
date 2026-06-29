"use client";

import {
  getEditableStagesForPackage,
  type ItemWorkflowStageTags,
} from "@/lib/item-workflow-stage-tags";
import type { PackageCategoryContent } from "@/lib/package-seed-data";
import { PostShootTagsEditor } from "@/components/admin/post-shoot-section-editor";

type ReservationPackageStageTagsEditorProps = {
  categoryTitle: string;
  optionLabel: string;
  packageOptionId: string;
  categoryContent?: Partial<PackageCategoryContent>;
  accentColor?: string;
  stageTags: ItemWorkflowStageTags;
  onChange: (stageTags: ItemWorkflowStageTags) => void;
};

export function ReservationPackageStageTagsEditor({
  categoryTitle,
  optionLabel,
  packageOptionId,
  categoryContent,
  accentColor,
  stageTags,
  onChange,
}: ReservationPackageStageTagsEditorProps) {
  const stages = getEditableStagesForPackage(
    categoryContent,
    packageOptionId,
    optionLabel,
  );

  function updateStageTags(stageId: string, tags: string[]) {
    onChange({
      ...stageTags,
      [stageId]: tags,
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
            key={stage.id}
            title={stage.label}
            tags={stageTags[stage.id] ?? []}
            onChange={(tags) => updateStageTags(stage.id, tags)}
          />
        ))}
      </div>
    </div>
  );
}
