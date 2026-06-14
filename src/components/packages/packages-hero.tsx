"use client";

import { useState } from "react";
// import {
//   BadgeCheck,
//   Camera,
//   CalendarDays,
//   Handshake,
//   Leaf,
//   Mountain,
//   Package,
//   Truck,
//   UserRoundCheck,
// } from "lucide-react";
import type { PackageCategoryData } from "@/lib/package-types";
import { getPackageIcon } from "@/components/packages/package-icon";
import { PackageCartBar } from "@/components/packages/package-cart-bar";
import { PackageDetailSheet } from "@/components/packages/package-detail-sheet";
import { getCategoryPriceLabel } from "@/lib/package-media";
import { useCartStore } from "@/stores/cart-store";

// type PackageFeature = {
//   title: string;
//   description: string;
//   icon: React.ComponentType<{ className?: string }>;
// };

// const topFeatures: PackageFeature[] = [
//   {
//     title: "Rehberlik Hizmeti",
//     description:
//       "Süreç boyunca size özel tavsiye ve deneyimlerimizle yanınızdayız.",
//     icon: Leaf,
//   },
//   {
//     title: "Birebir İletişim",
//     description:
//       "Sadece Bekography ile birebir, kesintisiz ve dostça iletişim kurarsınız.",
//     icon: Handshake,
//   },
//   {
//     title: "Onaylı Süreç",
//     description:
//       "Her adım karşılıklı onay ve sözleşme ile kayıt altına alınarak güveninizi koruruz.",
//     icon: BadgeCheck,
//   },
// ];

// const middleFeatures: PackageFeature[] = [
//   {
//     title: "Tam Teslimat",
//     description:
//       "Tüm çekilen ve düzenlenen görüntüler yüksek kalitede size teslim edilir.",
//     icon: Package,
//   },
//   {
//     title: "Şeffaf Çekim",
//     description:
//       "Çekimleri size göstererek sürece hakim olmanızı ve rahat hissetmenizi sağlıyoruz.",
//     icon: Camera,
//   },
//   {
//     title: "Sınırsız Mekan",
//     description:
//       "Belirlenen süre zarfında, vakit yettiği farklı mekanlarda özgünce çekim yaparız.",
//     icon: Mountain,
//   },
// ];

// const bottomFeatures: PackageFeature[] = [
//   {
//     title: "Erteleme Rahatlığı",
//     description: "Yıl sonuna kadar çekimi erteleme hakkınız olur.",
//     icon: CalendarDays,
//   },
//   {
//     title: "Ücretsiz Kargo",
//     description: "Baskılı ürünler direkt adresinize ücretsiz kargolanır.",
//     icon: Truck,
//   },
//   {
//     title: "Profesyonel Ekipman",
//     description: "Yüksek çözünürlükte görüntülere sahip olursunuz.",
//     icon: UserRoundCheck,
//   },
// ];

// function FeatureCard({ feature }: { feature: PackageFeature }) {
//   const Icon = feature.icon;
//   return (
//     <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-4 md:p-5">
//       <Icon className="h-6 w-6 text-white md:h-7 md:w-7" />
//       <h3 className="mt-3 text-base font-semibold text-white md:text-lg">
//         {feature.title}
//       </h3>
//       <p className="mt-2 text-sm leading-relaxed text-zinc-400">
//         {feature.description}
//       </p>
//     </div>
//   );
// }

export function PackagesHero({
  categories,
}: {
  categories: PackageCategoryData[];
}) {
  const [selectedCategory, setSelectedCategory] =
    useState<PackageCategoryData | null>(null);
  const cartCount = useCartStore((state) => state.items.length);

  return (
    <main
      className={`flex-1 bg-black pt-24 text-white ${cartCount > 0 ? "pb-28" : "pb-10"}`}
    >
      {/* Neden Bekography — geçici olarak gizlendi, konum daha sonra düşünülecek
      <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Neden?
          </p>
          <h1 className="mt-3 text-4xl font-semibold md:text-6xl">Bekography</h1>
        </div>

        <div className="mt-10 grid gap-3 md:grid-cols-3">
          {topFeatures.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {middleFeatures.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {bottomFeatures.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </section>
      */}

      <section className="mx-auto max-w-2xl px-4 pb-16 pt-4">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Paketler
          </p>
          <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
            Paket Oluştur
          </h1>
        </div>

        <div className="mt-8 space-y-2">
          {categories.map((category) => {
            const Icon = getPackageIcon(category.iconKey);

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left transition-colors ${
                  category.highlight
                    ? "border-amber-300/60 bg-amber-400/10 hover:bg-amber-400/15"
                    : "border-white/10 bg-[#0a0a0a] hover:bg-[#111]"
                }`}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${category.accentColor}22` }}
                >
                  <Icon
                    className="h-5 w-5"
                    style={{ color: category.accentColor }}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block text-base font-semibold"
                    style={{ color: category.accentColor }}
                  >
                    {category.title}
                  </span>
                  <span className="block text-sm text-zinc-400">
                    {getCategoryPriceLabel(category)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <PackageDetailSheet
        category={selectedCategory}
        onClose={() => setSelectedCategory(null)}
      />

      <PackageCartBar />
    </main>
  );
}
