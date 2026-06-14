import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
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
      todayShoots,
      upcomingShoots,
      approvedWithoutReservation,
    ] = await Promise.all([
      prisma.request.count({ where: { status: "yeni" } }),
      prisma.reservation.count({
        where: { status: { notIn: ["iptal", "teslim_edildi"] } },
      }),
      prisma.reservation.findMany({
        where: {
          shootDate: { gte: todayStart, lte: todayEnd },
          status: { not: "iptal" },
        },
        orderBy: { shootDate: "asc" },
      }),
      prisma.reservation.findMany({
        where: {
          shootDate: { gt: todayEnd },
          status: { notIn: ["iptal", "teslim_edildi"] },
        },
        orderBy: { shootDate: "asc" },
        take: 5,
      }),
      prisma.request.findMany({
        where: {
          status: "onaylandi",
          reservation: null,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      stats: {
        pendingRequests,
        activeReservations,
        approvedWithoutReservationCount: approvedWithoutReservation.length,
      },
      todayShoots,
      upcomingShoots,
      approvedWithoutReservation,
    });
  } catch (error) {
    console.error("GET /api/admin/dashboard", error);
    return NextResponse.json(
      { error: "Dashboard verileri yüklenemedi" },
      { status: 500 },
    );
  }
}
