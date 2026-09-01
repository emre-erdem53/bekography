import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { prisma } from "@/lib/prisma";

const staticRoutes = [
  "",
  "/fotograflar",
  "/videolar",
  "/paketler",
  "/about",
  "/contact",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  let serviceAreaRoutes: MetadataRoute.Sitemap = [];
  try {
    const serviceAreas = await prisma.serviceArea.findMany({
      where: {
        isActive: true,
        packages: {
          some: { isActive: true, shootTypes: { some: { isActive: true } } },
        },
      },
      select: { slug: true, updatedAt: true },
      orderBy: { sortOrder: "asc" },
    });

    serviceAreaRoutes = serviceAreas.map((serviceArea) => ({
      url: `${SITE_URL}/paketler/${serviceArea.slug}`,
      lastModified: serviceArea.updatedAt,
    }));
  } catch (error) {
    // Sitemap veritabanı erişilemediğinde statik yollarla üretilmeye devam etmeli.
    console.error("sitemap service areas", error);
  }

  return [
    ...staticRoutes.map((route) => ({
      url: `${SITE_URL}${route}`,
      lastModified,
    })),
    ...serviceAreaRoutes,
  ];
}
