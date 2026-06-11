"use client";

import { useInViewOnce } from "@/hooks/use-in-view-once";
import { AboutBackstage } from "./about-backstage";
import { AboutEquipment } from "./about-equipment";

function BackstageBlockSkeleton() {
  return (
    <div
      className="mt-16 border-t border-zinc-200 pt-14 dark:border-white/10 md:mt-20 md:pt-16"
      aria-hidden
    >
      <div className="h-4 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
      <div className="mt-4 h-10 max-w-xs animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
      <div className="mt-3 h-14 max-w-xl animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
        {Array.from({ length: 23 }, (_, i) => (
          <div
            key={i}
            className="aspect-[9/16] animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800"
          />
        ))}
      </div>
    </div>
  );
}

function EquipmentBlockSkeleton() {
  return (
    <div
      className="mt-12 border-t border-zinc-200 pt-12 dark:border-white/10 md:mt-14 md:pt-14"
      aria-hidden
    >
      <div className="h-4 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
      <div className="mt-4 h-10 max-w-sm animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
      <div className="mt-3 h-12 max-w-xl animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
      <div className="mt-10 space-y-12">
        {Array.from({ length: 5 }, (_, row) => (
          <div key={row}>
            <div className="mb-4 h-3 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, cell) => (
                <div
                  key={cell}
                  className="aspect-[4/3] animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Backstage + ekipman: ilk yüklemede Blob isteği yok; viewport’a yaklaşınca mount, görseller satır satır yüklenir. */
export function AboutMediaSections() {
  const { ref, inView } = useInViewOnce({ rootMargin: "280px 0px" });

  return (
    <div ref={ref}>
      {inView ? (
        <>
          <AboutBackstage />
          <AboutEquipment />
        </>
      ) : (
        <>
          <BackstageBlockSkeleton />
          <EquipmentBlockSkeleton />
        </>
      )}
    </div>
  );
}
