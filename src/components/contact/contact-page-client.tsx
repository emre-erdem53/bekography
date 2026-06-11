"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MapPin, Phone } from "lucide-react";
import Image from "next/image";
import { ABOUT_TEAM_PORTRAIT_FILES, getAboutTeamPortraitSrc } from "@/lib/about-team-media";
import { EASE_OUT } from "@/lib/motion";
import { turkishUppercase } from "@/lib/turkish-text";

export function ContactPageClient() {
  const reduce = useReducedMotion();
  const phoneDisplay = "0546 937 04 64";
  const phoneTel = "+905469370464";
  const whatsappNumber = "905469370464";
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=Merhaba%20Bekography%2C%20bilgi%20almak%20istiyorum.`;
  const address =
    "Yavuz Plaza, Eminettin, Menderes Blv. No:170-172 Kat:9 801, 53020 Rize Merkez/Rize";
  const mapsQuery = encodeURIComponent(address);
  const mapsLink = `https://maps.google.com/?q=${mapsQuery}`;
  const mapsEmbedSrc = `https://maps.google.com/maps?q=${mapsQuery}&z=16&output=embed`;
  const contactImage = getAboutTeamPortraitSrc(ABOUT_TEAM_PORTRAIT_FILES.bekir);

  return (
    <>
      <main className="flex min-h-screen flex-1 flex-col bg-[#f7f7f7] pt-24 transition-colors duration-300 dark:bg-zinc-950 md:flex-row">
        <motion.section
          className="relative flex h-[46vh] w-full items-center justify-center bg-[#141414] md:h-auto md:w-[54%] md:min-h-[calc(100vh-6rem)]"
          initial={reduce ? false : { opacity: 0, x: -36 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.85, ease: EASE_OUT }}
        >
          <motion.div
            className="relative mx-auto aspect-[3/4] h-[40vh] w-auto max-w-[82vw] overflow-hidden rounded-[50%] border-4 border-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] dark:border-zinc-700 md:my-16 md:h-auto md:w-[min(100%,420px)] md:max-w-none lg:w-[min(100%,520px)] 2xl:w-[min(100%,620px)]"
            initial={reduce ? false : { opacity: 0, scale: 0.92, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
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
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/10 to-transparent"
              aria-hidden
            />
          </motion.div>
          <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12">
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
                  href={`tel:${phoneTel}`}
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
                  href={mapsLink}
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
                    href={`tel:${phoneTel}`}
                    className="text-sm font-medium tracking-wide text-zinc-900 hover:underline dark:text-zinc-100"
                  >
                    {phoneDisplay}
                  </a>
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-bold tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
                    {turkishUppercase("Açık Adres")}
                  </p>
                  <p>{address}</p>
                </div>
              </div>
              <div className="aspect-[16/10] w-full border-t border-black/10 dark:border-white/10">
                <iframe
                  title="bekography ofis konumu"
                  src={mapsEmbedSrc}
                  className="h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </motion.div>
            <motion.footer
              className="mt-16 border-t border-[#141414]/5 pt-10 dark:border-white/10"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduce ? 0 : 0.55, duration: 0.5 }}
            >
              <p className="mb-3 text-[10px] font-bold tracking-[0.2em] text-[#141414]/40 dark:text-zinc-500">
                {turkishUppercase("Sosyal")}
              </p>
              <a
                className="text-xs font-medium tracking-wider text-zinc-900 transition-opacity hover:opacity-50 dark:text-zinc-200"
                href="https://www.instagram.com/bekography/"
                target="_blank"
                rel="noopener noreferrer"
              >
                INSTAGRAM
              </a>
            </motion.footer>
          </div>
        </motion.section>
      </main>
    </>
  );
}
