"use client";

import { useLayoutEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { createPortal } from "react-dom";
import type { ServiceAreaData } from "@/lib/package-types";
import { PackagesHero } from "@/components/packages/packages-hero";
import {
  PACKAGES_TAGLINE,
  PackagesIntroOverlay,
} from "@/components/packages/packages-intro-overlay";

const INTRO_HOLD_MS = 2800;
const HEADER_REVEAL_DELAY_MS = 480;

type IntroPhase = "intro" | "exiting" | "idle";

function setIntroPending(active: boolean) {
  document.documentElement.classList.toggle("packages-intro-pending", active);
  if (!active) {
    document.documentElement.classList.remove("packages-intro-exiting");
  }
  document.body.style.overflow = active ? "hidden" : "";
}

function setIntroExiting() {
  document.documentElement.classList.add("packages-intro-exiting");
}

type PaketlerPageClientProps = {
  serviceAreas: ServiceAreaData[];
};

export function PaketlerPageClient({ serviceAreas }: PaketlerPageClientProps) {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<IntroPhase>(
    reduceMotion ? "idle" : "intro",
  );
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    setMounted(true);

    if (reduceMotion) {
      setIntroPending(false);
      setPhase("idle");
      return;
    }

    setIntroPending(true);

    const holdTimer = window.setTimeout(() => {
      setIntroExiting();
      setPhase("exiting");
    }, INTRO_HOLD_MS);

    return () => {
      window.clearTimeout(holdTimer);
      setIntroPending(false);
    };
  }, [reduceMotion]);

  function handleIntroExitComplete() {
    setPhase("idle");
    window.setTimeout(() => {
      setIntroPending(false);
    }, HEADER_REVEAL_DELAY_MS);
  }

  const showContent = phase !== "intro";

  return (
    <>
      {mounted && phase !== "idle" && !reduceMotion
        ? createPortal(
            <PackagesIntroOverlay
              phase={phase === "intro" ? "intro" : "exiting"}
              onExitComplete={handleIntroExitComplete}
            />,
            document.body,
          )
        : null}

      <motion.div
        data-packages-page
        className="min-h-full"
        initial={false}
        animate={{
          opacity: showContent ? 1 : 0,
        }}
        transition={{
          duration: phase === "exiting" ? 0.65 : 0,
          delay: phase === "exiting" ? 0.08 : 0,
          ease: [0.22, 1, 0.36, 1],
        }}
        aria-hidden={!showContent}
      >
        <PackagesHero serviceAreas={serviceAreas} variant="page" />
      </motion.div>
    </>
  );
}

export { PACKAGES_TAGLINE };
