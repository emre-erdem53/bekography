import { RESERVATION_STATUS_LABELS } from "@/lib/constants";
import { parsePostShootSnapshot } from "@/lib/post-shoot";
import { emptyProductSnapshot } from "@/lib/reservation-product-snapshot";
import type { TrackingData } from "@/lib/tracking-types";
import {
  buildTrackingWorkflowView,
  emptyTrackingWorkflowFlags,
} from "@/lib/tracking-workflow";

function isCompleteWorkflow(
  workflow: TrackingData["workflow"] | undefined,
): workflow is TrackingData["workflow"] {
  return Boolean(workflow && Array.isArray(workflow.stages));
}

/** Eski önbellek / eksik API yanıtlarında workflow alanını tamamlar. */
export function normalizeTrackingData(
  value: Partial<TrackingData> & Pick<TrackingData, "coupleName" | "items">,
): TrackingData {
  const postShoot = parsePostShootSnapshot(value.postShoot);
  const workflowFlags =
    value.workflowFlags ?? postShoot.workflow ?? emptyTrackingWorkflowFlags();
  const shootDate =
    value.shootDate ??
    value.items[0]?.shootDate ??
    new Date().toISOString();
  const workflow = isCompleteWorkflow(value.workflow)
    ? value.workflow
    : buildTrackingWorkflowView({
        shootDate: new Date(shootDate),
        postShoot,
        workflow: workflowFlags,
      });

  const items = value.items.map((item) => ({
    shootTypeLabel: item.shootTypeLabel ?? item.optionLabel ?? "",
    productSnapshot: item.productSnapshot ?? emptyProductSnapshot(),
    categoryTitle: item.categoryTitle ?? "",
    accentColor: item.accentColor ?? "#ffffff",
    optionLabel: item.optionLabel ?? "",
    shootContent: item.shootContent ?? "",
    shootDate: item.shootDate ?? shootDate,
    readyTime: item.readyTime ?? "",
    location: item.location ?? "",
    agreedUnitPrice: item.agreedUnitPrice ?? 0,
    paymentType: item.paymentType ?? "",
    isOutdoor: item.isOutdoor ?? false,
    departureTime: item.departureTime ?? null,
    arrivalTime: item.arrivalTime ?? null,
    startTime: item.startTime ?? null,
    endTime: item.endTime ?? null,
  }));

  return {
    coupleName: value.coupleName,
    brideName: value.brideName ?? "",
    groomName: value.groomName ?? "",
    bridePhone: value.bridePhone ?? "",
    groomPhone: value.groomPhone ?? "",
    brideTc: value.brideTc ?? "",
    groomTc: value.groomTc ?? "",
    formYear: value.formYear ?? new Date(shootDate).getFullYear(),
    city: value.city ?? items[0]?.location ?? "",
    shootDate,
    status: value.status ?? "planlandi",
    statusLabel:
      value.statusLabel ??
      RESERVATION_STATUS_LABELS[value.status ?? "planlandi"],
    timeline: value.timeline ?? [],
    totalPrice: value.totalPrice ?? 0,
    cancellationFeeMax: value.cancellationFeeMax ?? 0,
    discountAmount: value.discountAmount ?? 0,
    postShoot,
    workflow,
    workflowFlags,
    installments: value.installments ?? [],
    items,
    purchasedProducts: value.purchasedProducts ?? [],
  };
}
