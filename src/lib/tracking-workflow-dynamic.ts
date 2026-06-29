import { addDays, endOfDay, format, isAfter, startOfDay } from "date-fns";
import { tr } from "date-fns/locale";
import type { PackageWorkflowStageDefinition } from "@/lib/package-workflow-stages";
import { packageHasPrintingStage } from "@/lib/package-workflow-stages";
import type { PostShootSnapshot } from "@/lib/post-shoot";
import {
  computeEffectiveWorkflowDeadlines,
  computeWorkflowDeadlines,
  emptyTrackingWorkflowFlags,
  getTrackingStageLabel,
  type TrackingWorkflowFlags,
  type TrackingWorkflowStageId,
  type TrackingWorkflowStageState,
  type TrackingWorkflowStageView,
  type TrackingWorkflowView,
} from "@/lib/tracking-workflow";

function formatDeadline(date: Date): string {
  return format(date, "d MMMM yyyy", { locale: tr });
}

function isBuiltinParallelStage(
  def: PackageWorkflowStageDefinition,
): boolean {
  return def.builtinKey === "dijital" || def.builtinKey === "secim";
}

function isStageCompletedByFlags(
  def: PackageWorkflowStageDefinition,
  workflow: TrackingWorkflowFlags,
): boolean {
  if (def.kind === "custom") {
    return Boolean(workflow.customCompletedAt?.[def.id]);
  }

  switch (def.builtinKey) {
    case "dijital":
      return Boolean(workflow.digitalDeliveredAt);
    case "secim":
      return Boolean(workflow.selectionCompletedAt);
    case "duzenleme":
      return Boolean(workflow.editingCompletedAt);
    case "baski":
      return Boolean(workflow.printingCompletedAt);
    case "rezervasyon":
    case "cekim":
      return false;
    default:
      return false;
  }
}

function inferEffectiveStageId(
  definitions: PackageWorkflowStageDefinition[],
  workflow: TrackingWorkflowFlags,
  shootPassed: boolean,
  pickupDeadlinePassed: boolean,
  hasPrinting: boolean,
): string {
  if (!shootPassed) {
    const cekim = definitions.find((def) => def.builtinKey === "cekim");
    return cekim?.id ?? definitions[1]?.id ?? definitions[0]?.id ?? "cekim";
  }

  for (const def of definitions) {
    if (def.builtinKey === "cekim" || def.builtinKey === "rezervasyon") {
      continue;
    }

    if (def.builtinKey === "duzenleme") {
      const editingDone = Boolean(workflow.editingCompletedAt);
      const printingDone = Boolean(workflow.printingCompletedAt);
      if (printingDone || (editingDone && !hasPrinting)) {
        const baski = definitions.find((entry) => entry.builtinKey === "baski");
        if (hasPrinting && baski && !printingDone) return baski.id;
        return def.id;
      }
      if (
        !editingDone &&
        (pickupDeadlinePassed || Boolean(workflow.selectionCompletedAt))
      ) {
        return def.id;
      }
      continue;
    }

    if (def.builtinKey === "baski") {
      if (Boolean(workflow.printingCompletedAt)) continue;
      if (Boolean(workflow.editingCompletedAt)) return def.id;
      continue;
    }

    if (isBuiltinParallelStage(def)) {
      const duzenlemeIndex = definitions.findIndex(
        (entry) => entry.builtinKey === "duzenleme",
      );
      const duzenleme = duzenlemeIndex >= 0 ? definitions[duzenlemeIndex] : null;
      if (duzenleme && isStageCompletedByFlags(duzenleme, workflow)) {
        continue;
      }
      if (
        !Boolean(workflow.digitalDeliveredAt) ||
        !Boolean(workflow.selectionCompletedAt)
      ) {
        return def.id;
      }
      continue;
    }

    if (def.kind === "custom" && !isStageCompletedByFlags(def, workflow)) {
      return def.id;
    }
  }

  const last = definitions[definitions.length - 1];
  return last?.id ?? "duzenleme";
}

