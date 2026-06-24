"use client";

import { useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { PostShootSnapshot } from "@/lib/post-shoot";
import {
  TRACKING_WORKFLOW_ACTION_LABELS,
  buildTrackingWorkflowView,
  emptyTrackingWorkflowFlags,
  type TrackingWorkflowAction,
} from "@/lib/tracking-workflow";
import { TrackingWorkflowTimeline } from "@/components/tracking/tracking-workflow-timeline";

export function ReservationWorkflowActions({
  reservationId,
  postShoot,
  shootDate,
  onWorkflowChange,
}: {
  reservationId: string;
  postShoot: PostShootSnapshot;
  shootDate: string;
  onWorkflowChange?: (postShoot: PostShootSnapshot) => void;
}) {
  const [busyAction, setBusyAction] = useState<TrackingWorkflowAction | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const workflowFlags = postShoot.workflow ?? emptyTrackingWorkflowFlags();
  const workflow = buildTrackingWorkflowView({
    shootDate: new Date(shootDate),
    postShoot,
    workflow: workflowFlags,
  });

  async function runAction(action: TrackingWorkflowAction) {
    setBusyAction(action);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/reservations/${reservationId}/workflow`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );

      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "İşlem başarısız oldu.");
        return;
      }

      onWorkflowChange?.(payload.postShoot);
    } catch {
      setError("İşlem başarısız oldu.");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-white">Sipariş Süreci</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Müşteri takip sayfasında görünen aşamaları buradan ilerletin.
          </p>
        </div>
        {workflow.deadlineDate ? (
          <p className="text-sm text-amber-300">
            {workflow.deadlineLabel}:{" "}
            {format(new Date(workflow.deadlineDate), "d MMMM yyyy", {
              locale: tr,
            })}
          </p>
        ) : null}
      </div>

      <div className="mt-5">
        <TrackingWorkflowTimeline workflow={workflow} compact />
      </div>

      {workflow.availableAdminActions.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {workflow.availableAdminActions.map((action) => (
            <button
              key={action}
              type="button"
              disabled={busyAction !== null}
              onClick={() => runAction(action)}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-60"
            >
              {busyAction === action
                ? "Kaydediliyor..."
                : TRACKING_WORKFLOW_ACTION_LABELS[action]}
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm text-zinc-500">
          Bu aşama için manuel işlem gerekmiyor.
        </p>
      )}

      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
