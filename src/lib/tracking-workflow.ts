import {
  addDays,
  endOfDay,
  format,
  isAfter,
  startOfDay,
} from "date-fns";
import { tr } from "date-fns/locale";
import type { PostShootSnapshot } from "@/lib/post-shoot";
import type { PackageWorkflowStageDefinition } from "@/lib/package-workflow-stages";
import { buildDynamicTrackingWorkflowView } from "@/lib/tracking-workflow-dynamic";

export type TrackingWorkflowAction =
  | "digital_delivered"
  | "selection_completed"
  | "editing_completed"
  | "printing_completed"
  | "mark_delivered"
  | "unmark_delivered";

export type TrackingWorkflowFlags = {
  digitalDeliveredAt: string | null;
  selectionCompletedAt: string | null;
  editingCompletedAt: string | null;
  printingCompletedAt: string | null;
  deliveredAt: string | null;
  /** Çekim tamamlandı sayıldığı gün (manuel aşama değişimi vb.). */
  shootCompletedAt?: string | null;
  /** Admin panelinden doğrudan seçilen güncel aşama. */
  adminStage?: string | null;
  /** Özel aşama tamamlanma tarihleri (stage id → ISO). */
  customCompletedAt?: Record<string, string>;
  /**
   * Aşama son gün override'ları (YYYY-MM-DD).
   * Doluysa otomatik hesap yerine bu tarih gösterilir.
   */
  deadlineOverrides?: Partial<
    Record<"dijital" | "secim" | "duzenleme" | "baski", string | null>
  >;
};

export type TrackingWorkflowDeadlineOverrideKey =
  | "dijital"
  | "secim"
  | "duzenleme"
  | "baski";

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
  id: string;
  label: string;
  state: TrackingWorkflowStageState;
  tone?: "green" | "red" | "amber" | "default";
  /** Aşamanın hedef / tamamlanma tarihi (ISO). */
  deadlineDate?: string;
  /** Tarihin üstünde/yanında gösterilen etiket (ör. "Son Gün"). */
  deadlineLabel?: string;
  /** Tarihin altında gösterilen kısa açıklama. */
  deadlineHint?: string;
  /** true ise deadlineHint, gösterilen tarihten sonra cümleyi sürdürür. */
  deadlineHintContinuesDate?: boolean;
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
    deliveredAt: null,
    adminStage: null,
    customCompletedAt: {},
    deadlineOverrides: {},
  };
}

function parseDeadlineOverrides(
  value: unknown,
): TrackingWorkflowFlags["deadlineOverrides"] {
  if (!value || typeof value !== "object") return {};

  const keys: TrackingWorkflowDeadlineOverrideKey[] = [
    "dijital",
    "secim",
    "duzenleme",
    "baski",
  ];
  const result: NonNullable<TrackingWorkflowFlags["deadlineOverrides"]> = {};

  for (const key of keys) {
    const raw = (value as Record<string, unknown>)[key];
    if (typeof raw === "string" && raw.trim()) {
      result[key] = raw.trim().slice(0, 10);
    } else if (raw === null) {
      result[key] = null;
    }
  }

  return result;
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
    deliveredAt:
      typeof data.deliveredAt === "string" ? data.deliveredAt : null,
    shootCompletedAt:
      typeof data.shootCompletedAt === "string"
        ? data.shootCompletedAt
        : null,
    adminStage:
      typeof data.adminStage === "string" && data.adminStage.trim()
        ? data.adminStage.trim()
        : null,
    customCompletedAt:
      data.customCompletedAt && typeof data.customCompletedAt === "object"
        ? Object.fromEntries(
            Object.entries(data.customCompletedAt).filter(
              (entry): entry is [string, string] =>
                typeof entry[0] === "string" && typeof entry[1] === "string",
            ),
          )
        : {},
    deadlineOverrides: parseDeadlineOverrides(data.deadlineOverrides),
  };
}

