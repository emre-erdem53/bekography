"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { EASE_OUT, duration } from "@/lib/motion";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/", label: "Anasayfa" },
  { href: "/fotograflar", label: "Fotoğraflar" },
  { href: "/videolar", label: "Videolar" },
  { href: "/paketler", label: "Paketler" },
  { href: "/about", label: "Hakkımızda" },
  { href: "/contact", label: "İletişim" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [hiddenOnScroll, setHiddenOnScroll] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    let lastY = window.scrollY;

    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastY;
      lastY = currentY;

      if (open) {
        setHiddenOnScroll(false);
        return;
      }

      if (currentY < 40) {
        setHiddenOnScroll(false);
        return;
      }

      if (delta > 6) {
        setHiddenOnScroll(true);
        return;
      }

      if (delta < -6) {
        setHiddenOnScroll(false);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [open]);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <motion.header
      className={`fixed top-0 z-50 w-full border-b backdrop-blur-md transition-colors duration-300 ${
        isDark
          ? "border-white/10 bg-zinc-950/90"
          : "border-black/5 bg-white/85"
      }`}
      initial={reduce ? false : { y: -24, opacity: 0 }}
      animate={{
        y: hiddenOnScroll ? -112 : 0,
        opacity: hiddenOnScroll ? 0.92 : 1,
      }}
      transition={{
        duration: reduce ? 0.01 : 0.42,
        ease: EASE_OUT,
      }}
    >
      <div className="relative mx-auto flex h-24 max-w-7xl items-center justify-between gap-4 px-8 md:px-10">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <Link
            href="/"
            className="block transition-opacity hover:opacity-70"
            aria-label="bekography Ana Sayfa"
          >
            <Image
              src={isDark ? "/logo/logo-white.svg" : "/logo/logo-black.svg"}
              alt="bekography"
              width={260}
              height={58}
              className="h-7 w-auto md:h-9"
              priority
            />
          </Link>
        </motion.div>
        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 md:hidden">
          <span
            className={`font-brand text-lg lowercase tracking-wide ${
              isDark ? "text-white" : "text-black"
            }`}
          >
            bekography
          </span>
        </div>
        <nav className="hidden items-center gap-12 md:flex">
          {links.map(({ href, label }, i) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <motion.div
                key={href}
                initial={reduce ? false : { opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: reduce ? 0 : 0.08 + i * 0.05,
                  duration: 0.45,
                  ease: EASE_OUT,
                }}
              >
                <Link
                  href={href}
                  data-active={active ? "true" : undefined}
                  className={`nav-link text-[10px] font-bold uppercase tracking-[0.3em] transition-colors ${
                    isDark
                      ? active
                        ? "text-white"
                        : "text-white/60 hover:text-white"
                      : active
                        ? "text-black"
                        : "text-black/50 hover:text-black"
                  }`}
                >
                  {label}
                </Link>
              </motion.div>
            );
          })}
          <ThemeToggle />
        </nav>
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <motion.button
            type="button"
            className={`flex h-10 w-10 items-center justify-center ${
              isDark ? "text-white" : "text-black"
            }`}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            whileTap={{ scale: 0.92 }}
          >
            <motion.span
              className="text-2xl leading-none"
              animate={{ rotate: open ? 90 : 0 }}
              transition={{ duration: duration.micro, ease: EASE_OUT }}
            >
              {open ? "×" : "☰"}
            </motion.span>
          </motion.button>
        </div>
      </div>
      <AnimatePresence>
        {open ? (
          <motion.div
            className={`overflow-hidden border-t md:hidden ${
              isDark
                ? "border-white/10 bg-zinc-950"
                : "border-black/10 bg-white"
            }`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "78dvh", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0.01 : 0.35, ease: EASE_OUT }}
          >
            <motion.div
              className="relative flex h-full flex-col gap-7 px-8 py-10"
              initial="closed"
              animate="open"
              exit="closed"
              variants={{
                open: {
                  transition: {
                    staggerChildren: reduce ? 0 : 0.06,
                    delayChildren: 0.04,
                  },
                },
                closed: {},
              }}
            >
              {links.map(({ href, label }) => (
                <motion.div
                  key={href}
                  variants={{
                    open: { opacity: 1, x: 0 },
                    closed: { opacity: 0, x: -12 },
                  }}
                  transition={{ duration: 0.3, ease: EASE_OUT }}
                >
                  <Link
                    href={href}
                    className={`block text-lg font-extrabold uppercase tracking-[0.22em] ${
                      isDark ? "text-white" : "text-black"
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    {label}
                  </Link>
                </motion.div>
              ))}
              <div className="pointer-events-none absolute bottom-6 left-8">
                <Image
                  src={isDark ? "/logo/logo-white.svg" : "/logo/logo-black.svg"}
                  alt="bekography"
                  width={80}
                  height={20}
                  className="h-5 w-auto opacity-80"
                />
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
}
