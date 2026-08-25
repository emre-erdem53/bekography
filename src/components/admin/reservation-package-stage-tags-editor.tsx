"use client";

import {
  getEditableStagesForShootType,
  type ItemWorkflowStageTags,
} from "@/lib/item-workflow-stage-tags";
import type { ServiceAreaData } from "@/lib/package-types";
import { findShootTypeContext } from "@/lib/shoot-type-context";
import { PostShootTagsEditor } from "@/components/admin/post-shoot-section-editor";

type ReservationPackageStageTagsEditorProps = {
  serviceAreaTitle: string;
  packageTitle?: string;
  shootTypeLabel: string;
  shootTypeId: string;
  serviceAreas: ServiceAreaData[];
  accentColor?: string;
  stageTags: ItemWorkflowStageTags;
  onChange: (stageTags: ItemWorkflowStageTags) => void;
};

export function ReservationPackageStageTagsEditor({
  serviceAreaTitle,
  packageTitle,
  shootTypeLabel,
  shootTypeId,
  serviceAreas,
  accentColor,
  stageTags,
  onChange,
}: ReservationPackageStageTagsEditorProps) {
  const context = findShootTypeContext(serviceAreas, shootTypeId);
  const stages = getEditableStagesForShootType(
    context?.shootType,
    context?.serviceArea.scheduleType,
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
        {serviceAreaTitle}
        {packageTitle ? ` · ${packageTitle}` : ""} · {shootTypeLabel}
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
