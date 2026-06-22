import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { parseSiteSettings } from "@/lib/site-settings";
import {
  getSiteSettings,
  saveSiteSettings,
} from "@/lib/site-settings-store";
import { updateSiteSettingsSchema } from "@/lib/validations/site-settings";

export async function GET() {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const settings = await getSiteSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET /api/admin/settings", error);
    return NextResponse.json(
      { error: "Ayarlar yüklenemedi" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const body = await request.json();
    const parsed = updateSiteSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Geçersiz veri" },
        { status: 400 },
      );
    }

    const saved = await saveSiteSettings(parseSiteSettings(parsed.data));
    return NextResponse.json(saved);
  } catch (error) {
    console.error("PUT /api/admin/settings", error);
    return NextResponse.json(
      { error: "Ayarlar kaydedilemedi" },
      { status: 500 },
    );
  }
}
