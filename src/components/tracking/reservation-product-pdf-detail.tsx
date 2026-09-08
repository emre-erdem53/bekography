import type { ReservationProductSnapshot } from "@/lib/reservation-product-snapshot";
import { PackageOptionDetailBody } from "@/components/packages/package-option-detail-body";

function resolveHeroImageUrl(product: ReservationProductSnapshot): string | null {
  const firstImage = product.galleryMedia.find((item) => item.type !== "video");
  if (firstImage?.url) return firstImage.url;
  if (product.previewImageUrl) return product.previewImageUrl;
  return null;
}

function resolveHeroVideoUrl(product: ReservationProductSnapshot): string | null {
  if (product.previewVideoUrl) return product.previewVideoUrl;
  const firstVideo = product.galleryMedia.find((item) => item.type === "video");
  return firstVideo?.url ?? null;
}

/** Rezervasyon PDF'inde ürün detay sayfasının statik karşılığı. */
export function ReservationProductPdfDetail({
  product,
}: {
  product: ReservationProductSnapshot;
}) {
  const sections = [...(product.detailSections ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  const heroImageUrl = resolveHeroImageUrl(product);
  const heroVideoUrl = heroImageUrl ? null : resolveHeroVideoUrl(product);

  return (
    <article className="rounded-2xl border border-white/15 bg-[#0a0a0a] p-5 sm:p-6">
      {heroImageUrl ? (
        <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-[#111]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImageUrl}
            alt=""
            decoding="sync"
            loading="eager"
            className="h-full w-full object-cover"
            data-pdf-image="true"
          />
        </div>
      ) : heroVideoUrl ? (
        <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-[#111]">
          <video
            src={heroVideoUrl}
            muted
            playsInline
            preload="auto"
            crossOrigin="anonymous"
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}

      <div className={heroImageUrl || heroVideoUrl ? "mt-5 sm:mt-6" : ""}>
        <PackageOptionDetailBody
          serviceAreaTitle={product.serviceAreaTitle}
          packageTitle={product.packageTitle}
          packageTags={product.packageTags}
          serviceAreaSlug={product.serviceAreaSlug}
          shootTypeLabel={product.shootTypeLabelRaw || product.shootTypeLabel}
          highlightTags={product.highlightTags}
          cashPrice={product.cashPrice}
          installmentPrice={product.installmentPrice}
          detailSections={sections}
          galleryMedia={[]}
          showGallery={false}
          scrollHint=""
          sectionsEmptyMessage="Bu ürün için kayıtlı detay metni bulunmuyor."
          sectionsTagsOnly={false}
        />
      </div>
    </article>
  );
}
