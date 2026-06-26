"use client";

import { useState } from "react";
import type { PostShootSnapshot } from "@/lib/post-shoot";
import { getItemWorkflowFlags } from "@/lib/post-shoot";
import {
  ADMIN_WORKFLOW_STAGE_OPTIONS,
  getCurrentWorkflowStageId,
  workflowStageOrder,
  type TrackingWorkflowStageId,
  type TrackingWorkflowView,
} from "@/lib/tracking-workflow";
import { StatusSelect } from "@/components/admin/status-select";

export function ReservationItemWorkflowAdmin({
  reservationId,
  itemId,
  itemTitle,
  postShoot,
  workflow,
  hasPrinting = false,
  onWorkflowChange,
}: {
  reservationId: string;
  itemId: string;
  itemTitle: string;
  postShoot: PostShootSnapshot;
  workflow: TrackingWorkflowView;
  hasPrinting?: boolean;
  onWorkflowChange?: (postShoot: PostShootSnapshot) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stageOrder = workflowStageOrder(hasPrinting);
  const flags = getItemWorkflowFlags(postShoot, itemId);
  const currentStage =
    flags.adminStage ??
    getCurrentWorkflowStageId(workflow) ??
    ("rezervasyon" as const);

  const options = ADMIN_WORKFLOW_STAGE_OPTIONS.filter((option) =>
    stageOrder.includes(option.id),
  ).map((option) => ({
    value: option.id,
    label: option.label,
  }));

  async function updateStage(stage: TrackingWorkflowStageId) {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/reservations/${reservationId}/workflow`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId, stage }),
        },
      );
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Aşama güncellenemedi.");
        return;
      }
      onWorkflowChange?.(payload.postShoot);
    } catch {
      setError("Aşama güncellenemedi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Paket süreci
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-white">
            {itemTitle}
          </p>
        </div>
        <StatusSelect
          value={currentStage}
          options={options}
          disabled={saving}
          onChange={(stage) => updateStage(stage as TrackingWorkflowStageId)}
        />
      </div>
      {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
