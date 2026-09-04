import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { nanoid } from "nanoid";
import { requireAdmin } from "@/lib/admin-auth";
import {
  emptyPostShootSnapshot,
  parsePostShootSnapshot,
  type PostShootSnapshot,
} from "@/lib/post-shoot";
import { prisma } from "@/lib/prisma";
import {
  hasMeaningfulDraftContent,
  type ReservationDraftPayload,
} from "@/lib/reservation-draft";
import { reservationNameFieldsFromInput } from "@/lib/reservation-utils";
import { getTrackingUrl } from "@/lib/reservations";
import { formatZodError } from "@/lib/validation-errors";
import { saveReservationDraftSchema } from "@/lib/validations";

function resolveDraftPostShoot(
  data: ReturnType<typeof saveReservationDraftSchema.parse>,
): PostShootSnapshot {
  return data.postShoot
    ? parsePostShootSnapshot(data.postShoot)
    : emptyPostShootSnapshot();
}

function buildDraftPayload(
  data: ReturnType<typeof saveReservationDraftSchema.parse>,
): ReservationDraftPayload {
  return {
    version: 1,
    brideFirstName: data.brideFirstName,
    brideLastName: data.brideLastName,
    brideTc: data.brideTc,
    bridePhone: data.bridePhone,
    groomFirstName: data.groomFirstName,
    groomLastName: data.groomLastName,
    groomTc: data.groomTc,
    groomPhone: data.groomPhone,
    totalPrice: data.totalPrice,
    discountAmount: data.discountAmount,
    discountEnabled: data.discountEnabled,
    notes: data.notes,
    ...(data.requestId ? { requestId: data.requestId } : {}),
    items: data.items,
    installments: data.installments,
    postShoot: resolveDraftPostShoot(data),
  };
}

function draftReservationFields(data: ReturnType<typeof saveReservationDraftSchema.parse>) {
  const nameFields = reservationNameFieldsFromInput(data);
  const postShoot = resolveDraftPostShoot(data);
  return {
    ...nameFields,
    brideTc: data.brideTc,
    bridePhone: data.bridePhone,
    groomTc: data.groomTc,
    groomPhone: data.groomPhone,
    totalPrice: data.totalPrice,
    discountAmount: data.discountEnabled ? data.discountAmount : 0,
    discountEnabled: data.discountEnabled,
    postShoot,
    notes: data.notes || null,
    draftPayload: buildDraftPayload(data) as unknown as Prisma.InputJsonValue,
    status: "taslak" as const,
  };
}

export async function POST(request: Request) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const body = await request.json();
    const parsed = saveReservationDraftSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 },
      );
    }

    if (!hasMeaningfulDraftContent(parsed.data)) {
      return NextResponse.json(
        { error: "Taslak kaydetmek için en az bir bilgi girin." },
        { status: 400 },
      );
    }

    const fields = draftReservationFields(parsed.data);

    const reservation = await prisma.reservation.create({
      data: {
        trackingSlug: nanoid(12),
        requestId: parsed.data.requestId ?? null,
        cancellationFeeMax: 0,
        ...fields,
        statusHistory: {
          create: { status: "taslak" },
        },
      },
    });

    return NextResponse.json({
      ...reservation,
      trackingUrl: getTrackingUrl(reservation.trackingSlug),
    });
  } catch (error) {
    console.error("POST /api/admin/reservations/draft", error);
    return NextResponse.json(
      { error: "Taslak kaydedilemedi" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const body = await request.json();
    const reservationId =
      typeof body.reservationId === "string" ? body.reservationId : "";
    if (!reservationId) {
      return NextResponse.json(
        { error: "Taslak rezervasyon id gerekli" },
        { status: 400 },
      );
    }

    const parsed = saveReservationDraftSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 },
      );
    }

    if (!hasMeaningfulDraftContent(parsed.data)) {
      return NextResponse.json(
        { error: "Taslak kaydetmek için en az bir bilgi girin." },
        { status: 400 },
      );
    }

    const existing = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });
    if (!existing || existing.deletedAt) {
      return NextResponse.json(
        { error: "Rezervasyon bulunamadı" },
        { status: 404 },
      );
    }
    if (existing.status !== "taslak") {
      return NextResponse.json(
        { error: "Yalnızca taslak rezervasyonlar bu şekilde güncellenebilir." },
        { status: 400 },
      );
    }

    const fields = draftReservationFields(parsed.data);
    const reservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        ...fields,
        requestId: parsed.data.requestId ?? existing.requestId,
      },
    });

    return NextResponse.json({
      ...reservation,
      trackingUrl: getTrackingUrl(reservation.trackingSlug),
    });
  } catch (error) {
    console.error("PATCH /api/admin/reservations/draft", error);
    return NextResponse.json(
      { error: "Taslak güncellenemedi" },
      { status: 500 },
    );
  }
}
