"use client";

import { animate, motion, useMotionValue, useReducedMotion, type PanInfo } from "framer-motion";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type TouchEvent as ReactTouchEvent } from "react";
import { EASE_OUT } from "@/lib/motion";
import {
  exploreMediaItems,
  type ExploreCarouselSlide,
  type ExploreMediaItem,
} from "@/lib/explore-media";

const SWIPE_THRESHOLD = 60;
const SWIPE_VELOCITY_THRESHOLD = 400;
const CAROUSEL_SWIPE_THRESHOLD = 48;
const MAX_ZOOM = 3;
const INITIAL_VISIBLE_COUNT = 12;
const LOAD_MORE_STEP = 9;

// Each ExploreMediaItem ships with its own `displayPattern` (computed in
// `lib/explore-media.ts`). The pattern is orientation-aware:
//   - wide slots (colSpan 2 or 3) only host landscape content
//   - tall (rowSpan 2) and 1x1 slots only host portrait content
// This avoids cropping landscape content into portrait frames.
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
  const reduce = useReducedMotion();
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const [slideZoom, setSlideZoom] = useState(1);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [activeVideoIds, setActiveVideoIds] = useState<Record<string, true>>({});

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const tilesRef = useRef<Record<string, HTMLButtonElement | null>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const wheelLocked = useRef(false);
  const isNavigating = useRef(false);

  const modalY = useMotionValue(0);
  const carouselTouchStart = useRef<{ x: number; y: number } | null>(null);
  const pinchStartDistance = useRef<number | null>(null);
  const pinchStartZoom = useRef(1);
  const isPinching = useRef(false);

  const media = useMemo(() => items, [items]);
  const arrangedFeedItems = useMemo(
    () => media.slice(0, Math.min(visibleCount, media.length)),
    [media, visibleCount],
  );

  const modalItem = modalIndex === null ? null : (media[modalIndex] ?? null);
  const modalSlides = modalItem?.carouselItems;
  const hasCarouselSlides = Boolean(modalSlides && modalSlides.length > 1);
  const activeModalSlide: ExploreCarouselSlide | ExploreMediaItem | null = modalItem
    ? modalSlides?.[activeCarouselIndex] ?? modalItem
    : null;

  const prevIndex = modalIndex === null ? -1 : (modalIndex - 1 + media.length) % media.length;
  const nextIndex = modalIndex === null ? -1 : (modalIndex + 1) % media.length;
  const prevItem = modalIndex !== null ? (media[prevIndex] ?? null) : null;
  const nextItem = modalIndex !== null ? (media[nextIndex] ?? null) : null;

  // Load more on scroll
  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setVisibleCount((current) => Math.min(current + LOAD_MORE_STEP, media.length));
      },
      { rootMargin: "320px 0px 320px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [media.length]);

  // Autoplay videos when in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        setActiveVideoIds((current) => {
          let changed = false;
          const next = { ...current };

          for (const entry of entries) {
            const mediaId = entry.target.getAttribute("data-media-id");
            const mediaType = entry.target.getAttribute("data-media-type");
            if (!mediaId || mediaType !== "video") continue;

            if (entry.isIntersecting) {
              if (!next[mediaId]) { next[mediaId] = true; changed = true; }
              continue;
            }
            if (next[mediaId]) { delete next[mediaId]; changed = true; }
          }

          return changed ? next : current;
        });
      },
      { threshold: 0.6, rootMargin: "120px 0px 120px 0px" },
    );

    const observedTiles = Object.values(tilesRef.current).filter(
      (tile): tile is HTMLButtonElement => tile !== null,
    );
    for (const tile of observedTiles) observer.observe(tile);

    return () => observer.disconnect();
  }, [arrangedFeedItems]);

  useEffect(() => {
    for (const [id, video] of Object.entries(videoRefs.current)) {
      if (!video) continue;
      if (activeVideoIds[id]) { video.play().catch(() => {}); continue; }
      video.pause();
    }
  }, [activeVideoIds]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (modalIndex === null) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, [modalIndex]);

  const navigateTo = async (direction: "next" | "prev") => {
    if (isNavigating.current || modalIndex === null) return;
    isNavigating.current = true;

    const targetY = direction === "next" ? -window.innerHeight : window.innerHeight;
    const newIndex =
      direction === "next"
        ? (modalIndex + 1) % media.length
        : (modalIndex - 1 + media.length) % media.length;

    await animate(modalY, targetY, {
      duration: reduce ? 0.01 : 0.28,
      ease: EASE_OUT,
    });

    setActiveCarouselIndex(0);
    setSlideZoom(1);
    setModalIndex(newIndex);
    modalY.set(0);
    isNavigating.current = false;
  };

  const handleModalDragEnd = (_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    if (slideZoom > 1.01) {
      animate(modalY, 0, { type: "spring", stiffness: 500, damping: 50 });
      return;
    }

    const isSignificant =
      Math.abs(info.offset.y) > SWIPE_THRESHOLD ||
      Math.abs(info.velocity.y) > SWIPE_VELOCITY_THRESHOLD;

    if (!isSignificant) {
      animate(modalY, 0, { type: "spring", stiffness: 500, damping: 50 });
      return;
    }

    void navigateTo(info.offset.y < 0 ? "next" : "prev");
  };

  const closeModal = () => {
    setModalIndex(null);
    setActiveCarouselIndex(0);
    setSlideZoom(1);
    modalY.set(0);
    isNavigating.current = false;
  };

  const clampZoom = (value: number) => Math.max(1, Math.min(MAX_ZOOM, value));

  const getTouchDistance = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (event.touches.length < 2) {
      return null;
    }
    const first = event.touches[0];
    const second = event.touches[1];
    if (!first || !second) {
      return null;
    }
    return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
  };

  const navigateCarousel = (direction: "next" | "prev") => {
    if (!modalSlides || modalSlides.length <= 1) {
      return;
    }
    setSlideZoom(1);
    setActiveCarouselIndex((current) => {
      if (direction === "next") {
        return (current + 1) % modalSlides.length;
      }
      return (current - 1 + modalSlides.length) % modalSlides.length;
    });
  };

  const handleCarouselTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (event.touches.length >= 2) {
      const distance = getTouchDistance(event);
      if (distance !== null) {
        isPinching.current = true;
        pinchStartDistance.current = distance;
        pinchStartZoom.current = slideZoom;
      }
      return;
    }

    const touch = event.touches[0];
    if (!touch) {
      return;
    }
    isPinching.current = false;
    pinchStartDistance.current = null;
    carouselTouchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleCarouselTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (event.touches.length < 2) {
      return;
    }

    const currentDistance = getTouchDistance(event);
    const startDistance = pinchStartDistance.current;
    if (currentDistance === null || !startDistance) {
      return;
    }

    isPinching.current = true;
    const nextZoom = clampZoom((currentDistance / startDistance) * pinchStartZoom.current);
    setSlideZoom(nextZoom);
  };

  const handleCarouselTouchEnd = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (event.touches.length >= 2) {
      return;
    }

    if (isPinching.current) {
      if (event.touches.length === 0) {
        isPinching.current = false;
        pinchStartDistance.current = null;
      }
      return;
    }

    if (!hasCarouselSlides || !carouselTouchStart.current || slideZoom > 1.01) {
      return;
    }
    const touch = event.changedTouches[0];
    if (!touch) {
      return;
    }

    const deltaX = touch.clientX - carouselTouchStart.current.x;
    const deltaY = touch.clientY - carouselTouchStart.current.y;
    carouselTouchStart.current = null;

    if (
      Math.abs(deltaX) < CAROUSEL_SWIPE_THRESHOLD ||
      Math.abs(deltaX) <= Math.abs(deltaY)
    ) {
      return;
    }

    navigateCarousel(deltaX < 0 ? "next" : "prev");
  };

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
                  ref={(node) => { tilesRef.current[item.id] = node; }}
                  data-media-id={item.id}
                  data-media-type={item.type}
                  onClick={() => {
                    setActiveCarouselIndex(0);
                    setSlideZoom(1);
                    setModalIndex(tileIndex);
                  }}
                  className={`group relative overflow-hidden bg-zinc-900 text-left ${colClass} ${rowClass}`}
                  aria-label={`Open ${item.title}`}
                >
                  {item.type === "video" ? (
                    <video
                      ref={(node) => { videoRefs.current[item.id] = node; }}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      src={item.src}
                      poster={item.poster}
                      autoPlay={Boolean(activeVideoIds[item.id])}
                      muted
                      loop
                      playsInline
                      preload={activeVideoIds[item.id] ? "metadata" : "none"}
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
      {modalItem ? (
        <div className="fixed inset-0 z-[70] overflow-hidden bg-black">
          {/* Close button */}
          <button
            type="button"
            onClick={closeModal}
            className="absolute left-4 top-4 z-[80] inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/35 bg-black/45 text-2xl text-white backdrop-blur-sm"
            aria-label="Close preview"
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

          <div className="pointer-events-none absolute left-1/2 top-5 z-[80] -translate-x-1/2">
            <h3 className="font-brand text-xl lowercase text-white sm:text-2xl">
              bekography
            </h3>
          </div>

          {/* 3-panel draggable stack */}
          <motion.div
            style={{ y: modalY }}
            drag={slideZoom > 1.01 ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.08}
            dragMomentum={false}
            onDragEnd={handleModalDragEnd}
            onWheel={(event) => {
              if (wheelLocked.current) return;
              wheelLocked.current = true;
              window.setTimeout(() => { wheelLocked.current = false; }, 300);
              void navigateTo(event.deltaY > 0 ? "next" : "prev");
            }}
            className="relative h-full w-full touch-none"
          >
            {/* Previous panel */}
            <div
              className="absolute w-full"
              style={{ top: "-100vh", height: "100vh" }}
            >
              {prevItem && <ModalPanel item={prevItem} />}
            </div>

            {/* Current panel */}
            <div className="absolute w-full" style={{ top: 0, height: "100vh" }}>
              {activeModalSlide ? (
                <div
                  onTouchStart={handleCarouselTouchStart}
                  onTouchMove={handleCarouselTouchMove}
                  onTouchEnd={handleCarouselTouchEnd}
                  onTouchCancel={() => {
                    carouselTouchStart.current = null;
                    pinchStartDistance.current = null;
                    isPinching.current = false;
                  }}
                  className="h-full w-full"
                >
                  <ModalPanel item={activeModalSlide} isActive zoom={slideZoom} />
                </div>
              ) : null}
              {/* Overlay: title + Instagram link */}
              <div className="absolute bottom-0 left-0 right-0 z-[75] p-4 pb-7 sm:p-6 sm:pb-8">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/75">
                  Yukarı / aşağı kaydırarak gezin
                </p>
                {hasCarouselSlides ? (
                  <div className="mt-3 flex items-center gap-1.5">
                    {modalSlides?.map((slide, index) => (
                      <span
                        key={slide.id}
                        className={`h-1.5 w-1.5 rounded-full transition-opacity ${
                          index === activeCarouselIndex ? "bg-white/95" : "bg-white/35"
                        }`}
                      />
                    ))}
                  </div>
                ) : null}
                <a
                  href={modalItem.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center justify-center gap-2.5"
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
            </div>

            {/* Next panel */}
            <div
              className="absolute w-full"
              style={{ top: "100vh", height: "100vh" }}
            >
              {nextItem && <ModalPanel item={nextItem} />}
            </div>
          </motion.div>
        </div>
      ) : null}
    </>
  );
}

type ModalPanelProps = {
  item: ExploreMediaItem | ExploreCarouselSlide;
  isActive?: boolean;
  zoom?: number;
};

function ModalPanel({ item, isActive = false, zoom = 1 }: ModalPanelProps) {
  return (
    <div className="relative h-full w-full">
      <div
        className="absolute inset-0 flex items-center justify-center md:p-8"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "center center",
        }}
      >
        {item.type === "video" ? (
          <video
            className="h-full w-full object-contain md:h-auto md:max-h-[88vh] md:w-auto md:max-w-[min(90vw,820px)]"
            src={item.src}
            poster={item.poster}
            autoPlay={isActive}
            muted
            loop
            playsInline
            controls={false}
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
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/65" />
    </div>
  );
}
