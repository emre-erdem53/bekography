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

export const PACKAGES_CAMPAIGN_ITEMS = [
  {
    id: "extra-package",
    title: "Ek Paket Kampanyası",
    body: SECOND_PACKAGE_DISCOUNT_NOTE,
  },
  {
    id: "winter",
    title: "Kış Kampanyası",
    body: SEASONAL_CAMPAIGN_NOTE,
  },
] as const;

export const PACKAGES_CAMPAIGNS = PACKAGES_CAMPAIGN_ITEMS.map(
  (campaign) => campaign.body,
);

function formatCampaignBody(body: string) {
  return body.replace(/^\.\s*/, "");
}

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
      <div className="flex min-h-[100dvh] flex-col justify-between px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-14 sm:pt-16">
        <motion.header
          className="flex shrink-0 flex-col items-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: isExiting ? 0 : 1,
            y: isExiting ? -8 : 0,
          }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <BekographyBrand href={null} size="sm" className="justify-center" />
          <p className="mt-4 max-w-sm text-base italic leading-relaxed text-white sm:mt-5 sm:text-lg">
            {PACKAGES_TAGLINE}
          </p>
        </motion.header>

        <motion.div
          className="flex shrink-0 flex-col items-center justify-center py-4 sm:py-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{
            opacity: isExiting ? 0 : 1,
            y: isExiting ? -6 : 0,
          }}
          transition={{
            delay: 0.18,
            duration: 0.75,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <ul className="w-full max-w-md space-y-6 sm:space-y-8">
            {PACKAGES_CAMPAIGN_ITEMS.map((campaign, index) => (
              <motion.li
                key={campaign.id}
                className="text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.28 + index * 0.12,
                  duration: 0.65,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-500 sm:mb-3 sm:text-[11px]">
                  {campaign.title}
                </p>
                <p className="packages-campaign-pulse text-sm font-semibold leading-snug sm:text-base">
                  {formatCampaignBody(campaign.body)}
                </p>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <motion.footer
          className="sticky bottom-0 z-10 mx-auto w-full max-w-md shrink-0 bg-black pt-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: isExiting ? 0 : 1,
            y: isExiting ? 8 : 0,
          }}
          transition={{
            delay: isExiting ? 0 : 0.52,
            duration: 0.65,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div className="mx-auto mb-6 h-px w-12 bg-white/20 sm:mb-7" />
          <button
            type="button"
            onClick={onDismiss}
            disabled={isExiting}
            className="w-full rounded-2xl bg-[#93f8b6] px-6 py-3.5 text-sm font-semibold text-black transition-opacity hover:bg-[#b8ffd0] disabled:cursor-not-allowed disabled:opacity-40 sm:text-base"
          >
            Paketleri Gör
          </button>
        </motion.footer>
      </div>
    </motion.div>
  );
}
