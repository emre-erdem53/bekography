"use client";

import { useState } from "react";
import { Check } from "lucide-react";
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
  const [deliveredBusy, setDeliveredBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stageOrder = workflowStageOrder(hasPrinting);
  const flags = getItemWorkflowFlags(postShoot, itemId);
  const currentStage =
    flags.adminStage ??
    getCurrentWorkflowStageId(workflow) ??
    ("rezervasyon" as const);
  const isDelivered = Boolean(flags.deliveredAt);

  const options = ADMIN_WORKFLOW_STAGE_OPTIONS.filter((option) =>
    stageOrder.includes(option.id),
  ).map((option) => ({
    value: option.id,
    label: option.label,
  }));

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

  async function updateStage(stage: TrackingWorkflowStageId) {
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
    setDeliveredBusy(true);
    setError(null);

    try {
      await postWorkflow({
        itemId,
        action: isDelivered ? "unmark_delivered" : "mark_delivered",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Teslim durumu güncellenemedi.");
    } finally {
      setDeliveredBusy(false);
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
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleDelivered}
            disabled={deliveredBusy || saving}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${
              isDelivered
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                : "border-white/15 bg-white/5 text-zinc-300 hover:bg-white/10"
            }`}
          >
            <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {deliveredBusy
              ? "Kaydediliyor..."
              : isDelivered
                ? "Teslim Edildi"
                : "Teslim Edildi İşaretle"}
          </button>
          <StatusSelect
            value={currentStage}
            options={options}
            disabled={saving || deliveredBusy}
            onChange={(stage) => updateStage(stage as TrackingWorkflowStageId)}
          />
        </div>
      </div>
      {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
