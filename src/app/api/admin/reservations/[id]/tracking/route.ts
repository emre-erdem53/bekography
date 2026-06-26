import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { buildTrackingPayloadById } from "@/lib/build-tracking-payload";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const data = await buildTrackingPayloadById(id);

    if (!data) {
      return NextResponse.json(
        { error: "Rezervasyon bulunamadı" },
        { status: 404 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/admin/reservations/[id]/tracking", error);
    return NextResponse.json(
      { error: "Takip verisi yüklenemedi" },
      { status: 500 },
    );
  }
}
