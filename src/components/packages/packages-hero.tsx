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

const pageMainClass = "flex-1 bg-black pt-24 pb-10 text-white";
const sectionClass = "scroll-mt-24 bg-black pb-6 text-white";

type PackagesHeroProps = {
  /** Hizmet alanı listesi modu: kartlar gösterilir. */
  serviceAreas?: ServiceAreaData[];
  /** Tek hizmet alanı modu: o alanın paket accordion'u gösterilir. */
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
  const [expandedPackageId, setExpandedPackageId] = useState<string | null>(
    null,
  );
  const [detailPackage, setDetailPackage] = useState<PackageData | null>(null);
  const [detailShootType, setDetailShootType] = useState<ShootTypeData | null>(
    null,
  );

  const isSingleServiceArea = Boolean(serviceArea);

  function handleTogglePackage(packageId: string) {
    setExpandedPackageId((current) =>
      current === packageId ? null : packageId,
    );
  }

  function handleSelectShootType(pkg: PackageData, shootType: ShootTypeData) {
    setDetailPackage(pkg);
    setDetailShootType(shootType);
  }

  function handleCloseDetail() {
    setDetailPackage(null);
    setDetailShootType(null);
  }

  const heading = isSingleServiceArea
    ? {
        eyebrow: "Paketler",
        title: serviceArea!.title,
        description:
          "Pakete tıklayın, çekim türünü seçin ve detayları inceleyin.",
      }
    : {
        eyebrow: "Paketler",
        title: "Paket Oluştur",
        description: "Bir hizmet alanı seçin, ardından paketleri inceleyin.",
      };

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
          variant === "section" ? "pb-6 pt-16" : "pb-16 pt-4"
        } ${variant === "section" && !visible ? "pointer-events-none" : ""}`}
      >
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            {heading.eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-semibold md:text-4xl lg:text-5xl">
            {heading.title}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-zinc-400">
            {heading.description}
          </p>
        </div>

        {isSingleServiceArea ? (
          <PackageAccordion
            serviceArea={serviceArea!}
            expandedPackageId={expandedPackageId}
            onTogglePackage={handleTogglePackage}
            onSelectShootType={handleSelectShootType}
          />
        ) : (
          <ServiceAreasGrid serviceAreas={serviceAreas ?? []} />
        )}
      </motion.div>

      <PackageDetailSheet
        serviceArea={serviceArea ?? null}
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

  return <main className={pageMainClass}>{inner}</main>;
}
