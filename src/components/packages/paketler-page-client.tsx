"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import type { ServiceAreaData } from "@/lib/package-types";
import { PackagesHero } from "@/components/packages/packages-hero";
import {
  PACKAGES_TAGLINE,
  PackagesIntroOverlay,
} from "@/components/packages/packages-intro-overlay";

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
  const searchParams = useSearchParams();
  const skipIntro =
    reduceMotion ||
    searchParams.get("intro") === "0" ||
    searchParams.get("skipIntro") === "1";

  const [phase, setPhase] = useState<IntroPhase>(skipIntro ? "idle" : "intro");
  const [mounted, setMounted] = useState(false);
  const phaseRef = useRef(phase);

  phaseRef.current = phase;

  function dismissIntro() {
    if (phaseRef.current !== "intro") return;
    resetPageScroll();
    setIntroExiting();
    setPhase("exiting");
  }

  useLayoutEffect(() => {
    setMounted(true);

    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    resetPageScroll();

    if (skipIntro) {
      setIntroPending(false);
      setPhase("idle");
      return;
    }

    setIntroPending(true);
    resetPageScroll();

    return () => {
      setIntroPending(false);
    };
  }, [skipIntro]);

  function handleDismiss() {
    dismissIntro();
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
      {mounted && phase !== "idle" && !skipIntro
        ? createPortal(
            <PackagesIntroOverlay
              phase={phase === "intro" ? "intro" : "exiting"}
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
