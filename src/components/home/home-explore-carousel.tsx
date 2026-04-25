"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type PanInfo,
} from "framer-motion";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { EASE_OUT } from "@/lib/motion";
import { exploreMediaItems, type ExploreMediaItem } from "@/lib/explore-media";

const VERTICAL_SWIPE_THRESHOLD = 50;
const INITIAL_VISIBLE_COUNT = 12;
const LOAD_MORE_STEP = 9;

type HomeExploreCarouselProps = {
  items?: ExploreMediaItem[];
  landscapeVideoSpan?: 2 | 3;
};

export function HomeExploreCarousel({
  items = exploreMediaItems,
  landscapeVideoSpan = 2,
}: HomeExploreCarouselProps) {
  const reduce = useReducedMotion();
  const [modalId, setModalId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [orientationById, setOrientationById] = useState<
    Record<string, "portrait" | "landscape">
  >({});
  const [activeVideoIds, setActiveVideoIds] = useState<Record<string, true>>({});
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const tilesRef = useRef<Record<string, HTMLButtonElement | null>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const wheelLocked = useRef(false);

  const media = useMemo(() => items, [items]);
  const feedItems = useMemo(
    () => media.slice(0, Math.min(visibleCount, media.length)),
    [media, visibleCount],
  );
  const arrangedFeedItems = useMemo(() => {
    const remaining = [...feedItems];
    const arranged: ExploreMediaItem[] = [];
    let currentRow = 0;
    let usedColumnsInRow = 0;
    let lastLandscapeVideoRow = -99;

    const isLandscapeVideo = (item: ExploreMediaItem) => {
      if (item.type !== "video") {
        return false;
      }
      const orientation = orientationById[item.id] ?? item.orientation;
      return orientation === "landscape";
    };

    const getSpan = (item: ExploreMediaItem) =>
      isLandscapeVideo(item) ? landscapeVideoSpan : 1;

    while (remaining.length > 0) {
      const columnsLeft = 3 - usedColumnsInRow;
      let chosenIndex = remaining.findIndex((candidate) => {
        const span = getSpan(candidate);
        if (span > columnsLeft) {
          return false;
        }

        if (isLandscapeVideo(candidate) && currentRow - lastLandscapeVideoRow <= 1) {
          return false;
        }

        return true;
      });

      if (chosenIndex === -1) {
        if (usedColumnsInRow > 0) {
          currentRow += 1;
          usedColumnsInRow = 0;
          continue;
        }

        chosenIndex = remaining.findIndex((candidate) => {
          if (!isLandscapeVideo(candidate)) {
            return true;
          }
          return currentRow - lastLandscapeVideoRow > 1;
        });

        if (chosenIndex === -1) {
          chosenIndex = 0;
        }
      }

      const [chosen] = remaining.splice(chosenIndex, 1);
      const chosenSpan = getSpan(chosen);

      if (chosenSpan > 3 - usedColumnsInRow) {
        currentRow += 1;
        usedColumnsInRow = 0;
      }

      const rowUsedByItem = currentRow;
      usedColumnsInRow += chosenSpan;
      if (usedColumnsInRow >= 3) {
        currentRow += 1;
        usedColumnsInRow = 0;
      }

      if (isLandscapeVideo(chosen)) {
        lastLandscapeVideoRow = rowUsedByItem;
      }

      arranged.push(chosen);
    }

    return arranged;
  }, [feedItems, landscapeVideoSpan, orientationById]);
  const modalIndex = modalId === null ? -1 : media.findIndex((item) => item.id === modalId);
  const modalItem = modalIndex === -1 ? null : media[modalIndex];

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) {
          return;
        }

        setVisibleCount((current) =>
          Math.min(current + LOAD_MORE_STEP, media.length),
        );
      },
      { rootMargin: "320px 0px 320px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [media.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        setActiveVideoIds((current) => {
          let changed = false;
          const next = { ...current };

          for (const entry of entries) {
            const mediaId = entry.target.getAttribute("data-media-id");
            const mediaType = entry.target.getAttribute("data-media-type");
            if (!mediaId || mediaType !== "video") {
              continue;
            }

            if (entry.isIntersecting) {
              if (!next[mediaId]) {
                next[mediaId] = true;
                changed = true;
              }
              continue;
            }

            if (next[mediaId]) {
              delete next[mediaId];
              changed = true;
            }
          }

          return changed ? next : current;
        });
      },
      {
        threshold: 0.6,
        rootMargin: "120px 0px 120px 0px",
      },
    );

    const observedTiles = Object.values(tilesRef.current).filter(
      (tile): tile is HTMLButtonElement => tile !== null,
    );
    for (const tile of observedTiles) {
      observer.observe(tile);
    }

    return () => observer.disconnect();
  }, [arrangedFeedItems]);

  useEffect(() => {
    for (const [id, video] of Object.entries(videoRefs.current)) {
      if (!video) {
        continue;
      }
      if (activeVideoIds[id]) {
        video.play().catch(() => {});
        continue;
      }
      video.pause();
    }
  }, [activeVideoIds]);

  const next = () => {
    if (!media.length) {
      return;
    }
    const safeIndex = modalIndex >= 0 ? modalIndex : 0;
    const nextIndex = (safeIndex + 1) % media.length;
    setModalId(media[nextIndex]?.id ?? null);
  };

  const prev = () => {
    if (!media.length) {
      return;
    }
    const safeIndex = modalIndex >= 0 ? modalIndex : 0;
    const prevIndex = (safeIndex - 1 + media.length) % media.length;
    setModalId(media[prevIndex]?.id ?? null);
  };

  useEffect(() => {
    if (modalId === null) {
      return;
    }
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [modalId]);

  return (
    <>
      <section
        className="relative w-full bg-black pt-24"
      >
        <div className="relative z-10 w-full">
          <div className="grid w-full grid-cols-3 gap-[1px]">
            {arrangedFeedItems.map((item, tileIndex) => {
              const itemOrientation = orientationById[item.id] ?? item.orientation;
              const isLandscape = itemOrientation === "landscape";
              const landscapeClass =
                landscapeVideoSpan === 3
                  ? "col-span-3 aspect-[16/9]"
                  : "col-span-2 aspect-[16/9]";
              return (
                <button
                  key={`${item.id}-${tileIndex}`}
                  type="button"
                  ref={(node) => {
                    tilesRef.current[item.id] = node;
                  }}
                  data-media-id={item.id}
                  data-media-type={item.type}
                  onClick={() => setModalId(item.id)}
                  className={`group relative overflow-hidden bg-zinc-900 text-left ${
                    isLandscape ? landscapeClass : "aspect-[3/4]"
                  }`}
                  aria-label={`Open ${item.title}`}
                >
                  {item.type === "video" ? (
                    <video
                      ref={(node) => {
                        videoRefs.current[item.id] = node;
                      }}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      src={item.src}
                      poster={item.poster}
                      autoPlay={Boolean(activeVideoIds[item.id])}
                      muted
                      loop
                      playsInline
                      preload={activeVideoIds[item.id] ? "metadata" : "none"}
                      onLoadedMetadata={(event) => {
                        const { videoWidth, videoHeight } = event.currentTarget;
                        if (!videoWidth || !videoHeight) {
                          return;
                        }
                        const nextOrientation =
                          videoWidth > videoHeight ? "landscape" : "portrait";
                        setOrientationById((current) => {
                          if (current[item.id] === nextOrientation) {
                            return current;
                          }
                          return { ...current, [item.id]: nextOrientation };
                        });
                      }}
                    />
                  ) : (
                    <Image
                      src={item.src}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 768px) 33vw, 20vw"
                      onLoad={(event) => {
                        const element = event.currentTarget;
                        const nextOrientation =
                          element.naturalWidth > element.naturalHeight
                            ? "landscape"
                            : "portrait";
                        setOrientationById((current) => {
                          if (current[item.id] === nextOrientation) {
                            return current;
                          }
                          return { ...current, [item.id]: nextOrientation };
                        });
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
                </button>
              );
            })}
          </div>
          {visibleCount < media.length ? (
            <div
              ref={loadMoreRef}
              className="h-20 w-full"
              aria-hidden
            />
          ) : null}
        </div>
      </section>

      <AnimatePresence>
        {modalItem ? (
          <motion.div
            className="fixed inset-0 z-[70] touch-none bg-black"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: reduce ? 0.01 : 0.35, ease: EASE_OUT }}
            onWheel={(event) => {
              if (wheelLocked.current) {
                return;
              }
              wheelLocked.current = true;
              window.setTimeout(() => {
                wheelLocked.current = false;
              }, 220);

              if (event.deltaY > 0) {
                next();
                return;
              }

              prev();
            }}
          >
            <button
              type="button"
              onClick={() => setModalId(null)}
              className="absolute right-4 top-4 z-[80] inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/35 bg-black/45 text-2xl text-white backdrop-blur-sm"
              aria-label="Close preview"
            >
              ×
            </button>

            <div className="relative h-full w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={modalItem.id}
                  className="absolute inset-0"
                  initial={reduce ? false : { opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -24 }}
                  drag="y"
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={0.14}
                  dragMomentum={false}
                  onDragEnd={(_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
                    if (Math.abs(info.offset.y) < VERTICAL_SWIPE_THRESHOLD) {
                      return;
                    }
                    if (info.offset.y < 0) {
                      next();
                      return;
                    }
                    prev();
                  }}
                  transition={{
                    duration: reduce ? 0.01 : 0.35,
                    ease: EASE_OUT,
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center md:p-8">
                    {modalItem.type === "video" ? (
                      <video
                        className="h-full w-full object-contain md:h-auto md:max-h-[88vh] md:w-auto md:max-w-[min(90vw,820px)]"
                        src={modalItem.src}
                        poster={modalItem.poster}
                        autoPlay
                        muted
                        loop
                        playsInline
                        controls={false}
                      />
                    ) : (
                      <Image
                        src={modalItem.src}
                        alt={modalItem.title}
                        width={1080}
                        height={1920}
                        className="h-full w-full object-contain md:h-auto md:max-h-[88vh] md:w-auto md:max-w-[min(90vw,820px)]"
                        sizes="(max-width: 767px) 100vw, 820px"
                      />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/65" />
                </motion.div>
              </AnimatePresence>

              <div className="absolute bottom-0 left-0 right-0 z-[75] p-4 pb-7 sm:p-6 sm:pb-8">
                <p className="text-xs uppercase tracking-[0.2em] text-white/75">
                  Yukarı / aşağı kaydırarak gezin
                </p>
                <h3 className="font-brand mt-2 text-3xl lowercase text-white sm:text-4xl">
                  bekography
                </h3>
                <a
                  href={modalItem.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center justify-center gap-3"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#833ab4] via-[#fd1d1d] to-[#fcb045] shadow-lg ring-1 ring-white/30">
                    <Image
                      src="/instagram.svg"
                      alt=""
                      width={16}
                      height={16}
                      className="h-4 w-4"
                      aria-hidden
                    />
                  </span>
                  <span className="inline-flex items-center justify-center border border-white/60 bg-black/70 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.25em] text-white transition-colors hover:bg-white hover:text-black">
                    Instagram&apos;da Gör
                  </span>
                </a>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
