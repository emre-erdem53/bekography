import type { PostShootSnapshot } from "@/lib/post-shoot";
import type { ReservationProductSnapshot } from "@/lib/reservation-product-snapshot";
import type {
  TrackingWorkflowFlags,
  TrackingWorkflowView,
} from "@/lib/tracking-workflow";
import type { ReservationStatus } from "@prisma/client";

export type TrackingTimelineStep = {
  status: string;
  label: string;
  isCurrent: boolean;
};

export type TrackingShootItem = {
  id: string;
  categoryTitle: string;
  accentColor: string;
  optionLabel: string;
  shootTypeLabel: string;
  shootContent: string;
  shootDate: string;
  readyTime: string;
  location: string;
  agreedUnitPrice: number;
  paymentType: string;
  isOutdoor: boolean;
  hasPrinting: boolean;
  departureTime: string | null;
  arrivalTime: string | null;
  startTime: string | null;
  endTime: string | null;
  productSnapshot: ReservationProductSnapshot;
  workflow: TrackingWorkflowView;
  workflowFlags: TrackingWorkflowFlags;
};

export type TrackingInstallment = {
  amount: number;
  dueDate: string;
  paidAt: string | null;
};

export type TrackingData = {
  coupleName: string;
  brideName: string;
  groomName: string;
  bridePhone: string;
  groomPhone: string;
  brideTc: string;
  groomTc: string;
  formYear: number;
  city: string;
  shootDate: string;
  status: ReservationStatus;
  statusLabel: string;
  timeline: TrackingTimelineStep[];
  totalPrice: number;
  cancellationFeeMax: number;
  discountAmount: number;
  discountEnabled: boolean;
  postShoot: PostShootSnapshot;
  workflow: TrackingWorkflowView;
  workflowFlags: TrackingWorkflowFlags;
  installments: TrackingInstallment[];
  items: TrackingShootItem[];
  purchasedProducts: ReservationProductSnapshot[];
};
