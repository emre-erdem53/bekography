"use client";

import {
  CAMPAIGN_END_MARK,
  formatCampaignBody,
  PACKAGES_CAMPAIGNS,
} from "@/lib/packages-campaigns";

function TickerSegment({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <span
      className="packages-ticker-segment packages-campaign-pulse inline-flex shrink-0 items-center whitespace-nowrap px-10 text-[11px] font-semibold tracking-wide sm:px-12 sm:text-xs"
      aria-hidden={duplicate || undefined}
    >
      {PACKAGES_CAMPAIGNS.map((campaign) => (
        <span
          key={campaign}
          className="inline-flex items-center gap-10 sm:gap-14"
        >
          <span>
            {formatCampaignBody(campaign)}
            <span className="select-none px-1 text-white/35" aria-hidden>
              {" "}
              {CAMPAIGN_END_MARK}
            </span>
          </span>
        </span>
      ))}
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
