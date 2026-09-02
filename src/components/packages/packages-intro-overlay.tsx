"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { BekographyBrand } from "@/components/bekography-brand";
import {
  SECOND_PACKAGE_DISCOUNT_NOTE,
  SEASONAL_CAMPAIGN_NOTE,
} from "@/lib/cart-bundle-discount";

export const PACKAGES_TAGLINE =
  "Her an yanınızda olan profesyonel bir çiftle çalışmanın konforunu yaşayın.";

export const PACKAGES_CAMPAIGNS = [
  SECOND_PACKAGE_DISCOUNT_NOTE,
  SEASONAL_CAMPAIGN_NOTE,
] as const;

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

  useEffect(() => {
    if (isExiting) exitStartedRef.current = true;
  }, [isExiting]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] overflow-y-auto bg-black"
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
      <div className="flex min-h-full items-center justify-center px-6 py-10">
        <motion.div
          className="flex w-full max-w-md flex-col items-center text-center"
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
            className="mt-8 text-lg italic leading-relaxed text-white sm:mt-10 sm:text-xl"
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

          <motion.ul
            className="mt-6 space-y-3 sm:mt-7"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.45,
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {PACKAGES_CAMPAIGNS.map((campaign, index) => (
              <motion.li
                key={campaign}
                className="packages-campaign-pulse text-sm font-semibold leading-snug sm:text-base"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.52 + index * 0.1,
                  duration: 0.65,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {campaign}
              </motion.li>
            ))}
          </motion.ul>

          <motion.div
            className="mt-7 h-px w-12 bg-white/20 sm:mt-8"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.75, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          />

          <motion.div
            className="mt-7 w-full sm:mt-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.82,
              duration: 0.65,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <button
              type="button"
              onClick={onDismiss}
              disabled={isExiting}
              className="w-full rounded-2xl bg-[#93f8b6] px-6 py-3.5 text-sm font-semibold text-black transition-opacity hover:bg-[#b8ffd0] disabled:cursor-not-allowed disabled:opacity-40 sm:text-base"
            >
              Paketleri Gör
            </button>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