function resolveCustomStageDeadline(
  def: PackageWorkflowStageDefinition,
  index: number,
  definitions: PackageWorkflowStageDefinition[],
  shootDate: Date,
  workflow: TrackingWorkflowFlags,
  postShoot: PostShootSnapshot,
): Date | undefined {
  if (!def.daysAfterPrevious || index === 0) return undefined;

  const previous = definitions[index - 1];
  const deadlines = computeEffectiveWorkflowDeadlines(
    shootDate,
    postShoot,
    workflow,
  );

  if (previous?.builtinKey === "cekim" || previous?.builtinKey === "rezervasyon") {
    return deadlines.shoot;
  }

  const previousCompleted =
    workflow.customCompletedAt?.[previous.id] ??
    (previous.kind === "custom" ? null : null);

  if (previousCompleted) {
    return endOfDay(
      addDays(startOfDay(new Date(previousCompleted)), def.daysAfterPrevious),
    );
  }

  return endOfDay(addDays(startOfDay(shootDate), def.daysAfterPrevious));
}

function computeDynamicStageState(
  def: PackageWorkflowStageDefinition,
  defIndex: number,
  effectiveStageId: string,
  definitions: PackageWorkflowStageDefinition[],
  shootPassed: boolean,
  workflow: TrackingWorkflowFlags,
): TrackingWorkflowStageState {
  if (isStageCompletedByFlags(def, workflow)) {
    return "completed";
  }

  const effectiveIndex = definitions.findIndex(
    (entry) => entry.id === effectiveStageId,
  );
  const effectiveDef =
    effectiveIndex >= 0 ? definitions[effectiveIndex] : undefined;

  if (def.builtinKey === "cekim") {
    if (!shootPassed) {
      return effectiveDef?.builtinKey === "rezervasyon" ? "upcoming" : "current";
    }
    return "completed";
  }

  if (def.builtinKey === "rezervasyon") {
    if (!shootPassed && effectiveDef?.builtinKey === "rezervasyon") {
      return "current";
    }
    return "completed";
  }

  if (isBuiltinParallelStage(def) && effectiveDef && isBuiltinParallelStage(effectiveDef)) {
    return "current";
  }

  const duzenlemeIndex = definitions.findIndex(
    (entry) => entry.builtinKey === "duzenleme",
  );
  if (
    isBuiltinParallelStage(def) &&
    duzenlemeIndex >= 0 &&
    effectiveIndex >= duzenlemeIndex
  ) {
    return "completed";
  }

  if (defIndex < effectiveIndex) return "completed";
  if (defIndex === effectiveIndex) return "current";
  return "upcoming";
}

function stageLabelFromDefinition(
  def: PackageWorkflowStageDefinition,
  state: TrackingWorkflowStageState,
): string {
  if (def.kind === "custom") {
    if (state === "completed") return `${def.label} Tamamlandı`;
    if (state === "current") return def.label;
    return def.label;
  }

  const builtinKey = def.builtinKey as TrackingWorkflowStageId | undefined;
  if (builtinKey) {
    return getTrackingStageLabel(builtinKey, state);
  }

  return def.label;
}

