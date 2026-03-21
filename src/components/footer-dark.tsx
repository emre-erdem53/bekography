"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { EASE_OUT } from "@/lib/motion";

function InstagramIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function BehanceIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M22 14.455c-.013-.852-.132-1.603-.357-2.259-.227-.654-.545-1.203-.956-1.645-.411-.444-.906-.777-1.485-.996-.579-.221-1.243-.332-1.993-.332-.775 0-1.467.121-2.077.362-.61.242-1.127.581-1.551 1.018-.424.438-.75 1.002-.977 1.692-.229.69-.344 1.503-.344 2.438 0 .91.11 1.711.328 2.404s.548 1.267.99 1.721c.441.455.981.797 1.618 1.026.637.228 1.365.342 2.183.342.923 0 1.727-.14 2.414-.421.688-.28 1.258-.691 1.713-1.231.454-.541.777-1.194.97-1.958.192-.764.282-1.62.269-2.561zm-4.786 3.193c-.452 0-.841-.073-1.164-.22-.323-.146-.593-.362-.808-.646-.216-.285-.373-.637-.474-1.056-.101-.419-.151-.902-.151-1.449h3.834c0 .547-.031 1.012-.094 1.393-.061.381-.177.697-.348.948-.17.252-.401.443-.69.573-.289.131-.659.197-1.109.197zm.671-5.631h-2.902c.046-.39.141-.715.286-.975.143-.261.322-.468.536-.622.215-.154.46-.264.733-.33.272-.066.565-.098.877-.098.358 0 .668.043.929.13.262.086.48.214.654.382.176.168.303.38.381.637.079.256.115.558.106.906zm-10.435 7.15c.613 0 1.156-.076 1.631-.229.475-.152.883-.393 1.226-.723s.607-.745.795-1.248c.188-.501.282-1.107.282-1.815 0-.742-.119-1.378-.358-1.906-.239-.529-.589-.958-1.052-1.287-.461-.328-1.031-.555-1.708-.682v-.047c.54-.108 1-.303 1.379-.586.379-.283.682-.642.909-1.077.227-.435.341-.951.341-1.547 0-.528-.088-1.002-.266-1.423-.177-.42-.444-.775-.801-1.065s-.804-.512-1.34-.666c-.537-.154-1.166-.231-1.888-.231h-5.467v14.128h5.618zm-2.883-11.758h2.046c.414 0 .779.039 1.096.116s.583.197.8.361c.217.164.383.376.5.636.115.261.173.578.173.953 0 .402-.065.733-.195.992-.129.259-.313.468-.553.626s-.527.272-.862.342c-.334.071-.704.105-1.109.105h-1.9v-4.131zm0 9.382v-4.129h2.388c.417 0 .802.043 1.155.131.353.087.656.229.907.424.252.196.446.456.585.779s.208.729.208 1.218c0 .484-.071.896-.214 1.236-.143.34-.349.619-.619.836s-.599.379-.988.486c-.389.107-.833.161-1.332.161h-2.09zM16.32 8.019h5.118v1.134H16.32V8.019z" />
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
      <div className="mx-auto max-w-[1600px] px-8 md:px-12">
        <div className="mb-32 grid grid-cols-1 items-start gap-20 md:grid-cols-3">
          <motion.div
            custom={0}
            variants={colVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-8%" }}
          >
            <h3 className="mb-8 text-2xl font-black tracking-[0.2em]">
              BEKOGRAPHY
            </h3>
            <p className="max-w-xs text-sm uppercase leading-relaxed tracking-tighter text-gray-400">
              Exploring the silent beauty of the world through a monochrome
              lens. Based in London, available worldwide.
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
              Navigation
            </span>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  className="transition-colors hover:text-gray-400"
                  href="/portfolio"
                >
                  Archive
                </Link>
              </li>
              <li>
                <span className="cursor-default text-white/50">Exhibitions</span>
              </li>
              <li>
                <span className="cursor-default text-white/50">
                  Fine Art Prints
                </span>
              </li>
              <li>
                <span className="cursor-default text-white/50">
                  Studio Journal
                </span>
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
              Inquiries
            </span>
            <p className="text-sm">hello@bekography.com</p>
            <p className="text-sm text-gray-400">+44 (0) 20 7946 0123</p>
          </motion.div>
        </div>
        <motion.div
          className="flex flex-col items-center justify-between gap-8 border-t border-white/10 pt-16 md:flex-row"
          initial={reduce ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: reduce ? 0 : 0.12, duration: 0.5 }}
        >
          <div className="flex gap-12">
            <motion.a
              className="transition-opacity hover:opacity-40"
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={reduce ? undefined : { y: -3, scale: 1.08 }}
            >
              <span className="sr-only">Instagram</span>
              <InstagramIcon />
            </motion.a>
            <motion.a
              className="transition-opacity hover:opacity-40"
              href="https://behance.net"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={reduce ? undefined : { y: -3, scale: 1.08 }}
            >
              <span className="sr-only">Behance</span>
              <BehanceIcon />
            </motion.a>
          </div>
          <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-white/30">
            © 2024 BEKOGRAPHY MONOCHROME. ALL RIGHTS RESERVED.
          </p>
        </motion.div>
      </div>
    </motion.footer>
  );
}
