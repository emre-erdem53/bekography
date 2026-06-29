"use client";

import { useState } from "react";
import type { PostShootSnapshot } from "@/lib/post-shoot";
import { getItemWorkflowFlags } from "@/lib/post-shoot";
import {
  ADMIN_WORKFLOW_STAGE_OPTIONS,
  getCurrentWorkflowStageId,
  workflowStageOrder,
  type TrackingWorkflowView,
} from "@/lib/tracking-workflow";
import { adminStageOptionsFromDefinitions } from "@/lib/tracking-workflow-dynamic";
import type { PackageWorkflowStageDefinition } from "@/lib/package-workflow-stages";
import { StatusSelect } from "@/components/admin/status-select";

const DELIVERED_SELECT_VALUE = "__delivered__";

export function ReservationItemWorkflowAdmin({
  reservationId,
  itemId,
  itemTitle,
  postShoot,
  workflow,
  hasPrinting = false,
  stageDefinitions,
  onWorkflowChange,
}: {
  reservationId: string;
  itemId: string;
  itemTitle: string;
  postShoot: PostShootSnapshot;
  workflow: TrackingWorkflowView;
  hasPrinting?: boolean;
  stageDefinitions?: PackageWorkflowStageDefinition[];
  onWorkflowChange?: (postShoot: PostShootSnapshot) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stageOrder = stageDefinitions?.length
    ? stageDefinitions.map((def) => def.id)
    : workflowStageOrder(hasPrinting);
  const flags = getItemWorkflowFlags(postShoot, itemId);
  const currentStage =
    flags.adminStage ??
    getCurrentWorkflowStageId(workflow) ??
    stageOrder[0] ??
    "rezervasyon";
  const isDelivered = Boolean(flags.deliveredAt);

  const stageOptions = stageDefinitions?.length
    ? adminStageOptionsFromDefinitions(stageDefinitions)
    : ADMIN_WORKFLOW_STAGE_OPTIONS.filter((option) =>
        stageOrder.includes(option.id),
      );

  const options = [
    ...stageOptions.map((option) => ({
      value: option.id,
      label: option.label,
    })),
    {
      value: DELIVERED_SELECT_VALUE,
      label: isDelivered ? "Teslim Edildi ✓" : "Teslim Edildi İşaretle",
    },
  ];

  async function postWorkflow(body: Record<string, unknown>) {
    const response = await fetch(
      `/api/admin/reservations/${reservationId}/workflow`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? "İşlem başarısız oldu.");
    }
    onWorkflowChange?.(payload.postShoot);
  }

  async function updateStage(stage: string) {
    setSaving(true);
    setError(null);

    try {
      await postWorkflow({ itemId, stage });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Aşama güncellenemedi.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleDelivered() {
    setSaving(true);
    setError(null);

    try {
      await postWorkflow({
        itemId,
        action: isDelivered ? "unmark_delivered" : "mark_delivered",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Teslim durumu güncellenemedi.");
    } finally {
      setSaving(false);
    }
  }

  function handleSelectChange(value: string) {
    if (value === DELIVERED_SELECT_VALUE) {
      void toggleDelivered();
      return;
    }
    void updateStage(value);
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
          onChange={handleSelectChange}
        />
      </div>
      {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
