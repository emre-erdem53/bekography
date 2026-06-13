"use client";

import { ChevronLeft, ChevronRight, ExternalLink, Quote, Star, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { GoogleReview } from "@/lib/google-reviews";
import { turkishUppercase } from "@/lib/turkish-text";

type AboutGoogleReviewsSliderProps = {
  reviews: GoogleReview[];
  rating?: number;
  totalRatings?: number;
  placeUrl?: string;
};

function GooglePlaceLink({
  placeUrl,
  className,
}: {
  placeUrl: string;
  className?: string;
}) {
  return (
    <a
      href={placeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ??
        "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-[11px] font-medium tracking-[0.12em] text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-white/20 dark:hover:bg-zinc-800"
      }
    >
      <ExternalLink className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
      {turkishUppercase("Google'da Gör")}
    </a>
  );
}

function StarRow({ count = 5 }: { count?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <Star
          key={index}
          className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

function ReviewAvatar({
  name,
  photoUrl,
}: {
  name: string;
  photoUrl?: string;
}) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  if (photoUrl) {
    return (
      <Image
        src={photoUrl}
        alt=""
        width={44}
        height={44}
        className="h-11 w-11 rounded-full object-cover ring-2 ring-white dark:ring-zinc-800"
        unoptimized
      />
    );
  }

  return (
    <div
      className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium tracking-wide text-zinc-600 ring-2 ring-white dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-900"
      aria-hidden
    >
      {initials || "G"}
    </div>
  );
}

function ReviewDetailModal({
  review,
  placeUrl,
  onClose,
}: {
  review: GoogleReview;
  placeUrl?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Yorumu kapat"
      />

      <div className="relative max-h-[min(85dvh,36rem)] w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-900">
        <div className="max-h-[min(85dvh,36rem)] overflow-y-auto p-6 sm:p-7">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full border border-zinc-200 bg-white p-2 text-zinc-600 transition hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            aria-label="Kapat"
          >
            <X className="h-4 w-4" />
          </button>

          <Quote
            className="mb-4 h-8 w-8 text-zinc-200 dark:text-zinc-700"
            strokeWidth={1.25}
            aria-hidden
          />

          <div className="flex items-center gap-3 pr-10">
            <ReviewAvatar
              name={review.authorName}
              photoUrl={review.authorPhotoUrl}
            />
            <div className="min-w-0">
              <p
                id="review-modal-title"
                className="text-base font-medium text-zinc-900 dark:text-zinc-100"
              >
                {review.authorName}
              </p>
              {review.relativeTime ? (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {review.relativeTime}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-4">
            <StarRow />
          </div>

          <p className="mt-5 text-sm font-light leading-relaxed text-zinc-700 dark:text-zinc-200">
            {review.text}
          </p>

          {placeUrl ? (
            <div className="mt-6">
              <GooglePlaceLink placeUrl={placeUrl} />
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function AboutGoogleReviewsSlider({
  reviews,
  rating,
  totalRatings,
  placeUrl,
}: AboutGoogleReviewsSliderProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(reviews.length > 1);
  const [expandedReview, setExpandedReview] = useState<GoogleReview | null>(
    null,
  );

  const getCards = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return [];
    return Array.from(
      container.querySelectorAll<HTMLElement>("[data-review-card]"),
    );
  }, []);

  const updateScrollState = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const cards = getCards();
    if (!cards.length) return;

    const center = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(center - cardCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveIndex(closestIndex);
    setCanScrollBack(container.scrollLeft > 8);
    setCanScrollForward(
      container.scrollLeft + container.clientWidth < container.scrollWidth - 8,
    );
  }, [getCards]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    updateScrollState();
    container.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      container.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  const scrollToIndex = useCallback(
    (index: number) => {
      const cards = getCards();
      const card = cards[index];
      if (!card) return;
      card.scrollIntoView({
        behavior: "smooth",
        inline: "start",
        block: "nearest",
      });
    },
    [getCards],
  );

  const scrollByPage = useCallback(
    (direction: -1 | 1) => {
      const nextIndex = Math.min(
        Math.max(activeIndex + direction, 0),
        reviews.length - 1,
      );
      scrollToIndex(nextIndex);
    },
    [activeIndex, reviews.length, scrollToIndex],
  );

  return (
    <section
      className="mt-14 overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-zinc-900 md:p-8"
      aria-label="Google yorumları"
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] tracking-[0.35em] text-zinc-500 dark:text-zinc-400">
            {turkishUppercase("Google Yorumları")}
          </p>
          <h3 className="mt-3 text-2xl leading-tight text-zinc-900 dark:text-zinc-50 md:text-3xl">
            Mutlu çiftlerimizden
          </h3>
          <p className="mt-2 max-w-xl text-sm font-light leading-relaxed text-zinc-600 dark:text-zinc-300">
            Gerçek deneyimler, 5 yıldızlı yorumlar.
          </p>
        </div>

        {typeof rating === "number" ? (
          <div className="inline-flex w-fit items-center gap-3 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2.5 dark:border-white/10 dark:bg-zinc-800/80">
            <span className="text-2xl font-light tabular-nums text-zinc-900 dark:text-zinc-50">
              {rating.toFixed(1)}
            </span>
            <div className="h-8 w-px bg-zinc-200 dark:bg-white/10" />
            <div>
              <StarRow />
              {typeof totalRatings === "number" ? (
                <p className="mt-1 text-[11px] tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                  {totalRatings.toLocaleString("tr-TR")} değerlendirme
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className="relative mt-8">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-10 bg-gradient-to-r from-white to-transparent dark:from-zinc-900 md:block"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-10 bg-gradient-to-l from-white to-transparent dark:from-zinc-900 md:block"
          aria-hidden
        />

        <div
          ref={scrollRef}
          className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {reviews.map((review) => (
            <article
              key={review.id}
              data-review-card
              className="w-[min(88vw,22rem)] shrink-0 snap-start sm:w-[min(78vw,24rem)] md:w-[min(42vw,22rem)] lg:w-[min(34vw,20rem)]"
            >
              <div className="flex h-[17.5rem] w-full flex-col rounded-2xl border border-zinc-100 bg-zinc-50/80 p-5 dark:border-white/5 dark:bg-zinc-800/50">
                <button
                  type="button"
                  onClick={() => setExpandedReview(review)}
                  className="group relative flex min-h-0 flex-1 flex-col text-left transition hover:opacity-95"
                  aria-label={`${review.authorName} yorumunu oku`}
                >
                  <Quote
                    className="absolute right-0 top-0 h-8 w-8 text-zinc-200 dark:text-zinc-700"
                    strokeWidth={1.25}
                    aria-hidden
                  />

                  <div className="flex items-center gap-3 pr-8">
                    <ReviewAvatar
                      name={review.authorName}
                      photoUrl={review.authorPhotoUrl}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {review.authorName}
                      </p>
                      {review.relativeTime ? (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {review.relativeTime}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <StarRow />

                  <p className="mt-3 line-clamp-4 flex-1 text-sm font-light leading-relaxed text-zinc-700 dark:text-zinc-200">
                    {review.text}
                  </p>

                  <span className="mt-3 text-[11px] tracking-[0.14em] text-zinc-500 transition group-hover:text-zinc-800 dark:text-zinc-400 dark:group-hover:text-zinc-200">
                    {turkishUppercase("Devamını oku")}
                  </span>
                </button>

                {placeUrl ? (
                  <div className="mt-3 shrink-0">
                    <GooglePlaceLink placeUrl={placeUrl} />
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>

        {reviews.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => scrollByPage(-1)}
              disabled={!canScrollBack}
              className="absolute left-0 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-zinc-200 bg-white p-2 text-zinc-700 shadow-sm transition enabled:hover:bg-zinc-50 disabled:opacity-0 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:enabled:hover:bg-zinc-800 md:inline-flex"
              aria-label="Önceki yorum"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollByPage(1)}
              disabled={!canScrollForward}
              className="absolute right-0 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-zinc-200 bg-white p-2 text-zinc-700 shadow-sm transition enabled:hover:bg-zinc-50 disabled:opacity-0 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:enabled:hover:bg-zinc-800 md:inline-flex"
              aria-label="Sonraki yorum"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        ) : null}
      </div>

      {reviews.length > 1 ? (
        <div className="mt-5 flex items-center justify-center gap-2">
          {reviews.map((review, index) => (
            <button
              key={review.id}
              type="button"
              onClick={() => scrollToIndex(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === activeIndex
                  ? "w-6 bg-zinc-800 dark:bg-zinc-100"
                  : "w-1.5 bg-zinc-300 dark:bg-zinc-600"
              }`}
              aria-label={`${index + 1}. yorum`}
              aria-current={index === activeIndex ? "true" : undefined}
            />
          ))}
        </div>
      ) : null}

      <p className="mt-5 text-center text-[10px] tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
        YORUMLAR GOOGLE TARAFINDAN SAĞLANMAKTADIR
      </p>

      {expandedReview ? (
        <ReviewDetailModal
          review={expandedReview}
          placeUrl={placeUrl}
          onClose={() => setExpandedReview(null)}
        />
      ) : null}
    </section>
  );
}
