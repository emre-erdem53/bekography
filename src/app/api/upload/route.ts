import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { buildBlobUploadPath, getBlobMediaKind, validateBlobUploadFile } from "@/lib/blob-media";

function resolveUploadContentType(file: File): string | undefined {
  if (file.type) return file.type;

  const kind = getBlobMediaKind(file.name);
  if (kind === "image") return "image/jpeg";
  if (kind === "video") return "video/mp4";

  return undefined;
}

export async function POST(request: Request) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string | null) ?? "";

    if (!file) {
      return NextResponse.json({ error: "Dosya gerekli" }, { status: 400 });
    }

    if (!getBlobMediaKind(file.name)) {
      return NextResponse.json(
        { error: "Desteklenmeyen dosya formatı" },
        { status: 400 },
      );
    }

    const validationError = validateBlobUploadFile(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const pathname = buildBlobUploadPath(folder, file.name);
    const contentType = resolveUploadContentType(file);
    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: true,
      ...(contentType ? { contentType } : {}),
    });

    return NextResponse.json({ url: blob.url, pathname: blob.pathname });
  } catch (error) {
    console.error("POST /api/upload", error);
    return NextResponse.json(
      { error: "Dosya yüklenemedi" },
      { status: 500 },
    );
  }
}
