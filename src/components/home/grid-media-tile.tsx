"use client";

import Image from "next/image";
import { useInViewOnce } from "@/hooks/use-in-view-once";
import type { ExploreMediaItem } from "@/lib/explore-media-types";

type GridMediaTileProps = {
  item: ExploreMediaItem;
  eager?: boolean;
  videoRef: (node: HTMLVideoElement | null) => void;
};

/** Viewport yakınında mount; Blob görselleri doğrudan CDN'den (`unoptimized`). */
export function GridMediaTile({ item, eager, videoRef }: GridMediaTileProps) {
  const { ref, inView } = useInViewOnce({
    rootMargin: eager ? "520px 0px" : "280px 0px",
  });

  return (
    <div ref={ref} className="absolute inset-0 [contain:layout_paint]">
      {!inView ? (
        <div className="absolute inset-0 bg-zinc-900" aria-hidden />
      ) : item.type === "video" ? (
        <video
          ref={videoRef}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          src={item.src}
          poster={item.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
        />
      ) : (
        <Image
          src={item.src}
          alt={item.title}
          fill
          priority={eager}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          unoptimized
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 33vw, 20vw"
        />
      )}
    </div>
  );
}
