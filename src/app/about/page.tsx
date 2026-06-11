import type { Metadata } from "next";
import localFont from "next/font/local";
import { AboutGoogleReviewsSection } from "@/components/about/about-google-reviews-section";
import { AboutMediaSections } from "@/components/about/about-media-sections";
import { AboutTeamPortrait } from "@/components/about/about-team-portrait";
import { Reveal } from "@/components/motion/reveal";
import { ABOUT_TEAM_PORTRAIT_FILES } from "@/lib/about-team-media";
import { turkishUppercase } from "@/lib/turkish-text";

const operettaBold = localFont({
  src: "../../../public/fonts/operetta-18-bold.ttf",
});

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
          <p className="text-[11px] tracking-[0.35em] text-zinc-500 dark:text-zinc-400">
            {turkishUppercase("Hakkımızda")}
          </p>
          <h1 className="mt-4 text-4xl leading-tight md:text-6xl">
            <span className="font-brand lowercase">bekography</span>
          </h1>
          <h2 className="mt-4 text-4xl leading-tight md:text-5xl">
            <span
              className={`${operettaBold.className} block italic text-zinc-600 dark:text-zinc-300`}
            >
              bir isim, bir tutku, yüzlerce mutlu hikaye...
            </span>
          </h2>
          <p className="mt-6 max-w-3xl text-base font-light leading-relaxed text-zinc-600 dark:text-zinc-300 md:text-lg">
            Her hikayeyi kurgusundan editine kadar titizlikle işleyen,{" "}
            <strong>butik ve yüksek standartlı</strong> bir üretim anlayışıyla
            çalışıyoruz.{" "}
            <strong>Kalbimiz her zaman aşkın hikayesinde atıyor.</strong>
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-2">
          <Reveal className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-zinc-900" y={20}>
            <AboutTeamPortrait
              fileName={ABOUT_TEAM_PORTRAIT_FILES.kevser}
              alt="Kevser Topçu portre fotoğrafı"
              priority
            />
            <h2 className="text-2xl">Kevser Topçu</h2>
            <p className="mt-1 text-sm tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
              {turkishUppercase("Kreatif Göz & Stil Rehberi")}
            </p>
            <p className="mt-5 text-sm font-light leading-relaxed text-zinc-700 dark:text-zinc-300">
              27 Eylül 1994 Rize doğumlu Kevser Topçu, moda tasarımına olan
              tutkusunu Süleyman Demirel ve İstanbul Üniversitelerindeki akademik
              eğitimiyle profesyonel bir temele taşıdı. 2017 yılından itibaren{" "}
              <span className="font-semibold lowercase">bekography</span> fotoğraf
              ve film bünyesinde görsel sanatlarla birleştirdi.
            </p>
            <p className="mt-4 text-sm font-light leading-relaxed text-zinc-700 dark:text-zinc-300">
              Kamera arkasındaki <strong>teknik uzmanlığını</strong> tasarımcı
              gözüyle
              harmanlayan Kevser, gelinliğinizin formundan saçınızın duruşuna
              kadar her detayı titizlikle yönetir; disiplinli yaklaşımını rahat
              ve eğlenceli bir enerjiyle dengeler.
            </p>
          </Reveal>

          <Reveal className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-zinc-900" y={24}>
            <AboutTeamPortrait
              fileName={ABOUT_TEAM_PORTRAIT_FILES.bekir}
              alt="Bekir Topçu portre fotoğrafı"
            />
            <h2 className="text-2xl">Bekir Topçu</h2>
            <p className="mt-1 text-sm tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
              {turkishUppercase("Kurucu & Görsel Hikaye Anlatıcısı")}
            </p>
            <p className="mt-5 text-sm font-light leading-relaxed text-zinc-700 dark:text-zinc-300">
              15 Temmuz 1993 Rize doğumlu Bekir Topçu, görsel sanatlar
              yolculuğuna 2006 yılında profesyonel setlerde başladı. Saha
              tecrübesini Akdeniz Üniversitesi eğitimi ve Usta Öğretici unvanıyla
              birleştirerek sinematik bir bakış geliştirdi.
            </p>
            <p className="mt-4 text-sm font-light leading-relaxed text-zinc-700 dark:text-zinc-300">
              2015 yılında kurduğu{" "}
              <span className="font-semibold lowercase">bekography</span> ile hazırlık
              sürecindeki disiplinli ve mükemmeliyetçi tavrını, çekim anında
              yüksek enerji ve samimiyete dönüştürerek <strong>güçlü bir
              deneyim</strong> sunar.
            </p>
          </Reveal>
        </div>

        <AboutGoogleReviewsSection />

        <Reveal className="mt-14 rounded-3xl border border-zinc-200 bg-white p-7 dark:border-white/10 dark:bg-zinc-900 md:p-10" y={22}>
          <h3 className="text-[11px] tracking-[0.35em] text-zinc-500 dark:text-zinc-400">
            {turkishUppercase("Neden")}{" "}
            <span className="font-brand lowercase">bekography</span>
          </h3>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            <article className="rounded-2xl bg-zinc-50 p-5 dark:bg-zinc-800/70">
              <h4 className="text-sm tracking-[0.2em] text-zinc-500 dark:text-zinc-300">
                {turkishUppercase("Butik Yaklaşım")}
              </h4>
              <p className="mt-3 text-sm font-light leading-relaxed text-zinc-700 dark:text-zinc-200">
                Bizim için başarı sayılar değil, her çifte ayrılan özenin
                kalitesidir.
              </p>
            </article>
            <article className="rounded-2xl bg-zinc-50 p-5 dark:bg-zinc-800/70">
              <h4 className="text-sm tracking-[0.2em] text-zinc-500 dark:text-zinc-300">
                {turkishUppercase("Güçlü Teknik")}
              </h4>
              <p className="mt-3 text-sm font-light leading-relaxed text-zinc-700 dark:text-zinc-200">
                En iyi ekipmanları, yenilikçi teknikleri ve doğru kurguyu bir
                araya getiriyoruz.
              </p>
            </article>
            <article className="rounded-2xl bg-zinc-50 p-5 dark:bg-zinc-800/70">
              <h4 className="text-sm tracking-[0.2em] text-zinc-500 dark:text-zinc-300">
                {turkishUppercase("İmza Estetik")}
              </h4>
              <p className="mt-3 text-sm font-light leading-relaxed text-zinc-700 dark:text-zinc-200">
                Her çekimde ışığın en doğru haliyle, hikayeye özgü bir{" "}
                <span className="font-semibold lowercase">bekography</span> imzası
                oluşturuyoruz.
              </p>
            </article>
          </div>
        </Reveal>

        <AboutMediaSections />
      </section>
    </main>
  );
}
