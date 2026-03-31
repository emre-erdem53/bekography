"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { EASE_OUT } from "@/lib/motion";
import { exploreMediaItems, type ExploreMediaItem } from "@/lib/explore-media";

const VERTICAL_SWIPE_THRESHOLD = 50;
const FEED_TILE_COUNT = 36;

type HomeExploreCarouselProps = {
  items?: ExploreMediaItem[];
};

export function HomeExploreCarousel({ items = exploreMediaItems }: HomeExploreCarouselProps) {
  const reduce = useReducedMotion();
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const wheelLocked = useRef(false);

  const media = useMemo(() => items, [items]);
  const feedItems = useMemo(
    () =>
      Array.from({ length: FEED_TILE_COUNT }).map(
        (_, index) => media[index % media.length],
      ),
    [media],
  );
  const modalItem = modalIndex === null ? null : media[modalIndex];

  const next = () => {
    setModalIndex((current) =>
      current === null ? 0 : (current + 1) % media.length,
    );
  };

  const prev = () => {
    setModalIndex((current) =>
      current === null ? 0 : (current - 1 + media.length) % media.length,
    );
  };

  useEffect(() => {
    if (modalIndex === null) {
      return;
    }
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [modalIndex]);

  return (
    <>
      <section
        className="relative w-full bg-black pt-24"
      >
        <div className="relative z-10 w-full">
          <div className="grid w-full grid-cols-3 gap-[1px]">
            {feedItems.map((item, tileIndex) => {
              const globalIndex = media.findIndex((entry) => entry.id === item.id);
              return (
                <button
                  key={`${item.id}-${tileIndex}`}
                  type="button"
                  onClick={() => setModalIndex(globalIndex)}
                  className="group relative aspect-[3/4] overflow-hidden bg-zinc-900 text-left"
                  aria-label={`Open ${item.title}`}
                >
                  {item.type === "video" ? (
                    <video
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      src={item.src}
                      poster={item.poster}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
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
        </div>
      </section>

      <AnimatePresence>
        {modalItem ? (
          <motion.div
            className="fixed inset-0 z-[70] bg-black"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: reduce ? 0.01 : 0.35, ease: EASE_OUT }}
            onTouchStart={(event) => {
              touchStartY.current = event.touches[0]?.clientY ?? null;
            }}
            onTouchEnd={(event) => {
              const start = touchStartY.current;
              const end = event.changedTouches[0]?.clientY ?? null;
              touchStartY.current = null;

              if (start === null || end === null) {
                return;
              }

              const distance = end - start;
              if (Math.abs(distance) < VERTICAL_SWIPE_THRESHOLD) {
                return;
              }

              if (distance < 0) {
                next();
                return;
              }

              prev();
            }}
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
              onClick={() => setModalIndex(null)}
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
                  transition={{
                    duration: reduce ? 0.01 : 0.35,
                    ease: EASE_OUT,
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center md:p-8">
                    {modalItem.type === "video" ? (
                      <video
                        className="h-full w-full object-cover md:h-auto md:max-h-[88vh] md:w-auto md:max-w-[min(90vw,820px)] md:object-contain"
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
                        className="h-full w-full object-cover md:h-auto md:max-h-[88vh] md:w-auto md:max-w-[min(90vw,820px)] md:object-contain"
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
                <h3 className="mt-2 font-serif text-3xl italic text-white sm:text-4xl">
                  {modalItem.title}
                </h3>
                <a
                  href={modalItem.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center justify-center border border-white bg-white px-6 py-3 text-[10px] font-bold uppercase tracking-[0.25em] text-black transition-colors hover:bg-black hover:text-white"
                >
                  Instagram&apos;da Gör
                </a>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
