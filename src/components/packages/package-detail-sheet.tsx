"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import type {
  PackageData,
  ServiceAreaData,
  ShootTypeData,
} from "@/lib/package-types";
import { getShootTypeGalleryMedia } from "@/lib/package-media";
import { getShootTypeDetailSections } from "@/lib/package-detail-section";
import { PackageOptionDetailBody } from "@/components/packages/package-option-detail-body";
import { BekographyBrand } from "@/components/bekography-brand";
import { PackageCartToggleButton } from "@/components/packages/package-cart-toggle-button";
import {
  buildCartItemFromShootType,
  type CartItemInput,
} from "@/stores/cart-store";
import { getCompanionRequirementMessage } from "@/lib/cart-companion-rules";
import { RequestModal } from "@/components/packages/request-modal";
import {
  RequestActionLabel,
  requestActionSurfaceClassFull,
} from "@/components/packages/request-action-label";
import { useCartBottomInset } from "@/components/packages/package-cart-bar";

type PackageDetailSheetProps = {
  serviceArea: ServiceAreaData | null;
  pkg: PackageData | null;
  shootType: ShootTypeData | null;
  onClose: () => void;
  presentation?: "overlay" | "inline";
};

function ShootTypeDetailView({
  serviceArea,
  pkg,
  shootType,
  onQuickRequest,
  quickRequestDisabled,
}: {
  serviceArea: ServiceAreaData;
  pkg: PackageData;
  shootType: ShootTypeData;
  onQuickRequest: () => void;
  quickRequestDisabled: boolean;
}) {
  const cartBottomInset = useCartBottomInset();
  const galleryMedia = getShootTypeGalleryMedia(shootType);
  const sections = getShootTypeDetailSections(shootType);

  return (
    <div
      className={`mx-auto w-full max-w-lg px-4 pt-2 sm:px-6 ${
        cartBottomInset ??
        "pb-[max(env(safe-area-inset-bottom),1.5rem)] sm:pb-8"
      }`}
    >
      <PackageOptionDetailBody
        serviceAreaTitle={serviceArea.title}
        packageTitle={pkg.title}
        packageTags={pkg.tags}
        serviceAreaSlug={serviceArea.slug}
        shootTypeLabel={shootType.label}
        highlightTags={shootType.tags}
        cashPrice={shootType.cashPrice}
        installmentPrice={shootType.installmentPrice}
        detailSections={sections}
        galleryMedia={galleryMedia}
        showGallery
        actions={
          <>
            <PackageCartToggleButton
              serviceArea={serviceArea}
              pkg={pkg}
              shootType={shootType}
            />
            <button
              type="button"
              onClick={onQuickRequest}
              disabled={quickRequestDisabled}
              className={`${requestActionSurfaceClassFull} min-h-11 rounded-2xl border border-white/25 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-12 sm:py-3.5 sm:text-sm`}
            >
              <RequestActionLabel iconVariant="brand">
                Hemen Talep Oluştur
              </RequestActionLabel>
            </button>
            {quickRequestDisabled ? (
              <p className="text-center text-[11px] leading-relaxed text-amber-200/80 sm:text-xs">
                {getCompanionRequirementMessage()}
              </p>
            ) : null}
          </>
        }
      />
    </div>
  );
}

export function PackageDetailSheet({
  serviceArea,
  pkg,
  shootType,
  onClose,
  presentation = "overlay",
}: PackageDetailSheetProps) {
  const [requestOpen, setRequestOpen] = useState(false);
  const [singleRequestItems, setSingleRequestItems] = useState<CartItemInput[]>(
    [],
  );

  useEffect(() => {
    if (!shootType) return;
    setRequestOpen(false);
    setSingleRequestItems([]);
    if (presentation !== "overlay") return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [shootType?.id, presentation]);

  const shellClass =
    presentation === "inline"
      ? "relative w-full"
      : "fixed inset-0 z-[70] flex flex-col bg-black";

  const quickRequestDisabled = Boolean(serviceArea?.isCompanionOnly);

  const backHref = "/paketler";

  const content =
    serviceArea && pkg && shootType ? (
      <>
        <header
          className={
            presentation === "inline"
              ? "shrink-0 border-b border-white/10 px-4 pb-3 pt-1 sm:px-6"
              : "shrink-0 border-b border-white/10 px-4 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)] sm:px-6"
          }
        >
          <div className="flex items-center justify-between gap-3">
            <Link
              href={backHref}
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
              aria-label="Paketlere dön"
            >
              <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
              Paketler
            </Link>
            <BekographyBrand size="sm" className="hover:opacity-100" />
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <ShootTypeDetailView
            serviceArea={serviceArea}
            pkg={pkg}
            shootType={shootType}
            quickRequestDisabled={quickRequestDisabled}
            onQuickRequest={() => {
              if (quickRequestDisabled) return;
              setSingleRequestItems([
                buildCartItemFromShootType(serviceArea, pkg, shootType),
              ]);
              setRequestOpen(true);
            }}
          />
        </div>
      </>
    ) : null;

  return (
    <>
      {presentation === "inline" ? (
        content
      ) : (
        <LayoutGroup id="package-detail-overlay">
          <AnimatePresence>
            {serviceArea && pkg && shootType ? (
              <motion.div
                key={shootType.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={shellClass}
              >
                {content}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </LayoutGroup>
      )}

      <RequestModal
        open={requestOpen}
        onClose={() => {
          setRequestOpen(false);
          setSingleRequestItems([]);
        }}
        itemsOverride={
          singleRequestItems.length > 0 ? singleRequestItems : undefined
        }
      />
    </>
  );
}
