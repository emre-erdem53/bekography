import { Reveal } from "@/components/motion/reveal";
import { AboutBackstageGrid } from "./about-backstage-grid";

export function AboutBackstage() {
  return (
    <Reveal
      className="mt-16 border-t border-zinc-200 pt-14 dark:border-white/10 md:mt-20 md:pt-16"
      y={20}
    >
      <section aria-labelledby="about-backstage-heading">
        <p className="text-[11px] uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">
          Sahne arkası
        </p>
        <h2
          id="about-backstage-heading"
          className="mt-3 text-3xl font-light tracking-tight md:text-4xl"
        >
          Backstage
        </h2>
        <p className="mt-3 max-w-2xl text-sm font-light leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-base">
          Setten kısa kesitler; prodüksiyonun enerjisi ve detayları tek bakışta.
        </p>

        <AboutBackstageGrid />
      </section>
    </Reveal>
  );
}
