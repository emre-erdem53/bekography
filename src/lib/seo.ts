import type { Metadata } from "next";
import {
  BEKOGRAPHY_ADDRESS,
  BEKOGRAPHY_COORDINATES,
  BEKOGRAPHY_INSTAGRAM_URL,
  BEKOGRAPHY_PHONE_TEL,
} from "@/lib/site-location";

export const SITE_NAME = "Bekography - Fotoğraf & Film";
export const SITE_SHORT_NAME = "Bekography";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://bekography.com"
).replace(/\/$/, "");

/** Google arama snippet'inde görünen açıklama — şehir adı yok. */
export const DEFAULT_DESCRIPTION =
  "Düğün fotoğrafçılığı ve sinematik film çekimi. Dış çekim, düğün, nişan ve özel günleriniz için butik fotoğraf & film stüdyosu.";

/**
 * Arka plan local SEO — meta keywords, JSON-LD ve sayfa içeriğinde kullanılır.
 * Google snippet'inde (mavi başlık + gri açıklama) görünmez.
 */
export const SEO_KEYWORDS = [
  "bekography",
  "düğün fotoğrafçısı",
  "düğün film",
  "düğün fotoğrafçılığı",
  "düğün videograf",
  "dış çekim",
  "gelin çıkışı",
  "nişan fotoğrafçısı",
  "kına fotoğrafçısı",
  "fotoğraf ve film",
  "rize düğün fotoğrafçısı",
  "rize düğün film",
  "trabzon düğün fotoğrafçısı",
  "trabzon düğün film",
  "artvin düğün fotoğrafçısı",
  "artvin düğün film",
  "rize fotoğrafçı",
  "trabzon fotoğrafçı",
  "artvin fotoğrafçı",
  "karadeniz düğün fotoğrafçısı",
] as const;

export const LOCAL_SEO_CITIES = ["Rize", "Trabzon", "Artvin"] as const;

type PageMetadataInput = {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
};

export function createPageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "",
  noIndex = false,
}: PageMetadataInput = {}): Metadata {
  const url = `${SITE_URL}${path}`;
  const pageTitle = title ? `${title} | ${SITE_SHORT_NAME}` : SITE_NAME;

  return {
    title: pageTitle,
    description,
    keywords: [...SEO_KEYWORDS],
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      locale: "tr_TR",
      url,
      siteName: SITE_NAME,
      title: pageTitle,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
    },
    ...(noIndex
      ? {
          robots: {
            index: false,
            follow: false,
          },
        }
      : {}),
  };
}

export function createRootMetadata(): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: SITE_NAME,
      template: `%s | ${SITE_SHORT_NAME}`,
    },
    description: DEFAULT_DESCRIPTION,
    keywords: [...SEO_KEYWORDS],
    alternates: {
      canonical: SITE_URL,
    },
    openGraph: {
      type: "website",
      locale: "tr_TR",
      url: SITE_URL,
      siteName: SITE_NAME,
      title: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/icon-48.png", type: "image/png", sizes: "48x48" },
        { url: "/icon.png", type: "image/png", sizes: "32x32" },
        { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      ],
      shortcut: "/favicon.ico",
      apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    },
  };
}

export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    image: `${SITE_URL}/icon-192.png`,
    telephone: BEKOGRAPHY_PHONE_TEL,
    sameAs: [BEKOGRAPHY_INSTAGRAM_URL],
    address: {
      "@type": "PostalAddress",
      streetAddress: BEKOGRAPHY_ADDRESS,
      addressLocality: "Rize",
      addressRegion: "Rize",
      addressCountry: "TR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: BEKOGRAPHY_COORDINATES.lat,
      longitude: BEKOGRAPHY_COORDINATES.lng,
    },
    areaServed: LOCAL_SEO_CITIES.map((city) => ({
      "@type": "City",
      name: city,
    })),
    serviceType: [
      "Düğün fotoğrafçılığı",
      "Düğün film çekimi",
      "Dış çekim",
      "Nişan fotoğrafçılığı",
    ],
    knowsAbout: [...SEO_KEYWORDS],
  };
}
