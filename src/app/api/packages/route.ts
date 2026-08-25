import { NextResponse } from "next/server";
import { getActivePackages, serializeServiceAreas } from "@/lib/packages";

export async function GET() {
  try {
    const serviceAreas = await getActivePackages();
    return NextResponse.json(serializeServiceAreas(serviceAreas));
  } catch (error) {
    console.error("GET /api/packages", error);
    return NextResponse.json(
      { error: "Paketler yüklenemedi" },
      { status: 500 },
    );
  }
}
