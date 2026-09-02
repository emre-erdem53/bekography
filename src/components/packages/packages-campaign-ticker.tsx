"use client";

import { PACKAGES_CAMPAIGNS } from "@/components/packages/packages-intro-overlay";

const TICKER_SEPARATOR = "   ◆   ";

function TickerSegment({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <span
      className="packages-ticker-segment packages-campaign-pulse shrink-0 whitespace-nowrap px-8 text-[11px] font-semibold tracking-wide sm:text-xs"
      aria-hidden={duplicate || undefined}
    >
      {PACKAGES_CAMPAIGNS.map((campaign, index) => (
        <span key={campaign}>
          {index > 0 ? TICKER_SEPARATOR : null}
          {campaign}
        </span>
      ))}
      {TICKER_SEPARATOR}
    </span>
  );
}

/** Paketler sayfasında header çizgisinin hemen altında kayan kampanya bandı. */
export function PackagesCampaignTicker() {
  return (
    <div
      className="relative overflow-hidden border-b border-white/10 bg-black/95"
      aria-label="Kampanyalar"
    >
      <div className="packages-ticker-viewport py-2">
        <div className="packages-ticker-track">
          <TickerSegment />
          <TickerSegment duplicate />
        </div>
      </div>
    </div>
  );
}
