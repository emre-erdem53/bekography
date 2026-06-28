import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const routes = [
  "",
  "/fotograflar",
  "/videolar",
  "/paketler",
  "/about",
  "/contact",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified,
  }));
}
