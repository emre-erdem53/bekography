import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { formatCoupleName } from "@/lib/reservations";
import { startOfDay, endOfDay } from "date-fns";

export async function GET() {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const [
      pendingRequests,
      activeReservations,
      todayItems,
      upcomingItems,
    ] = await Promise.all([
      prisma.request.count({ where: { status: "yeni" } }),
      prisma.reservation.count({
        where: { status: { notIn: ["iptal", "teslim_edildi"] } },
      }),
      prisma.reservationItem.findMany({
        where: {
          shootDate: { gte: todayStart, lte: todayEnd },
          reservation: { status: { not: "iptal" } },
        },
        orderBy: { shootDate: "asc" },
        include: {
          packageOption: { include: { category: true } },
          reservation: true,
        },
      }),
      prisma.reservationItem.findMany({
        where: {
          shootDate: { gt: todayEnd },
          reservation: { status: { notIn: ["iptal", "teslim_edildi"] } },
        },
        orderBy: { shootDate: "asc" },
        take: 5,
        include: {
          packageOption: { include: { category: true } },
          reservation: true,
        },
      }),
    ]);

    const mapShoot = (item: (typeof todayItems)[number]) => ({
      id: item.reservationId,
      itemId: item.id,
      customerName: formatCoupleName(
        item.reservation.brideName,
        item.reservation.groomName,
      ),
      shootDate: item.shootDate,
      packageTitle: item.packageOption.category.title,
    });

    return NextResponse.json({
      stats: {
        pendingRequests,
        activeReservations,
      },
      todayShoots: todayItems.map(mapShoot),
      upcomingShoots: upcomingItems.map(mapShoot),
    });
  } catch (error) {
    console.error("GET /api/admin/dashboard", error);
    return NextResponse.json(
      { error: "Dashboard verileri yüklenemedi" },
      { status: 500 },
    );
  }
}
