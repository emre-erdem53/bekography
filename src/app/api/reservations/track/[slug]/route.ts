import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  PAYMENT_TYPE_LABELS,
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_ORDER,
} from "@/lib/constants";
import {
  formatCoupleName,
  reservationTcMatches,
} from "@/lib/reservations";
import { trackReservationSchema } from "@/lib/validations";

async function buildTrackingPayload(slug: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { trackingSlug: slug },
    include: {
      items: {
        include: {
          packageOption: { include: { category: true } },
        },
        orderBy: { shootDate: "asc" },
      },
      statusHistory: { orderBy: { changedAt: "asc" } },
    },
  });

  if (!reservation || reservation.status === "iptal") {
    return null;
  }

  const completedStatuses = new Set(
    reservation.statusHistory.map((entry) => entry.status),
  );
  completedStatuses.add(reservation.status);

  const timeline = RESERVATION_STATUS_ORDER.filter((status) =>
    completedStatuses.has(status),
  ).map((status) => ({
    status,
    label: RESERVATION_STATUS_LABELS[status],
    isCurrent: status === reservation.status,
  }));

  const earliestShoot = reservation.items[0]?.shootDate ?? new Date();

  return {
    customerName: formatCoupleName(
      reservation.brideName,
      reservation.groomName,
    ),
    city: reservation.items[0]?.location ?? "",
    shootDate: earliestShoot,
    status: reservation.status,
    statusLabel: RESERVATION_STATUS_LABELS[reservation.status],
    timeline,
    items: reservation.items.map((item) => ({
      categoryTitle: item.packageOption.category.title,
      optionLabel: item.packageOption.label,
      paymentType: PAYMENT_TYPE_LABELS[item.paymentType],
      shootDate: item.shootDate,
    })),
  };
}

export async function GET() {
  return NextResponse.json(
    { error: "Takip için TC kimlik doğrulaması gereklidir" },
    { status: 405 },
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const parsed = trackReservationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Geçersiz TC kimlik numarası" },
        { status: 400 },
      );
    }

    const reservation = await prisma.reservation.findUnique({
      where: { trackingSlug: slug },
      select: {
        id: true,
        status: true,
        brideTc: true,
        groomTc: true,
      },
    });

    if (!reservation || reservation.status === "iptal") {
      return NextResponse.json(
        { error: "Rezervasyon bulunamadı" },
        { status: 404 },
      );
    }

    if (
      !reservationTcMatches(
        parsed.data.tc,
        reservation.brideTc,
        reservation.groomTc,
      )
    ) {
      return NextResponse.json(
        { error: "TC kimlik numarası eşleşmedi" },
        { status: 401 },
      );
    }

    const payload = await buildTrackingPayload(slug);
    if (!payload) {
      return NextResponse.json(
        { error: "Rezervasyon bulunamadı" },
        { status: 404 },
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error("POST /api/reservations/track", error);
    return NextResponse.json(
      { error: "Rezervasyon yüklenemedi" },
      { status: 500 },
    );
  }
}
