import { list } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { restorePackageGalleriesFromBlobs } from "@/lib/restore-package-gallery";

export async function POST(request: Request) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      apply?: boolean;
    };
    const apply = body.apply !== false;

    const blobs: Awaited<ReturnType<typeof list>>["blobs"] = [];
    let cursor: string | undefined;
    do {
      const page = await list({ cursor, limit: 1000 });
      blobs.push(...page.blobs);
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);

    const categories = await prisma.packageCategory.findMany({
      include: { options: { orderBy: { sortOrder: "asc" } } },
      orderBy: { sortOrder: "asc" },
    });

    const result = restorePackageGalleriesFromBlobs(categories, blobs);

    if (apply) {
      for (const update of result.updates) {
        const category = categories.find((item) => item.slug === update.slug);
        if (!category) continue;
        const content = (category.content ?? {}) as Record<string, unknown>;
        await prisma.packageCategory.update({
          where: { id: category.id },
          data: {
            content: {
              ...content,
              galleryMediaByOption: update.galleryMediaByOption,
            },
          },
        });
      }
    }

    return NextResponse.json({
      apply,
      blobCount: blobs.length,
      ...result,
    });
  } catch (error) {
    console.error("POST /api/admin/restore-package-gallery", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Galeri geri yüklenemedi",
      },
      { status: 500 },
    );
  }
}
