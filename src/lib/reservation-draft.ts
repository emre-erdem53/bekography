import type { PostShootSnapshot } from "@/lib/post-shoot";

export type ReservationDraftItem = {
  itemKey: string;
  shootTypeId: string;
  packageId: string;
  packageTitle: string;
  serviceAreaId: string;
  serviceAreaSlug: string;
  serviceAreaTitle: string;
  paymentType: "pesin" | "taksitli";
  unitPrice: number;
  label: string;
  accentColor: string;
  shootDate: string;
  shootContent: string;
  readyTime: string;
  location: string;
  agreedUnitPrice: number;
  departureTime: string;
  arrivalTime: string;
  startTime: string;
  endTime: string;
};

export type ReservationDraftInstallment = {
  amount: number;
  dueDate: string;
};

export type ReservationDraftPayload = {
  version: 1;
  brideFirstName: string;
  brideLastName: string;
  brideTc: string;
  bridePhone: string;
  groomFirstName: string;
  groomLastName: string;
  groomTc: string;
  groomPhone: string;
  totalPrice: number;
  discountAmount: number;
  discountEnabled: boolean;
  notes: string;
  requestId?: string;
  items: ReservationDraftItem[];
  installments: ReservationDraftInstallment[];
  postShoot: PostShootSnapshot;
};

export function isReservationDraftPayload(
  value: unknown,
): value is ReservationDraftPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 1 &&
    Array.isArray(record.items) &&
    Array.isArray(record.installments)
  );
}

export function draftReservationDisplayName(input: {
  brideFirstName?: string;
  brideLastName?: string;
  groomFirstName?: string;
  groomLastName?: string;
  brideName?: string;
  groomName?: string;
}): string {
  const bride =
    [input.brideFirstName, input.brideLastName].filter(Boolean).join(" ").trim() ||
    input.brideName?.trim() ||
    "";
  const groom =
    [input.groomFirstName, input.groomLastName].filter(Boolean).join(" ").trim() ||
    input.groomName?.trim() ||
    "";

  if (bride && groom) return `${bride} & ${groom}`;
  if (bride || groom) return bride || groom;
  return "İsimsiz taslak";
}

export function hasMeaningfulDraftContent(
  payload: Pick<
    ReservationDraftPayload,
    | "brideFirstName"
    | "brideLastName"
    | "bridePhone"
    | "groomFirstName"
    | "groomLastName"
    | "groomPhone"
    | "notes"
    | "items"
  >,
): boolean {
  return (
    Boolean(payload.brideFirstName.trim()) ||
    Boolean(payload.brideLastName.trim()) ||
    Boolean(payload.bridePhone.trim()) ||
    Boolean(payload.groomFirstName.trim()) ||
    Boolean(payload.groomLastName.trim()) ||
    Boolean(payload.groomPhone.trim()) ||
    Boolean(payload.notes.trim()) ||
    payload.items.length > 0
  );
}
