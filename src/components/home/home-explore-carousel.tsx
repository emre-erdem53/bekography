"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Loader2 } from "lucide-react";
import {
  BEKOGRAPHY_INSTAGRAM_HANDLE,
  BEKOGRAPHY_INSTAGRAM_PROFILE_IMAGE,
  BEKOGRAPHY_INSTAGRAM_URL,
} from "@/lib/site-location";
import { GridMediaTile } from "@/components/home/grid-media-tile";
import {
  getExploreLoadMoreCount,
  getInitialExploreVisibleCount,
} from "@/lib/explore-grid-viewport";
import { preloadExploreBatch } from "@/lib/explore-media-preload";
import type {
  DisplayPattern,
  ExploreCarouselSlide,
  ExploreMediaItem,
} from "@/lib/explore-media-types";

/** Üst sıradaki görsellere LCP önceliği. */
const PRIORITY_TILE_COUNT = 3;
/** Kullanıcı scroll etmeden «daha fazla yükle» tetiklenmesin. */
const SCROLL_GATE_PX = 40;
/** Sağa kaydırarak modal kapatma eşiği (px). */
const DISMISS_CLOSE_PX = 112;
/** Eksen kilidi için minimum hareket (px). */
const DISMISS_AXIS_LOCK_PX = 12;

// `displayPattern` is computed in `lib/explore-media.ts`. The pattern is
// orientation-aware (wide slots host landscape, narrow slots host portrait)
// so content is never cropped into a wrong-shaped slot.
const COL_SPAN_CLASS: Record<1 | 2 | 3, string> = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
};

const ROW_SPAN_CLASS: Record<DisplayPattern["rowSpan"], string> = {
  1: "",
  2: "row-span-2",
  3: "row-span-3",
  4: "row-span-4",
  5: "row-span-5",
  6: "row-span-6",
};

type HomeExploreCarouselProps = {
  items: ExploreMediaItem[];
  /** Sayfa bazlı feed kimliği — geçişlerde ön yükleme döngüsünü sıfırlar. */
  feedKey?: string;
};

