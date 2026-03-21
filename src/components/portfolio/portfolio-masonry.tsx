"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import Image from "next/image";
import { useMemo, useState } from "react";
import {
  type PortfolioCategory,
  portfolioItems,
} from "@/lib/site-images";
import { EASE_OUT } from "@/lib/motion";

const filters: { id: PortfolioCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "wedding", label: "Wedding" },
  { id: "portrait", label: "Portrait" },
  { id: "street", label: "Street" },
  { id: "architecture", label: "Architecture" },
];

export function PortfolioMasonry() {
  const [active, setActive] = useState<PortfolioCategory>("all");
  const reduce = useReducedMotion();

  const visible = useMemo(
    () =>
      active === "all"
        ? portfolioItems
        : portfolioItems.filter((p) => p.category === active),
    [active],
  );

  return (
    <>
      <div className="mb-24 flex flex-wrap justify-center gap-x-12 gap-y-6 border-b border-black/10 pb-8 text-[10px] font-bold uppercase tracking-[0.3em] dark:border-white/10">
        {filters.map((f) => (
          <motion.button
            key={f.id}
            type="button"
            onClick={() => setActive(f.id)}
            className={`relative ${
              active === f.id
                ? "text-black opacity-100 dark:text-white"
                : "text-black/40 opacity-40 hover:opacity-100 dark:text-white/40 dark:hover:opacity-100"
            }`}
            whileHover={reduce ? undefined : { y: -1 }}
            whileTap={reduce ? undefined : { scale: 0.97 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
          >
            {f.label}
            {active === f.id ? (
              <motion.span
                layoutId="portfolio-filter-line"
                className="absolute -bottom-1 left-0 right-0 h-px bg-black dark:bg-white"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            ) : null}
          </motion.button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          className="grid grid-cols-12 gap-16"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{ duration: reduce ? 0.01 : 0.35, ease: EASE_OUT }}
        >
          {visible.map((item, index) => (
            <motion.div
              key={item.src + item.label}
              layout
              className={`group relative overflow-hidden bg-black ${item.colClass} ${item.aspectClass}`}
              initial={reduce ? false : { opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: reduce ? 0 : index * 0.06,
                duration: 0.55,
                ease: EASE_OUT,
              }}
            >
              <motion.div
                className="relative h-full w-full"
                whileHover={reduce ? undefined : { scale: 1.04 }}
                transition={{ duration: 0.75, ease: EASE_OUT }}
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  className="monochrome-img object-cover transition-opacity duration-500 group-hover:opacity-60"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </motion.div>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-white opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <span className="mb-2 text-[10px] font-bold uppercase tracking-[0.4em]">
                  {item.label}
                </span>
                <span className="font-serif text-xl italic">{item.subtitle}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
      <motion.div
        className="mt-32 text-center"
        initial={reduce ? false : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
      >
        <motion.button
          type="button"
          className="border border-black px-12 py-5 text-[10px] font-bold uppercase tracking-[0.4em] text-black transition-colors duration-500 hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
          whileHover={reduce ? undefined : { scale: 1.03 }}
          whileTap={reduce ? undefined : { scale: 0.98 }}
        >
          Load More Works
        </motion.button>
      </motion.div>
    </>
  );
}
