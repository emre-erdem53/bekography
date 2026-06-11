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
};

const REVIEWS_REVALIDATE_SECONDS = 60 * 60 * 24 * 7;

function getGoogleCredentials() {
  const apiKey = process.env.GOOGLE_API_KEY?.trim();
  const placeId = process.env.GOOGLE_PLACE_ID?.trim();
  if (!apiKey || !placeId) return null;
  return { apiKey, placeId };
}

function toFiveStarReviews(
  reviews: GoogleReview[],
  rating?: number,
  totalRatings?: number,
): GoogleReviewsResult {
  return {
    reviews: reviews.filter((review) => review.rating === 5),
    rating,
    totalRatings,
  };
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
        "X-Goog-FieldMask": "reviews,rating,userRatingCount",
      },
      next: { revalidate: REVIEWS_REVALIDATE_SECONDS },
    },
  );

  if (!response.ok) return null;

  const data = (await response.json()) as NewPlacesResponse;
  const reviews: GoogleReview[] = (data.reviews ?? []).map((review, index) => ({
    id: review.name ?? `new-${index}`,
    authorName: review.authorAttribution?.displayName?.trim() || "Google kullanıcısı",
    authorPhotoUrl: review.authorAttribution?.photoUri,
    rating: review.rating ?? 0,
    text: pickLocalizedReviewText(review),
    relativeTime: review.relativePublishTimeDescription?.trim() ?? "",
  }));

  return toFiveStarReviews(reviews, data.rating, data.userRatingCount);
}

async function fetchLegacyPlacesReviews(
  apiKey: string,
  placeId: string,
): Promise<GoogleReviewsResult | null> {
  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/details/json",
  );
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "reviews,rating,user_ratings_total");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("language", "tr");

  const response = await fetch(url, {
    next: { revalidate: REVIEWS_REVALIDATE_SECONDS },
  });

  if (!response.ok) return null;

  const data = (await response.json()) as LegacyPlacesResponse;
  if (data.status !== "OK" || !data.result) return null;

  const reviews: GoogleReview[] = (data.result.reviews ?? []).map(
    (review, index) => ({
      id: `legacy-${review.time ?? index}`,
      authorName: review.author_name?.trim() || "Google kullanıcısı",
      authorPhotoUrl: review.profile_photo_url,
      rating: review.rating ?? 0,
      text: review.text?.trim() ?? "",
      relativeTime: review.relative_time_description?.trim() ?? "",
    }),
  );

  return toFiveStarReviews(
    reviews,
    data.result.rating,
    data.result.user_ratings_total,
  );
}

/** Sunucu tarafında Google yorumlarını çeker; yalnızca 5 yıldızlıları döndürür. */
export async function getFiveStarGoogleReviews(): Promise<GoogleReviewsResult> {
  const credentials = getGoogleCredentials();
  if (!credentials) {
    return { reviews: [] };
  }

  const { apiKey, placeId } = credentials;

  try {
    const fromLegacyApi = await fetchLegacyPlacesReviews(apiKey, placeId);
    if (fromLegacyApi && fromLegacyApi.reviews.length > 0) {
      return fromLegacyApi;
    }
  } catch {
    // Legacy kapalı veya anahtar kısıtlı olabilir — yeni API'ye düş.
  }

  try {
    const fromNewApi = await fetchNewPlacesReviews(apiKey, placeId);
    if (fromNewApi && fromNewApi.reviews.length > 0) {
      return fromNewApi;
    }
  } catch {
    // Sessizce boş dön; bölüm render edilmez.
  }

  return { reviews: [] };
}
