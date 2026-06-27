import { list } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { decodeBlobPathname, getBlobMediaKind } from "@/lib/blob-media";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

type BlobMediaItem = {
  url: string;
  pathname: string;
  uploadedAt: string;
  type: "image" | "video";
  label: string;
};

async function listAllMediaBlobs() {
  const blobs: Awaited<ReturnType<typeof list>>["blobs"] = [];
  let cursor: string | undefined;

  do {
    const page = await list({ cursor, limit: 1000 });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  return blobs
    .map((blob) => {
      const type = getBlobMediaKind(blob.pathname);
      if (!type) return null;
      return {
        url: blob.url,
        pathname: blob.pathname,
        uploadedAt: blob.uploadedAt.toISOString(),
        type,
        label: decodeBlobPathname(blob.pathname),
      } satisfies BlobMediaItem;
    })
    .filter((item): item is BlobMediaItem => item !== null)
    .sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
    );
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

    const allItems = await listAllMediaBlobs();
    const filtered =
      typeFilter === "image" || typeFilter === "video"
        ? allItems.filter((item) => item.type === typeFilter)
        : allItems;

    const items = filtered.slice(offset, offset + limit);
    const nextOffset = offset + items.length;
    const hasMore = nextOffset < filtered.length;

    return NextResponse.json({
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
