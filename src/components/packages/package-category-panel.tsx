"use client";

import Image from "next/image";
import type { PackageCategoryContent } from "@/lib/package-seed-data";
import type { PackageCategoryData } from "@/lib/package-types";
import { getPackageIcon } from "@/components/packages/package-icon";
import { PackagePricingTable } from "@/components/packages/package-pricing-table";

const blobBaseUrl = process.env.NEXT_PUBLIC_BLOB_BASE_URL?.replace(/\/+$/, "");

function packageMedia(fileName: string) {
  if (fileName.startsWith("http")) return fileName;
  return blobBaseUrl ? `${blobBaseUrl}/${fileName}` : `/reels/${fileName}`;
}

export function PackageCategoryPanel({
  category,
}: {
  category: PackageCategoryData;
}) {
  const content = category.content as PackageCategoryContent;
  const heroImage = category.heroImageUrl
    ? packageMedia(category.heroImageUrl)
    : null;
  const displayTitle = content.displayTitle ?? category.title;

  return (
    <div className="space-y-2.5 px-3 py-3 md:space-y-4 md:px-5 md:py-5">
      {heroImage ? (
        <div className="relative overflow-hidden rounded-2xl">
          <Image
            src={heroImage}
            alt={`${category.title} detayları`}
            width={1600}
            height={700}
            className="h-24 w-full object-cover brightness-75 md:h-44"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/40 to-black/60" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center" style={{ color: category.accentColor }}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.13em]">
                {content.tagline}
              </p>
              <h4 className="mt-1 text-5xl font-semibold leading-none md:text-7xl">
                {displayTitle}
              </h4>
            </div>
          </div>
        </div>
      ) : null}

      {content.services?.length > 0 ? (
        <div
          className="grid grid-cols-2 gap-[1px] overflow-hidden rounded-2xl md:grid-cols-4"
          style={{ backgroundColor: content.serviceGridColor }}
        >
          {content.services.map((item) => {
            const Icon = getPackageIcon(item.iconKey);
            return (
              <div
                key={item.title}
                className="px-2 py-2 text-center"
                style={{
                  backgroundColor: content.serviceGridColor,
                  color: content.serviceTextColor,
                }}
              >
                <Icon className="mx-auto h-6 w-6 md:h-7 md:w-7" />
                <p className="mt-1.5 text-xs font-bold leading-tight md:mt-2 md:text-sm">
                  {item.title}
                </p>
                <div
                  className="mt-1 space-y-px text-[10px] leading-none md:text-[11px]"
                  style={{ color: content.serviceSubTextColor }}
                >
                  {item.subLines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="space-y-2 rounded-2xl bg-black/80 p-2.5 md:space-y-3 md:p-4">
        <div>
          <h5
            className="text-center text-2xl font-bold"
            style={{ color: category.accentColor }}
          >
            {content.shootTitle ?? "Çekim"}
          </h5>
          <p className="mt-2 text-center text-[10px] leading-relaxed text-zinc-300 md:text-base">
            {content.shootDescription}
          </p>
        </div>
        <div>
          <h5
            className="text-center text-2xl font-bold"
            style={{ color: category.accentColor }}
          >
            {content.afterShootTitle ?? "Çekim Sonrası"}
          </h5>
          <p className="mt-2 text-center text-[10px] leading-relaxed text-zinc-300 md:text-base">
            {content.afterShootDescription}
          </p>
          {content.afterShootExtra ? (
            <p className="mt-2 text-center text-[10px] text-zinc-300 md:text-base">
              {content.afterShootExtra}
            </p>
          ) : null}
        </div>
      </div>

      <PackagePricingTable
        categoryTitle={category.title}
        options={category.options}
        accentColor={category.accentColor}
      />
    </div>
  );
}
