"use client";

import Image from "next/image";

type CartItemThumbnailProps = {
  imageUrl: string | null;
  videoUrl: string | null;
  className?: string;
};

export function CartItemThumbnail({
  imageUrl,
  videoUrl,
  className = "relative aspect-square w-12 shrink-0 overflow-hidden rounded-lg bg-[#1a1a1a] sm:w-14",
}: CartItemThumbnailProps) {
  if (imageUrl) {
    return (
      <div className={className}>
        <Image
          src={imageUrl}
          alt=""
          fill
          className="object-cover"
          sizes="56px"
        />
      </div>
    );
  }

  if (videoUrl) {
    return (
      <div className={className}>
        <video
          src={videoUrl}
          muted
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
          aria-hidden
        />
      </div>
    );
  }

  return (
    <div
      className={`${className} flex items-center justify-center text-[10px] text-zinc-600`}
    >
      —
    </div>
  );
}
