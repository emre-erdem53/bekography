import {
  addDays,
  endOfDay,
  format,
  isAfter,
  startOfDay,
} from "date-fns";
import { tr } from "date-fns/locale";
import type { PostShootSnapshot } from "@/lib/post-shoot";

export type TrackingWorkflowAction =
  | "digital_delivered"
  | "selection_completed"
  | "editing_completed"
  | "printing_completed";

export type TrackingWorkflowFlags = {
  digitalDeliveredAt: string | null;
  selectionCompletedAt: string | null;
  editingCompletedAt: string | null;
  printingCompletedAt: string | null;
  /** Admin panelinden doğrudan seçilen güncel aşama. */
  adminStage?: TrackingWorkflowStageId | null;
};

export type TrackingWorkflowStageId =
  | "rezervasyon"
  | "cekim"
  | "dijital"
  | "secim"
  | "duzenleme"
  | "baski";

export type TrackingWorkflowStageState =
  | "completed"
  | "current"
  | "upcoming";

export type TrackingWorkflowStageView = {
  id: TrackingWorkflowStageId;
  label: string;
  state: TrackingWorkflowStageState;
  tone?: "green" | "red" | "amber" | "default";
};

export type TrackingWorkflowView = {
  primaryTitle: string;
  primarySubtitle?: string;
  summary?: string;
  deadlineDate?: string;
  deadlineLabel?: string;
  isCompleted: boolean;
  stages: TrackingWorkflowStageView[];
  availableAdminActions: TrackingWorkflowAction[];
};

export const TRACKING_WORKFLOW_STAGE_ORDER: TrackingWorkflowStageId[] = [
  "rezervasyon",
  "cekim",
  "dijital",
  "secim",
  "duzenleme",
  "baski",
];

export function emptyTrackingWorkflowFlags(): TrackingWorkflowFlags {
  return {
    digitalDeliveredAt: null,
    selectionCompletedAt: null,
    editingCompletedAt: null,
    printingCompletedAt: null,
    adminStage: null,
  };
}

export function parseTrackingWorkflowFlags(
  value: unknown,
): TrackingWorkflowFlags {
  if (!value || typeof value !== "object") {
    return emptyTrackingWorkflowFlags();
  }

  const data = value as Partial<TrackingWorkflowFlags>;
  return {
    digitalDeliveredAt:
      typeof data.digitalDeliveredAt === "string"
        ? data.digitalDeliveredAt
        : null,
    selectionCompletedAt:
      typeof data.selectionCompletedAt === "string"
        ? data.selectionCompletedAt
        : null,
    editingCompletedAt:
      typeof data.editingCompletedAt === "string"
        ? data.editingCompletedAt
        : null,
    printingCompletedAt:
      typeof data.printingCompletedAt === "string"
        ? data.printingCompletedAt
        : null,
    adminStage:
      typeof data.adminStage === "string" &&
      (TRACKING_WORKFLOW_STAGE_ORDER as string[]).includes(data.adminStage)
        ? (data.adminStage as TrackingWorkflowStageId)
        : null,
  };
}

export function mergeWorkflowAction(
  flags: TrackingWorkflowFlags,
  action: TrackingWorkflowAction,
): TrackingWorkflowFlags {
  const now = new Date().toISOString();
  switch (action) {
    case "digital_delivered":
      return { ...flags, digitalDeliveredAt: flags.digitalDeliveredAt ?? now };
    case "selection_completed":
      return {
        ...flags,
        selectionCompletedAt: flags.selectionCompletedAt ?? now,
      };
    case "editing_completed":
      return { ...flags, editingCompletedAt: flags.editingCompletedAt ?? now };
    case "printing_completed":
      return { ...flags, printingCompletedAt: flags.printingCompletedAt ?? now };
    default:
      return flags;
  }
}

export function hasPrintingProducts(postShoot: PostShootSnapshot): boolean {
  return postShoot.printing.pills.length > 0;
}

export function parseDeadlineDaysFromPills(
  pills: string[],
  fallback = 30,
): number {
  for (const pill of pills) {
    const alinmali = pill.match(/(\d+)\s*Günde\s*Alınmalı/i);
    if (alinmali) return Number.parseInt(alinmali[1], 10);
  }
  for (const pill of pills) {
    const match = pill.match(/(\d+)\s*Gün/i);
    if (match) return Number.parseInt(match[1], 10);
  }
  return fallback;
}

function formatDeadline(date: Date): string {
  return format(date, "d MMMM yyyy", { locale: tr });
}

function summarizePills(pills: string[]): string {
  return pills.filter(Boolean).join(" · ");
}

