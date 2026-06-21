"use client";

import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { EASE_OUT, duration } from "@/lib/motion";

const links: {
  href: string;
  label: string;
  sectionId?: string;
}[] = [
  { href: "/", label: "Anasayfa", sectionId: "kesfet" },
  { href: "/fotograflar", label: "Fotoğraflar" },
  { href: "/videolar", label: "Videolar" },
  { href: "/paketler", label: "Paketler", sectionId: "paket-olustur" },
  { href: "/about", label: "Hakkımızda", sectionId: "hakkimizda" },
  { href: "/contact", label: "İletişim", sectionId: "iletisim" },
];

function resolveNavHref(
  href: string,
  pathname: string,
  sectionId?: string,
) {
  if (pathname === "/" && sectionId) {
    return `/#${sectionId}`;
  }
  return href;
}

const HEADER_HEIGHT = 96;

function scrollSpringConfig(speed: number, reduce: boolean | null) {
  if (reduce) {
    return { duration: 0.01 };
  }

  const stiffness = Math.min(Math.max(160 + speed * 42, 160), 980);
  const damping = Math.min(Math.max(22 + speed * 2.2, 22), 54);

  return {
    type: "spring" as const,
    stiffness,
    damping,
    mass: 0.72,
  };
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const headerY = useMotionValue(0);
  const hideOffsetRef = useRef(0);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;

    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollYRef.current;
      const speed = Math.abs(delta);
      lastScrollYRef.current = currentY;

      if (open || currentY < 40) {
        hideOffsetRef.current = 0;
        animate(headerY, 0, scrollSpringConfig(speed, reduce));
        return;
      }

      hideOffsetRef.current = Math.max(
        0,
        Math.min(HEADER_HEIGHT, hideOffsetRef.current + delta * 1.15),
      );

      animate(
        headerY,
        -hideOffsetRef.current,
        scrollSpringConfig(speed, reduce),
      );
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [headerY, open, reduce]);

  return (
    <motion.header
      className="fixed top-0 z-50 w-full border-b border-white/10 bg-zinc-950/90 backdrop-blur-md"
      style={{ y: headerY }}
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        opacity: {
          duration: reduce ? 0.01 : 0.45,
          ease: EASE_OUT,
        },
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
            className="flex items-center gap-3 transition-opacity hover:opacity-70 sm:gap-3.5"
            aria-label="bekography Ana Sayfa"
          >
            <Image
              src="/logo/logo-white.svg"
              alt=""
              width={260}
              height={58}
              className="h-7 w-auto shrink-0 md:h-9"
              priority
            />
            <span className="font-brand flex h-7 items-center text-[1.75rem] leading-none lowercase tracking-wide text-white md:h-9 md:text-[2.25rem]">
              bekography
            </span>
          </Link>
        </motion.div>
        <nav className="hidden items-center gap-12 md:flex">
          {links.map(({ href, label, sectionId }, i) => {
            const navHref = resolveNavHref(href, pathname, sectionId);
            const active =
              href === "/"
                ? pathname === "/"
                : pathname.startsWith(href);
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
                  href={navHref}
                  data-active={active ? "true" : undefined}
                  className={`nav-link text-[10px] font-bold uppercase tracking-[0.3em] transition-colors ${
                    active
                      ? "text-white"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {label}
                </Link>
              </motion.div>
            );
          })}
        </nav>
        <div className="flex items-center md:hidden">
          <motion.button
            type="button"
            className="flex h-12 w-12 items-center justify-center text-white"
            aria-expanded={open}
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
            onClick={() => setOpen((v) => !v)}
            whileTap={{ scale: 0.92 }}
          >
            <motion.span
              className="text-3xl leading-none"
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
            className="overflow-hidden border-t border-white/10 bg-zinc-950 md:hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "78dvh", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0.01 : 0.35, ease: EASE_OUT }}
          >
            <motion.div
              className="relative flex h-full flex-col gap-1 px-8 py-8"
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
              {links.map(({ href, label, sectionId }) => {
                const navHref = resolveNavHref(href, pathname, sectionId);
                return (
                <motion.div
                  key={href}
                  variants={{
                    open: { opacity: 1, x: 0 },
                    closed: { opacity: 0, x: -12 },
                  }}
                  transition={{ duration: 0.3, ease: EASE_OUT }}
                >
                  <Link
                    href={navHref}
                    className="flex min-h-[3.25rem] items-center text-2xl font-extrabold uppercase tracking-[0.18em] text-white"
                    onClick={() => setOpen(false)}
                  >
                    {label}
                  </Link>
                </motion.div>
              );
              })}
              <div className="pointer-events-none absolute bottom-6 left-8">
                <Image
                  src="/logo/logo-white.svg"
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
