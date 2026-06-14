import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const reservations = await prisma.reservation.findMany({
      where: {
        status: { not: "iptal" },
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
        items: {
          include: {
            packageOption: { include: { category: true } },
          },
        },
      },
    });

    const events = reservations.map((reservation) => ({
      id: reservation.id,
      title: `${reservation.customerName} — ${reservation.city}`,
      start: reservation.shootDate,
      end: reservation.shootDate,
      resource: reservation,
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
    const { shootDate } = await request.json();
    if (!shootDate) {
      return NextResponse.json({ error: "Tarih gerekli" }, { status: 400 });
    }

    const existing = await prisma.reservation.findFirst({
      where: {
        shootDate: new Date(shootDate),
        status: { not: "iptal" },
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
