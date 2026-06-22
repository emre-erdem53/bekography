import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/site-settings-store";

export async function GET() {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json(settings, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("GET /api/settings", error);
    return NextResponse.json(
      { error: "Ayarlar yüklenemedi" },
      { status: 500 },
    );
  }
}
