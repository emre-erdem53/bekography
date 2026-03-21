import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { images } from "@/lib/site-images";

export const metadata: Metadata = {
  title: "About",
  description: "The studio story — monochrome, film, and emotional storytelling.",
};

const vision = [
  {
    title: "Authenticity",
    body: "We reject the staged and the artificial. Our lens seeks the genuine imperfections that make a story uniquely yours.",
  },
  {
    title: "Raw Emotion",
    body: "Technical perfection is secondary to the feeling. We chase the breath before the laugh, the tear before it falls.",
  },
  {
    title: "High Contrast",
    body: "Our signature look. Deep blacks and piercing whites that create timeless, dramatic imagery with weight.",
  },
  {
    title: "Quietude",
    body: "In the chaos of events, we find the stillness. Our process is discreet, allowing life to unfold naturally around us.",
  },
] as const;

export default function AboutPage() {
  return (
    <main
      className="flex min-h-screen flex-col bg-[#f6f6f8] pt-24 text-slate-800 transition-colors duration-300 dark:bg-[#111121] dark:text-slate-200 md:flex-row"
      style={{ fontFamily: "var(--font-newsreader), Georgia, serif" }}
    >
      <Reveal
        className="relative h-[50vh] w-full overflow-hidden md:sticky md:top-0 md:h-screen md:w-[40%]"
        y={40}
      >
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-transparent to-[#f6f6f8]/35 dark:to-[#111121]/25" />
        <Image
          src={images.aboutPortrait}
          alt="Lead photographer monochrome portrait"
          fill
          priority
          className="object-cover grayscale brightness-90 contrast-125"
          sizes="(max-width: 768px) 100vw, 40vw"
        />
        <div className="absolute bottom-12 left-8 z-20">
          <p className="text-xs uppercase tracking-[0.5em] text-white/60">
            Lead Photographer
          </p>
          <h2 className="text-2xl font-light italic text-white">Elias Bekker</h2>
        </div>
      </Reveal>
      <section className="w-full bg-[#f6f6f8] px-8 py-16 dark:bg-[#111121] md:w-[60%] md:px-24 md:py-24">
        <div className="mx-auto max-w-2xl space-y-16">
          <Reveal className="space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-[#16169c]">
              The Studio
            </span>
            <h1 className="text-5xl font-light leading-tight text-zinc-900 dark:text-white md:text-7xl">
              BEKOGRAPHY: <br />
              <span className="font-extralight italic text-slate-500 dark:text-slate-500">
                THE STORY
              </span>
            </h1>
          </Reveal>
          <Stagger
            className="space-y-8 text-lg font-light leading-relaxed text-slate-600 dark:text-slate-400 md:text-xl"
            stagger={0.12}
          >
            <StaggerItem>
              <p>
                What began as a quiet obsession with 35mm film in a makeshift
                darkroom has evolved into a pursuit of the definitive moment.
                BEKOGRAPHY was founded on the principle that photography is not
                merely capturing what is seen, but revealing what is felt.
              </p>
            </StaggerItem>
            <StaggerItem>
              <p>
                In a world saturated with ephemeral digital snapshots, we choose
                a different path. Our aesthetic is rooted in high-contrast
                monochrome, stripping away the distraction of color to focus on
                the raw geometry of light, shadow, and human connection.
              </p>
            </StaggerItem>
            <StaggerItem>
              <p>
                Every frame is treated as a piece of curated art. We don’t just
                take photographs; we document the silent dialogues and the loud,
                unspoken emotions that define our subjects.
              </p>
            </StaggerItem>
          </Stagger>
          <Reveal className="border-t border-[#16169c]/20 pt-12" y={24}>
            <h3 className="mb-10 text-sm font-bold uppercase tracking-[0.3em] text-zinc-900 dark:text-white">
              My Vision
            </h3>
            <Stagger className="grid grid-cols-1 gap-12 md:grid-cols-2" stagger={0.1}>
              {vision.map((v) => (
                <StaggerItem key={v.title} className="space-y-4">
                  <h4 className="text-2xl italic text-[#16169c]">{v.title}</h4>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-500">
                    {v.body}
                  </p>
                </StaggerItem>
              ))}
            </Stagger>
          </Reveal>
          <Reveal
            className="flex flex-col items-start justify-between gap-8 border-t border-[#16169c]/10 pt-20 pb-12 dark:border-[#16169c]/20 md:flex-row md:items-center"
            y={20}
          >
            <div>
              <p className="mb-2 text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Next Chapter
              </p>
              <Link
                href="/portfolio"
                className="group inline-flex items-center gap-4 text-2xl text-zinc-900 transition-all duration-500 hover:text-[#16169c] dark:text-white dark:hover:text-[#7c8fd4] md:text-3xl"
              >
                Explore the Gallery
                <span className="transition-transform duration-500 group-hover:translate-x-2">
                  →
                </span>
              </Link>
            </div>
            <div className="flex gap-6">
              <a
                className="text-slate-600 transition-colors hover:text-zinc-900 dark:text-slate-500 dark:hover:text-white"
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </a>
              <a
                className="text-slate-600 transition-colors hover:text-zinc-900 dark:text-slate-500 dark:hover:text-white"
                href="https://vimeo.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Vimeo
              </a>
              <span className="cursor-default text-slate-500 dark:text-slate-600">
                Journal
              </span>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
