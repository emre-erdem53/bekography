"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Check } from "lucide-react";
import {
  getTrackingStageLabel,
  type TrackingWorkflowStageId,
  type TrackingWorkflowView,
} from "@/lib/tracking-workflow";
import { getStageTagsForWorkflow } from "@/lib/tracking-stage-tags";

export function TrackingWorkflowTimeline({
  workflow,
  stageTags,
  compact = false,
  embedded = false,
}: {
  workflow: TrackingWorkflowView | undefined;
  stageTags?: Record<string, string[]>;
  compact?: boolean;
  embedded?: boolean;
}) {
  if (!workflow?.stages?.length) {
    return null;
  }

  const currentStages = workflow.stages.filter((stage) => stage.state === "current");

  return (
    <section
      className={
        embedded
          ? "space-y-3"
          : compact
            ? "space-y-4"
            : "mx-auto max-w-5xl border-b border-white/10 pb-10"
      }
    >
      {!compact && !embedded ? (
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-zinc-500">
            Sipariş Durumu
          </p>
          <h2
            className={`mt-3 font-semibold leading-tight text-white ${
              workflow.isCompleted
                ? "text-2xl text-emerald-300 sm:text-3xl"
                : "text-2xl sm:text-3xl md:text-4xl"
            }`}
          >
            {workflow.primaryTitle}
          </h2>
          {workflow.primarySubtitle ? (
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              {workflow.primarySubtitle}
            </p>
          ) : null}
          {workflow.deadlineDate && workflow.deadlineLabel ? (
            <p className="mt-2 text-sm font-medium text-amber-300">
              {workflow.deadlineLabel}:{" "}
              {format(new Date(workflow.deadlineDate), "d MMMM yyyy", {
                locale: tr,
              })}
            </p>
          ) : null}
          {workflow.summary ? (
            <p className="mt-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">
              {workflow.summary}
            </p>
          ) : null}
        </div>
      ) : !embedded ? (
        <div>
          <p className="text-sm font-semibold text-white">{workflow.primaryTitle}</p>
          {workflow.primarySubtitle ? (
            <p className="mt-1 text-sm text-zinc-400">{workflow.primarySubtitle}</p>
          ) : null}
          {workflow.summary ? (
            <p className="mt-2 text-sm text-zinc-300">{workflow.summary}</p>
          ) : null}
        </div>
      ) : null}

      <div className={`overflow-x-auto ${embedded ? "pb-1" : "pb-2"}`}>
        <ol className={`flex min-w-max ${embedded ? "" : "md:min-w-0"}`}>
          {workflow.stages.map((stage, index) => {
            const isCurrent = stage.state === "current";
            const isCompleted = stage.state === "completed";
            const isUpcoming = stage.state === "upcoming";
            const isLast = index === workflow.stages.length - 1;
            const toneClass =
              stage.tone === "green"
                ? "text-emerald-400"
                : stage.tone === "red"
                  ? "text-rose-400"
                  : stage.tone === "amber"
                    ? "text-amber-300"
                    : "text-zinc-400";
            const connectorClass = isCompleted ? "bg-white/50" : "bg-white/10";
            const leftConnectorClass =
              index === 0
                ? "bg-transparent"
                : workflow.stages[index - 1].state === "completed"
                  ? "bg-white/50"
                  : "bg-white/10";
            const rightConnectorClass = isLast
              ? "bg-transparent"
              : connectorClass;

            const stageTagList = stageTags
              ? getStageTagsForWorkflow(stageTags, stage.id)
              : [];

            return (
              <li
                key={stage.id}
                className={`flex flex-col items-center ${
                  embedded
                    ? "min-w-[4.5rem] flex-1 sm:min-w-[5.5rem]"
                    : `min-w-[5.5rem] flex-1 sm:min-w-[6.5rem] ${
                        isCurrent ? "md:min-w-[8rem]" : ""
                      }`
                }`}
              >
                <div className="flex w-full items-center">
                  <span
                    className={`h-px min-w-3 flex-1 sm:min-w-4 ${leftConnectorClass}`}
                    aria-hidden
                  />
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center sm:h-10 sm:w-10">
                    <span
                      className={`flex items-center justify-center rounded-full border transition-all ${
                        isCurrent
                          ? "h-8 w-8 border-amber-300 bg-amber-300 text-black sm:h-9 sm:w-9"
                          : isCompleted
                            ? "h-6 w-6 border-white bg-white text-black sm:h-7 sm:w-7"
                            : "h-5 w-5 border-white/20 bg-transparent sm:h-6 sm:w-6"
                      }`}
                    >
                      {isCompleted ? (
                        <Check
                          className={
                            isCurrent ? "h-4 w-4" : "h-3 w-3 sm:h-3.5 sm:w-3.5"
                          }
                        />
                      ) : isCurrent ? (
                        <span className="h-2 w-2 rounded-full bg-black" />
                      ) : null}
                    </span>
                  </span>
                  <span
                    className={`h-px min-w-3 flex-1 sm:min-w-4 ${rightConnectorClass}`}
                    aria-hidden
                  />
                </div>

                <p
                  className={`mt-3 w-full px-1 text-center leading-snug ${
                    isCurrent
                      ? `text-xs font-semibold sm:text-sm md:text-base ${toneClass}`
                      : isUpcoming
                        ? "text-[10px] text-zinc-600 sm:text-xs"
                        : `text-[10px] sm:text-xs ${toneClass}`
                  }`}
                >
                  {stage.label ||
                    getTrackingStageLabel(
                      stage.id as TrackingWorkflowStageId,
                      stage.state,
                    )}
                </p>
                {stage.deadlineDate || stage.deadlineHint ? (
                  <>
                    {stage.deadlineDate ? (
                      <p
                        className={`mt-1 w-full px-0.5 text-center text-[8px] leading-snug sm:text-[9px] ${
                          isCurrent
                            ? "text-amber-200/80"
                            : isCompleted
                              ? "text-emerald-400/70"
                              : "text-zinc-600"
                        }`}
                      >
                        {stage.deadlineHintContinuesDate && stage.deadlineHint
                          ? `${format(new Date(stage.deadlineDate), "d MMM yyyy", {
                              locale: tr,
                            })}${stage.deadlineHint}`
                          : stage.deadlineLabel
                            ? `${stage.deadlineLabel} ${format(
                                new Date(stage.deadlineDate),
                                "d MMM yyyy",
                                { locale: tr },
                              )}`
                            : format(new Date(stage.deadlineDate), "d MMM yyyy", {
                                locale: tr,
                              })}
                      </p>
                    ) : null}
                    {stage.deadlineHint && !stage.deadlineHintContinuesDate ? (
                      <p
                        className={`mt-1 w-full px-0.5 text-center text-[8px] leading-snug sm:text-[9px] ${
                          isCurrent
                            ? "text-amber-200/60"
                            : isUpcoming
                              ? "text-zinc-600"
                              : "text-zinc-500"
                        }`}
                      >
                        {stage.deadlineHint}
                      </p>
                    ) : null}
                  </>
                ) : null}
                {stageTagList.length > 0 ? (
                  <div className="mt-2 flex w-full flex-col items-center gap-1 px-0.5">
                    {stageTagList.map((tag) => (
                      <span
                        key={tag}
                        className={`max-w-full truncate rounded-full border px-1.5 py-0.5 text-[8px] leading-tight sm:text-[9px] ${
                          isCurrent
                            ? "border-white/20 bg-white/10 text-zinc-200"
                            : isCompleted
                              ? "border-white/10 bg-white/5 text-zinc-400"
                              : "border-white/10 bg-transparent text-zinc-600"
                        }`}
                        title={tag}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>

      {!compact && !embedded && currentStages.length > 1 ? (
        <p className="mt-4 text-xs text-zinc-500">
          Şu anda{" "}
          {currentStages
            .map((stage) => stage.label || getTrackingStageLabel(stage.id as TrackingWorkflowStageId, stage.state))
            .join(" ve ")}{" "}
          aşamaları
          aktif.
        </p>
      ) : null}
    </section>
  );
}
