import { resolveBlobSharedBase } from "@/lib/blob-base-url";
import {
  SECOND_PACKAGE_DISCOUNT_NOTE,
  SEASONAL_CAMPAIGN_NOTE,
} from "@/lib/cart-bundle-discount";

export const PACKAGES_TAGLINE =
  "Her an yanınızda olan profesyonel bir çiftle çalışmanın konforunu yaşayın.";

export const PACKAGES_INTRO_VIDEO_PATH = "site/packages-intro.mp4";

export function packagesIntroVideoUrl(): string {
  const base = resolveBlobSharedBase(process.env.NEXT_PUBLIC_BLOB_BASE_URL);
  return `${base}/${PACKAGES_INTRO_VIDEO_PATH}`;
}

export type PackagesCampaign = {
  id: string;
  title: string;
  body: string;
};

export const PACKAGES_CAMPAIGN_ITEMS: PackagesCampaign[] = [
  {
    id: "extra-package",
    title: "Ek Paket Kampanyası",
    body: SECOND_PACKAGE_DISCOUNT_NOTE,
  },
  {
    id: "winter",
    title: "Kış Kampanyası",
    body: SEASONAL_CAMPAIGN_NOTE,
  },
];

export const PACKAGES_CAMPAIGNS = PACKAGES_CAMPAIGN_ITEMS.map(
  (campaign) => campaign.body,
);

export function formatCampaignBody(body: string) {
  return body.replace(/^\.\s*/, "");
}