function buildDynamicStages(
  definitions: PackageWorkflowStageDefinition[],
  effectiveStageId: string,
  shootDate: Date,
  postShoot: PostShootSnapshot,
  workflow: TrackingWorkflowFlags,
  shootPassed: boolean,
  allCompleted: boolean,
): TrackingWorkflowStageView[] {
  if (allCompleted) {
    return definitions.map((def) => ({
      id: def.id,
      label: stageLabelFromDefinition(def, "completed"),
      state: "completed" as const,
      tone: "green" as const,
    }));
  }

  return definitions.map((def, index) => {
    const state = computeDynamicStageState(
      def,
      index,
      effectiveStageId,
      definitions,
      shootPassed,
      workflow,
    );
    const tone =
      state === "completed"
        ? ("green" as const)
        : state === "current"
          ? def.builtinKey === "cekim"
            ? ("red" as const)
            : ("amber" as const)
          : ("default" as const);

    const customDeadline =
      def.kind === "custom"
        ? resolveCustomStageDeadline(
            def,
            index,
            definitions,
            shootDate,
            workflow,
            postShoot,
          )
        : undefined;

    return {
      id: def.id,
      label: stageLabelFromDefinition(def, state),
      state,
      tone,
      deadlineDate:
        state !== "upcoming" && customDeadline
          ? customDeadline.toISOString()
          : undefined,
      deadlineHint:
        def.kind === "custom" && def.daysAfterPrevious && state !== "upcoming"
          ? `Önceki aşamadan ${def.daysAfterPrevious} gün içinde`
          : undefined,
    };
  });
}

function buildPrimaryCopyForDynamic(
  effectiveDef: PackageWorkflowStageDefinition | undefined,
  shootDate: Date,
  postShoot: PostShootSnapshot,
  workflow: TrackingWorkflowFlags,
  allCompleted: boolean,
): Pick<
  TrackingWorkflowView,
  "primaryTitle" | "primarySubtitle" | "deadlineDate" | "deadlineLabel"
> {
  if (allCompleted) {
    return {
      primaryTitle: "Hizmet Tamamlandı",
      primarySubtitle: "Tüm süreçler tamamlandı. Teşekkür ederiz.",
    };
  }

  if (!effectiveDef) {
    return { primaryTitle: "Sipariş Durumu" };
  }

  const deadlines = computeEffectiveWorkflowDeadlines(
    shootDate,
    postShoot,
    workflow,
  );

  if (effectiveDef.kind === "custom") {
    return {
      primaryTitle: effectiveDef.label,
      primarySubtitle: `${effectiveDef.label} aşaması devam ediyor.`,
    };
  }

  switch (effectiveDef.builtinKey) {
    case "rezervasyon":
      return {
        primaryTitle: "Rezervasyon",
        primarySubtitle: `Çekim tarihi: ${formatDeadline(deadlines.shoot)}`,
      };
    case "cekim":
      return {
        primaryTitle: "Çekim Bekleniyor",
        primarySubtitle: `Çekim tarihi: ${formatDeadline(deadlines.shoot)}`,
      };
    case "dijital":
    case "secim":
      return {
        primaryTitle: "Dijital Teslimat ve Seçim",
        primarySubtitle: `${formatDeadline(deadlines.digitalSelection)} tarihine kadar dijital içeriklerinizi teslim almalı ve seçim konusunda karar vermelisiniz.`,
        deadlineDate: deadlines.digitalSelection.toISOString(),
        deadlineLabel: "Son gün",
      };
    case "duzenleme":
      return {
        primaryTitle: "Düzenleniyor",
        primarySubtitle: `${formatDeadline(deadlines.editing)} tarihine kadar düzenleme süreci devam ediyor.`,
        deadlineDate: deadlines.editing.toISOString(),
        deadlineLabel: "Son gün",
      };
    case "baski":
      return {
        primaryTitle: "Baskılı Ürünler Hazırlanıyor",
        primarySubtitle: `${formatDeadline(deadlines.printing)} tarihine kadar baskı süreciniz devam ediyor.`,
        deadlineDate: deadlines.printing.toISOString(),
        deadlineLabel: "Son gün",
      };
    default:
      return {
        primaryTitle: effectiveDef.label,
        primarySubtitle: `${effectiveDef.label} aşaması devam ediyor.`,
      };
  }
}

