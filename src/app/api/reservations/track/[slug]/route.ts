import { NextResponse } from "next/server";
import { buildTrackingPayloadBySlug } from "@/lib/build-tracking-payload";
import { reservationTcMatches } from "@/lib/reservations";
import { prisma } from "@/lib/prisma";
import { trackReservationSchema } from "@/lib/validations";

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

    const payload = await buildTrackingPayloadBySlug(slug);
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
