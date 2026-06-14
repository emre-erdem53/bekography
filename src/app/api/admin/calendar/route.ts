import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { formatCoupleName } from "@/lib/reservations";

export async function GET(request: Request) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const items = await prisma.reservationItem.findMany({
      where: {
        reservation: { status: { notIn: ["iptal", "teslim_edildi"] } },
        ...(start && end
          ? {
              shootDate: {
                gte: new Date(start),
                lte: new Date(end),
              },
            }
          : {}),
      },
      orderBy: { shootDate: "asc" },
      include: {
        packageOption: { include: { category: true } },
        reservation: true,
      },
    });

    const events = items.map((item) => ({
      id: item.id,
      title: `${formatCoupleName(item.reservation.brideName, item.reservation.groomName)} — ${item.packageOption.category.title}`,
      start: item.shootDate,
      end: item.shootDate,
      resource: {
        reservationId: item.reservationId,
        item,
      },
    }));

    return NextResponse.json(events);
  } catch (error) {
    console.error("GET /api/admin/calendar", error);
    return NextResponse.json(
      { error: "Takvim verileri yüklenemedi" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const { shootDate, excludeReservationId } = await request.json();
    if (!shootDate) {
      return NextResponse.json({ error: "Tarih gerekli" }, { status: 400 });
    }

    const existing = await prisma.reservationItem.findFirst({
      where: {
        shootDate: new Date(shootDate),
        reservation: {
          status: { notIn: ["iptal", "teslim_edildi"] },
          ...(excludeReservationId
            ? { id: { not: excludeReservationId } }
            : {}),
        },
      },
    });

    return NextResponse.json({ available: !existing });
  } catch (error) {
    console.error("POST /api/admin/calendar", error);
    return NextResponse.json(
      { error: "Tarih kontrolü yapılamadı" },
      { status: 500 },
    );
  }
}
