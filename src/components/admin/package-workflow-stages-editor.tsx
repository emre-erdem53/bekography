"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import type { PackageWorkflowStageDefinition } from "@/lib/package-workflow-stages";
import {
  defaultBuiltinStageDefinitions,
  ensureUniqueCustomStageId,
} from "@/lib/package-workflow-stages";

type PackageWorkflowStagesEditorProps = {
  stages: PackageWorkflowStageDefinition[];
  scheduleType: "indoor" | "outdoor";
  onChange: (stages: PackageWorkflowStageDefinition[]) => void;
};

export function PackageWorkflowStagesEditor({
  stages,
  scheduleType,
  onChange,
}: PackageWorkflowStagesEditorProps) {
  const list = stages.length
    ? stages
    : defaultBuiltinStageDefinitions(scheduleType);

  function updateStage(index: number, patch: Partial<PackageWorkflowStageDefinition>) {
    const next = list.map((stage, i) =>
      i === index ? { ...stage, ...patch } : stage,
    );
    onChange(next);
  }

  function moveStage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function removeStage(index: number) {
    onChange(list.filter((_, i) => i !== index));
  }

  function addCustomStage() {
    const label = window.prompt("Özel aşama adı (örn. Drone Çekimi):");
    if (!label?.trim()) return;
    onChange([...list, ensureUniqueCustomStageId(list, label)]);
  }

  function resetDefaults() {
    onChange(defaultBuiltinStageDefinitions(scheduleType));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-medium text-white">Süreç Aşamaları</h4>
          <p className="mt-1 text-xs text-zinc-500">
            Müşteri takip timeline&apos;ında görünen aşamalar ve sıraları.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={resetDefaults}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
          >
            Varsayılana dön
          </button>
          <button
            type="button"
            onClick={addCustomStage}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/5"
          >
            <Plus className="h-3.5 w-3.5" />
            Özel aşama ekle
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {list.map((stage, index) => (
          <div
            key={`${stage.id}-${index}`}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3"
          >
            <div className="flex shrink-0 flex-col gap-0.5">
              <button
                type="button"
                onClick={() => moveStage(index, -1)}
                disabled={index === 0}
                className="rounded p-0.5 text-zinc-500 hover:text-white disabled:opacity-30"
                aria-label="Yukarı taşı"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => moveStage(index, 1)}
                disabled={index === list.length - 1}
                className="rounded p-0.5 text-zinc-500 hover:text-white disabled:opacity-30"
                aria-label="Aşağı taşı"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            <div className="min-w-0 flex-1">
              {stage.kind === "custom" ? (
                <input
                  value={stage.label}
                  onChange={(e) =>
                    updateStage(index, { label: e.target.value })
                  }
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                  placeholder="Aşama adı"
                />
              ) : (
                <p className="text-sm font-medium text-white">{stage.label}</p>
              )}
              <p className="mt-0.5 text-[10px] text-zinc-600">
                {stage.kind === "builtin" ? "Yerleşik aşama" : "Özel aşama"} ·{" "}
                {stage.id}
              </p>
            </div>

            {stage.kind === "custom" ? (
              <div className="w-24 shrink-0">
                <label className="mb-1 block text-[10px] text-zinc-500">
                  Gün (+)
                </label>
                <input
                  type="number"
                  min={0}
                  value={stage.daysAfterPrevious ?? ""}
                  onChange={(e) =>
                    updateStage(index, {
                      daysAfterPrevious: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white"
                  placeholder="—"
                />
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => removeStage(index)}
              className="shrink-0 rounded-lg p-2 text-red-400 hover:bg-red-500/10"
              aria-label="Aşamayı kaldır"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
