"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { EASE_OUT } from "@/lib/motion";
import { images } from "@/lib/site-images";

export function HomeCreator() {
  const reduce = useReducedMotion();

  return (
    <section className="bg-black py-40 text-white" id="about">
      <div className="mx-auto max-w-7xl px-8">
        <div className="flex flex-col items-center gap-20 md:flex-row lg:gap-32">
          <Reveal className="w-full md:w-1/2" y={36}>
            <div className="relative">
              <motion.div
                className="relative z-10 overflow-hidden"
                initial={reduce ? false : { clipPath: "inset(8% 8% 8% 8%)" }}
                whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 1.15, ease: EASE_OUT }}
              >
                <Image
                  src={images.leadPhotographer}
                  alt="Lead photographer"
                  width={800}
                  height={1000}
                  className="w-full grayscale monochrome-img"
                />
              </motion.div>
              <motion.div
                className="absolute -bottom-8 -right-8 -z-10 h-full w-full border border-white/20"
                initial={reduce ? false : { opacity: 0, x: 16, y: 16 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.85, ease: EASE_OUT, delay: 0.2 }}
              />
            </div>
          </Reveal>
          <div className="w-full space-y-10 md:w-1/2">
            <Reveal y={24}>
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white">
                The Creator
              </span>
              <h2 className="mt-4 font-serif text-5xl leading-[1.2]">
                A dialogue between light and shadow.
              </h2>
            </Reveal>
            <Stagger className="space-y-6 text-lg font-light leading-relaxed text-gray-400" stagger={0.12}>
              <StaggerItem>
                <p>
                  BEKOGRAPHY is a studio dedicated to the purity of monochrome.
                  We strip away the noise of color to find the resonance of
                  emotion and the architecture of light.
                </p>
              </StaggerItem>
              <StaggerItem>
                <p>
                  Our philosophy is rooted in cinematic storytelling. Every
                  project is an exploration of high-contrast narratives and
                  timeless aesthetics that transcend the digital age.
                </p>
              </StaggerItem>
            </Stagger>
            <Reveal y={16} delay={0.05}>
              <div className="pt-8 invert filter">
                <Image
                  src={images.signature}
                  alt="Signature"
                  width={200}
                  height={64}
                  className="h-16 w-auto opacity-100"
                />
              </div>
              <motion.div
                className="mt-6"
                whileHover={{ x: 4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Link
                  href="/about"
                  className="inline-block text-[10px] font-bold uppercase tracking-[0.3em] text-white/80 underline-offset-4 hover:text-white hover:underline"
                >
                  Our story
                </Link>
              </motion.div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