export function mergeWorkflowAction(
  flags: TrackingWorkflowFlags,
  action: TrackingWorkflowAction,
): TrackingWorkflowFlags {
  const now = new Date().toISOString();
  switch (action) {
    case "digital_delivered":
      return {
        ...flags,
        digitalDeliveredAt: flags.digitalDeliveredAt ?? now,
        shootCompletedAt: flags.shootCompletedAt ?? now,
      };
    case "selection_completed":
      return {
        ...flags,
        selectionCompletedAt: flags.selectionCompletedAt ?? now,
        shootCompletedAt: flags.shootCompletedAt ?? now,
      };
    case "editing_completed":
      return { ...flags, editingCompletedAt: flags.editingCompletedAt ?? now };
    case "printing_completed":
      return { ...flags, printingCompletedAt: flags.printingCompletedAt ?? now };
    case "mark_delivered":
      return { ...flags, deliveredAt: flags.deliveredAt ?? now };
    case "unmark_delivered":
      return { ...flags, deliveredAt: null };
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

/** Dijital teslim / seçim son günü — "X Günde Hazır" etiketini yok sayar. */
function parseDigitalDeadlineDaysFromPills(
  pills: string[],
  fallback = 30,
): number {
  for (const pill of pills) {
    const alinmali = pill.match(/(\d+)\s*Günde\s*Alınmalı/i);
    if (alinmali) return Number.parseInt(alinmali[1], 10);
  }
  for (const pill of pills) {
    if (/Hazır/i.test(pill)) continue;
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

const DEFAULT_DIGITAL_SELECTION_DAYS = 30;
const DEFAULT_EDITING_AFTER_SELECTION_DAYS = 70;
const DEFAULT_PRINTING_AFTER_EDITING_DAYS = 30;

export function getWorkflowDayCounts(postShoot?: PostShootSnapshot) {
  const digitalDays = postShoot
    ? parseDigitalDeadlineDaysFromPills(
        postShoot.digital.pills,
        DEFAULT_DIGITAL_SELECTION_DAYS,
      )
    : DEFAULT_DIGITAL_SELECTION_DAYS;
  const editingDaysAfter = postShoot
    ? parseDeadlineDaysFromPills(
        postShoot.editing.pills,
        DEFAULT_EDITING_AFTER_SELECTION_DAYS,
      )
    : DEFAULT_EDITING_AFTER_SELECTION_DAYS;
  const printingDaysAfter = postShoot
    ? parseDeadlineDaysFromPills(
        postShoot.printing.pills,
        DEFAULT_PRINTING_AFTER_EDITING_DAYS,
      )
    : DEFAULT_PRINTING_AFTER_EDITING_DAYS;

  return { digitalDays, editingDaysAfter, printingDaysAfter };
}

function completionDay(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  return endOfDay(startOfDay(new Date(iso)));
}

export type WorkflowDeadlines = {
  shoot: Date;
  digitalSelection: Date;
  editing: Date;
  printing: Date;
};

/** Çekim tarihine göre varsayılan son günleri hesaplar (erken tamamlama yok). */
export function computeWorkflowDeadlines(
  shootDate: Date,
  postShoot?: PostShootSnapshot,
): WorkflowDeadlines {
  return computeEffectiveWorkflowDeadlines(
    shootDate,
    postShoot,
    emptyTrackingWorkflowFlags(),
  );
}

/** Tamamlanma tarihlerine göre sonraki aşama son günlerini kaydırır. */
export function computeEffectiveWorkflowDeadlines(
  shootDate: Date,
  postShoot?: PostShootSnapshot,
  workflow: TrackingWorkflowFlags = emptyTrackingWorkflowFlags(),
): WorkflowDeadlines {
  const shootDay = startOfDay(shootDate);
  const { digitalDays, editingDaysAfter, printingDaysAfter } =
    getWorkflowDayCounts(postShoot);

  const cekimDay =
    completionDay(workflow.shootCompletedAt) ?? shootDay;
  const digitalSelection = endOfDay(addDays(cekimDay, digitalDays));
  const selectionAnchor =
    completionDay(workflow.selectionCompletedAt) ?? digitalSelection;
  const editing = endOfDay(addDays(selectionAnchor, editingDaysAfter));
  const editingAnchor =
    completionDay(workflow.editingCompletedAt) ?? editing;
  const printing = endOfDay(addDays(editingAnchor, printingDaysAfter));

  return {
    shoot: endOfDay(shootDay),
    digitalSelection,
    editing,
    printing,
  };
}

export function resolveStageDeadlineOverride(
  id: TrackingWorkflowStageId,
  workflow: TrackingWorkflowFlags,
): Date | null {
  if (
    id !== "dijital" &&
    id !== "secim" &&
    id !== "duzenleme" &&
    id !== "baski"
  ) {
    return null;
  }

  const raw = workflow.deadlineOverrides?.[id];
  if (!raw) return null;

  const parsed = startOfDay(new Date(`${raw.slice(0, 10)}T12:00:00`));
  if (Number.isNaN(parsed.getTime())) return null;
  return endOfDay(parsed);
}

/** Baskı onayı = düzenleme tamamlandı (veya override girildi). */
export function isPrintingDeadlineApproved(
  workflow: TrackingWorkflowFlags,
): boolean {
  return Boolean(
    workflow.editingCompletedAt || workflow.deadlineOverrides?.baski,
  );
}

export function resolveStageDeadlineDate(
  id: TrackingWorkflowStageId,
  deadlines: WorkflowDeadlines,
  workflow: TrackingWorkflowFlags,
  reservationCreatedAt?: Date,
): Date {
  const override = resolveStageDeadlineOverride(id, workflow);
  if (override) return override;

  switch (id) {
    case "rezervasyon":
      return reservationCreatedAt
        ? endOfDay(startOfDay(reservationCreatedAt))
        : deadlines.shoot;
    case "cekim":
      return deadlines.shoot;
    case "dijital":
      return deadlines.digitalSelection;
    case "secim":
      return deadlines.digitalSelection;
    case "duzenleme":
      return deadlines.editing;
    case "baski":
      return deadlines.printing;
    default:
      return deadlines.shoot;
  }
}

function resolveEffectiveStage(
  stageId: TrackingWorkflowStageId,
  order: TrackingWorkflowStageId[],
  shootPassed: boolean,
): TrackingWorkflowStageId {
  if (!shootPassed) return stageId;

  const stageIndex = order.indexOf(stageId);
  const cekimIndex = order.indexOf("cekim");
  const dijitalIndex = order.indexOf("dijital");

  if (stageIndex <= cekimIndex && dijitalIndex >= 0) {
    return "dijital";
  }

  return stageId;
}

function isParallelDigitalSelectionStage(
  stageId: TrackingWorkflowStageId,
): boolean {
  return stageId === "dijital" || stageId === "secim";
}

function isShootEffectivelyComplete(
  workflow: TrackingWorkflowFlags,
  shootPassed: boolean,
  order: TrackingWorkflowStageId[],
): boolean {
  if (shootPassed) return true;

  if (
    workflow.digitalDeliveredAt ||
    workflow.selectionCompletedAt ||
    workflow.editingCompletedAt ||
    workflow.printingCompletedAt
  ) {
    return true;
  }

  if (workflow.adminStage) {
    const cekimIndex = order.indexOf("cekim");
    const adminIndex = order.indexOf(
      workflow.adminStage as TrackingWorkflowStageId,
    );
    if (cekimIndex >= 0 && adminIndex > cekimIndex) return true;
  }

  return false;
}

function computeStageState(
  id: TrackingWorkflowStageId,
  effectiveStageId: TrackingWorkflowStageId,
  order: TrackingWorkflowStageId[],
  shootPassed: boolean,
  workflow: TrackingWorkflowFlags,
): TrackingWorkflowStageState {
  const effectiveIndex = order.indexOf(effectiveStageId);
  const idIndex = order.indexOf(id);
  const duzenlemeIndex = order.indexOf("duzenleme");
  const shootComplete = isShootEffectivelyComplete(workflow, shootPassed, order);

  if (id === "dijital" || id === "secim") {
    if (duzenlemeIndex >= 0 && effectiveIndex >= duzenlemeIndex) {
      return "completed";
    }
    if (
      shootComplete &&
      isParallelDigitalSelectionStage(effectiveStageId)
    ) {
      return "current";
    }
    if (effectiveIndex > idIndex) return "completed";
    return "upcoming";
  }

  if (id === "cekim") {
    if (!shootComplete) {
      return effectiveStageId === "rezervasyon" ? "upcoming" : "current";
    }
    return "completed";
  }

  if (id === "rezervasyon") {
    if (!shootPassed && effectiveStageId === "rezervasyon") return "current";
    return "completed";
  }

  if (idIndex < effectiveIndex) return "completed";
  if (idIndex === effectiveIndex) return "current";
  return "upcoming";
}

function computeStageTone(
  id: TrackingWorkflowStageId,
  state: TrackingWorkflowStageState,
): TrackingWorkflowStageView["tone"] {
  if (state === "completed") return "green";
  if (state === "current") {
    if (id === "cekim") return "red";
    return "amber";
  }
  return "default";
}

export function resolveStageDeadlineHint(
  id: TrackingWorkflowStageId,
  state: TrackingWorkflowStageState,
  dayCounts: { editingDaysAfter: number; printingDaysAfter: number },
  workflow: TrackingWorkflowFlags = emptyTrackingWorkflowFlags(),
): { hint?: string; continuesDate?: boolean; label?: string } {
  if (state === "completed") return {};

  switch (id) {
    case "dijital":
    case "secim":
    case "duzenleme":
      return { label: "Son Gün" };
    case "baski":
      if (!isPrintingDeadlineApproved(workflow)) {
        return {
          hint: `Onaydan sonra ${dayCounts.printingDaysAfter} günde kargoda`,
        };
      }
      return { label: "Son Gün" };
    default:
      return {};
  }
}

export function stageShowsDeadlineWhenUpcoming(
  id: TrackingWorkflowStageId,
  workflow: TrackingWorkflowFlags = emptyTrackingWorkflowFlags(),
): boolean {
  if (id === "dijital" || id === "secim" || id === "duzenleme") return true;
  if (id === "baski") return isPrintingDeadlineApproved(workflow);
  return false;
}

function buildStagesFromEffectiveStage(
  effectiveStageId: TrackingWorkflowStageId,
  deadlines: WorkflowDeadlines,
  hasPrinting: boolean,
  shootPassed: boolean,
  allCompleted: boolean,
  workflow: TrackingWorkflowFlags,
  postShoot?: PostShootSnapshot,
  reservationCreatedAt?: Date,
): TrackingWorkflowStageView[] {
  const order = workflowStageOrder(hasPrinting);
  const dayCounts = getWorkflowDayCounts(postShoot);

  if (allCompleted) {
    return order.map((id) => ({
      id,
      label: stageCompletedLabel(id),
      state: "completed" as const,
      tone: "green" as const,
      deadlineDate: resolveStageDeadlineDate(
        id,
        deadlines,
        workflow,
        reservationCreatedAt,
      ).toISOString(),
    }));
  }

  return order.map((id) => {
    const state = computeStageState(
      id,
      effectiveStageId,
      order,
      shootPassed,
      workflow,
    );
    const { hint, continuesDate, label } = resolveStageDeadlineHint(
      id,
      state,
      dayCounts,
      workflow,
    );
    const showDeadline =
      (state !== "upcoming" || stageShowsDeadlineWhenUpcoming(id, workflow)) &&
      !(id === "baski" && !isPrintingDeadlineApproved(workflow) && state !== "completed");
    const showHint = Boolean(hint) && !showDeadline;
    return {
      id,
      label: stageDefaultLabel(id, state),
      state,
      tone: computeStageTone(id, state),
      deadlineDate: showDeadline
        ? resolveStageDeadlineDate(
            id,
            deadlines,
            workflow,
            reservationCreatedAt,
          ).toISOString()
        : undefined,
      deadlineLabel:
        showDeadline && state !== "completed"
          ? label ?? "Son Gün"
          : undefined,
      deadlineHint: showHint ? hint : undefined,
      deadlineHintContinuesDate: showDeadline ? continuesDate : undefined,
    };
  });
}

function inferEffectiveStageWithoutAdmin(
  workflow: TrackingWorkflowFlags,
  shootPassed: boolean,
  pickupDeadlinePassed: boolean,
  hasPrinting: boolean,
): TrackingWorkflowStageId {
  if (!shootPassed) return "cekim";

  const editingDone = Boolean(workflow.editingCompletedAt);
  const printingDone = Boolean(workflow.printingCompletedAt);

  if (printingDone || (editingDone && !hasPrinting)) {
    return hasPrinting ? "baski" : "duzenleme";
  }
  if (editingDone && hasPrinting && !printingDone) return "baski";
  if (
    !editingDone &&
    (pickupDeadlinePassed || Boolean(workflow.selectionCompletedAt))
  ) {
    return "duzenleme";
  }
  return "dijital";
}

function buildPrimaryCopy(
  effectiveStageId: TrackingWorkflowStageId,
  deadlines: WorkflowDeadlines,
  allCompleted: boolean,
  hasPrinting: boolean,
  reservationCreatedAt?: Date,
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

  switch (effectiveStageId) {
    case "rezervasyon":
      return {
        primaryTitle: "Rezervasyon",
        primarySubtitle: reservationCreatedAt
          ? `Rezervasyon tarihi: ${formatDeadline(endOfDay(startOfDay(reservationCreatedAt)))}`
          : "Rezervasyon alındı",
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
      return { primaryTitle: "Sipariş Durumu" };
  }
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

  const cekimIndex = order.indexOf("cekim");
  const editingIndex = order.indexOf("duzenleme");
  const printingIndex = order.indexOf("baski");

  if (cekimIndex >= 0 && stageIndex > cekimIndex) {
    flags.shootCompletedAt = now;
  }

  if (stageIndex >= editingIndex && editingIndex >= 0) {
    flags.digitalDeliveredAt = now;
    flags.selectionCompletedAt = now;
  }
  if (stageIndex > editingIndex && editingIndex >= 0) {
    flags.editingCompletedAt = now;
  }
  if (printingIndex >= 0 && stageIndex > printingIndex) {
    flags.printingCompletedAt = now;
  }

  return flags;
}

function buildViewFromAdminStage(
  stageId: TrackingWorkflowStageId,
  hasPrinting: boolean,
  shootDate: Date,
  postShoot: PostShootSnapshot,
  workflow: TrackingWorkflowFlags,
  now: Date = new Date(),
  reservationCreatedAt?: Date,
): TrackingWorkflowView {
  const order = workflowStageOrder(hasPrinting);
  const deadlines = computeEffectiveWorkflowDeadlines(
    shootDate,
    postShoot,
    workflow,
  );
  const shootPassed = isAfter(now, endOfDay(startOfDay(shootDate)));
  const resolvedStage = resolveEffectiveStage(stageId, order, shootPassed);

  const stages = buildStagesFromEffectiveStage(
    resolvedStage,
    deadlines,
    hasPrinting,
    shootPassed,
    false,
    workflow,
    postShoot,
    reservationCreatedAt,
  );

  const copy = buildPrimaryCopy(
    resolvedStage,
    deadlines,
    false,
    hasPrinting,
    reservationCreatedAt,
  );

  return {
    ...copy,
    isCompleted: false,
    stages,
    availableAdminActions: [],
  };
}

export function getCurrentWorkflowStageId(
  workflow: TrackingWorkflowView,
): string | null {
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
  hasPrinting?: boolean;
  stageDefinitions?: PackageWorkflowStageDefinition[];
  reservationCreatedAt?: Date;
  now?: Date;
}): TrackingWorkflowView {
  if (input.stageDefinitions?.length) {
    return buildDynamicTrackingWorkflowView({
      shootDate: input.shootDate,
      postShoot: input.postShoot,
      workflow: input.workflow,
      stageDefinitions: input.stageDefinitions,
      reservationCreatedAt: input.reservationCreatedAt,
      now: input.now,
    });
  }

  const reservationCreatedAt = input.reservationCreatedAt;
  const now = input.now ?? new Date();
  const { postShoot, workflow } = input;
  const hasPrinting = input.hasPrinting ?? false;
  const baseDeadlines = computeWorkflowDeadlines(input.shootDate, postShoot);
  const deadlines = computeEffectiveWorkflowDeadlines(
    input.shootDate,
    postShoot,
    workflow,
  );
  const shootDay = startOfDay(input.shootDate);
  const shootPassed = isAfter(now, endOfDay(shootDay));
  const pickupDeadlinePassed = isAfter(now, baseDeadlines.digitalSelection);

  const digitalDone = Boolean(workflow.digitalDeliveredAt);
  const selectionDone = Boolean(workflow.selectionCompletedAt);
  const editingDone = Boolean(workflow.editingCompletedAt);
  const printingDone = Boolean(workflow.printingCompletedAt);
  const serviceCompleted =
    printingDone || (editingDone && !hasPrinting);

  const availableAdminActions: TrackingWorkflowAction[] = [];
  const shootComplete = isShootEffectivelyComplete(
    workflow,
    shootPassed,
    workflowStageOrder(hasPrinting),
  );

  if (shootComplete && !digitalDone) {
    availableAdminActions.push("digital_delivered");
  }
  if (shootComplete && !selectionDone) {
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

  if (workflow.adminStage) {
    return buildViewFromAdminStage(
      workflow.adminStage as TrackingWorkflowStageId,
      hasPrinting,
      input.shootDate,
      postShoot,
      workflow,
      now,
      reservationCreatedAt,
    );
  }

  if (serviceCompleted) {
    return {
      primaryTitle: "Hizmet Tamamlandı",
      primarySubtitle: "Tüm süreçler tamamlandı. Teşekkür ederiz.",
      isCompleted: true,
      stages: buildStagesFromEffectiveStage(
        hasPrinting ? "baski" : "duzenleme",
        deadlines,
        hasPrinting,
        shootPassed,
        true,
        workflow,
        postShoot,
        reservationCreatedAt,
      ),
      availableAdminActions: [],
    };
  }

  const effectiveStage = inferEffectiveStageWithoutAdmin(
    workflow,
    shootPassed,
    pickupDeadlinePassed,
    hasPrinting,
  );

  const copy = buildPrimaryCopy(
    effectiveStage,
    deadlines,
    false,
    hasPrinting,
    reservationCreatedAt,
  );

  return {
    ...copy,
    summary:
      effectiveStage === "duzenleme"
        ? summarizePills(postShoot.editing.pills)
        : effectiveStage === "baski"
          ? summarizePills(postShoot.printing.pills)
          : undefined,
    isCompleted: false,
    stages: buildStagesFromEffectiveStage(
      effectiveStage,
      deadlines,
      hasPrinting,
      shootPassed,
      false,
      workflow,
      postShoot,
      reservationCreatedAt,
    ),
    availableAdminActions,
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

export const TRACKING_WORKFLOW_ACTION_LABELS: Record<
  TrackingWorkflowAction,
  string
> = {
  digital_delivered: "Dijital teslimat yapıldı",
  selection_completed: "Seçim tamamlandı",
  editing_completed: "Düzenleme tamamlandı",
  printing_completed: "Baskı tamamlandı",
  mark_delivered: "Teslim edildi",
  unmark_delivered: "Teslim işaretini kaldır",
};