export function HomeExploreCarousel({
  items,
  feedKey = "home",
}: HomeExploreCarouselProps) {
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  // Per-post horizontal slide index (only relevant for carousel posts).
  const [carouselSlideByIndex, setCarouselSlideByIndex] = useState<
    Record<number, number>
  >({});
  const [readyCount, setReadyCount] = useState(0);
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  // True while any modal image is being pinch-zoomed; we use this to
  // freeze both the vertical scroller and any active inner carousel so
  // the user can pan within the zoomed image without the page snapping.
  const [isPinching, setIsPinching] = useState(false);
  // User preference for sound. Default = wants sound (false = not muted).
  // We persist for the modal session so toggling once applies to all
  // subsequent posts the user scrolls through.
  const [userMuted, setUserMuted] = useState(false);
  const [dismissOffset, setDismissOffset] = useState(0);
  const [dismissTransition, setDismissTransition] = useState(true);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const readyCountRef = useRef(readyCount);
  const isFeedLoadingRef = useRef(isFeedLoading);
  const hasUserScrolledRef = useRef(false);
  const canLoadMoreRef = useRef(false);
  const lastScrollYRef = useRef(0);
  const tilesRef = useRef<Record<string, HTMLButtonElement | null>>({});
  const gridVideoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const gridVideoObserverRef = useRef<IntersectionObserver | null>(null);
  const modalScrollRef = useRef<HTMLDivElement | null>(null);
  const carouselScrollRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const activeIndexRef = useRef(activeIndex);
  const isPinchingRef = useRef(isPinching);
  const dismissOffsetRef = useRef(0);
  const dismissDragRef = useRef<{
    pointerId: number | null;
    startX: number;
    startY: number;
    axis: "x" | "y" | null;
  }>({ pointerId: null, startX: 0, startY: 0, axis: null });

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    isPinchingRef.current = isPinching;
  }, [isPinching]);

  // The grid order and the modal swipe order are *the same array* so that
  // tile N in the grid is index N in the swipe stream. There is no separate
  // ordering, no shuffle, no dedupe step that could drift.
  const media = items;

  useEffect(() => {
    let cancelled = false;
    hasUserScrolledRef.current = false;
    canLoadMoreRef.current = false;
    lastScrollYRef.current = 0;

    async function bootstrapFeed() {
      isFeedLoadingRef.current = true;
      setIsFeedLoading(true);
      setReadyCount(0);

      const target = getInitialExploreVisibleCount(items);
      await preloadExploreBatch(items, 0, target);

      if (cancelled) return;
      setReadyCount(target);
      isFeedLoadingRef.current = false;
      setIsFeedLoading(false);
    }

    void bootstrapFeed();
    return () => {
      cancelled = true;
    };
  }, [items, feedKey]);

  useEffect(() => {
    readyCountRef.current = readyCount;
  }, [readyCount]);

  useEffect(() => {
    isFeedLoadingRef.current = isFeedLoading;
  }, [isFeedLoading]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y >= SCROLL_GATE_PX) {
        hasUserScrolledRef.current = true;
      }
      if (y > lastScrollYRef.current + 12) {
        canLoadMoreRef.current = true;
      }
      lastScrollYRef.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Yükleme bitene kadar sayfa scroll'unu kilitle.
  useEffect(() => {
    if (!isFeedLoading) return;

    const scrollY = window.scrollY;
    const { style } = document.body;
    style.position = "fixed";
    style.top = `-${scrollY}px`;
    style.left = "0";
    style.right = "0";
    style.width = "100%";
    style.overflow = "hidden";

    return () => {
      style.position = "";
      style.top = "";
      style.left = "";
      style.right = "";
      style.width = "";
      style.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, [isFeedLoading]);

  const loadNextBatch = useCallback(async () => {
    if (isFeedLoadingRef.current) return;

    const current = readyCountRef.current;
    if (current >= media.length) return;

    const step = getExploreLoadMoreCount(media, current);
    const next = Math.min(current + step, media.length);
    if (next <= current) return;

    isFeedLoadingRef.current = true;
    setIsFeedLoading(true);
    try {
      await preloadExploreBatch(media, current, next);
      setReadyCount(next);
    } finally {
      isFeedLoadingRef.current = false;
      setIsFeedLoading(false);
    }
  }, [media]);

  const arrangedFeedItems = useMemo(
    () => media.slice(0, Math.min(readyCount, media.length)),
    [media, readyCount],
  );

  // Lazy-render only a window around the active modal post, so dozens of
  // <video> tags don't all initialise at once.
  const RENDER_RADIUS = 2;

  // ----------------------------- GRID ------------------------------------

  // "Load more" — scroll sonrası; medya önce indirilir, sonra DOM'a eklenir.
  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || readyCount >= media.length || isFeedLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (!hasUserScrolledRef.current) return;
        if (!canLoadMoreRef.current) return;
        if (isFeedLoadingRef.current) return;
        canLoadMoreRef.current = false;
        void loadNextBatch();
      },
      { rootMargin: "80px 0px 0px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [media, readyCount, media.length, isFeedLoading, loadNextBatch]);

  // Grid videoları: görünürken loop oynat, çıkınca duraklat — React state güncellemesi yok.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.getAttribute("data-media-id");
          const type = entry.target.getAttribute("data-media-type");
          if (!id || type !== "video") continue;
          const video = gridVideoRefs.current[id];
          if (!video) continue;
          if (entry.isIntersecting) {
            if (video.preload === "none") {
              video.preload = "metadata";
            }
            video.play().catch(() => {});
            continue;
          }
          video.pause();
        }
      },
      { threshold: 0.6, rootMargin: "120px 0px 120px 0px" },
    );
    gridVideoObserverRef.current = observer;

    for (const tile of Object.values(tilesRef.current)) {
      if (tile?.getAttribute("data-media-type") === "video") {
        observer.observe(tile);
      }
    }

    return () => {
      observer.disconnect();
      gridVideoObserverRef.current = null;
    };
  }, [arrangedFeedItems.length]);

  const registerGridTile = useCallback(
    (item: ExploreMediaItem, node: HTMLButtonElement | null) => {
      const previous = tilesRef.current[item.id];
      if (previous && previous !== node) {
        gridVideoObserverRef.current?.unobserve(previous);
      }
      tilesRef.current[item.id] = node;
      if (node && item.type === "video") {
        gridVideoObserverRef.current?.observe(node);
      }
    },
    [],
  );

  // ----------------------------- MODAL -----------------------------------

  // Lock body scroll while modal is open.
  useEffect(() => {
    if (modalIndex === null) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [modalIndex]);

  // Open modal: scroll to the clicked post immediately.
  // useLayoutEffect guarantees this runs *before* paint, so the user never
  // sees the first item flash before the correct one snaps in.
  // (`activeIndex` is synced inside `openModal`, so we don't update state
  // here — that would trigger a cascading render.)
  useLayoutEffect(() => {
    if (modalIndex === null) return;
    const container = modalScrollRef.current;
    if (!container) return;
    const target = container.querySelector<HTMLElement>(
      `[data-post-index="${modalIndex}"]`,
    );
    if (!target) return;
    container.scrollTo({ top: target.offsetTop, behavior: "instant" as ScrollBehavior });
  }, [modalIndex]);

  // Track which post is currently centred in the viewport via
  // IntersectionObserver. This drives video play/pause, dot indicators
  // and the Instagram link in the bottom overlay.
  useEffect(() => {
    if (modalIndex === null) return;
    const container = modalScrollRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let bestIndex: number | null = null;
        let bestRatio = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (entry.intersectionRatio <= bestRatio) continue;
          const idxAttr = entry.target.getAttribute("data-post-index");
          if (idxAttr === null) continue;
          bestIndex = Number(idxAttr);
          bestRatio = entry.intersectionRatio;
        }
        if (bestIndex !== null) {
          setActiveIndex(bestIndex);
        }
      },
      {
        root: container,
        threshold: [0.5, 0.6, 0.75, 0.9],
      },
    );

    const posts = container.querySelectorAll<HTMLElement>("[data-post-index]");
    for (const post of posts) observer.observe(post);
    return () => observer.disconnect();
  }, [modalIndex, media.length]);

  const closeModal = useCallback(() => {
    setModalIndex(null);
    setActiveIndex(0);
    setCarouselSlideByIndex({});
    setDismissOffset(0);
    dismissOffsetRef.current = 0;
    dismissDragRef.current = {
      pointerId: null,
      startX: 0,
      startY: 0,
      axis: null,
    };
  }, []);

  const finishDismissDrag = useCallback(
    (target: HTMLDivElement, pointerId: number) => {
      dismissDragRef.current.pointerId = null;
      dismissDragRef.current.axis = null;
      if (target.hasPointerCapture(pointerId)) {
        target.releasePointerCapture(pointerId);
      }

      setDismissTransition(true);
      const offset = dismissOffsetRef.current;
      const shouldClose = offset >= DISMISS_CLOSE_PX;

      if (shouldClose) {
        const exitDistance =
          typeof window !== "undefined" ? window.innerWidth : offset;
        setDismissOffset(exitDistance);
        dismissOffsetRef.current = exitDistance;
        window.setTimeout(() => {
          closeModal();
        }, 200);
        return;
      }

      setDismissOffset(0);
      dismissOffsetRef.current = 0;
    },
    [closeModal],
  );

  const handleDismissPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (isPinchingRef.current || event.button !== 0) return;
      if ((event.target as HTMLElement).closest("a, button")) return;
      dismissDragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        axis: null,
      };
    },
    [],
  );

  const handleDismissPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const drag = dismissDragRef.current;
      if (drag.pointerId !== event.pointerId || isPinchingRef.current) return;

      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;

      if (!drag.axis) {
        if (
          Math.abs(dx) < DISMISS_AXIS_LOCK_PX &&
          Math.abs(dy) < DISMISS_AXIS_LOCK_PX
        ) {
          return;
        }
        drag.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }

      if (drag.axis !== "x") return;
      if (dx <= 0) {
        if (dismissOffsetRef.current !== 0) {
          dismissOffsetRef.current = 0;
          setDismissOffset(0);
        }
        return;
      }

      const carousel = carouselScrollRefs.current[activeIndexRef.current];
      if (carousel && carousel.scrollLeft > 8) return;

      if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }

      setDismissTransition(false);
      dismissOffsetRef.current = dx;
      setDismissOffset(dx);
    },
    [],
  );

  const handleDismissPointerEnd = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const drag = dismissDragRef.current;
      if (drag.pointerId !== event.pointerId) return;
      if (!drag.axis && dismissOffsetRef.current === 0) {
        dismissDragRef.current.pointerId = null;
        return;
      }
      finishDismissDrag(event.currentTarget, event.pointerId);
    },
    [finishDismissDrag],
  );

  const openModal = useCallback((index: number) => {
    setActiveIndex(index);
    setCarouselSlideByIndex({});
    setModalIndex(index);
  }, []);

  const handleCarouselScroll = useCallback(
    (index: number, slide: number) => {
      setCarouselSlideByIndex((current) => {
        if (current[index] === slide) return current;
        return { ...current, [index]: slide };
      });
    },
    [],
  );

  // The active item drives the bottom overlay (dots + Instagram link).
  const activeItem = modalIndex !== null ? media[activeIndex] ?? null : null;
  const activeCarouselSlideIndex =
    activeItem && activeItem.carouselItems && activeItem.carouselItems.length > 1
      ? carouselSlideByIndex[activeIndex] ?? 0
      : 0;
  const activeHasCarousel = Boolean(
    activeItem?.carouselItems && activeItem.carouselItems.length > 1,
  );
  const dismissOpacity =
    dismissOffset > 0
      ? Math.max(0.35, 1 - dismissOffset / 420)
      : 1;

  // ----------------------------- RENDER ----------------------------------

  return (
    <>
      {isFeedLoading ? (
        <div
          className="fixed inset-0 z-[65] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          aria-live="polite"
          aria-busy="true"
        >
          <Loader2
            className="h-10 w-10 animate-spin text-white"
            aria-label="İçerik yükleniyor"
          />
        </div>
      ) : null}

      <section className="relative w-full bg-black pt-24">
        <div className="relative z-10 w-full">
          <div
            className="grid w-full auto-flow-dense grid-cols-3 gap-[1px]"
            style={{ gridAutoRows: "30vw" }}
          >
            {arrangedFeedItems.map((item, tileIndex) => {
              const pattern = item.displayPattern ?? { colSpan: 1, rowSpan: 1 };
              const hasExplicitPlacement =
                pattern.colStart !== undefined && pattern.rowStart !== undefined;
              const colClass = hasExplicitPlacement
                ? ""
                : COL_SPAN_CLASS[pattern.colSpan];
              const rowClass = hasExplicitPlacement
                ? ""
                : ROW_SPAN_CLASS[pattern.rowSpan];
              const gridPlacementStyle = hasExplicitPlacement
                ? {
                    gridColumn: `${pattern.colStart} / span ${pattern.colSpan}`,
                    gridRow: `${pattern.rowStart} / span ${pattern.rowSpan}`,
                  }
                : undefined;
              return (
                <button
                  key={item.id}
                  type="button"
                  ref={(node) => registerGridTile(item, node)}
                  data-media-id={item.id}
                  data-media-type={item.type}
                  onClick={() => openModal(tileIndex)}
                  style={gridPlacementStyle}
                  className={`group relative overflow-hidden bg-black text-left ${colClass} ${rowClass}`}
                  aria-label={`Open ${item.title}`}
                >
                  <GridMediaTile
                    item={item}
                    priority={tileIndex < PRIORITY_TILE_COUNT}
                    videoRef={(node) => {
                      gridVideoRefs.current[item.id] = node;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
                </button>
              );
            })}
          </div>
          {readyCount < media.length ? (
            <div ref={loadMoreRef} className="h-px w-full" aria-hidden />
          ) : null}
        </div>
      </section>

      {/* Fullscreen modal */}
      {modalIndex !== null ? (
        <div
          className="fixed inset-x-0 top-0 z-[70] overflow-hidden bg-black touch-pan-y"
          style={{ height: "100dvh" }}
          onPointerDown={handleDismissPointerDown}
          onPointerMove={handleDismissPointerMove}
          onPointerUp={handleDismissPointerEnd}
          onPointerCancel={handleDismissPointerEnd}
        >
          <div
            className="relative h-full w-full"
            style={{
              transform: `translate3d(${dismissOffset}px, 0, 0)`,
              opacity: dismissOpacity,
              transition: dismissTransition
                ? "transform 0.22s ease-out, opacity 0.22s ease-out"
                : "none",
            }}
          >
          {/* Vertical scroll-snap container — the swipe order is identical
              to the grid order because we render `media` in DOM order.
              While the user pinch-zooms an image we lock the scroller so
              the post doesn't snap underneath their fingers. */}
          <div
            ref={modalScrollRef}
            className={`h-full w-full overflow-x-hidden no-scrollbar ${
              isPinching ? "overflow-y-hidden" : "overflow-y-scroll"
            }`}
            style={{
              scrollSnapType: isPinching ? "none" : "y mandatory",
              overscrollBehavior: "contain",
              WebkitOverflowScrolling: "touch",
              touchAction: isPinching ? "none" : "pan-y",
            }}
          >
            {media.map((item, index) => {
              const distance = Math.abs(index - activeIndex);
              const shouldRender = distance <= RENDER_RADIUS;
              return (
                <div
                  key={item.id}
                  data-post-index={index}
                  className="relative w-full"
                  style={{
                    height: "100dvh",
                    scrollSnapAlign: "start",
                    scrollSnapStop: "always",
                  }}
                >
                  {shouldRender ? (
                    <PostView
                      item={item}
                      index={index}
                      isActive={index === activeIndex}
                      isPinching={isPinching}
                      userMuted={userMuted}
                      onToggleMute={() => setUserMuted((prev) => !prev)}
                      onPinchChange={setIsPinching}
                      onCarouselScrollContainer={(node) => {
                        carouselScrollRefs.current[index] = node;
                      }}
                      onCarouselSlideChange={(slide) =>
                        handleCarouselScroll(index, slide)
                      }
                    />
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Modal chrome: counter, dots, profile, close */}
          {activeItem ? (
            <>
              {activeHasCarousel && activeItem.carouselItems ? (
                <div className="pointer-events-none absolute right-4 top-4 z-[80] rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold tabular-nums text-white backdrop-blur-sm sm:right-6 sm:top-6 sm:text-sm">
                  {activeCarouselSlideIndex + 1}/{activeItem.carouselItems.length}
                </div>
              ) : null}

              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[80] px-4 pb-[max(env(safe-area-inset-bottom),1.75rem)] pt-16 sm:px-6">
                {activeHasCarousel && activeItem.carouselItems ? (
                  <div className="mb-5 flex items-center justify-center gap-2">
                    {activeItem.carouselItems.map((slide, slideIdx) => (
                      <span
                        key={slide.id}
                        className={`rounded-full transition-all duration-200 ${
                          slideIdx === activeCarouselSlideIndex
                            ? "h-2 w-6 bg-white"
                            : "h-2 w-2 bg-white/45"
                        }`}
                      />
                    ))}
                  </div>
                ) : null}

                <div className="flex items-end justify-between gap-4">
                  <a
                    href={activeItem.instagramUrl || BEKOGRAPHY_INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pointer-events-auto inline-flex min-w-0 max-w-[calc(100%-4rem)] items-center gap-2.5"
                  >
                    <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-white/80">
                      <Image
                        src={BEKOGRAPHY_INSTAGRAM_PROFILE_IMAGE}
                        alt=""
                        width={36}
                        height={36}
                        className="h-full w-full object-cover"
                      />
                    </span>
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-white">
                        @{BEKOGRAPHY_INSTAGRAM_HANDLE}
                      </span>
                      <VerifiedBadge />
                    </span>
                  </a>

                  <button
                    type="button"
                    onClick={closeModal}
                    className="pointer-events-auto inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/35 bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/75"
                    aria-label="Önizlemeyi kapat"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                      aria-hidden
                    >
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

function VerifiedBadge() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-label="Onaylı hesap"
      className="h-4 w-4 shrink-0"
      role="img"
    >
      <circle cx="12" cy="12" r="10" fill="#0095F6" />
      <path
        d="M7.5 12.2 10.4 15l6.1-6.3"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ===========================================================================
// PostView — renders a single full-screen post inside the modal scroller.
// ===========================================================================

type PostViewProps = {
  item: ExploreMediaItem;
  index: number;
  isActive: boolean;
  isPinching: boolean;
  userMuted: boolean;
  onToggleMute: () => void;
  onPinchChange: (pinching: boolean) => void;
  onCarouselScrollContainer: (node: HTMLDivElement | null) => void;
  onCarouselSlideChange: (slide: number) => void;
};

function PostView({
  item,
  isActive,
  isPinching,
  userMuted,
  onToggleMute,
  onPinchChange,
  onCarouselScrollContainer,
  onCarouselSlideChange,
}: PostViewProps) {
  const slides = item.carouselItems;
  if (slides && slides.length > 1) {
    return (
      <CarouselPost
        slides={slides}
        isActive={isActive}
        isPinching={isPinching}
        userMuted={userMuted}
        onToggleMute={onToggleMute}
        onPinchChange={onPinchChange}
        onContainer={onCarouselScrollContainer}
        onSlideChange={onCarouselSlideChange}
      />
    );
  }
  return (
    <MediaContent
      item={item}
      isActive={isActive}
      userMuted={userMuted}
      onToggleMute={onToggleMute}
      onPinchChange={onPinchChange}
    />
  );
}

// ===========================================================================
// CarouselPost — horizontal scroll-snap inside the vertical scroll-snap
// container. Browser's native gesture routing handles axis disambiguation.
// ===========================================================================

type CarouselPostProps = {
  slides: ExploreCarouselSlide[];
  isActive: boolean;
  isPinching: boolean;
  userMuted: boolean;
  onToggleMute: () => void;
  onPinchChange: (pinching: boolean) => void;
  onContainer: (node: HTMLDivElement | null) => void;
  onSlideChange: (slide: number) => void;
};

function CarouselPost({
  slides,
  isActive,
  isPinching,
  userMuted,
  onToggleMute,
  onPinchChange,
  onContainer,
  onSlideChange,
}: CarouselPostProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node;
      onContainer(node);
    },
    [onContainer],
  );

  // Track the active slide via scroll position; cheap because we only update
  // when the snapped slide changes.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let frame = 0;
    let lastSlide = 0;
    const handleScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const width = container.clientWidth;
        if (!width) return;
        const slide = Math.round(container.scrollLeft / width);
        if (slide === lastSlide) return;
        lastSlide = slide;
        setCurrentSlide(slide);
        onSlideChange(slide);
      });
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      container.removeEventListener("scroll", handleScroll);
    };
  }, [onSlideChange]);

  return (
    <div
      ref={setRef}
      className={`flex h-full w-full overflow-y-hidden no-scrollbar ${
        isPinching ? "overflow-x-hidden" : "overflow-x-scroll"
      }`}
      style={{
        scrollSnapType: isPinching ? "none" : "x mandatory",
        // Allow scroll-chaining: when the user pans vertically, the inner
        // container can't scroll in that direction (overflow-y: hidden), so
        // the gesture must propagate to the outer vertical scroller.
        overscrollBehaviorY: "auto",
        overscrollBehaviorX: "contain",
        WebkitOverflowScrolling: "touch",
        // While pinching we hand all touches to the image's gesture
        // handler. Otherwise we permit both axes — `pan-x` alone would
        // block pan-y entirely on this element.
        touchAction: isPinching ? "none" : "pan-x pan-y",
      }}
    >
      {slides.map((slide, slideIdx) => (
        <div
          key={slide.id}
          className="relative h-full w-full flex-shrink-0"
          style={{ scrollSnapAlign: "start", scrollSnapStop: "always" }}
        >
          <MediaContent
            item={slide}
            isActive={isActive && slideIdx === currentSlide}
            userMuted={userMuted}
            onToggleMute={onToggleMute}
            onPinchChange={onPinchChange}
          />
        </div>
      ))}
    </div>
  );
}

// ===========================================================================
// MediaContent — image or video centred (object-contain) in the post frame.
// Images get pinch-to-zoom + pan; videos get autoplay with sound (with
// graceful fallback to muted if the browser blocks unmuted autoplay).
// ===========================================================================

type MediaContentProps = {
  item: ExploreMediaItem | ExploreCarouselSlide;
  isActive: boolean;
  userMuted: boolean;
  onToggleMute: () => void;
  onPinchChange: (pinching: boolean) => void;
};

const MAX_ZOOM = 4;
const MIN_ZOOM = 1;
// Below this zoom we treat the user as "essentially not zoomed" and
// snap the image back to its resting state when they release.
const ZOOM_SNAP_THRESHOLD = 1.05;

function MediaContent({
  item,
  isActive,
  userMuted,
  onToggleMute,
  onPinchChange,
}: MediaContentProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  // True only while a touch (pinch or pan) is in progress; we disable
  // the CSS transition during gestures so the transform tracks fingers
  // 1:1 instead of easing behind them.
  const [isGesturing, setIsGesturing] = useState(false);

  // Snap stale zoom state back to rest when the post stops being
  // active so the next entry starts fresh. The setState calls here
  // only run on the isActive→false edge and bail when the values are
  // already at rest, so they never trigger a render cascade.
  useEffect(() => {
    if (isActive) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset bound to prop edge
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsGesturing(false);
  }, [isActive]);

  // Tell the parent whenever we start/stop being zoomed so it can lock
  // the surrounding scrollers and prevent post snapping under our pan.
  // We only consider an *active* post as "pinching" — an off-screen
  // post stuck with stale zoom state must never lock the scroller.
  useEffect(() => {
    onPinchChange(isActive && zoom > ZOOM_SNAP_THRESHOLD);
  }, [isActive, zoom, onPinchChange]);

  // Pinch + pan gestures. We have to use the DOM addEventListener path
  // (not React's onTouch* synthetic handlers) because we need
  // `{ passive: false }` to call preventDefault and override the native
  // scroll behaviour on iOS Safari. We only attach handlers while this
  // post is active so off-screen posts never intercept touches.
  useEffect(() => {
    if (item.type !== "image") return;
    if (!isActive) return;
    const el = containerRef.current;
    if (!el) return;

    let pinchStart: { distance: number; zoom: number } | null = null;
    let panStart:
      | { x: number; y: number; pan: { x: number; y: number } }
      | null = null;
    // Each new active session starts from rest. We mirror state in
    // these locals so handlers can read the latest gesture values
    // without depending on stale React closures.
    let liveZoom = 1;
    let livePan = { x: 0, y: 0 };

    const distanceBetween = (a: Touch, b: Touch) =>
      Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);

    const handleStart = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        const t1 = event.touches[0];
        const t2 = event.touches[1];
        if (!t1 || !t2) return;
        pinchStart = {
          distance: distanceBetween(t1, t2),
          zoom: liveZoom,
        };
        panStart = null;
        setIsGesturing(true);
        event.preventDefault();
      } else if (
        event.touches.length === 1 &&
        liveZoom > ZOOM_SNAP_THRESHOLD
      ) {
        const t = event.touches[0];
        if (!t) return;
        panStart = {
          x: t.clientX,
          y: t.clientY,
          pan: { ...livePan },
        };
        setIsGesturing(true);
        event.preventDefault();
      }
    };

    const handleMove = (event: TouchEvent) => {
      if (event.touches.length === 2 && pinchStart) {
        const t1 = event.touches[0];
        const t2 = event.touches[1];
        if (!t1 || !t2) return;
        const ratio = distanceBetween(t1, t2) / pinchStart.distance;
        const next = Math.max(
          MIN_ZOOM,
          Math.min(MAX_ZOOM, pinchStart.zoom * ratio),
        );
        liveZoom = next;
        setZoom(next);
        event.preventDefault();
      } else if (
        event.touches.length === 1 &&
        panStart &&
        liveZoom > ZOOM_SNAP_THRESHOLD
      ) {
        const t = event.touches[0];
        if (!t) return;
        const next = {
          x: panStart.pan.x + (t.clientX - panStart.x),
          y: panStart.pan.y + (t.clientY - panStart.y),
        };
        livePan = next;
        setPan(next);
        event.preventDefault();
      }
    };

    const handleEnd = (event: TouchEvent) => {
      if (event.touches.length < 2) pinchStart = null;
      if (event.touches.length === 0) {
        panStart = null;
        setIsGesturing(false);
        // Snap back to rest if the user only nudged the zoom; this
        // also re-enables the surrounding scrollers via onPinchChange.
        if (liveZoom < ZOOM_SNAP_THRESHOLD) {
          liveZoom = 1;
          livePan = { x: 0, y: 0 };
          setZoom(1);
          setPan({ x: 0, y: 0 });
        }
      }
    };

    el.addEventListener("touchstart", handleStart, { passive: false });
    el.addEventListener("touchmove", handleMove, { passive: false });
    el.addEventListener("touchend", handleEnd);
    el.addEventListener("touchcancel", handleEnd);

    return () => {
      el.removeEventListener("touchstart", handleStart);
      el.removeEventListener("touchmove", handleMove);
      el.removeEventListener("touchend", handleEnd);
      el.removeEventListener("touchcancel", handleEnd);
    };
  }, [item.type, item.id, isActive]);

  // Drive video playback + sound explicitly. The autoplay attribute
  // alone is unreliable across re-renders, and sound requires special
  // handling: try unmuted first (browsers usually allow it after a
  // user gesture has unlocked the page), fall back to muted on failure.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (item.type !== "video") return;

    if (!isActive) {
      video.pause();
      try {
        video.currentTime = 0;
      } catch {
        // currentTime can throw before metadata loads; safe to ignore.
      }
      return;
    }

    video.muted = userMuted;
    const tryPlay = video.play();
    if (tryPlay && typeof tryPlay.catch === "function") {
      tryPlay.catch(() => {
        // Browser refused unmuted autoplay (common on iOS without a
        // recent user gesture). Fall back to muted so the video at
        // least plays; tapping the video counts as a fresh gesture.
        video.muted = true;
        video.play().catch(() => {});
      });
    }
  }, [isActive, item.id, item.type, userMuted]);

  const isImage = item.type === "image";
  const transformActive = zoom > ZOOM_SNAP_THRESHOLD || pan.x !== 0 || pan.y !== 0;

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full"
      style={{
        // While zoomed we own all touches so the parent scroller
        // doesn't try to interpret a pan-while-zoomed gesture as a
        // post change.
        touchAction: isImage && transformActive ? "none" : undefined,
      }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center md:p-8"
        style={
          isImage
            ? {
                transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
                transformOrigin: "center center",
                transition: isGesturing
                  ? "none"
                  : "transform 0.22s ease-out",
                willChange: "transform",
              }
            : undefined
        }
      >
        {item.type === "video" ? (
          <video
            key={item.id}
            ref={videoRef}
            className="h-full w-full object-contain md:h-auto md:max-h-[88vh] md:w-auto md:max-w-[min(90vw,820px)]"
            src={item.src}
            poster={item.poster}
            autoPlay={isActive}
            muted={userMuted}
            loop
            playsInline
            controls={false}
            preload="auto"
            onClick={(event) => {
              event.stopPropagation();
              onToggleMute();
            }}
          />
        ) : (
          <Image
            src={item.src}
            alt={item.title}
            width={1080}
            height={1920}
            className="h-full w-full object-contain md:h-auto md:max-h-[88vh] md:w-auto md:max-w-[min(90vw,820px)]"
            sizes="(max-width: 767px) 100vw, 820px"
            draggable={false}
          />
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/65" />
    </div>
  );
}
