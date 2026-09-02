"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type {
  PackageData,
  ServiceAreaData,
  ShootTypeData,
} from "@/lib/package-types";
import { seedServiceAreas } from "@/lib/package-seed-data";
import {
  isCustomPackageIcon,
  PackageIconDisplay,
} from "@/components/packages/package-icon";
import { PackageAccordion } from "@/components/packages/package-accordion";

const DEFAULT_SERVICE_AREA_SUBTITLES = Object.fromEntries(
  seedServiceAreas
    .filter((area) => area.content.subtitle?.trim())
    .map((area) => [area.slug, area.content.subtitle!.trim()]),
) as Record<string, string>;

function resolveServiceAreaSubtitle(serviceArea: ServiceAreaData) {
  const fromContent = serviceArea.content.subtitle?.trim() ?? "";
  if (fromContent) return fromContent;
  return DEFAULT_SERVICE_AREA_SUBTITLES[serviceArea.slug] ?? "";
}

function isRasterServiceAreaIcon(iconKey: string) {
  return (
    isCustomPackageIcon(iconKey) && !iconKey.toLowerCase().endsWith(".svg")
  );
}

/** `/paketler` ve anasayfa: hizmet alanları accordion. */
export function ServiceAreasGrid({
  serviceAreas,
  expandedServiceAreaId,
  onToggleServiceArea,
  onSelectShootType,
}: {
  serviceAreas: ServiceAreaData[];
  expandedServiceAreaId: string | null;
  onToggleServiceArea: (
    serviceAreaId: string,
    cardElement: HTMLElement,
  ) => void;
  onSelectShootType: (
    serviceArea: ServiceAreaData,
    pkg: PackageData,
    shootType: ShootTypeData,
  ) => void;
}) {
  if (serviceAreas.length === 0) {
    return (
      <p className="mt-8 text-center text-sm text-zinc-500">
        Şu anda görüntülenecek bir hizmet alanı yok.
      </p>
    );
  }

  return (
    <div className="mt-2.5 flex w-full flex-col gap-2.5 [overflow-anchor:none] sm:mt-3 sm:gap-3">
      {serviceAreas.map((serviceArea) => {
        const isOpen = expandedServiceAreaId === serviceArea.id;
        const subtitle = resolveServiceAreaSubtitle(serviceArea);
        const usesPhotoIcon = isRasterServiceAreaIcon(serviceArea.iconKey);

        return (
          <div
            key={serviceArea.id}
            data-service-area-card
            className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] [overflow-anchor:none]"
          >
            <button
              type="button"
              onClick={(event) =>
                onToggleServiceArea(
                  serviceArea.id,
                  event.currentTarget.closest("[data-service-area-card]") as
                    | HTMLElement
                    | null ?? event.currentTarget,
                )
              }
              aria-expanded={isOpen}
              className="group flex min-h-12 w-full min-w-0 items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-[#111] active:bg-[#141414] sm:min-h-14 sm:gap-4 sm:px-5 sm:py-3"
            >
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl sm:h-14 sm:w-14"
                style={
                  usesPhotoIcon
                    ? undefined
                    : { backgroundColor: `${serviceArea.accentColor}22` }
                }
              >
                <PackageIconDisplay
                  iconKey={serviceArea.iconKey}
                  className={
                    usesPhotoIcon
                      ? "h-full w-full rounded-2xl object-cover"
                      : "h-8 w-8 sm:h-9 sm:w-9"
                  }
                  style={{ color: serviceArea.accentColor }}
                  imageSizes={usesPhotoIcon ? "64px" : "36px"}
                />
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className="block truncate text-2xl font-semibold leading-none sm:text-3xl md:text-4xl"
                  style={{ color: serviceArea.accentColor }}
                >
                  {serviceArea.title}
                </span>
                {subtitle ? (
                  <span className="mt-0.5 block truncate text-xs italic leading-tight text-zinc-500 sm:text-sm">
                    {subtitle}
                  </span>
                ) : null}
              </span>

              <ChevronDown
                className={`h-5 w-5 shrink-0 text-zinc-500 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
                aria-hidden
              />
            </button>

            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                  className="overflow-hidden [overflow-anchor:none]"
                >
                  <div className="border-t border-white/10 px-2.5 pb-3 pt-2 sm:px-3 sm:pb-3.5">
                    <PackageAccordion
                      serviceArea={serviceArea}
                      onSelectShootType={(pkg, shootType) =>
                        onSelectShootType(serviceArea, pkg, shootType)
                      }
                      nested
                    />
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
