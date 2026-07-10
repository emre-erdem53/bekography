import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { buildRequestYearOptions } from "@/lib/request-admin-filters";
import {
  getCurrentReservationYear,
  parseReservationYearParam,
} from "@/lib/reservation-year";

export async function GET(request: Request) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const { searchParams } = new URL(request.url);
    const currentYear = getCurrentReservationYear();
    const selectedYear =
      parseReservationYearParam(searchParams.get("year")) ?? currentYear;
    const showDeleted = searchParams.get("view") === "silinenler";

    const yearRows = await prisma.request.findMany({
      select: { shootDate: true, deletedAt: true },
    });
    const rowsForView = yearRows.filter((row) =>
      showDeleted ? row.deletedAt !== null : row.deletedAt === null,
    );
    const yearOptions = buildRequestYearOptions(rowsForView, currentYear);

    const requests = await prisma.request.findMany({
      where: {
        shootDate: {
          gte: new Date(Date.UTC(selectedYear, 0, 1)),
          lt: new Date(Date.UTC(selectedYear + 1, 0, 1)),
        },
        deletedAt: showDeleted ? { not: null } : null,
      },
      orderBy: showDeleted ? { deletedAt: "desc" } : { createdAt: "desc" },
      include: {
        items: {
          include: {
            packageOption: { include: { category: true } },
          },
        },
        reservation: true,
      },
    });

    return NextResponse.json({
      requests,
      yearOptions,
      selectedYear,
      view: showDeleted ? "silinenler" : "active",
    });
  } catch (error) {
    console.error("GET /api/admin/requests", error);
    return NextResponse.json(
      { error: "Talepler yüklenemedi" },
      { status: 500 },
    );
  }
}
