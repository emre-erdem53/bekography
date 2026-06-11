"use client";

import { Play } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { useInViewOnce } from "@/hooks/use-in-view-once";
import {
  BACKSTAGE_VIDEO_FILES,
  getBackstagePosterSrc,
  getBackstageVideoSrc,
} from "@/lib/backstage-media";

function BackstageFacade({
  file,
  index,
  onPlay,
}: {
  file: string;
  index: number;
  onPlay: () => void;
}) {
  const [posterFailed, setPosterFailed] = useState(false);
  const posterSrc = getBackstagePosterSrc(file);
  const { ref: viewportRef, inView } = useInViewOnce({
    rootMargin: "100px 0px",
  });

  return (
    <div
      ref={viewportRef}
      className="relative aspect-[9/16] w-full bg-zinc-900"
    >
      <div
        className="absolute inset-0 bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-950"
        aria-hidden
      />
      {inView && !posterFailed ? (
        <Image
          src={posterSrc}
          alt=""
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
          loading="lazy"
          decoding="async"
          unoptimized
          className="object-cover"
          onError={() => {
            if (process.env.NODE_ENV === "development") {
              console.warn(
                "[Backstage] Önizleme yüklenemedi (Blob’da dosya adı / uzantı kontrol edin):",
                posterSrc,
              );
            }
            setPosterFailed(true);
          }}
        />
      ) : null}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20"
        aria-hidden
      />
      <button
        type="button"
        onClick={onPlay}
        className="absolute inset-0 z-10 flex items-center justify-center text-white transition-opacity hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
        aria-label={`Backstage ${index + 1} videosunu oynat`}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/35 ring-1 ring-white/30 backdrop-blur-sm md:h-14 md:w-14">
          <Play
            className="ml-0.5 h-6 w-6 md:h-7 md:w-7"
            fill="currentColor"
            aria-hidden
          />
        </span>
      </button>
    </div>
  );
}

export function AboutBackstageGrid() {
  const [playing, setPlaying] = useState<Record<number, true>>({});

  const activate = useCallback((index: number) => {
    setPlaying((prev) => (prev[index] ? prev : { ...prev, [index]: true }));
  }, []);

  return (
    <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
      {BACKSTAGE_VIDEO_FILES.map((file, index) => {
        const isOn = playing[index];

        return (
          <figure
            key={file}
            className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-950 shadow-sm transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-md [contain:layout] dark:border-white/10 dark:shadow-none dark:hover:shadow-lg dark:hover:shadow-black/30"
          >
            {isOn ? (
              <div className="relative aspect-[9/16] w-full bg-zinc-900">
                <video
                  src={getBackstageVideoSrc(file)}
                  controls
                  playsInline
                  preload="none"
                  autoPlay
                  className="h-full w-full object-cover"
                  aria-label={`Backstage görüntüsü ${index + 1}`}
                />
              </div>
            ) : (
              <BackstageFacade
                file={file}
                index={index}
                onPlay={() => activate(index)}
              />
            )}
          </figure>
        );
      })}
    </div>
  );
}
