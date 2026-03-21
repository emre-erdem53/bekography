"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { EASE_OUT } from "@/lib/motion";
import { images } from "@/lib/site-images";

export function ContactPageClient() {
  const reduce = useReducedMotion();

  return (
    <>
      <main className="flex min-h-screen flex-1 flex-col bg-[#f7f7f7] pt-24 transition-colors duration-300 dark:bg-zinc-950 md:flex-row">
        <motion.section
          className="relative flex h-[50vh] w-full items-center justify-center bg-[#141414] md:h-auto md:w-1/2 md:min-h-[calc(100vh-6rem)]"
          initial={reduce ? false : { opacity: 0, x: -36 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.85, ease: EASE_OUT }}
        >
          <motion.div
            className="relative mx-auto aspect-[3/4] w-[min(100%,420px)] overflow-hidden rounded-[50%] border-4 border-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] dark:border-zinc-700 md:my-16"
            initial={reduce ? false : { opacity: 0, scale: 0.92, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{
              duration: 1,
              ease: EASE_OUT,
              delay: reduce ? 0 : 0.12,
            }}
          >
            <Image
              src={images.contactLandscape}
              alt="Black and white landscape photography"
              fill
              className="object-cover grayscale contrast-125"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/10 to-transparent"
              aria-hidden
            />
          </motion.div>
          <div className="absolute bottom-12 left-12 hidden md:block">
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/40">
              Architectural Series — 024
            </p>
          </div>
        </motion.section>
        <motion.section
          className="flex w-full items-center justify-center bg-white p-8 dark:bg-zinc-900 md:w-1/2 md:p-24 lg:p-32"
          initial={reduce ? false : { opacity: 0, x: 36 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.85,
            ease: EASE_OUT,
            delay: reduce ? 0 : 0.08,
          }}
        >
          <div className="w-full max-w-md">
            <motion.header
              className="mb-16"
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: reduce ? 0 : 0.2,
                duration: 0.6,
                ease: EASE_OUT,
              }}
            >
              <h1 className="mb-4 text-4xl font-extrabold tracking-tighter text-[#141414] dark:text-white md:text-5xl">
                LET&apos;S CREATE <br />
                TOGETHER
              </h1>
              <p className="text-sm font-light leading-relaxed text-[#141414]/60 dark:text-zinc-400">
                Currently accepting new projects for the upcoming season. Reach
                out to discuss your vision.
              </p>
            </motion.header>
            <motion.form
              className="space-y-12"
              action="#"
              method="post"
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: {
                  transition: {
                    staggerChildren: reduce ? 0 : 0.1,
                    delayChildren: reduce ? 0 : 0.28,
                  },
                },
              }}
            >
              {[
                {
                  label: "Full Name",
                  name: "name",
                  type: "text" as const,
                  placeholder: "Your Name",
                },
                {
                  label: "Email Address",
                  name: "email",
                  type: "email" as const,
                  placeholder: "hello@domain.com",
                },
              ].map((field) => (
                <motion.div
                  key={field.name}
                  className="flex flex-col"
                  variants={{
                    hidden: { opacity: reduce ? 1 : 0, y: reduce ? 0 : 14 },
                    show: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.45, ease: EASE_OUT },
                    },
                  }}
                >
                  <label className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#141414]/40 dark:text-zinc-500">
                    {field.label}
                  </label>
                  <input
                    className="border-0 border-b border-[#141414] bg-transparent py-3 text-zinc-900 outline-none transition-[border-width] focus:border-b-2 dark:border-zinc-500 dark:text-zinc-100 dark:focus:border-zinc-300"
                    placeholder={field.placeholder}
                    type={field.type}
                    name={field.name}
                  />
                </motion.div>
              ))}
              <motion.div
                className="flex flex-col"
                variants={{
                  hidden: { opacity: reduce ? 1 : 0, y: reduce ? 0 : 14 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.45, ease: EASE_OUT },
                  },
                }}
              >
                <label className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#141414]/40 dark:text-zinc-500">
                  Message
                </label>
                <textarea
                  className="resize-none border-0 border-b border-[#141414] bg-transparent py-3 text-zinc-900 outline-none transition-[border-width] focus:border-b-2 dark:border-zinc-500 dark:text-zinc-100 dark:focus:border-zinc-300"
                  placeholder="Describe your project"
                  rows={3}
                  name="message"
                />
              </motion.div>
              <motion.div
                className="pt-4"
                variants={{
                  hidden: { opacity: reduce ? 1 : 0, y: reduce ? 0 : 14 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.45, ease: EASE_OUT },
                  },
                }}
              >
                <motion.button
                  className="w-full rounded-sm bg-[#141414] py-4 px-8 text-xs font-bold uppercase tracking-[0.3em] text-white transition-all hover:opacity-90 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                  type="submit"
                  whileHover={reduce ? undefined : { scale: 1.01 }}
                  whileTap={reduce ? undefined : { scale: 0.98 }}
                >
                  Send Message
                </motion.button>
              </motion.div>
            </motion.form>
            <motion.footer
              className="mt-24 grid grid-cols-1 gap-8 border-t border-[#141414]/5 pt-12 dark:border-white/10 md:grid-cols-2"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduce ? 0 : 0.55, duration: 0.5 }}
            >
              <div>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#141414]/40 dark:text-zinc-500">
                  Direct
                </p>
                <a
                  className="mb-1 block text-xs font-medium tracking-wider text-zinc-900 hover:underline dark:text-zinc-100"
                  href="mailto:hello@bekography.com"
                >
                  hello@bekography.com
                </a>
                <p className="text-xs font-medium tracking-wider text-zinc-800 dark:text-zinc-300">
                  +1 (555) 000-0000
                </p>
              </div>
              <div>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#141414]/40 dark:text-zinc-500">
                  Connect
                </p>
                <div className="flex gap-4">
                  <a
                    className="text-xs font-medium tracking-wider text-zinc-900 transition-opacity hover:opacity-50 dark:text-zinc-200"
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    INSTAGRAM
                  </a>
                  <span className="text-[#141414]/20 dark:text-zinc-600">/</span>
                  <a
                    className="text-xs font-medium tracking-wider text-zinc-900 transition-opacity hover:opacity-50 dark:text-zinc-200"
                    href="https://behance.net"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    BEHANCE
                  </a>
                </div>
              </div>
            </motion.footer>
          </div>
        </motion.section>
      </main>
      <motion.div
        className="pointer-events-none fixed bottom-8 left-8 hidden lg:block"
        initial={reduce ? false : { opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: reduce ? 0 : 0.9, duration: 0.5 }}
      >
        <span
          className="inline-block origin-left rotate-90 text-[8px] font-bold uppercase tracking-[0.5em] text-zinc-500 dark:text-zinc-400"
          aria-hidden
        >
          EST. 2024
        </span>
      </motion.div>
    </>
  );
}
