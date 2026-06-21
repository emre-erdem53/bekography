"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MapPin, Phone } from "lucide-react";
import Image from "next/image";
import { BekographyMap } from "@/components/maps/bekography-map";
import { ABOUT_TEAM_PORTRAIT_FILES, getAboutTeamPortraitSrc } from "@/lib/about-team-media";
import { EASE_OUT } from "@/lib/motion";
import {
  BEKOGRAPHY_ADDRESS,
  BEKOGRAPHY_INSTAGRAM_URL,
  BEKOGRAPHY_MAPS_SHORT_URL,
  BEKOGRAPHY_PHONE_DISPLAY,
  BEKOGRAPHY_PHONE_TEL,
} from "@/lib/site-location";
import { turkishUppercase } from "@/lib/turkish-text";

export function ContactPageClient({
  variant = "page",
}: {
  variant?: "page" | "section";
}) {
  const reduce = useReducedMotion();
  const whatsappNumber = "905469370464";
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=Merhaba%20Bekography%2C%20bilgi%20almak%20istiyorum.`;
  const contactImage = getAboutTeamPortraitSrc(
    ABOUT_TEAM_PORTRAIT_FILES.bekirContact,
  );

  const Tag = variant === "section" ? "section" : "main";
  const outerClass =
    variant === "section"
      ? "scroll-mt-24 flex flex-col bg-[#f7f7f7] transition-colors duration-300 dark:bg-zinc-950 md:flex-row"
      : "flex min-h-screen flex-1 flex-col bg-[#f7f7f7] pt-24 transition-colors duration-300 dark:bg-zinc-950 md:flex-row";

  return (
    <Tag id={variant === "section" ? "iletisim" : undefined} className={outerClass}>
        <motion.section
          className={`relative w-full overflow-hidden bg-[#141414] ${
            variant === "section"
              ? "h-[46vh] md:h-auto md:min-h-[640px] md:w-[54%]"
              : "h-[46vh] md:h-auto md:w-[54%] md:min-h-[calc(100vh-6rem)]"
          }`}
          initial={reduce ? false : { opacity: 0, x: -36 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.85, ease: EASE_OUT }}
        >
          <motion.div
            className="absolute inset-0"
            initial={reduce ? false : { opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 1,
              ease: EASE_OUT,
              delay: reduce ? 0 : 0.12,
            }}
          >
            <Image
              src={contactImage}
              alt="Bekir Topçu portre fotoğrafı"
              fill
              unoptimized
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 54vw"
              priority
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"
              aria-hidden
            />
          </motion.div>
          <div className="absolute bottom-8 left-8 z-10 md:bottom-12 md:left-12">
            <p className="text-[10px] tracking-[0.4em] text-white/50">
              {turkishUppercase("Rize'den Tüm Dünyaya")}
            </p>
          </div>
        </motion.section>
        <motion.section
          className="flex w-full items-center justify-center bg-white p-8 dark:bg-zinc-900 md:w-[46%] md:p-16 lg:p-20 2xl:p-24"
          initial={reduce ? false : { opacity: 0, x: 36 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.85,
            ease: EASE_OUT,
            delay: reduce ? 0 : 0.08,
          }}
        >
          <div className="w-full max-w-md lg:max-w-lg 2xl:max-w-xl">
            <motion.header
              className="mb-12"
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: reduce ? 0 : 0.2,
                duration: 0.6,
                ease: EASE_OUT,
              }}
            >
              <h1 className="mb-4 text-3xl font-extrabold tracking-tighter text-[#141414] dark:text-white md:text-4xl lg:text-5xl">
                Bekir Topçu ile iletişime geçebilirsiniz
              </h1>
              <p className="text-sm font-light leading-relaxed text-[#141414]/60 dark:text-zinc-400">
                İlk görüşmeden itibaren çalışmanızı teslim alana kadar olan tüm
                süreçte sadece bizzat Bekir Topçu ile iletişimde olmanın
                rahatlığını ve güvenini yaşarsınız.
              </p>
            </motion.header>
            <motion.div
              className="space-y-4"
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
              <motion.div
                variants={{
                  hidden: { opacity: reduce ? 1 : 0, y: reduce ? 0 : 14 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.45, ease: EASE_OUT },
                  },
                }}
              >
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#25d366] px-5 py-4 text-sm font-semibold text-black transition-opacity hover:opacity-90"
                >
                  <Image
                    src="/whatsapp.svg"
                    alt=""
                    width={24}
                    height={24}
                    loading="eager"
                    className="h-6 w-6 brightness-0 invert"
                    aria-hidden
                  />
                  Whatsapp
                </a>
              </motion.div>
              <motion.div
                variants={{
                  hidden: { opacity: reduce ? 1 : 0, y: reduce ? 0 : 14 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.45, ease: EASE_OUT },
                  },
                }}
              >
                <a
                  href={`tel:${BEKOGRAPHY_PHONE_TEL}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#141414] px-5 py-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-black"
                >
                  <Phone className="h-6 w-6" strokeWidth={1.75} />
                  Ara
                </a>
              </motion.div>
              <motion.div
                variants={{
                  hidden: { opacity: reduce ? 1 : 0, y: reduce ? 0 : 14 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.45, ease: EASE_OUT },
                  },
                }}
              >
                <a
                  href={BEKOGRAPHY_INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] px-5 py-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  <Image
                    src="/instagram.svg"
                    alt=""
                    width={24}
                    height={24}
                    loading="eager"
                    className="h-6 w-6"
                    aria-hidden
                  />
                  Instagram
                </a>
              </motion.div>
              <motion.div
                variants={{
                  hidden: { opacity: reduce ? 1 : 0, y: reduce ? 0 : 14 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.45, ease: EASE_OUT },
                  },
                }}
              >
                <a
                  href={BEKOGRAPHY_MAPS_SHORT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#141414]/20 bg-white px-5 py-4 text-sm font-semibold text-[#141414] transition-colors hover:bg-zinc-100 dark:border-white/20 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-800"
                >
                  <MapPin className="h-6 w-6" strokeWidth={1.75} />
                  Adrese Git
                </a>
              </motion.div>
            </motion.div>
            <motion.div
              className="mt-6 overflow-hidden rounded-2xl border border-black/10 bg-zinc-50 dark:border-white/10 dark:bg-zinc-800"
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : 0.38, duration: 0.55, ease: EASE_OUT }}
            >
              <div className="space-y-4 px-5 py-4 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                <div>
                  <p className="mb-2 text-[10px] font-bold tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
                    {turkishUppercase("Telefon")}
                  </p>
                  <a
                    href={`tel:${BEKOGRAPHY_PHONE_TEL}`}
                    className="text-sm font-medium tracking-wide text-zinc-900 hover:underline dark:text-zinc-100"
                  >
                    {BEKOGRAPHY_PHONE_DISPLAY}
                  </a>
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-bold tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
                    {turkishUppercase("Açık Adres")}
                  </p>
                  <a
                    href={BEKOGRAPHY_MAPS_SHORT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-opacity hover:opacity-80"
                  >
                    {BEKOGRAPHY_ADDRESS}
                  </a>
                </div>
              </div>
              <div className="aspect-[16/10] w-full border-t border-black/10 dark:border-white/10">
                <BekographyMap className="h-full w-full" />
              </div>
            </motion.div>
          </div>
        </motion.section>
    </Tag>
  );
}
