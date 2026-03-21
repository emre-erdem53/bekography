"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { EASE_OUT } from "@/lib/motion";
import { images } from "@/lib/site-images";

export function HomeHero() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(
    scrollYProgress,
    [0, 1],
    [0, reduce ? 0 : 18],
  );
  const contentY = useTransform(
    scrollYProgress,
    [0, 1],
    [0, reduce ? 0 : 36],
  );
  const contentOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0.35]);

  return (
    <section
      ref={sectionRef}
      className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-black"
    >
      <motion.div className="absolute inset-0 z-0" style={{ y: imageY }}>
        <motion.div
          className="relative h-full w-full"
          initial={false}
          animate={
            reduce
              ? undefined
              : {
                  scale: [1.06, 1.1],
                }
          }
          transition={{
            duration: 22,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
        >
          <Image
            src={images.heroDunes}
            alt="Cinematic monochrome landscape"
            fill
            priority
            className="monochrome-img object-cover opacity-60"
            sizes="100vw"
          />
        </motion.div>
      </motion.div>
      <motion.div
        className="relative z-10 max-w-4xl px-4 text-center text-white"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        <motion.h1
          className="font-serif text-6xl italic leading-[1.1] tracking-[-0.02em] md:text-8xl"
          initial={reduce ? false : { opacity: 0, y: 40, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1, ease: EASE_OUT, delay: reduce ? 0 : 0.15 }}
        >
          The Art of the Frame.
        </motion.h1>
        <motion.div
          className="mt-10 flex flex-col items-center gap-6"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.7,
            ease: EASE_OUT,
            delay: reduce ? 0 : 0.45,
          }}
        >
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
          >
            <Link
              className="inline-block border border-white bg-white px-10 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-black transition-colors duration-300 hover:bg-black hover:text-white"
              href="/portfolio"
            >
              Explore Gallery
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
      <motion.div
        className="absolute bottom-12 left-1/2 z-10 -translate-x-1/2 text-white/50"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduce ? 0 : 0.9, duration: 0.5 }}
      >
        <motion.span
          className="block text-4xl font-extralight"
          animate={reduce ? undefined : { y: [0, 6, 0] }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          aria-hidden
        >
          ↓
        </motion.span>
      </motion.div>
    </section>
  );
}