export const ADMIN_WORKFLOW_STAGE_OPTIONS: Array<{
  id: TrackingWorkflowStageId;
  label: string;
}> = [
  { id: "rezervasyon", label: "Rezervasyon" },
  { id: "cekim", label: "Çekim Bekleniyor" },
  { id: "dijital", label: "Dijital Teslimat" },
  { id: "secim", label: "Seçim" },
  { id: "duzenleme", label: "Düzenleme" },
  { id: "baski", label: "Baskı" },
];

export function workflowStageOrder(hasPrinting: boolean): TrackingWorkflowStageId[] {
  return TRACKING_WORKFLOW_STAGE_ORDER.filter(
    (id) => id !== "baski" || hasPrinting,
  );
}

export function workflowFlagsForAdminStage(
  stageId: TrackingWorkflowStageId,
  hasPrinting: boolean,
): TrackingWorkflowFlags {
  const now = new Date().toISOString();
  const order = workflowStageOrder(hasPrinting);
  const stageIndex = order.indexOf(stageId);
  const flags = emptyTrackingWorkflowFlags();
  flags.adminStage = stageId;

  const digitalIndex = order.indexOf("dijital");
  const selectionIndex = order.indexOf("secim");
  const editingIndex = order.indexOf("duzenleme");
  const printingIndex = order.indexOf("baski");

  if (stageIndex > digitalIndex && digitalIndex >= 0) {
    flags.digitalDeliveredAt = now;
  }
  if (stageIndex > selectionIndex && selectionIndex >= 0) {
    flags.digitalDeliveredAt = now;
    flags.selectionCompletedAt = now;
  }
  if (stageIndex > editingIndex && editingIndex >= 0) {
    flags.digitalDeliveredAt = now;
    flags.selectionCompletedAt = now;
    flags.editingCompletedAt = now;
  }
  if (printingIndex >= 0 && stageIndex > printingIndex) {
    flags.digitalDeliveredAt = now;
    flags.selectionCompletedAt = now;
    flags.editingCompletedAt = now;
    flags.printingCompletedAt = now;
  }

  return flags;
}

function buildViewFromAdminStage(
  stageId: TrackingWorkflowStageId,
  hasPrinting: boolean,
): TrackingWorkflowView {
  const order = workflowStageOrder(hasPrinting);
  const stageIndex = order.indexOf(stageId);

  if (stageIndex < 0) {
    return buildViewFromAdminStage("rezervasyon", hasPrinting);
  }

  const stages = order.map((id, index) => {
    const state: TrackingWorkflowStageState =
      index < stageIndex
        ? "completed"
        : index === stageIndex
          ? "current"
          : "upcoming";

    let tone: TrackingWorkflowStageView["tone"] = "default";
    if (state === "completed") tone = "green";
    if (state === "current") {
      tone = id === "cekim" ? "red" : "amber";
    }

    return {
      id,
      label: stageDefaultLabel(id, state),
      state,
      tone,
    };
  });

  const isCompleted = false;

  return {
    primaryTitle: stageDefaultLabel(stageId, "current"),
    isCompleted,
    stages,
    availableAdminActions: [],
  };
}

export function getCurrentWorkflowStageId(
  workflow: TrackingWorkflowView,
): TrackingWorkflowStageId | null {
  const current = workflow.stages.filter((stage) => stage.state === "current");
  if (current.length === 1) return current[0].id;
  if (workflow.isCompleted) {
    const last = workflow.stages[workflow.stages.length - 1];
    return last?.id ?? null;
  }
  return current[0]?.id ?? null;
}

