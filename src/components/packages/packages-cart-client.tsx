"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import type {
  PackageData,
  ServiceAreaData,
  ShootTypeData,
} from "@/lib/package-types";
import { useCartStore, getCartItemDiscountPrices } from "@/stores/cart-store";
import {
  getCartTotalsWithDiscount,
  SECOND_PACKAGE_DISCOUNT_NOTE,
} from "@/lib/cart-bundle-discount";
import { formatPrice } from "@/lib/constants";
import {
  getShootTypeGalleryPreviewMedia,
  isVideoMediaUrl,
} from "@/lib/package-media";
import { findShootTypeContext } from "@/lib/shoot-type-context";
import { PaymentTypePrice } from "@/components/packages/payment-type-price";
import { PackageDetailSheet } from "@/components/packages/package-detail-sheet";
import { CartItemThumbnail } from "@/components/packages/cart-item-thumbnail";

const contentWidth =
  "mx-auto w-full max-w-2xl px-4 sm:max-w-3xl sm:px-6 lg:max-w-4xl xl:max-w-5xl";

type PackagesCartClientProps = {
  serviceAreas: ServiceAreaData[];
};

export function PackagesCartClient({ serviceAreas }: PackagesCartClientProps) {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const toggleSelected = useCartStore((state) => state.toggleSelected);
  const selectAll = useCartStore((state) => state.selectAll);
  const clearCart = useCartStore((state) => state.clearCart);
  const [detailServiceArea, setDetailServiceArea] =
    useState<ServiceAreaData | null>(null);
  const [detailPackage, setDetailPackage] = useState<PackageData | null>(null);
  const [detailShootType, setDetailShootType] = useState<ShootTypeData | null>(
    null,
  );

  const allSelected = items.length > 0 && items.every((item) => item.selected);

  const cartTotals = useMemo(() => {
    const selected = items.filter((item) => item.selected);
    const discountItems = selected.map((item) => ({
      cashPrice: item.cashPrice,
      installmentPrice: item.installmentPrice,
      scheduleType: item.scheduleType,
      areaSlug: item.serviceAreaSlug,
      isCompanionOnly: item.isCompanionOnly,
    }));
    const totals = getCartTotalsWithDiscount(discountItems);

    return {
      cash: totals.cash,
      installment: totals.installment,
      selectedCount: selected.length,
      discountAppliedCount: totals.discountAppliedCount,
    };
  }, [items]);

  function openItemDetail(shootTypeId: string) {
    const context = findShootTypeContext(serviceAreas, shootTypeId);
    if (!context) return;
    setDetailServiceArea(context.serviceArea);
    setDetailPackage(context.package);
    setDetailShootType(context.shootType);
  }

  function getItemPreviewMedia(shootTypeId: string, storedUrl: string | null) {
    const context = findShootTypeContext(serviceAreas, shootTypeId);
    if (context) {
      const preview = getShootTypeGalleryPreviewMedia(context.shootType);
      if (preview) return preview;
    }
    if (storedUrl) {
      return {
        url: storedUrl,
        type: isVideoMediaUrl(storedUrl) ? ("video" as const) : ("image" as const),
      };
    }
    return null;
  }

  return (
    <main className="flex-1 bg-black pt-24 pb-28 text-white">
      <section className={`${contentWidth} pb-16 pt-4`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link
              href="/paketler"
              className="text-sm text-zinc-400 hover:text-white"
            >
              ← Paketler
            </Link>
            <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Sepetim</h1>
          </div>
          {items.length > 0 ? (
            <div className="flex shrink-0 items-center gap-4">
              <button
                type="button"
                onClick={() => selectAll(!allSelected)}
                className="text-sm text-zinc-400 hover:text-white"
              >
                {allSelected ? "Seçimi Kaldır" : "Tümünü Seç"}
              </button>
              <button
                type="button"
                onClick={clearCart}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Tümünü Sil
              </button>
            </div>
          ) : null}
        </div>

        {items.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-white/10 bg-[#0a0a0a] p-8 text-center">
            <p className="text-zinc-400">Sepetiniz boş.</p>
            <Link
              href="/paketler"
              className="mt-4 inline-block rounded-2xl bg-white px-5 py-2.5 text-sm font-semibold text-black"
            >
              Paketlere Git
            </Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
            {items.map((item) => {
              const preview = getItemPreviewMedia(
                item.shootTypeId,
                item.imageUrl,
              );
              const effective = getCartItemDiscountPrices(item, items);

              return (
                <li
                  key={item.shootTypeId}
                  className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-4 md:p-5"
                >
                  <button
                    type="button"
                    onClick={() => openItemDetail(item.shootTypeId)}
                    className="flex w-full gap-3 text-left"
                  >
                    <div onClick={(event) => event.stopPropagation()}>
                      <CartItemThumbnail
                        imageUrl={
                          preview?.type === "image" ? preview.url : null
                        }
                        videoUrl={
                          preview?.type === "video" ? preview.url : null
                        }
                      />
                    </div>
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onClick={(event) => event.stopPropagation()}
                      onChange={() => toggleSelected(item.shootTypeId)}
                      className="mt-1 h-4 w-4 shrink-0 accent-[#93f8b6]"
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className="font-semibold md:text-lg"
                        style={{ color: item.accentColor }}
                      >
                        {item.serviceAreaTitle}
                      </p>
                      <p className="text-sm text-zinc-400">
                        {item.packageTitle} · {item.shootTypeLabel}
                      </p>
                      {effective.discountApplied ? (
                        <p className="mt-1 text-xs font-medium text-[#93f8b6]">
                          %10 indirim uygulandı
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeItem(item.shootTypeId);
                      }}
                      className="shrink-0 text-red-500 hover:text-red-400"
                      aria-label="Kaldır"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </button>
                  <div className="mt-3 grid grid-cols-2 gap-3 border-t border-white/5 pt-3 md:mt-4">
                    <div>
                      {effective.discountApplied ? (
                        <p className="mb-1 text-xs text-zinc-500 line-through">
                          {formatPrice(item.cashPrice)}
                        </p>
                      ) : null}
                      <PaymentTypePrice
                        type="pesin"
                        price={effective.cashPrice}
                        variant="stacked"
                      />
                    </div>
                    <div>
                      {effective.discountApplied ? (
                        <p className="mb-1 text-xs text-zinc-500 line-through">
                          {formatPrice(item.installmentPrice)}
                        </p>
                      ) : null}
                      <PaymentTypePrice
                        type="taksitli"
                        price={effective.installmentPrice}
                        variant="stacked"
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {items.length > 0 ? (
          <div className="mt-8 rounded-3xl border-2 border-[#93f8b6]/40 bg-gradient-to-b from-[#93f8b6]/20 via-[#93f8b6]/10 to-transparent p-6 shadow-[0_0_48px_rgba(147,248,182,0.14)] md:mt-10 md:p-8">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#93f8b6]/20 pb-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#93f8b6]">
                  Özet
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
                  Sepet Toplamı
                </h2>
              </div>
              {items.length > 1 && cartTotals.selectedCount < items.length ? (
                <p className="text-sm text-zinc-400">
                  Seçili {cartTotals.selectedCount} / {items.length} ürün
                </p>
              ) : null}
            </div>
            <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10 md:mt-8">
              <PaymentTypePrice
                type="pesin"
                price={cartTotals.cash}
                variant="featured"
              />
              <PaymentTypePrice
                type="taksitli"
                price={cartTotals.installment}
                variant="featured"
              />
            </div>
            {cartTotals.discountAppliedCount > 0 ? (
              <p className="mt-4 text-sm text-[#93f8b6]">
                {SECOND_PACKAGE_DISCOUNT_NOTE}
              </p>
            ) : null}
            {cartTotals.selectedCount === 0 ? (
              <p className="mt-5 text-sm text-zinc-400">
                Toplamı görmek için en az bir ürün seçin.
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      <PackageDetailSheet
        serviceArea={detailServiceArea}
        pkg={detailPackage}
        shootType={detailShootType}
        onClose={() => {
          setDetailServiceArea(null);
          setDetailPackage(null);
          setDetailShootType(null);
        }}
      />
    </main>
  );
}
