import archivedReviewsRaw from "@/data/google-reviews-archive.json";
import { BEKOGRAPHY_MAPS_SHORT_URL } from "@/lib/site-location";

export type GoogleReview = {
  id: string;
  authorName: string;
  authorPhotoUrl?: string;
  rating: number;
  text: string;
  relativeTime: string;
};

export type GoogleReviewsResult = {
  reviews: GoogleReview[];
  rating?: number;
  totalRatings?: number;
  /** Google Maps / İşletme Profili bağlantısı */
  placeUrl?: string;
};

const REVIEWS_REVALIDATE_SECONDS = 60 * 60 * 24 * 7;
const MAX_DISPLAY_REVIEWS = 40;

function getGoogleCredentials() {
  const apiKey = process.env.GOOGLE_API_KEY?.trim();
  const placeId = process.env.GOOGLE_PLACE_ID?.trim();
  if (!apiKey || !placeId) return null;
  return { apiKey, placeId };
}

function buildGooglePlaceUrl(placeId: string) {
  return `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(placeId)}`;
}

function reviewDedupeKey(review: GoogleReview) {
  const author = review.authorName.trim().toLowerCase();
  const text = review.text.trim().toLowerCase().slice(0, 120);
  return `${author}::${text}`;
}

function mergeReviews(
  batches: GoogleReview[],
  max = MAX_DISPLAY_REVIEWS,
): GoogleReview[] {
  const seen = new Set<string>();
  const merged: GoogleReview[] = [];

  for (const review of batches) {
    if (review.rating !== 5 || !review.text.trim()) continue;
    const key = reviewDedupeKey(review);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(review);
    if (merged.length >= max) break;
  }

  return merged;
}

function loadArchivedReviews(): GoogleReview[] {
  const archivedReviews = archivedReviewsRaw as GoogleReview[];
  if (!Array.isArray(archivedReviews)) return [];
  return archivedReviews.filter(
    (review) =>
      typeof review === "object" &&
      review !== null &&
      typeof review.id === "string" &&
      typeof review.authorName === "string" &&
      typeof review.rating === "number" &&
      typeof review.text === "string" &&
      typeof review.relativeTime === "string",
  );
}

type LocalizedText = {
  text?: string;
  languageCode?: string;
};

type NewPlacesReview = {
  name?: string;
  rating?: number;
  relativePublishTimeDescription?: string;
  text?: LocalizedText;
  originalText?: LocalizedText;
  authorAttribution?: {
    displayName?: string;
    photoUri?: string;
  };
};

function pickLocalizedReviewText(review: NewPlacesReview): string {
  const original = review.originalText?.text?.trim();
  const translated = review.text?.text?.trim();

  if (original && review.originalText?.languageCode?.startsWith("tr")) {
    return original;
  }

  return original || translated || "";
}

type NewPlacesResponse = {
  rating?: number;
  userRatingCount?: number;
  reviews?: NewPlacesReview[];
  googleMapsUri?: string;
};

type LegacyPlacesReview = {
  author_name?: string;
  profile_photo_url?: string;
  rating?: number;
  relative_time_description?: string;
  text?: string;
  time?: number;
};

type LegacyPlacesResponse = {
  status?: string;
  result?: {
    rating?: number;
    user_ratings_total?: number;
    reviews?: LegacyPlacesReview[];
    url?: string;
  };
};

async function fetchNewPlacesReviews(
  apiKey: string,
  placeId: string,
): Promise<GoogleReviewsResult | null> {
  const response = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
    {
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": "tr",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "reviews,rating,userRatingCount,googleMapsUri",
      },
      next: { revalidate: REVIEWS_REVALIDATE_SECONDS },
    },
  );

  if (!response.ok) return null;

  const data = (await response.json()) as NewPlacesResponse;
  const reviews: GoogleReview[] = (data.reviews ?? []).map((review, index) => ({
    id: review.name ?? `new-${index}`,
    authorName:
      review.authorAttribution?.displayName?.trim() || "Google kullanıcısı",
    authorPhotoUrl: review.authorAttribution?.photoUri,
    rating: review.rating ?? 0,
    text: pickLocalizedReviewText(review),
    relativeTime: review.relativePublishTimeDescription?.trim() ?? "",
  }));

  return {
    reviews,
    rating: data.rating,
    totalRatings: data.userRatingCount,
    placeUrl: data.googleMapsUri ?? buildGooglePlaceUrl(placeId),
  };
}

