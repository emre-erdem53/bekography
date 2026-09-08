import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOST_SUFFIXES = [
  ".public.blob.vercel-storage.com",
  ".blob.vercel-storage.com",
];

function isAllowedImageUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") return true;
    if (ALLOWED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
      return true;
    }
    const blobBase = process.env.NEXT_PUBLIC_BLOB_BASE_URL?.trim();
    if (blobBase) {
      try {
        if (new URL(blobBase).hostname.toLowerCase() === host) return true;
      } catch {
        // ignore
      }
    }
    return false;
  } catch {
    return false;
  }
}

/** PDF export için tarayıcı CORS engeline takılan görselleri same-origin getirir. */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url");
  if (!raw || !isAllowedImageUrl(raw)) {
    return NextResponse.json({ error: "Invalid image url" }, { status: 400 });
  }

  try {
    const upstream = await fetch(raw, {
      headers: { Accept: "image/*,*/*" },
      cache: "force-cache",
    });
    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream ${upstream.status}` },
        { status: 502 },
      );
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    const buffer = await upstream.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
  }
}
