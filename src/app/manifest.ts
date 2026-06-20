import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "bekography",
    short_name: "bekography",
    description:
      "Fine art monochrome photography — cinematic narratives, high contrast, timeless frames.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
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
