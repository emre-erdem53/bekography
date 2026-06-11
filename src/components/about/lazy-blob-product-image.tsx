"use client";

import Image from "next/image";
import { useInViewOnce } from "@/hooks/use-in-view-once";

type LazyBlobProductImageProps = {
  src: string;
  alt: string;
  sizes: string;
  imgClassName: string;
};

export function LazyBlobProductImage({
  src,
  alt,
  sizes,
  imgClassName,
}: LazyBlobProductImageProps) {
  const { ref, inView } = useInViewOnce({ rootMargin: "140px 0px" });

  return (
    <div ref={ref} className="absolute inset-0">
      {inView ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          loading="lazy"
          decoding="async"
          className={imgClassName}
        />
      ) : (
        <div
          className="absolute inset-0 animate-pulse bg-zinc-200/70 dark:bg-zinc-700/50"
          aria-hidden
        />
      )}
    </div>
  );
}
