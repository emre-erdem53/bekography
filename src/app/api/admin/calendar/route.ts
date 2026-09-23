import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { parseDateOnlyInput } from "@/lib/date-only";
import { formatCoupleFirstNames } from "@/lib/reservation-utils";
import { findShootDateConflictDetails } from "@/lib/reservations";

export async function GET(request: Request) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const items = await prisma.reservationItem.findMany({
      where: {
        reservation: {
          status: { notIn: ["iptal", "teslim_edildi"] },
          deletedAt: null,
        },
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
        shootType: { include: { package: { include: { serviceArea: true } } } },
        reservation: true,
      },
    });

    const events = items.map((item) => {
      const pkg = item.shootType.package;
      const serviceArea = pkg.serviceArea;
      const reservation = item.reservation;

      return {
        id: item.id,
        title: `${serviceArea.title} · ${pkg.title} (${formatCoupleFirstNames(
          reservation.brideFirstName,
          reservation.brideName,
          reservation.groomFirstName,
          reservation.groomName,
        )})`,
        start: item.shootDate,
        end: item.shootDate,
        resource: {
          reservationId: item.reservationId,
          item: {
            shootContent: item.shootContent,
            departureTime: item.departureTime,
            arrivalTime: item.arrivalTime,
            startTime: item.startTime,
            endTime: item.endTime,
            isOutdoor: serviceArea.scheduleType === "outdoor",
            shootType: {
              label: item.shootType.label,
              package: {
                title: pkg.title,
                slug: pkg.slug,
              },
              serviceArea: {
                title: serviceArea.title,
                slug: serviceArea.slug,
                accentColor: serviceArea.accentColor,
              },
            },
            reservation: {
              brideName: reservation.brideName,
              brideFirstName: reservation.brideFirstName,
              groomName: reservation.groomName,
              groomFirstName: reservation.groomFirstName,
            },
          },
        },
      };
    });

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

    parseDateOnlyInput(shootDate);

    const conflicts = await findShootDateConflictDetails(
      [shootDate],
      typeof excludeReservationId === "string"
        ? excludeReservationId
        : undefined,
    );

    return NextResponse.json({
      available: conflicts.length === 0,
      conflicts,
    });
  } catch (error) {
    console.error("POST /api/admin/calendar", error);
    return NextResponse.json(
      { error: "Tarih kontrolü yapılamadı" },
      { status: 500 },
    );
  }
}
