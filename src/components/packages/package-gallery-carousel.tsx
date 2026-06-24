"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { PackageGalleryMedia } from "@/lib/package-seed-data";

type PackageGalleryCarouselProps = {
  media: PackageGalleryMedia[];
  variant?: "detail" | "default" | "scroll";
};

function CarouselVideoSlide({
  src,
  isActive,
}: {
  src: string;
  isActive: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      if (video.preload === "none") {
        video.preload = "metadata";
      }
      void video.play().catch(() => {});
      return;
    }

    video.pause();
  }, [isActive]);

  return (
    <video
      ref={videoRef}
      src={src}
      className="h-full w-full object-cover"
      muted
      playsInline
      loop
      preload="metadata"
    />
  );
}

export function PackageGalleryCarousel({
  media,
  variant = "default",
}: PackageGalleryCarouselProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const frameClass =
    variant === "scroll"
      ? "relative h-full min-h-0 w-full overflow-hidden rounded-2xl bg-[#111] sm:rounded-3xl"
      : variant === "detail"
        ? "relative aspect-square w-full overflow-hidden rounded-3xl bg-[#111]"
        : "relative aspect-[4/5] overflow-hidden rounded-3xl bg-[#111]";

  useEffect(() => {
    setCurrentIndex(0);
    if (containerRef.current) {
      containerRef.current.scrollLeft = 0;
    }
  }, [media]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || media.length <= 1) return;

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
        setCurrentIndex(slide);
      });
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      container.removeEventListener("scroll", handleScroll);
    };
  }, [media.length]);

  if (media.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-[#1a1a1a] text-xs text-zinc-500 sm:text-sm ${
          variant === "scroll"
            ? "h-full min-h-0 w-full rounded-2xl sm:rounded-3xl"
            : variant === "detail"
              ? "aspect-square w-full rounded-3xl"
              : "aspect-[4/5] rounded-3xl"
        }`}
      >
        Görsel yakında eklenecek
      </div>
    );
  }

  const showCounter = media.length > 1;

  return (
    <div
      className={
        variant === "scroll" ? "flex h-full min-h-0 flex-col" : "space-y-3"
      }
    >
      <div className={`${frameClass} relative`}>
        <div
          ref={containerRef}
          className="no-scrollbar flex h-full w-full snap-x snap-mandatory overflow-x-scroll overflow-y-hidden"
          style={{ overscrollBehaviorY: "auto" }}
        >
          {media.map((item, index) => (
            <div
              key={`${item.url}-${index}`}
              className="relative h-full w-full shrink-0 snap-center snap-always"
            >
              {item.type === "video" ? (
                <CarouselVideoSlide
                  src={item.url}
                  isActive={index === currentIndex}
                />
              ) : (
                <Image
                  src={item.url}
                  alt={item.alt ?? ""}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 640px, 768px"
                  priority={index === 0}
                />
              )}
            </div>
          ))}
        </div>

        {showCounter ? (
          <div className="pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold tabular-nums text-white backdrop-blur-sm sm:right-4 sm:top-4 sm:text-sm">
            {currentIndex + 1}/{media.length}
          </div>
        ) : null}
      </div>

      {showCounter ? (
        <div
          className={`flex justify-center gap-2 ${
            variant === "scroll" ? "mt-1.5 shrink-0 sm:mt-2" : ""
          }`}
        >
          {media.map((_, dotIndex) => (
            <span
              key={dotIndex}
              className={`rounded-full transition-all duration-200 ${
                dotIndex === currentIndex
                  ? "h-2 w-6 bg-white"
                  : "h-2 w-2 bg-white/45"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** @deprecated Pass `media` prop instead */
export function PackageGalleryCarouselLegacy({
  images,
  variant = "default",
}: {
  images: string[];
  variant?: "detail" | "default" | "scroll";
}) {
  const media = images.map((url) => ({ url, type: "image" as const }));
  return <PackageGalleryCarousel media={media} variant={variant} />;
}
