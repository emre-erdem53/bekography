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

const INTRO_MIN_DISPLAY_MS = 20_000;
const HEADER_REVEAL_DELAY_MS = 480;

type IntroPhase = "intro" | "exiting" | "idle";

function resetPageScroll() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function setIntroPending(active: boolean) {
  document.documentElement.classList.toggle("packages-intro-pending", active);
  if (!active) {
    document.documentElement.classList.remove("packages-intro-exiting");
    resetPageScroll();
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
  const [canDismiss, setCanDismiss] = useState(false);
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    setMounted(true);

    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    resetPageScroll();

    if (reduceMotion) {
      setIntroPending(false);
      setPhase("idle");
      return;
    }

    setIntroPending(true);
    resetPageScroll();

    const enableTimer = window.setTimeout(() => {
      setCanDismiss(true);
    }, INTRO_MIN_DISPLAY_MS);

    return () => {
      window.clearTimeout(enableTimer);
      setIntroPending(false);
    };
  }, [reduceMotion]);

  function handleDismiss() {
    if (!canDismiss || phase !== "intro") return;
    resetPageScroll();
    setIntroExiting();
    setPhase("exiting");
  }

  function handleIntroExitComplete() {
    setPhase("idle");
    resetPageScroll();
    window.setTimeout(() => {
      setIntroPending(false);
      resetPageScroll();
    }, HEADER_REVEAL_DELAY_MS);
  }

  const showContent = phase !== "intro";

  return (
    <>
      {mounted && phase !== "idle" && !reduceMotion
        ? createPortal(
            <PackagesIntroOverlay
              phase={phase === "intro" ? "intro" : "exiting"}
              canDismiss={canDismiss}
              onDismiss={handleDismiss}
              onExitComplete={handleIntroExitComplete}
            />,
            document.body,
          )
        : null}

      <motion.div
        data-packages-page
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
