"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { isVideoMediaUrl } from "@/lib/package-media";

type CartItemThumbnailProps = {
  imageUrl: string | null;
  videoUrl: string | null;
  className?: string;
};

const defaultClassName =
  "relative aspect-square w-12 shrink-0 overflow-hidden rounded-lg bg-[#1a1a1a] sm:w-14";

function VideoPosterFrame({
  src,
  className,
}: {
  src: string;
  className: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    function primeFrame() {
      if (!video || !video.duration && video.readyState < 2) return;
      const target = Number.isFinite(video.duration)
        ? Math.min(0.25, video.duration * 0.02)
        : 0.1;
      try {
        video.currentTime = target;
      } catch {
        // ignore seek errors on some mobile browsers
      }
    }

    video.addEventListener("loadeddata", primeFrame);
    video.addEventListener("loadedmetadata", primeFrame);

    if (video.readyState >= 2) {
      primeFrame();
    }

    return () => {
      video.removeEventListener("loadeddata", primeFrame);
      video.removeEventListener("loadedmetadata", primeFrame);
    };
  }, [src]);

  if (failed) {
    return (
      <div
        className={`${className} flex items-center justify-center text-[10px] text-zinc-600`}
      >
        —
      </div>
    );
  }

  return (
    <div className={className}>
      <video
        ref={videoRef}
        src={src}
        muted
        playsInline
        preload="auto"
        aria-hidden
        onError={() => setFailed(true)}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}

export function CartItemThumbnail({
  imageUrl,
  videoUrl,
  className = defaultClassName,
}: CartItemThumbnailProps) {
  const resolvedVideoUrl =
    videoUrl ?? (imageUrl && isVideoMediaUrl(imageUrl) ? imageUrl : null);
  const resolvedImageUrl =
    imageUrl && !isVideoMediaUrl(imageUrl) ? imageUrl : null;

  if (resolvedImageUrl) {
    return (
      <div className={className}>
        <Image
          src={resolvedImageUrl}
          alt=""
          fill
          className="object-cover"
          sizes="56px"
        />
      </div>
    );
  }

  if (resolvedVideoUrl) {
    return <VideoPosterFrame src={resolvedVideoUrl} className={className} />;
  }

  return (
    <div
      className={`${className} flex items-center justify-center text-[10px] text-zinc-600`}
    >
      —
    </div>
  );
}
