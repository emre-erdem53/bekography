"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BekographyBrand } from "@/components/bekography-brand";
import {
  PACKAGES_TAGLINE,
  packagesIntroVideoUrl,
} from "@/lib/packages-campaigns";

type PackagesIntroOverlayProps = {
  phase: "intro" | "exiting";
  onDismiss: () => void;
  onExitComplete: () => void;
};

export function PackagesIntroOverlay({
  phase,
  onDismiss,
  onExitComplete,
}: PackagesIntroOverlayProps) {
  const isExiting = phase === "exiting";
  const exitStartedRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoSrc = packagesIntroVideoUrl();

  useEffect(() => {
    if (isExiting) exitStartedRef.current = true;
  }, [isExiting]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isExiting) {
      video.pause();
      return;
    }

    video.loop = true;
    const play = () => {
      void video.play().catch(() => {
        // Autoplay policies may block; muted + playsInline usually allows it.
      });
    };

    const restart = () => {
      try {
        video.currentTime = 0;
      } catch {
        // ignore seek errors
      }
      play();
    };

    video.addEventListener("ended", restart);
    play();

    return () => {
      video.removeEventListener("ended", restart);
    };
  }, [isExiting, videoSrc]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] overflow-hidden bg-black"
      initial={false}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={() => {
        if (exitStartedRef.current && isExiting) {
          onExitComplete();
        }
      }}
      aria-hidden={isExiting}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src={videoSrc}
        autoPlay
        muted
        playsInline
        loop
        preload="auto"
        aria-hidden
      />

      <div
        className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/25 to-black/70"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-[100dvh] flex-col px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))] sm:px-8 sm:pb-10 sm:pt-12">
        <motion.div
          className="mx-auto flex w-full max-w-lg flex-col items-center text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: isExiting ? 0 : 1,
            y: isExiting ? -8 : 0,
          }}
          transition={{
            duration: isExiting ? 0.55 : 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <BekographyBrand href={null} size="lg" className="justify-center" />
          </motion.div>

          <motion.p
            className="mt-4 max-w-md text-base italic leading-relaxed text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.65)] sm:mt-5 sm:text-xl sm:leading-relaxed"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.2,
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {PACKAGES_TAGLINE}
          </motion.p>
        </motion.div>

        <div className="min-h-0 flex-1" aria-hidden />

        <motion.div
          className="mx-auto flex w-full max-w-lg flex-col gap-3 sm:flex-row sm:gap-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{
            opacity: isExiting ? 0 : 1,
            y: isExiting ? 8 : 0,
          }}
          transition={{
            delay: isExiting ? 0 : 0.35,
            duration: isExiting ? 0.45 : 0.6,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <Link
            href="/kampanyalar"
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-white/35 bg-black/35 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/10 sm:text-base"
            tabIndex={isExiting ? -1 : undefined}
            onClick={(event) => {
              if (isExiting) event.preventDefault();
            }}
          >
            Kampanyalar
          </Link>
          <button
            type="button"
            onClick={onDismiss}
            disabled={isExiting}
            className="min-h-12 flex-1 rounded-2xl bg-[#93f8b6] px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-[#b8ffd0] disabled:cursor-not-allowed disabled:opacity-40 sm:text-base"
          >
            Paketler
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}

export { PACKAGES_TAGLINE } from "@/lib/packages-campaigns";
export {
  PACKAGES_CAMPAIGN_ITEMS,
  PACKAGES_CAMPAIGNS,
} from "@/lib/packages-campaigns";
