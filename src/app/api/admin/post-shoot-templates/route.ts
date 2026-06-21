import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getPostShootTemplateSettings,
  savePostShootTemplateSettings,
} from "@/lib/post-shoot-template-store";
import { parsePostShootTemplateSettings } from "@/lib/post-shoot-template-settings";

export async function GET() {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const settings = await getPostShootTemplateSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET /api/admin/post-shoot-templates", error);
    return NextResponse.json(
      { error: "Şablonlar yüklenemedi" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const body = await request.json();
    const parsed = parsePostShootTemplateSettings(body);
    const saved = await savePostShootTemplateSettings(parsed);
    return NextResponse.json(saved);
  } catch (error) {
    console.error("PUT /api/admin/post-shoot-templates", error);
    return NextResponse.json(
      { error: "Şablonlar kaydedilemedi" },
      { status: 500 },
    );
  }
}
