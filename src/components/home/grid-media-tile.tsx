"use client";

import Image from "next/image";
import type { ExploreMediaItem } from "@/lib/explore-media-types";

type GridMediaTileProps = {
  item: ExploreMediaItem;
  priority?: boolean;
  videoRef: (node: HTMLVideoElement | null) => void;
};

/** Medya önceden indirildikten sonra mount edilir; placeholder yok. */
export function GridMediaTile({ item, priority, videoRef }: GridMediaTileProps) {
  return (
    <div className="absolute inset-0 [contain:layout_paint]">
      {item.type === "video" ? (
        <video
          ref={videoRef}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          src={item.src}
          poster={item.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      ) : (
        <Image
          src={item.src}
          alt={item.title}
          fill
          priority={priority}
          loading="eager"
          decoding="sync"
          unoptimized
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 33vw, 20vw"
        />
      )}
    </div>
  );
}
