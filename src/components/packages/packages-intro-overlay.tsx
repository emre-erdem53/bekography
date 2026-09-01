"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { BekographyBrand } from "@/components/bekography-brand";

export const PACKAGES_TAGLINE =
  "Her an yanınızda olan profesyonel bir çiftle çalışmanın konforunu yaşayın.";

type PackagesIntroOverlayProps = {
  phase: "intro" | "exiting";
  onExitComplete: () => void;
};

export function PackagesIntroOverlay({
  phase,
  onExitComplete,
}: PackagesIntroOverlayProps) {
  const isExiting = phase === "exiting";
  const exitStartedRef = useRef(false);

  useEffect(() => {
    if (isExiting) exitStartedRef.current = true;
  }, [isExiting]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black px-6"
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
      <motion.div
        className="flex max-w-md flex-col items-center text-center"
        initial={{ opacity: 0, y: 14 }}
        animate={{
          opacity: isExiting ? 0 : 1,
          y: isExiting ? -10 : 0,
          scale: isExiting ? 0.98 : 1,
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
          <BekographyBrand href={null} size="md" className="justify-center" />
        </motion.div>

        <motion.p
          className="mt-10 text-lg italic leading-relaxed text-white sm:text-xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.28,
            duration: 0.75,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {PACKAGES_TAGLINE}
        </motion.p>

        <motion.div
          className="mt-8 h-px w-12 bg-white/20"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.75, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
      </motion.div>
    </motion.div>
  );
}
