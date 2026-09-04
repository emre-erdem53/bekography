"use client";

import { useMemo, useState } from "react";
import type { PostShootSnapshot } from "@/lib/post-shoot";
import { getItemWorkflowFlags } from "@/lib/post-shoot";
import { toDateInputValue } from "@/lib/date-only";
import {
  ADMIN_WORKFLOW_STAGE_OPTIONS,
  getCurrentWorkflowStageId,
  workflowStageOrder,
  type TrackingWorkflowDeadlineOverrideKey,
  type TrackingWorkflowView,
} from "@/lib/tracking-workflow";
import { adminStageOptionsFromDefinitions } from "@/lib/tracking-workflow-dynamic";
import type { PackageWorkflowStageDefinition } from "@/lib/package-workflow-stages";
import { StatusSelect } from "@/components/admin/status-select";

const DELIVERED_SELECT_VALUE = "__delivered__";

const DEADLINE_FIELDS: Array<{
  key: TrackingWorkflowDeadlineOverrideKey;
  label: string;
}> = [
  { key: "dijital", label: "Dijital son gün" },
  { key: "secim", label: "Seçim son gün" },
  { key: "duzenleme", label: "Düzenleme son gün" },
  { key: "baski", label: "Baskı son gün" },
];

function resolveDisplayedDeadline(
  workflow: TrackingWorkflowView,
  stageId: string,
): string {
  const stage = workflow.stages.find((entry) => entry.id === stageId);
  if (!stage?.deadlineDate) return "";
  return toDateInputValue(stage.deadlineDate);
}

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

  const deadlineFields = useMemo(
    () =>
      DEADLINE_FIELDS.filter(
        (field) => field.key !== "baski" || hasPrinting,
      ),
    [hasPrinting],
  );

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

  async function updateDeadline(
    key: TrackingWorkflowDeadlineOverrideKey,
    value: string,
  ) {
    setSaving(true);
    setError(null);

    try {
      await postWorkflow({
        itemId,
        deadlineOverrides: {
          [key]: value ? value : null,
        },
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Son gün tarihi güncellenemedi.",
      );
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

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {deadlineFields.map((field) => {
          const overrideValue = flags.deadlineOverrides?.[field.key] ?? "";
          const computedValue = resolveDisplayedDeadline(workflow, field.key);
          const inputValue = overrideValue || computedValue;

          return (
            <label key={field.key} className="block text-xs text-zinc-400">
              <span className="mb-1.5 flex items-center justify-between gap-2 font-medium text-zinc-300">
                <span>
                  {field.label}
                  {overrideValue ? (
                    <span className="ml-1 text-[10px] text-amber-300/90">
                      (manuel)
                    </span>
                  ) : null}
                </span>
                {overrideValue ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void updateDeadline(field.key, "")}
                    className="text-[10px] text-zinc-500 hover:text-white disabled:opacity-50"
                  >
                    Otomatiğe dön
                  </button>
                ) : null}
              </span>
              <input
                type="date"
                value={inputValue}
                disabled={saving}
                onChange={(event) =>
                  void updateDeadline(field.key, event.target.value)
                }
                className="w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none focus:border-white/30 disabled:opacity-50"
              />
            </label>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
        Son günler otomatik hesaplanır. Tarihi değiştirirseniz manuel olarak
        kaydedilir; “Otomatiğe dön” ile tekrar hesaba bırakabilirsiniz.
      </p>

      {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
