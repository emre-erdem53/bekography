import { del, list } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  deriveChildFolderPrefixes,
  isDirectBlobChild,
  mapBlobToMediaItem,
  normalizeBlobFolderPrefix,
  toBlobMediaFolder,
  type BlobMediaItem,
} from "@/lib/blob-media";
import { prisma } from "@/lib/prisma";

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 50;

async function listFolderContents(prefix: string) {
  const normalizedPrefix = normalizeBlobFolderPrefix(prefix);
  const allBlobs: Awaited<ReturnType<typeof list>>["blobs"] = [];
  let cursor: string | undefined;

  do {
    const page = await list({
      cursor,
      limit: 1000,
      prefix: normalizedPrefix || undefined,
    });

    allBlobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  const folderPaths = deriveChildFolderPrefixes(
    allBlobs.map((blob) => blob.pathname),
    normalizedPrefix,
  );

  const folders = folderPaths
    .map((folderPath) => toBlobMediaFolder(folderPath))
    .sort((a, b) => a.name.localeCompare(b.name, "tr"));

  const items = allBlobs
    .filter((blob) => isDirectBlobChild(blob.pathname, normalizedPrefix))
    .map((blob) => mapBlobToMediaItem(blob))
    .filter((item): item is BlobMediaItem => item !== null)
    .sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
    );

  return { folders, items };
}

async function findPackageUsageCount(url: string) {
  const categories = await prisma.packageCategory.findMany({
    select: { content: true },
  });

  let count = 0;
  for (const category of categories) {
    const content = category.content;
    if (!content || typeof content !== "object") continue;
    const json = JSON.stringify(content);
    if (json.includes(url)) count += 1;
  }
  return count;
}

export async function GET(request: Request) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const { searchParams } = new URL(request.url);
    const offset = Math.max(0, Number(searchParams.get("offset") ?? "0") || 0);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(searchParams.get("limit") ?? DEFAULT_LIMIT) || DEFAULT_LIMIT),
    );
    const typeFilter = searchParams.get("type");
    const prefix = searchParams.get("prefix") ?? "";

    const { folders, items: allItems } = await listFolderContents(prefix);
    const filtered =
      typeFilter === "image" || typeFilter === "video"
        ? allItems.filter((item) => item.type === typeFilter)
        : allItems;

    const items = filtered.slice(offset, offset + limit);
    const nextOffset = offset + items.length;
    const hasMore = nextOffset < filtered.length;

    return NextResponse.json({
      prefix: normalizeBlobFolderPrefix(prefix),
      folders,
      items,
      hasMore,
      nextOffset: hasMore ? nextOffset : null,
      total: filtered.length,
    });
  } catch (error) {
    console.error("GET /api/admin/blob-media", error);
    return NextResponse.json(
      { error: "Blob medyaları listelenemedi" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const body = (await request.json()) as { pathname?: string; url?: string };
    const pathname = body.pathname?.trim();
    const url = body.url?.trim();

    if (!pathname && !url) {
      return NextResponse.json(
        { error: "Silinecek dosya belirtilmedi" },
        { status: 400 },
      );
    }

    if (url) {
      const usageCount = await findPackageUsageCount(url);
      if (usageCount > 0) {
        return NextResponse.json(
          {
            error: `Bu dosya ${usageCount} pakette kullanılıyor. Önce paket galerilerinden kaldırın.`,
          },
          { status: 409 },
        );
      }
    }

    await del(pathname || url!);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/blob-media", error);
    return NextResponse.json(
      { error: "Dosya silinemedi" },
      { status: 500 },
    );
  }
}
