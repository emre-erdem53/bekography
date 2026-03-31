"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { LineReveal, Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { EASE_OUT } from "@/lib/motion";
import { images } from "@/lib/site-images";

const labels = [
  "Visual 01",
  "Visual 02",
  "Visual 03",
  "Visual 04",
  "Visual 05",
  "Visual 06",
] as const;

export function HomeSelectedVisuals() {
  const reduce = useReducedMotion();

  return (
    <section
      className="bg-white py-40 transition-colors duration-300 dark:bg-zinc-950"
      id="portfolio"
    >
      <div className="mx-auto max-w-7xl px-8">
        <div className="mb-32 flex flex-col justify-between gap-8 border-b border-black pb-12 dark:border-white/15 md:flex-row md:items-end">
          <Reveal className="max-w-xl" y={28}>
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-black dark:text-white">
              Archives
            </span>
            <h2 className="mt-4 font-serif text-5xl text-black dark:text-white">
              Selected Visuals
            </h2>
            <LineReveal className="mt-6 h-px w-16 bg-black dark:bg-white" />
          </Reveal>
          <Reveal className="max-w-xs" y={20} delay={0.08}>
            <p className="text-sm uppercase leading-relaxed tracking-tighter text-gray-500 dark:text-zinc-400">
              A curated collection of cinematic moments and high-contrast
              narratives.
            </p>
          </Reveal>
        </div>
        <Stagger
          className="grid grid-cols-1 gap-1 md:grid-cols-2 lg:grid-cols-3"
          stagger={0.07}
        >
          {images.grid.map((src, i) => (
            <StaggerItem key={src}>
              <motion.div
                className="group relative aspect-[3/4] overflow-hidden bg-black"
                whileHover={reduce ? undefined : { y: -4 }}
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
              >
                <motion.div
                  className="relative h-full w-full"
                  whileHover={reduce ? undefined : { scale: 1.06 }}
                  transition={{ duration: 0.85, ease: EASE_OUT }}
                >
                  <Image
                    src={src}
                    alt={labels[i]}
                    fill
                    className="monochrome-img object-cover transition-opacity duration-500 group-hover:opacity-70"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </motion.div>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white">
                    {labels[i]}
                  </span>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </Stagger>
        <Reveal className="mt-20 text-center" y={16}>
          <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.25 }}>
            <Link
              className="border-b border-black pb-2 text-[10px] font-semibold uppercase tracking-[0.4em] text-black transition-colors hover:text-gray-500 dark:border-white dark:text-white dark:hover:text-zinc-400"
              href="/fotograflar"
            >
              View All Works
            </Link>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}
