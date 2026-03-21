import type { Metadata } from "next";
import { FooterDark } from "@/components/footer-dark";
import { PortfolioMasonry } from "@/components/portfolio/portfolio-masonry";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Portfolio Collections",
  description: "Visual narratives — wedding, portrait, street, architecture.",
};

export default function PortfolioPage() {
  return (
    <>
      <main className="flex-1 bg-white pb-32 pt-40 transition-colors duration-300 dark:bg-zinc-950">
        <div className="mx-auto max-w-[1600px] px-8 md:px-12">
          <Reveal className="mb-20 text-center" y={20}>
            <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-black/40 dark:text-white/40">
              Collections
            </span>
            <h1 className="mt-6 font-serif text-5xl italic text-black dark:text-white md:text-7xl">
              Visual Narratives
            </h1>
          </Reveal>
          <PortfolioMasonry />
        </div>
      </main>
      <FooterDark />
    </>
  );
}
