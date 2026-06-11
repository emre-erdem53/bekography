"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { EASE_OUT, duration } from "@/lib/motion";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
  /** Varsayılan 0.2; uzun bölümlerde mobilde görünmez kalabiliyor — başlık için "some" kullanın. */
  viewportAmount?: number | "some" | "all";
  viewportMargin?: string;
};

export function Reveal({
  children,
  className,
  delay = 0,
  y = 32,
  once = true,
  viewportAmount = 0.2,
  viewportMargin = "-12% 0px -8% 0px",
}: RevealProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduce ? undefined : { opacity: 0, y }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once, margin: viewportMargin, amount: viewportAmount }}
      transition={{
        duration: reduce ? 0.01 : duration.reveal,
        delay: reduce ? 0 : delay,
        ease: EASE_OUT,
      }}
    >
      {children}
    </motion.div>
  );
}

type StaggerProps = {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delayChildren?: number;
};

export function Stagger({
  children,
  className,
  stagger = 0.08,
  delayChildren = 0,
}: StaggerProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-10% 0px", amount: 0.15 }}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: reduce ? 0 : stagger,
            delayChildren: reduce ? 0 : delayChildren,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

type StaggerItemProps = {
  children: ReactNode;
  className?: string;
  y?: number;
};

export function StaggerItem({ children, className, y = 24 }: StaggerItemProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: reduce ? 1 : 0, y: reduce ? 0 : y },
        show: {
          opacity: 1,
          y: 0,
          transition: {
            duration: reduce ? 0.01 : 0.55,
            ease: EASE_OUT,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

type LineRevealProps = {
  className?: string;
};

export function LineReveal({ className }: LineRevealProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduce ? undefined : { scaleX: 0 }}
      whileInView={reduce ? undefined : { scaleX: 1 }}
      viewport={{ once: true, margin: "-5%" }}
      transition={{
        duration: reduce ? 0.01 : 1.1,
        ease: EASE_OUT,
      }}
      style={{ transformOrigin: "left center" }}
    />
  );
}