export function workflowFlagsForAdminStageFromDefinitions(
  stageId: string,
  definitions: PackageWorkflowStageDefinition[],
): TrackingWorkflowFlags {
  const now = new Date().toISOString();
  const flags = emptyTrackingWorkflowFlags();
  flags.adminStage = stageId;
  flags.customCompletedAt = {};

  const targetIndex = definitions.findIndex((def) => def.id === stageId);
  if (targetIndex < 0) return flags;

  const editingIndex = definitions.findIndex(
    (def) => def.builtinKey === "duzenleme",
  );
  const printingIndex = definitions.findIndex(
    (def) => def.builtinKey === "baski",
  );

  for (let i = 0; i <= targetIndex; i++) {
    const def = definitions[i];
    if (def.kind === "custom") {
      flags.customCompletedAt![def.id] = now;
    }
  }

  if (editingIndex >= 0 && targetIndex >= editingIndex) {
    flags.digitalDeliveredAt = now;
    flags.selectionCompletedAt = now;
  }
  if (editingIndex >= 0 && targetIndex > editingIndex) {
    flags.editingCompletedAt = now;
  }
  if (printingIndex >= 0 && targetIndex > printingIndex) {
    flags.printingCompletedAt = now;
  }

  return flags;
}

export function buildDynamicTrackingWorkflowView(input: {
  shootDate: Date;
  postShoot: PostShootSnapshot;
  workflow: TrackingWorkflowFlags;
  stageDefinitions: PackageWorkflowStageDefinition[];
  now?: Date;
}): TrackingWorkflowView {
  const now = input.now ?? new Date();
  const { workflow, postShoot, stageDefinitions } = input;
  const hasPrinting = packageHasPrintingStage(stageDefinitions);
  const baseDeadlines = computeWorkflowDeadlines(input.shootDate, postShoot);
  const shootDay = startOfDay(input.shootDate);
  const shootPassed = isAfter(now, endOfDay(shootDay));
  const pickupDeadlinePassed = isAfter(now, baseDeadlines.digitalSelection);

  const editingDone = Boolean(workflow.editingCompletedAt);
  const printingDone = Boolean(workflow.printingCompletedAt);
  const serviceCompleted = printingDone || (editingDone && !hasPrinting);

  if (serviceCompleted) {
    return {
      primaryTitle: "Hizmet Tamamlandı",
      primarySubtitle: "Tüm süreçler tamamlandı. Teşekkür ederiz.",
      isCompleted: true,
      stages: buildDynamicStages(
        stageDefinitions,
        stageDefinitions[stageDefinitions.length - 1]?.id ?? "",
        input.shootDate,
        postShoot,
        workflow,
        shootPassed,
        true,
      ),
      availableAdminActions: [],
    };
  }

  const effectiveStageId = workflow.adminStage
    ? workflow.adminStage
    : inferEffectiveStageId(
        stageDefinitions,
        workflow,
        shootPassed,
        pickupDeadlinePassed,
        hasPrinting,
      );

  const effectiveDef = stageDefinitions.find(
    (def) => def.id === effectiveStageId,
  );
  const copy = buildPrimaryCopyForDynamic(
    effectiveDef,
    input.shootDate,
    postShoot,
    workflow,
    false,
  );

  return {
    ...copy,
    isCompleted: false,
    stages: buildDynamicStages(
      stageDefinitions,
      effectiveStageId,
      input.shootDate,
      postShoot,
      workflow,
      shootPassed,
      false,
    ),
    availableAdminActions: [],
  };
}

export function adminStageOptionsFromDefinitions(
  definitions: PackageWorkflowStageDefinition[],
): Array<{ id: string; label: string }> {
  return definitions.map((def) => {
    if (def.kind === "custom") {
      return { id: def.id, label: def.label };
    }

    switch (def.builtinKey) {
      case "rezervasyon":
        return { id: def.id, label: "Rezervasyon" };
      case "cekim":
        return { id: def.id, label: "Çekim Bekleniyor" };
      case "dijital":
        return { id: def.id, label: "Dijital Teslimat" };
      case "secim":
        return { id: def.id, label: "Seçim" };
      case "duzenleme":
        return { id: def.id, label: "Düzenleme" };
      case "baski":
        return { id: def.id, label: "Baskı" };
      default:
        return { id: def.id, label: def.label };
    }
  });
}
