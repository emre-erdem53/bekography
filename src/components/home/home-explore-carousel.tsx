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
  // True while any modal image is being pinch-zoomed; we use this to
  // freeze both the vertical scroller and any active inner carousel so
  // the user can pan within the zoomed image without the page snapping.
  const [isPinching, setIsPinching] = useState(false);
  // User preference for sound. Default = wants sound (false = not muted).
  // We persist for the modal session so toggling once applies to all
  // subsequent posts the user scrolls through.
  const [userMuted, setUserMuted] = useState(false);

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
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0 flex-1">
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
                </div>
                {/* Sound toggle: only meaningful for video posts. Browsers
                    may still force muted on the very first autoplay of the
                    session, but tapping this button counts as a user
                    gesture and reliably unmutes from that point on. */}
                {activeItem.type === "video" ? (
                  <button
                    type="button"
                    onClick={() => setUserMuted((prev) => !prev)}
                    className="pointer-events-auto inline-flex h-10 w-10 flex-none items-center justify-center rounded-full border border-white/35 bg-black/55 text-white backdrop-blur-sm"
                    aria-label={userMuted ? "Sesi aç" : "Sesi kapat"}
                  >
                    {userMuted ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                        aria-hidden
                      >
                        <path d="M11 5 6 9H2v6h4l5 4V5z" />
                        <line x1="22" y1="9" x2="16" y2="15" />
                        <line x1="16" y1="9" x2="22" y2="15" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                        aria-hidden
                      >
                        <path d="M11 5 6 9H2v6h4l5 4V5z" />
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                      </svg>
                    )}
                  </button>
                ) : null}
              </div>
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
  isPinching: boolean;
  userMuted: boolean;
  onPinchChange: (pinching: boolean) => void;
  onCarouselScrollContainer: (node: HTMLDivElement | null) => void;
  onCarouselSlideChange: (slide: number) => void;
};

function PostView({
  item,
  isActive,
  isPinching,
  userMuted,
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
  onPinchChange: (pinching: boolean) => void;
  onContainer: (node: HTMLDivElement | null) => void;
  onSlideChange: (slide: number) => void;
};

function CarouselPost({
  slides,
  isActive,
  isPinching,
  userMuted,
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
        // least plays; the user can hit the unmute button to enable
        // sound, which counts as a fresh gesture.
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
