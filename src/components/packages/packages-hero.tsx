"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type {
  PackageData,
  ServiceAreaData,
  ShootTypeData,
} from "@/lib/package-types";
import { PackageDetailSheet } from "@/components/packages/package-detail-sheet";
import { PackageAccordion } from "@/components/packages/package-accordion";
import { ServiceAreasGrid } from "@/components/packages/service-areas-grid";
import { PackagesPageHeader } from "@/components/packages/packages-page-header";
import { PACKAGES_PAGE_MAIN_OFFSET_CLASS } from "@/lib/packages-page-layout";

const sectionClass = "scroll-mt-24 bg-black pb-6 text-white";

type PackagesHeroProps = {
  /** Hizmet alanı listesi: accordion ile paketler yerinde açılır. */
  serviceAreas?: ServiceAreaData[];
  /** Tek hizmet alanı: paketler kompakt listelenir. */
  serviceArea?: ServiceAreaData;
  variant?: "page" | "section";
  visible?: boolean;
};

export function PackagesHero({
  serviceAreas,
  serviceArea,
  variant = "page",
  visible = true,
}: PackagesHeroProps) {
  const [expandedServiceAreaId, setExpandedServiceAreaId] = useState<
    string | null
  >(null);
  const [detailServiceArea, setDetailServiceArea] =
    useState<ServiceAreaData | null>(null);
  const [detailPackage, setDetailPackage] = useState<PackageData | null>(null);
  const [detailShootType, setDetailShootType] = useState<ShootTypeData | null>(
    null,
  );

  const isSingleServiceArea = Boolean(serviceArea);
  const isPackagesListPage = variant === "page" && !isSingleServiceArea;

  function handleToggleServiceArea(serviceAreaId: string) {
    setExpandedServiceAreaId((current) =>
      current === serviceAreaId ? null : serviceAreaId,
    );
  }

  function handleSelectShootType(
    area: ServiceAreaData,
    pkg: PackageData,
    shootType: ShootTypeData,
  ) {
    setDetailServiceArea(area);
    setDetailPackage(pkg);
    setDetailShootType(shootType);
  }

  function handleSelectShootTypeSingle(
    pkg: PackageData,
    shootType: ShootTypeData,
  ) {
    if (!serviceArea) return;
    handleSelectShootType(serviceArea, pkg, shootType);
  }

  function handleCloseDetail() {
    setDetailServiceArea(null);
    setDetailPackage(null);
    setDetailShootType(null);
  }

  const activeDetailArea = detailServiceArea ?? serviceArea ?? null;

  const inner = (
    <>
      <motion.div
        initial={variant === "section" && !visible ? { opacity: 0, y: 24 } : false}
        animate={
          variant === "section"
            ? visible
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: 24 }
            : { opacity: 1, y: 0 }
        }
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={`mx-auto w-full max-w-2xl px-4 sm:max-w-3xl sm:px-6 lg:max-w-3xl ${
          variant === "section" ? "pb-6 pt-16" : "pb-16 pt-0"
        } ${variant === "section" && !visible ? "pointer-events-none" : ""}`}
      >
        {isPackagesListPage ? (
          <PackagesPageHeader />
        ) : isSingleServiceArea ? (
          <div className="text-center">
            <span className="inline-block rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
              Paketler
            </span>
            <h1 className="mt-5 text-3xl font-semibold md:text-4xl">
              {serviceArea!.title}
            </h1>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Paketler
            </p>
            <h1 className="mt-3 text-3xl font-semibold md:text-4xl lg:text-5xl">
              Paket Oluştur
            </h1>
          </div>
        )}

        {isSingleServiceArea ? (
          <PackageAccordion
            serviceArea={serviceArea!}
            onSelectShootType={handleSelectShootTypeSingle}
          />
        ) : (
          <ServiceAreasGrid
            serviceAreas={serviceAreas ?? []}
            expandedServiceAreaId={expandedServiceAreaId}
            onToggleServiceArea={handleToggleServiceArea}
            onSelectShootType={handleSelectShootType}
          />
        )}
      </motion.div>

      <PackageDetailSheet
        serviceArea={activeDetailArea}
        pkg={detailPackage}
        shootType={detailShootType}
        onClose={handleCloseDetail}
      />
    </>
  );

  if (variant === "section") {
    return (
      <section
        id="paket-olustur"
        className={sectionClass}
        aria-hidden={!visible}
      >
        {inner}
      </section>
    );
  }

  return (
    <main
      className={`flex-1 bg-black pb-10 text-white ${
        isPackagesListPage ? PACKAGES_PAGE_MAIN_OFFSET_CLASS : "pt-24"
      }`}
    >
      {inner}
    </main>
  );
}
