import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description:
    "Kevser Topçu ve Bekir Topçu'nun biyografileriyle bekography hikayesi.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] pt-28 text-zinc-900 transition-colors duration-300 dark:bg-zinc-950 dark:text-zinc-100">
      <section className="mx-auto max-w-6xl px-6 pb-24 md:px-10">
        <Reveal className="border-b border-zinc-200 pb-12 dark:border-white/10" y={24}>
          <p className="text-[11px] uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">
            Hakkımızda
          </p>
          <h1 className="mt-4 text-4xl leading-tight md:text-6xl">
            <span className="font-brand lowercase">bekography</span>
            <span className="block text-zinc-600 dark:text-zinc-300">
              bir isim, bir tutku, bir imza
            </span>
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-zinc-600 dark:text-zinc-300 md:text-lg">
            Her hikayeyi kurgusundan editine kadar titizlikle işleyen,{" "}
            <strong>butik ve yüksek standartlı</strong> bir üretim anlayışıyla
            çalışıyoruz.{" "}
            <strong>Kalbimiz her zaman aşkın hikayesinde atıyor.</strong>
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-2">
          <Reveal className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-zinc-900" y={20}>
            <div className="mb-5 aspect-[4/5] rounded-2xl border border-dashed border-zinc-300 bg-zinc-100/70 p-5 dark:border-white/20 dark:bg-zinc-800/70">
              <div className="flex h-full items-center justify-center rounded-xl bg-white/60 text-center text-sm text-zinc-500 dark:bg-zinc-900/40 dark:text-zinc-300">
                Kevser Topçu görsel alanı
              </div>
            </div>
            <h2 className="text-2xl">Kevser Topçu</h2>
            <p className="mt-1 text-sm uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
              Kreatif Göz & Stil Rehberi
            </p>
            <p className="mt-5 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              27 Eylül 1994 Rize doğumlu Kevser Topçu, moda tasarımına olan
              tutkusunu Süleyman Demirel ve İstanbul Üniversitelerindeki akademik
              eğitimiyle profesyonel bir temele taşıdı. 2017 yılından itibaren{" "}
              <span className="font-semibold lowercase">bekography</span> fotoğraf
              ve film bünyesinde görsel sanatlarla birleştirdi.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              Kamera arkasındaki <strong>teknik uzmanlığını</strong> tasarımcı
              gözüyle
              harmanlayan Kevser, gelinliğinizin formundan saçınızın duruşuna
              kadar her detayı titizlikle yönetir; disiplinli yaklaşımını rahat
              ve eğlenceli bir enerjiyle dengeler.
            </p>
          </Reveal>

          <Reveal className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-zinc-900" y={24}>
            <div className="mb-5 aspect-[4/5] rounded-2xl border border-dashed border-zinc-300 bg-zinc-100/70 p-5 dark:border-white/20 dark:bg-zinc-800/70">
              <div className="flex h-full items-center justify-center rounded-xl bg-white/60 text-center text-sm text-zinc-500 dark:bg-zinc-900/40 dark:text-zinc-300">
                Bekir Topçu görsel alanı
              </div>
            </div>
            <h2 className="text-2xl">Bekir Topçu</h2>
            <p className="mt-1 text-sm uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
              Kurucu & Görsel Hikaye Anlatıcısı
            </p>
            <p className="mt-5 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              15 Temmuz 1993 Rize doğumlu Bekir Topçu, görsel sanatlar
              yolculuğuna 2006 yılında profesyonel setlerde başladı. Saha
              tecrübesini Akdeniz Üniversitesi eğitimi ve Usta Öğretici unvanıyla
              birleştirerek sinematik bir bakış geliştirdi.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              2015 yılında kurduğu{" "}
              <span className="font-semibold lowercase">bekography</span> ile hazırlık
              sürecindeki disiplinli ve mükemmeliyetçi tavrını, çekim anında
              yüksek enerji ve samimiyete dönüştürerek <strong>güçlü bir
              deneyim</strong> sunar.
            </p>
          </Reveal>
        </div>

        <Reveal className="mt-14 rounded-3xl border border-zinc-200 bg-white p-7 dark:border-white/10 dark:bg-zinc-900 md:p-10" y={22}>
          <h3 className="text-[11px] uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">
            Neden <span className="font-brand lowercase">bekography</span>
          </h3>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            <article className="rounded-2xl bg-zinc-50 p-5 dark:bg-zinc-800/70">
              <h4 className="text-sm uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-300">
                Butik Yaklaşım
              </h4>
              <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
                Bizim için başarı sayılar değil, her çifte ayrılan özenin
                kalitesidir.
              </p>
            </article>
            <article className="rounded-2xl bg-zinc-50 p-5 dark:bg-zinc-800/70">
              <h4 className="text-sm uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-300">
                Güçlü Teknik
              </h4>
              <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
                En iyi ekipmanları, yenilikçi teknikleri ve doğru kurguyu bir
                araya getiriyoruz.
              </p>
            </article>
            <article className="rounded-2xl bg-zinc-50 p-5 dark:bg-zinc-800/70">
              <h4 className="text-sm uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-300">
                İmza Estetik
              </h4>
              <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
                Her çekimde ışığın en doğru haliyle, hikayeye özgü bir{" "}
                <span className="font-semibold lowercase">bekography</span> imzası
                oluşturuyoruz.
              </p>
            </article>
          </div>
        </Reveal>

        <Reveal className="mt-16 border-t border-zinc-200 pt-10 dark:border-white/10" y={16}>
          <Link
            href="/fotograflar"
            className="inline-flex items-center gap-3 text-lg transition-opacity hover:opacity-70 md:text-2xl"
          >
            Galeriyi keşfet
            <span aria-hidden>→</span>
          </Link>
        </Reveal>
      </section>
    </main>
  );
}
