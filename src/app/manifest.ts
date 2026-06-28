import type { MetadataRoute } from "next";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_SHORT_NAME } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_SHORT_NAME,
    description: DEFAULT_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    lang: "tr",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-48.png",
        sizes: "48x48",
        type: "image/png",
      },
    ],
  };
}