export function buildTrackingWorkflowView(input: {
  shootDate: Date;
  postShoot: PostShootSnapshot;
  workflow: TrackingWorkflowFlags;
  now?: Date;
}): TrackingWorkflowView {
  const now = input.now ?? new Date();
  const { postShoot, workflow } = input;
  const hasPrinting = hasPrintingProducts(postShoot);

  if (workflow.adminStage) {
    return buildViewFromAdminStage(workflow.adminStage, hasPrinting);
  }

  const shootDay = startOfDay(input.shootDate);
  const shootPassed = isAfter(now, endOfDay(shootDay));

  const pickupDays = parseDeadlineDaysFromPills(postShoot.digital.pills, 30);
  const editingDays = parseDeadlineDaysFromPills(postShoot.editing.pills, 70);
  const pickupDeadline = endOfDay(addDays(shootDay, pickupDays));
  const editingDeadline = endOfDay(addDays(shootDay, editingDays));
  const pickupDeadlinePassed = isAfter(now, pickupDeadline);

  const digitalDone = Boolean(workflow.digitalDeliveredAt);
  const selectionDone = Boolean(workflow.selectionCompletedAt);
  const editingDone = Boolean(workflow.editingCompletedAt);
  const printingDone = Boolean(workflow.printingCompletedAt);
  const serviceCompleted =
    printingDone || (editingDone && !hasPrinting);

  const availableAdminActions: TrackingWorkflowAction[] = [];
  if (shootPassed && !digitalDone) {
    availableAdminActions.push("digital_delivered");
  }
  if (shootPassed && !selectionDone) {
    availableAdminActions.push("selection_completed");
  }
  if (
    (selectionDone || pickupDeadlinePassed) &&
    !editingDone &&
    !serviceCompleted
  ) {
    availableAdminActions.push("editing_completed");
  }
  if (editingDone && hasPrinting && !printingDone) {
    availableAdminActions.push("printing_completed");
  }

  if (serviceCompleted) {
    return {
      primaryTitle: "Hizmet Tamamlandı",
      primarySubtitle: "Tüm süreçler tamamlandı. Teşekkür ederiz.",
      isCompleted: true,
      stages: TRACKING_WORKFLOW_STAGE_ORDER.filter(
        (id) => id !== "baski" || hasPrinting,
      ).map((id) => ({
        id,
        label: stageCompletedLabel(id),
        state: "completed" as const,
        tone: "green",
      })),
      availableAdminActions: [],
    };
  }

  if (!shootPassed) {
    return {
      primaryTitle: "Çekim Bekleniyor",
      primarySubtitle: `Çekim tarihi: ${formatDeadline(shootDay)}`,
      isCompleted: false,
      stages: buildStageStates({
        rezervasyon: "completed",
        cekim: "current",
        dijital: "upcoming",
        secim: "upcoming",
        duzenleme: "upcoming",
        baski: hasPrinting ? "upcoming" : "upcoming",
        hasPrinting,
        cekimTone: "red",
      }),
      availableAdminActions,
    };
  }

  if (
    !selectionDone &&
    !editingDone &&
    !pickupDeadlinePassed
  ) {
    const activeDigital = !digitalDone;
    const activeSelection = !selectionDone;

    const titleParts: string[] = [];
    if (activeDigital) titleParts.push("Dijital Teslimat Yapılacak");
    if (activeSelection) titleParts.push("Seçim Yapılacak");

    return {
      primaryTitle: titleParts.join(" ve "),
      primarySubtitle:
        activeDigital && activeSelection
          ? `${formatDeadline(pickupDeadline)} tarihine kadar dijital içeriklerinizi teslim almalı ve seçim konusunda karar vermelisiniz.`
          : activeSelection
            ? `${formatDeadline(pickupDeadline)} tarihine kadar seçim konusunda karar vermelisiniz.`
            : undefined,
      deadlineDate: pickupDeadline.toISOString(),
      deadlineLabel: "Son gün",
      isCompleted: false,
      stages: buildStageStates({
        rezervasyon: "completed",
        cekim: "completed",
        dijital: activeDigital ? "current" : digitalDone ? "completed" : "upcoming",
        secim: activeSelection ? "current" : selectionDone ? "completed" : "upcoming",
        duzenleme: "upcoming",
        baski: hasPrinting ? "upcoming" : "upcoming",
        hasPrinting,
        cekimTone: "green",
      }),
      availableAdminActions,
    };
  }

  if (!editingDone) {
    return {
      primaryTitle: "Düzenleniyor",
      primarySubtitle: `${formatDeadline(editingDeadline)} tarihine kadar düzenleme süreci devam ediyor.`,
      summary: summarizePills(postShoot.editing.pills),
      deadlineDate: editingDeadline.toISOString(),
      deadlineLabel: "Son gün",
      isCompleted: false,
      stages: buildStageStates({
        rezervasyon: "completed",
        cekim: "completed",
        dijital: "completed",
        secim: "completed",
        duzenleme: "current",
        baski: hasPrinting ? "upcoming" : "upcoming",
        hasPrinting,
        cekimTone: "green",
      }),
      availableAdminActions,
    };
  }

  if (hasPrinting && !printingDone) {
    return {
      primaryTitle: "Baskılı Ürünler Hazırlanıyor",
      primarySubtitle: "Baskı süreciniz devam ediyor.",
      summary: summarizePills(postShoot.printing.pills),
      deadlineDate: editingDeadline.toISOString(),
      deadlineLabel: "Son gün",
      isCompleted: false,
      stages: buildStageStates({
        rezervasyon: "completed",
        cekim: "completed",
        dijital: "completed",
        secim: "completed",
        duzenleme: "completed",
        baski: "current",
        hasPrinting,
        cekimTone: "green",
      }),
      availableAdminActions,
    };
  }

  return {
    primaryTitle: "Hizmet Tamamlandı",
    isCompleted: true,
    stages: TRACKING_WORKFLOW_STAGE_ORDER.filter(
      (id) => id !== "baski" || hasPrinting,
    ).map((id) => ({
      id,
      label: stageCompletedLabel(id),
      state: "completed",
      tone: "green",
    })),
    availableAdminActions: [],
  };
}

