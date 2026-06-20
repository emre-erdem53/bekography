export const BEKOGRAPHY_ADDRESS =
  "Eminettin Mah., Menderes Bul., No:170-172 Yavuz Plaza, Kat: 9/801 Merkez RİZE";

export const BEKOGRAPHY_MAPS_SHORT_URL =
  "https://maps.app.goo.gl/C6AffCcN8T9aABTd6";

export const BEKOGRAPHY_MAPS_LABEL = "bekography";

export const BEKOGRAPHY_COORDINATES = {
  lat: 41.0274521,
  lng: 40.5167851,
} as const;

export const BEKOGRAPHY_PHONE_DISPLAY = "0546 937 04 64";
export const BEKOGRAPHY_PHONE_TEL = "+905469370464";
export const BEKOGRAPHY_INSTAGRAM_URL = "https://www.instagram.com/bekography/";

export function getBekographyMapsUrl(placeId?: string | null) {
  if (placeId?.trim()) {
    return `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(placeId.trim())}`;
  }
  return BEKOGRAPHY_MAPS_SHORT_URL;
}

export function getBekographyMapsEmbedUrl(options?: {
  apiKey?: string | null;
  placeId?: string | null;
}) {
  const apiKey = options?.apiKey?.trim();
  const placeId = options?.placeId?.trim();

  if (apiKey && placeId) {
    return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(apiKey)}&q=place_id:${encodeURIComponent(placeId)}&zoom=17`;
  }

  const { lat, lng } = BEKOGRAPHY_COORDINATES;
  return `https://maps.google.com/maps?q=${lat},${lng}+(bekography)&z=17&output=embed`;
}

export function getGoogleMapsApiKey() {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_API_KEY?.trim() ||
    ""
  );
}

export function getGooglePlaceId() {
  return process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID?.trim() || process.env.GOOGLE_PLACE_ID?.trim() || "";
}
