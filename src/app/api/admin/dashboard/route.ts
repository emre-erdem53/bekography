import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";

export async function GET() {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const [
      pendingRequests,
      activeReservations,
      todayShoots,
      upcomingShoots,
      monthlyRevenue,
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
      prisma.reservation.aggregate({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
          status: { not: "iptal" },
        },
        _sum: { agreedPrice: true },
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
        monthlyRevenue: monthlyRevenue._sum.agreedPrice ?? 0,
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