function stageCompletedLabel(id: TrackingWorkflowStageId): string {
  switch (id) {
    case "rezervasyon":
      return "Rezervasyon";
    case "cekim":
      return "Çekim Yapıldı";
    case "dijital":
      return "Dijital Teslimat Yapıldı";
    case "secim":
      return "Seçim Yapıldı";
    case "duzenleme":
      return "Düzenlendi";
    case "baski":
      return "Baskı Tamamlandı";
    default:
      return id;
  }
}

export function getTrackingStageLabel(
  id: TrackingWorkflowStageId,
  state: TrackingWorkflowStageState,
): string {
  return stageDefaultLabel(id, state);
}

function stageDefaultLabel(
  id: TrackingWorkflowStageId,
  state: TrackingWorkflowStageState,
): string {
  if (state === "upcoming") return stageUpcomingLabel(id);
  if (id === "cekim" && state === "current") return "Çekim Bekleniyor";
  if (id === "cekim" && state === "completed") return "Çekim Yapıldı";
  if (id === "dijital" && state === "current") return "Dijital Teslimat";
  if (id === "dijital" && state === "completed") return "Dijital Teslimat Yapıldı";
  if (id === "secim" && state === "current") return "Seçim";
  if (id === "secim" && state === "completed") return "Seçim Yapıldı";
  if (id === "duzenleme" && state === "current") return "Düzenleniyor";
  if (id === "duzenleme" && state === "completed") return "Düzenlendi";
  if (id === "baski" && state === "current") return "Baskı";
  if (id === "baski" && state === "completed") return "Baskı Tamamlandı";
  if (id === "rezervasyon") return "Rezervasyon";
  return stageUpcomingLabel(id);
}

function stageUpcomingLabel(id: TrackingWorkflowStageId): string {
  switch (id) {
    case "rezervasyon":
      return "Rezervasyon";
    case "cekim":
      return "Çekim";
    case "dijital":
      return "Dijital Teslimat";
    case "secim":
      return "Seçim";
    case "duzenleme":
      return "Düzenleme";
    case "baski":
      return "Baskı";
    default:
      return id;
  }
}

function buildStageStates(input: {
  rezervasyon: TrackingWorkflowStageState;
  cekim: TrackingWorkflowStageState;
  dijital: TrackingWorkflowStageState;
  secim: TrackingWorkflowStageState;
  duzenleme: TrackingWorkflowStageState;
  baski: TrackingWorkflowStageState;
  hasPrinting: boolean;
  cekimTone?: "green" | "red";
}): TrackingWorkflowStageView[] {
  const entries: Array<{
    id: TrackingWorkflowStageId;
    state: TrackingWorkflowStageState;
    tone?: TrackingWorkflowStageView["tone"];
  }> = [
    { id: "rezervasyon", state: input.rezervasyon, tone: "green" },
    {
      id: "cekim",
      state: input.cekim,
      tone:
        input.cekim === "current"
          ? input.cekimTone
          : input.cekim === "completed"
            ? "green"
            : "default",
    },
    { id: "dijital", state: input.dijital },
    { id: "secim", state: input.secim },
    { id: "duzenleme", state: input.duzenleme },
    { id: "baski", state: input.baski },
  ];

  return entries
    .filter((entry) => entry.id !== "baski" || input.hasPrinting)
    .map((entry) => ({
      id: entry.id,
      label: stageDefaultLabel(entry.id, entry.state),
      state: entry.state,
      tone:
        entry.state === "completed"
          ? entry.tone ?? "green"
          : entry.state === "current"
            ? entry.tone ?? "amber"
            : "default",
    }));
}

export const TRACKING_WORKFLOW_ACTION_LABELS: Record<
  TrackingWorkflowAction,
  string
> = {
  digital_delivered: "Dijital teslimat yapıldı",
  selection_completed: "Seçim tamamlandı",
  editing_completed: "Düzenleme tamamlandı",
  printing_completed: "Baskı tamamlandı",
};
