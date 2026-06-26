import { RESERVATION_STATUS_LABELS } from "@/lib/constants";
import {
  getItemWorkflowFlags,
  itemHasPrintingStage,
  parsePostShootSnapshot,
  ensureItemWorkflows,
  reservationHasPrintingPackage,
} from "@/lib/post-shoot";
import { emptyProductSnapshot } from "@/lib/reservation-product-snapshot";
import type { TrackingData } from "@/lib/tracking-types";
import {
  buildTrackingWorkflowView,
  emptyTrackingWorkflowFlags,
} from "@/lib/tracking-workflow";

/** Eski önbellek / eksik API yanıtlarında workflow alanını tamamlar. */
export function normalizeTrackingData(
  value: Partial<TrackingData> & Pick<TrackingData, "coupleName" | "items">,
): TrackingData {
  const postShoot = ensureItemWorkflows(
    parsePostShootSnapshot(value.postShoot),
    value.items.map((item) => item.id).filter(Boolean),
  );
  const shootDate =
    value.shootDate ??
    value.items[0]?.shootDate ??
    new Date().toISOString();

  const items = value.items.map((item) => {
    const itemId = item.id ?? "";
    const itemShootDate = item.shootDate ?? shootDate;
    const itemWorkflowFlags = itemId
      ? getItemWorkflowFlags(postShoot, itemId)
      : item.workflowFlags ?? emptyTrackingWorkflowFlags();
    const hasPrinting =
      item.hasPrinting ??
      itemHasPrintingStage(
        item.productSnapshot?.categorySlug ?? "",
      );
    const workflow = buildTrackingWorkflowView({
      shootDate: new Date(itemShootDate),
      postShoot,
      workflow: itemWorkflowFlags,
      hasPrinting,
    });

    return {
      id: itemId,
      shootTypeLabel: item.shootTypeLabel ?? item.optionLabel ?? "",
      productSnapshot: item.productSnapshot ?? emptyProductSnapshot(),
      categoryTitle: item.categoryTitle ?? "",
      accentColor: item.accentColor ?? "#ffffff",
      optionLabel: item.optionLabel ?? "",
      shootContent: item.shootContent ?? "",
      shootDate: itemShootDate,
      readyTime: item.readyTime ?? "",
      location: item.location ?? "",
      agreedUnitPrice: item.agreedUnitPrice ?? 0,
      paymentType: item.paymentType ?? "",
      isOutdoor: item.isOutdoor ?? false,
      hasPrinting,
      departureTime: item.departureTime ?? null,
      arrivalTime: item.arrivalTime ?? null,
      startTime: item.startTime ?? null,
      endTime: item.endTime ?? null,
      workflow,
      workflowFlags: itemWorkflowFlags,
    };
  });

  const firstItem = items[0];
  const workflowFlags = firstItem
    ? firstItem.workflowFlags
    : value.workflowFlags ?? emptyTrackingWorkflowFlags();
  const workflow = firstItem
    ? firstItem.workflow
    : buildTrackingWorkflowView({
        shootDate: new Date(shootDate),
        postShoot,
        workflow: workflowFlags,
        hasPrinting: reservationHasPrintingPackage(items),
      });

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
    discountEnabled: value.discountEnabled ?? false,
    postShoot,
    workflow,
    workflowFlags,
    installments: value.installments ?? [],
    items,
    purchasedProducts: value.purchasedProducts ?? [],
  };
}
