import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  PAYMENT_TYPE_LABELS,
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_ORDER,
} from "@/lib/constants";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const reservation = await prisma.reservation.findUnique({
      where: { trackingSlug: slug },
      include: {
        items: {
          include: {
            packageOption: { include: { category: true } },
          },
        },
        statusHistory: { orderBy: { changedAt: "asc" } },
      },
    });

    if (!reservation || reservation.status === "iptal") {
      return NextResponse.json(
        { error: "Rezervasyon bulunamadı" },
        { status: 404 },
      );
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

    return NextResponse.json({
      customerName: reservation.customerName,
      city: reservation.city,
      shootDate: reservation.shootDate,
      status: reservation.status,
      statusLabel: RESERVATION_STATUS_LABELS[reservation.status],
      timeline,
      items: reservation.items.map((item) => ({
        categoryTitle: item.packageOption.category.title,
        optionLabel: item.packageOption.label,
        paymentType: PAYMENT_TYPE_LABELS[item.paymentType],
      })),
    });
  } catch (error) {
    console.error("GET /api/reservations/track", error);
    return NextResponse.json(
      { error: "Rezervasyon yüklenemedi" },
      { status: 500 },
    );
  }
}
