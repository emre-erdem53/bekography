import { RESERVATION_STATUS_LABELS } from "@/lib/constants";
import {
  getItemWorkflowFlags,
  parsePostShootSnapshot,
  ensureItemWorkflows,
} from "@/lib/post-shoot";
import { packageHasPrintingStage } from "@/lib/package-workflow-stages";
import { emptyProductSnapshot, parseProductSnapshot } from "@/lib/reservation-product-snapshot";
import type { TrackingData } from "@/lib/tracking-types";
import {
  buildTrackingWorkflowView,
  emptyTrackingWorkflowFlags,
} from "@/lib/tracking-workflow";
import { buildWorkflowStageTags } from "@/lib/tracking-stage-tags";

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
  const reservationCreatedAt = value.createdAt
    ? new Date(value.createdAt)
    : undefined;

  const items = value.items.map((item) => {
    const itemId = item.id ?? "";
    const itemShootDate = item.shootDate ?? shootDate;
    const itemWorkflowFlags = itemId
      ? getItemWorkflowFlags(postShoot, itemId)
      : item.workflowFlags ?? emptyTrackingWorkflowFlags();
    // Slug tahmini yerine snapshot'taki aşama tanımına bakılır.
    const hasPrinting =
      item.hasPrinting ??
      (item.stageDefinitions
        ? packageHasPrintingStage(item.stageDefinitions)
        : false);
    const workflow = buildTrackingWorkflowView({
      shootDate: new Date(itemShootDate),
      postShoot,
      workflow: itemWorkflowFlags,
      hasPrinting,
      stageDefinitions: item.stageDefinitions,
      reservationCreatedAt,
    });
    const snapshot = item.productSnapshot ?? emptyProductSnapshot();
    const workflowStageTags = buildWorkflowStageTags(
      postShoot,
      undefined,
      itemId,
    );

    return {
      id: itemId,
      shootTypeLabel: item.shootTypeLabel ?? item.optionLabel ?? "",
      productSnapshot: snapshot,
      serviceAreaTitle: item.serviceAreaTitle ?? snapshot.serviceAreaTitle,
      packageTitle: item.packageTitle ?? snapshot.packageTitle,
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
      stageDefinitions: item.stageDefinitions,
      departureTime: item.departureTime ?? null,
      arrivalTime: item.arrivalTime ?? null,
      startTime: item.startTime ?? null,
      endTime: item.endTime ?? null,
      workflow,
      workflowFlags: itemWorkflowFlags,
      workflowStageTags,
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
        hasPrinting: items.some((item) => item.hasPrinting),
        reservationCreatedAt,
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
    createdAt: value.createdAt ?? shootDate,
    paymentTypeLabel: value.paymentTypeLabel ?? "",
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
    installments: (value.installments ?? []).map((row) => ({
      amount: row.amount,
      dueDate: row.dueDate,
      paidAt: row.paidAt ?? null,
    })),
    items,
    purchasedProducts: (value.purchasedProducts ?? []).map((product) =>
      parseProductSnapshot(product),
    ),
  };
}
