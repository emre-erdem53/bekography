"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { EASE_OUT } from "@/lib/motion";

function InstagramIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

export function FooterDark() {
  const reduce = useReducedMotion();

  const colVariants = {
    hidden: { opacity: reduce ? 1 : 0, y: reduce ? 0 : 28 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: reduce ? 0 : i * 0.12,
        duration: reduce ? 0.01 : 0.65,
        ease: EASE_OUT,
      },
    }),
  };

  return (
    <motion.footer
      className="bg-black pb-16 pt-32 text-white"
      initial={reduce ? false : { opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-5%" }}
      transition={{ duration: 0.55, ease: EASE_OUT }}
    >
      <div className="relative mx-auto max-w-[1600px] px-8 md:px-12">
        <div className="mb-32 grid grid-cols-1 items-start gap-20 md:grid-cols-3">
          <motion.div
            custom={0}
            variants={colVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-8%" }}
          >
            <div className="mb-8 flex items-center gap-4">
              <Image
                src="/logo/logo-white.svg"
                alt="bekography logo"
                width={40}
                height={40}
                className="h-10 w-10"
              />
              <h3 className="font-brand text-2xl tracking-[0.2em]">bekography</h3>
            </div>
            <p className="max-w-xs text-sm leading-relaxed tracking-tight text-gray-400">
              Her hikayeyi kurgusundan editine kadar titizlikle işleyen, butik
              ve yüksek standartlı bir üretim anlayışıyla çalışıyoruz. Işığın
              en doğru haliyle her çifte özel bir bekography imzası bırakıyoruz.
            </p>
          </motion.div>
          <motion.div
            custom={1}
            variants={colVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-8%" }}
          >
            <span className="mb-6 block text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">
              Hızlı Gezinme
            </span>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  className="transition-colors hover:text-gray-400"
                  href="/"
                >
                  Anasayfa
                </Link>
              </li>
              <li>
                <Link
                  className="transition-colors hover:text-gray-400"
                  href="/fotograflar"
                >
                  Fotoğraflar
                </Link>
              </li>
              <li>
                <Link
                  className="transition-colors hover:text-gray-400"
                  href="/videolar"
                >
                  Videolar
                </Link>
              </li>
              <li>
                <Link className="transition-colors hover:text-gray-400" href="/paketler">
                  Paketler
                </Link>
              </li>
              <li>
                <Link className="transition-colors hover:text-gray-400" href="/about">
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link className="transition-colors hover:text-gray-400" href="/contact">
                  İletişim
                </Link>
              </li>
            </ul>
          </motion.div>
          <motion.div
            custom={2}
            variants={colVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-8%" }}
          >
            <span className="mb-6 block text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">
              İletişim
            </span>
            <p className="text-sm">hello@bekography.com</p>
            <p className="text-sm text-gray-400">0546 937 04 64</p>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-gray-400">
              Yavuz Plaza, Eminettin, Menderes Blv. No:170-172 Kat:9 801,
              53020 Rize Merkez/Rize
            </p>
          </motion.div>
        </div>
        <motion.div
          className="flex flex-col items-center justify-between gap-8 border-t border-white/10 pb-8 pt-16 md:flex-row"
          initial={reduce ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: reduce ? 0 : 0.12, duration: 0.5 }}
        >
          <div className="flex gap-12">
            <motion.a
              className="transition-opacity hover:opacity-40"
              href="https://www.instagram.com/bekography/"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={reduce ? undefined : { y: -3, scale: 1.08 }}
            >
              <span className="sr-only">Instagram</span>
              <InstagramIcon />
            </motion.a>
          </div>
          <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-white/30">
            © 2026 bekography monochrome. all rights reserved.
          </p>
        </motion.div>
        <p className="pointer-events-none absolute bottom-2 left-8 text-[11px] text-white/45 md:left-12">
          Developed and Design by Emre Erdem
        </p>
      </div>
    </motion.footer>
  );
}