async function fetchLegacyPlacesReviews(
  apiKey: string,
  placeId: string,
  reviewsSort?: 0 | 1 | 2,
): Promise<GoogleReviewsResult | null> {
  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/details/json",
  );
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "reviews,rating,user_ratings_total,url");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("language", "tr");
  if (reviewsSort !== undefined) {
    url.searchParams.set("reviews_sort", String(reviewsSort));
  }

  const response = await fetch(url, {
    next: { revalidate: REVIEWS_REVALIDATE_SECONDS },
  });

  if (!response.ok) return null;

  const data = (await response.json()) as LegacyPlacesResponse;
  if (data.status !== "OK" || !data.result) return null;

  const reviews: GoogleReview[] = (data.result.reviews ?? []).map(
    (review, index) => ({
      id: `legacy-${reviewsSort ?? "x"}-${review.time ?? index}`,
      authorName: review.author_name?.trim() || "Google kullanıcısı",
      authorPhotoUrl: review.profile_photo_url,
      rating: review.rating ?? 0,
      text: review.text?.trim() ?? "",
      relativeTime: review.relative_time_description?.trim() ?? "",
    }),
  );

  return {
    reviews,
    rating: data.result.rating,
    totalRatings: data.result.user_ratings_total,
    placeUrl: data.result.url ?? buildGooglePlaceUrl(placeId),
  };
}

async function fetchCombinedGoogleReviews(
  apiKey: string,
  placeId: string,
): Promise<GoogleReviewsResult> {
  const liveBatches: GoogleReview[] = [];
  let rating: number | undefined;
  let totalRatings: number | undefined;
  let placeUrl = buildGooglePlaceUrl(placeId);

  const legacySorts: Array<0 | 1 | 2> = [0, 1, 2];
  await Promise.all(
    legacySorts.map(async (sort) => {
      try {
        const batch = await fetchLegacyPlacesReviews(apiKey, placeId, sort);
        if (!batch) return;
        liveBatches.push(...batch.reviews);
        rating ??= batch.rating;
        totalRatings ??= batch.totalRatings;
        placeUrl = batch.placeUrl ?? placeUrl;
      } catch {
        // Tek sıralama başarısız olabilir.
      }
    }),
  );

  try {
    const fromNewApi = await fetchNewPlacesReviews(apiKey, placeId);
    if (fromNewApi) {
      liveBatches.push(...fromNewApi.reviews);
      rating ??= fromNewApi.rating;
      totalRatings ??= fromNewApi.totalRatings;
      placeUrl = fromNewApi.placeUrl ?? placeUrl;
    }
  } catch {
    // Yeni API kapalı olabilir.
  }

  const archived = loadArchivedReviews();
  const reviews = mergeReviews([...liveBatches, ...archived]);

  return {
    reviews,
    rating,
    totalRatings,
    placeUrl: placeUrl || BEKOGRAPHY_MAPS_SHORT_URL,
  };
}

/** Sunucu tarafında Google yorumlarını çeker; yalnızca 5 yıldızlıları döndürür. */
export async function getFiveStarGoogleReviews(): Promise<GoogleReviewsResult> {
  const credentials = getGoogleCredentials();
  const archived = loadArchivedReviews();

  if (!credentials) {
    const reviews = mergeReviews(archived);
    return {
      reviews,
      placeUrl: BEKOGRAPHY_MAPS_SHORT_URL,
    };
  }

  try {
    return await fetchCombinedGoogleReviews(
      credentials.apiKey,
      credentials.placeId,
    );
  } catch {
    const reviews = mergeReviews(archived);
    return {
      reviews,
      placeUrl: BEKOGRAPHY_MAPS_SHORT_URL,
    };
  }
}

/** Script / senkronizasyon için ham API yorumlarını döndürür. */
export async function fetchLiveGoogleReviewsForArchive(): Promise<GoogleReview[]> {
  const credentials = getGoogleCredentials();
  if (!credentials) return [];

  const result = await fetchCombinedGoogleReviews(
    credentials.apiKey,
    credentials.placeId,
  );
  return result.reviews;
}
