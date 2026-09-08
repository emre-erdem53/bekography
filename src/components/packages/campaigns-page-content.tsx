import localFont from "next/font/local";
import Link from "next/link";
import {
  formatCampaignBody,
  PACKAGES_CAMPAIGN_ITEMS,
  PACKAGES_TAGLINE,
} from "@/lib/packages-campaigns";
import { turkishUppercase } from "@/lib/turkish-text";

const operettaBold = localFont({
  src: "../../../public/fonts/operetta-18-bold.ttf",
});

export function CampaignsPageContent() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(147,248,182,0.12),_transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(255,255,255,0.06),_transparent_50%)]"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col px-6 pb-20 pt-28 sm:px-8 sm:pt-32">
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-zinc-500">
          {turkishUppercase("Kampanyalar")}
        </p>
        <h1
          className={`${operettaBold.className} mt-4 text-4xl italic leading-tight text-white sm:text-5xl`}
        >
          Şu anki fırsatlar
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
          {PACKAGES_TAGLINE}
        </p>

        <ul className="mt-12 space-y-6 sm:mt-14 sm:space-y-8">
          {PACKAGES_CAMPAIGN_ITEMS.map((campaign) => (
            <li
              key={campaign.id}
              className="border-t border-white/10 pt-6 first:border-t-0 first:pt-0 sm:pt-8"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#93f8b6]/sm:text-xs">
                {campaign.title}
              </p>
              <p className="mt-3 text-xl font-semibold leading-snug text-white sm:text-2xl">
                {formatCampaignBody(campaign.body)}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-14 sm:mt-16">
          <Link
            href="/paketler?intro=0"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#93f8b6] px-8 py-3.5 text-sm font-semibold text-black transition hover:bg-[#b8ffd0] sm:text-base"
          >
            Paketler
          </Link>
        </div>
      </div>
    </main>
  );
}
