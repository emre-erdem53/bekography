import type { ReactNode } from "react";
import type {
  PackageDetailSection,
  PackageGalleryMedia,
} from "@/lib/package-seed-data";
import { PackageGalleryCarousel } from "@/components/packages/package-gallery-carousel";
import { PackageDetailSectionsList } from "@/components/packages/package-detail-sections-list";
import { PaymentTypePrice } from "@/components/packages/payment-type-price";

type PackageOptionDetailBodyProps = {
  categoryTitle: string;
  optionLabel: string;
  highlightTags?: string[];
  cashPrice: number;
  installmentPrice: number;
  detailSections: PackageDetailSection[];
  galleryMedia?: PackageGalleryMedia[];
  showGallery?: boolean;
  actions?: ReactNode;
  sectionsEmptyMessage?: string;
  scrollHint?: string;
  sectionsTagsOnly?: boolean;
};

export function PackageOptionDetailBody({
  categoryTitle,
  optionLabel,
  highlightTags = [],
  cashPrice,
  installmentPrice,
  detailSections,
  galleryMedia = [],
  showGallery = true,
  actions,
  sectionsEmptyMessage,
  scrollHint = "Detaylar için aşağı kaydırın",
  sectionsTagsOnly = false,
}: PackageOptionDetailBodyProps) {
  return (
    <>
      <header className="mb-4 sm:mb-5">
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {categoryTitle}
        </h2>
        <p className="mt-1 text-lg font-semibold text-white/90 sm:text-xl">
          {optionLabel}
        </p>
        {highlightTags.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-2">
            {highlightTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/80 px-2.5 py-0.5 text-[11px] text-white sm:px-3 sm:py-1 sm:text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      {showGallery && galleryMedia.length > 0 ? (
        <PackageGalleryCarousel media={galleryMedia} variant="detail" />
      ) : null}

      <div className="mt-4 flex items-start gap-6 sm:mt-5 sm:gap-8">
        <PaymentTypePrice type="pesin" price={cashPrice} />
        <PaymentTypePrice type="taksitli" price={installmentPrice} />
      </div>

      {actions ? <div className="mt-4 space-y-2 sm:mt-5">{actions}</div> : null}

      {scrollHint ? (
        <p className="mt-3 text-center text-[11px] text-zinc-500 sm:text-xs">
          {scrollHint}
        </p>
      ) : null}

      <PackageDetailSectionsList
        sections={detailSections}
        emptyMessage={sectionsEmptyMessage}
        tagsOnly={sectionsTagsOnly}
      />
    </>
  );
}
