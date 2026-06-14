"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type PackageGalleryCarouselProps = {
  images: string[];
  variant?: "detail" | "default";
};

export function PackageGalleryCarousel({
  images,
  variant = "default",
}: PackageGalleryCarouselProps) {
  const [index, setIndex] = useState(0);

  const frameClass =
    variant === "detail"
      ? "relative aspect-[4/5] max-h-[38vh] w-full overflow-hidden rounded-3xl bg-[#111] md:aspect-[16/10] md:max-h-[280px] lg:max-h-[320px]"
      : "relative aspect-[4/5] overflow-hidden rounded-3xl bg-[#111]";

  if (images.length === 0) {
    return (
      <div
        className={`flex items-center justify-center rounded-3xl bg-[#1a1a1a] text-sm text-zinc-500 ${
          variant === "detail"
            ? "aspect-[4/5] max-h-[38vh] md:aspect-[16/10] md:max-h-[280px]"
            : "aspect-[4/5]"
        }`}
      >
        Görsel yakında eklenecek
      </div>
    );
  }

  const current = images[index] ?? images[0];

  return (
    <div className="space-y-3">
      <div className={frameClass}>
        <Image
          src={current}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 640px, 768px"
          priority
        />
        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() =>
                setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
              }
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-white"
              aria-label="Önceki görsel"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() =>
                setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
              }
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-white"
              aria-label="Sonraki görsel"
            >
              ›
            </button>
          </>
        ) : null}
      </div>
      {images.length > 1 ? (
        <div className="flex justify-center gap-2">
          {images.map((_, dotIndex) => (
            <button
              key={dotIndex}
              type="button"
              onClick={() => setIndex(dotIndex)}
              className={`h-2 w-2 rounded-full ${
                dotIndex === index ? "bg-white" : "bg-white/30"
              }`}
              aria-label={`Görsel ${dotIndex + 1}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
