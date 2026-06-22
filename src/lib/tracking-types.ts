import type { PostShootSnapshot } from "@/lib/post-shoot";
import type { ReservationStatus } from "@prisma/client";

export type TrackingTimelineStep = {
  status: string;
  label: string;
  isCurrent: boolean;
};

export type TrackingShootItem = {
  categoryTitle: string;
  accentColor: string;
  optionLabel: string;
  shootContent: string;
  shootDate: string;
  readyTime: string;
  location: string;
  agreedUnitPrice: number;
  paymentType: string;
  isOutdoor: boolean;
  departureTime: string | null;
  arrivalTime: string | null;
  startTime: string | null;
  endTime: string | null;
};

export type TrackingInstallment = {
  amount: number;
  dueDate: string;
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
  postShoot: PostShootSnapshot;
  installments: TrackingInstallment[];
  items: TrackingShootItem[];
};
