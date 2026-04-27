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
import {
  exploreMediaItems,
  type ExploreCarouselSlide,
  type ExploreMediaItem,
} from "@/lib/explore-media";

const INITIAL_VISIBLE_COUNT = 12;
const LOAD_MORE_STEP = 9;

// `displayPattern` is computed in `lib/explore-media.ts`. The pattern is
// orientation-aware (wide slots host landscape, narrow slots host portrait)
// so content is never cropped into a wrong-shaped slot.
const COL_SPAN_CLASS: Record<1 | 2 | 3, string> = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
};

const ROW_SPAN_CLASS: Record<1 | 2, string> = {
  1: "",
  2: "row-span-2",
};

type HomeExploreCarouselProps = {
  items?: ExploreMediaItem[];
};

export function HomeExploreCarousel({
  items = exploreMediaItems,
}: HomeExploreCarouselProps) {
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  // Per-post horizontal slide index (only relevant for carousel posts).
  const [carouselSlideByIndex, setCarouselSlideByIndex] = useState<
    Record<number, number>
  >({});
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [activeGridVideoIds, setActiveGridVideoIds] = useState<
    Record<string, true>
  >({});

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const tilesRef = useRef<Record<string, HTMLButtonElement | null>>({});
  const gridVideoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const modalScrollRef = useRef<HTMLDivElement | null>(null);
  const carouselScrollRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // The grid order and the modal swipe order are *the same array* so that
  // tile N in the grid is index N in the swipe stream. There is no separate
  // ordering, no shuffle, no dedupe step that could drift.
  const media = items;
  const arrangedFeedItems = useMemo(
    () => media.slice(0, Math.min(visibleCount, media.length)),
    [media, visibleCount],
  );

  // Lazy-render only a window around the active modal post, so dozens of
  // <video> tags don't all initialise at once.
  const RENDER_RADIUS = 2;

  // ----------------------------- GRID ------------------------------------

  // "Load more" sentinel
  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setVisibleCount((current) =>
          Math.min(current + LOAD_MORE_STEP, media.length),
        );
      },
      { rootMargin: "320px 0px 320px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [media.length]);

  // Autoplay grid videos only while their tile is in view.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        setActiveGridVideoIds((current) => {
          let changed = false;
          const next = { ...current };
          for (const entry of entries) {
            const id = entry.target.getAttribute("data-media-id");
            const type = entry.target.getAttribute("data-media-type");
            if (!id || type !== "video") continue;
            if (entry.isIntersecting) {
              if (!next[id]) {
                next[id] = true;
                changed = true;
              }
              continue;
            }
            if (next[id]) {
              delete next[id];
              changed = true;
            }
          }
          return changed ? next : current;
        });
      },
      { threshold: 0.6, rootMargin: "120px 0px 120px 0px" },
    );

    const observed = Object.values(tilesRef.current).filter(
      (tile): tile is HTMLButtonElement => tile !== null,
    );
    for (const tile of observed) observer.observe(tile);

    return () => observer.disconnect();
  }, [arrangedFeedItems]);

  useEffect(() => {
    for (const [id, video] of Object.entries(gridVideoRefs.current)) {
      if (!video) continue;
      if (activeGridVideoIds[id]) {
        video.play().catch(() => {});
        continue;
      }
      video.pause();
    }
  }, [activeGridVideoIds]);

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
  }, []);

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

  // ----------------------------- RENDER ----------------------------------

  return (
    <>
      <section className="relative w-full bg-black pt-24">
        <div className="relative z-10 w-full">
          <div
            className="grid w-full grid-cols-3 gap-[1px]"
            style={{ gridAutoRows: "30vw" }}
          >
            {arrangedFeedItems.map((item, tileIndex) => {
              const pattern = item.displayPattern ?? { colSpan: 1, rowSpan: 1 };
              const colClass = COL_SPAN_CLASS[pattern.colSpan];
              const rowClass = ROW_SPAN_CLASS[pattern.rowSpan];
              return (
                <button
                  key={item.id}
                  type="button"
                  ref={(node) => {
                    tilesRef.current[item.id] = node;
                  }}
                  data-media-id={item.id}
                  data-media-type={item.type}
                  onClick={() => openModal(tileIndex)}
                  className={`group relative overflow-hidden bg-zinc-900 text-left ${colClass} ${rowClass}`}
                  aria-label={`Open ${item.title}`}
                >
                  {item.type === "video" ? (
                    <video
                      ref={(node) => {
                        gridVideoRefs.current[item.id] = node;
                      }}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      src={item.src}
                      poster={item.poster}
                      autoPlay={Boolean(activeGridVideoIds[item.id])}
                      muted
                      loop
                      playsInline
                      preload={
                        activeGridVideoIds[item.id] ? "metadata" : "none"
                      }
                    />
                  ) : (
                    <Image
                      src={item.src}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 768px) 33vw, 20vw"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
                </button>
              );
            })}
          </div>
          {visibleCount < media.length ? (
            <div ref={loadMoreRef} className="h-20 w-full" aria-hidden />
          ) : null}
        </div>
      </section>

      {/* Fullscreen modal */}
      {modalIndex !== null ? (
        <div
          className="fixed inset-x-0 top-0 z-[70] overflow-hidden bg-black"
          style={{ height: "100dvh" }}
        >
          {/* Vertical scroll-snap container — the swipe order is identical
              to the grid order because we render `media` in DOM order. */}
          <div
            ref={modalScrollRef}
            className="h-full w-full overflow-y-scroll overflow-x-hidden no-scrollbar"
            style={{
              scrollSnapType: "y mandatory",
              overscrollBehavior: "contain",
              WebkitOverflowScrolling: "touch",
              touchAction: "pan-y",
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

          {/* Top overlay: close + brand title */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[80] flex items-start justify-between p-4">
            <button
              type="button"
              onClick={closeModal}
              className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/35 bg-black/45 text-white backdrop-blur-sm"
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
            <h3 className="font-brand mt-2 text-xl lowercase text-white sm:text-2xl">
              bekography
            </h3>
            <span aria-hidden className="h-11 w-11" />
          </div>

          {/* Bottom overlay: hint + dot indicators + Instagram link */}
          {activeItem ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[80] p-4 pb-7 sm:p-6 sm:pb-8">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/75">
                Yukarı / aşağı kaydırarak gezin
              </p>
              {activeHasCarousel && activeItem.carouselItems ? (
                <div className="mt-3 flex items-center gap-1.5">
                  {activeItem.carouselItems.map((slide, slideIdx) => (
                    <span
                      key={slide.id}
                      className={`h-1.5 w-1.5 rounded-full transition-opacity ${
                        slideIdx === activeCarouselSlideIndex
                          ? "bg-white/95"
                          : "bg-white/35"
                      }`}
                    />
                  ))}
                </div>
              ) : null}
              <a
                href={activeItem.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="pointer-events-auto mt-4 inline-flex items-center justify-center gap-2.5"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full shadow-lg">
                  <Image
                    src="/instagram.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="h-7 w-7"
                    aria-hidden
                  />
                </span>
                <span className="inline-flex h-9 items-center justify-center rounded-full border border-white/60 bg-black/70 px-5 text-[10px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-white hover:text-black">
                  Instagram&apos;da Gör
                </span>
              </a>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

// ===========================================================================
// PostView — renders a single full-screen post inside the modal scroller.
// ===========================================================================

type PostViewProps = {
  item: ExploreMediaItem;
  index: number;
  isActive: boolean;
  onCarouselScrollContainer: (node: HTMLDivElement | null) => void;
  onCarouselSlideChange: (slide: number) => void;
};

function PostView({
  item,
  isActive,
  onCarouselScrollContainer,
  onCarouselSlideChange,
}: PostViewProps) {
  const slides = item.carouselItems;
  if (slides && slides.length > 1) {
    return (
      <CarouselPost
        slides={slides}
        isActive={isActive}
        onContainer={onCarouselScrollContainer}
        onSlideChange={onCarouselSlideChange}
      />
    );
  }
  return <MediaContent item={item} isActive={isActive} />;
}

// ===========================================================================
// CarouselPost — horizontal scroll-snap inside the vertical scroll-snap
// container. Browser's native gesture routing handles axis disambiguation.
// ===========================================================================

type CarouselPostProps = {
  slides: ExploreCarouselSlide[];
  isActive: boolean;
  onContainer: (node: HTMLDivElement | null) => void;
  onSlideChange: (slide: number) => void;
};

function CarouselPost({
  slides,
  isActive,
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
      className="flex h-full w-full overflow-x-scroll overflow-y-hidden no-scrollbar"
      style={{
        scrollSnapType: "x mandatory",
        overscrollBehavior: "contain",
        WebkitOverflowScrolling: "touch",
        touchAction: "pan-x",
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
          />
        </div>
      ))}
    </div>
  );
}

// ===========================================================================
// MediaContent — image or video centred (object-contain) in the post frame.
// ===========================================================================

type MediaContentProps = {
  item: ExploreMediaItem | ExploreCarouselSlide;
  isActive: boolean;
};

function MediaContent({ item, isActive }: MediaContentProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Drive video playback explicitly so swiping to a video tile actually
  // plays the video (autoplay attribute alone is unreliable when the same
  // <video> node is reused across React renders).
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (item.type !== "video") return;
    if (isActive) {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
      return;
    }
    video.pause();
    try {
      video.currentTime = 0;
    } catch {
      // currentTime can throw before metadata loads; safe to ignore.
    }
  }, [isActive, item.id, item.type]);

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 flex items-center justify-center md:p-8">
        {item.type === "video" ? (
          <video
            key={item.id}
            ref={videoRef}
            className="h-full w-full object-contain md:h-auto md:max-h-[88vh] md:w-auto md:max-w-[min(90vw,820px)]"
            src={item.src}
            poster={item.poster}
            autoPlay={isActive}
            muted
            loop
            playsInline
            controls={false}
            preload="auto"
          />
        ) : (
          <Image
            src={item.src}
            alt={item.title}
            width={1080}
            height={1920}
            className="h-full w-full object-contain md:h-auto md:max-h-[88vh] md:w-auto md:max-w-[min(90vw,820px)]"
            sizes="(max-width: 767px) 100vw, 820px"
          />
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/65" />
    </div>
  );
}
