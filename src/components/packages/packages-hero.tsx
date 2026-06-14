"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import {
  BadgeCheck,
  Camera,
  CalendarDays,
  ChevronDown,
  Handshake,
  Leaf,
  Mountain,
  Package,
  Truck,
  UserRoundCheck,
} from "lucide-react";
import type { PackageCategoryData } from "@/lib/package-types";
import { formatPrice } from "@/lib/constants";
import { getPackageIcon } from "@/components/packages/package-icon";
import { PackageCategoryPanel } from "@/components/packages/package-category-panel";
import { PackageCartBar } from "@/components/packages/package-cart-bar";

type PackageFeature = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const topFeatures: PackageFeature[] = [
  {
    title: "Rehberlik Hizmeti",
    description:
      "Süreç boyunca size özel tavsiye ve deneyimlerimizle yanınızdayız.",
    icon: Leaf,
  },
  {
    title: "Birebir İletişim",
    description:
      "Sadece Bekography ile birebir, kesintisiz ve dostça iletişim kurarsınız.",
    icon: Handshake,
  },
  {
    title: "Onaylı Süreç",
    description:
      "Her adım karşılıklı onay ve sözleşme ile kayıt altına alınarak güveninizi koruruz.",
    icon: BadgeCheck,
  },
];

const middleFeatures: PackageFeature[] = [
  {
    title: "Tam Teslimat",
    description:
      "Tüm çekilen ve düzenlenen görüntüler yüksek kalitede size teslim edilir.",
    icon: Package,
  },
  {
    title: "Şeffaf Çekim",
    description:
      "Çekimleri size göstererek sürece hakim olmanızı ve rahat hissetmenizi sağlıyoruz.",
    icon: Camera,
  },
  {
    title: "Sınırsız Mekan",
    description:
      "Belirlenen süre zarfında, vakit yettiği farklı mekanlarda özgünce çekim yaparız.",
    icon: Mountain,
  },
];

const bottomFeatures: PackageFeature[] = [
  {
    title: "Erteleme Rahatlığı",
    description: "Yıl sonuna kadar çekimi erteleme hakkınız olur.",
    icon: CalendarDays,
  },
  {
    title: "Ücretsiz Kargo",
    description: "Baskılı ürünler direkt adresinize ücretsiz kargolanır.",
    icon: Truck,
  },
  {
    title: "Profesyonel Ekipman",
    description: "Yüksek çözünürlükte görüntülere sahip olursunuz.",
    icon: UserRoundCheck,
  },
];

function getCategoryPriceLabel(category: PackageCategoryData) {
  const cashPrices = category.options.map((option) => option.cashPrice);
  if (cashPrices.length === 0) return "";
  const min = Math.min(...cashPrices);
  const max = Math.max(...cashPrices);
  if (min === max) return formatPrice(min);
  return `${formatPrice(min)} - ${formatPrice(max)}`;
}

function FeatureCard({ feature }: { feature: PackageFeature }) {
  const Icon = feature.icon;
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-4 md:p-5">
      <Icon className="h-6 w-6 text-white md:h-7 md:w-7" />
      <h3 className="mt-3 text-base font-semibold text-white md:text-lg">
        {feature.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
        {feature.description}
      </p>
    </div>
  );
}

const blobBaseUrl = process.env.NEXT_PUBLIC_BLOB_BASE_URL?.replace(/\/+$/, "");

function packageMedia(fileName: string) {
  if (fileName.startsWith("http")) return fileName;
  return blobBaseUrl ? `${blobBaseUrl}/${fileName}` : `/reels/${fileName}`;
}

export function PackagesHero({
  categories,
}: {
  categories: PackageCategoryData[];
}) {
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  return (
    <main className="flex-1 bg-black pb-28 text-white">
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

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Paketler
          </p>
          <h2 className="mt-3 text-3xl font-semibold md:text-5xl">Fiyat Listesi</h2>
        </div>

        <div className="mt-8 space-y-3">
          {categories.map((category) => {
            const Icon = getPackageIcon(category.iconKey);
            const isOpen = openCategory === category.id;
            const backgroundImage = category.backgroundImageUrl
              ? packageMedia(category.backgroundImageUrl)
              : null;

            return (
              <div
                key={category.id}
                className={`overflow-hidden rounded-2xl border ${
                  category.highlight
                    ? "border-amber-300/60"
                    : "border-white/10"
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenCategory((prev) =>
                      prev === category.id ? null : category.id,
                    )
                  }
                  className={`relative flex w-full items-center justify-between gap-3 overflow-hidden px-4 py-3 text-left transition-colors md:px-5 ${
                    category.highlight
                      ? "bg-amber-400 text-black hover:bg-amber-300"
                      : "bg-[#050505] text-white hover:bg-[#0e0e0e]"
                  }`}
                  aria-expanded={isOpen}
                >
                  <span className="relative z-10 flex min-w-0 flex-1 items-center gap-3">
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-base font-semibold md:text-lg">
                        {category.title}
                      </span>
                      <span
                        className={`block text-sm ${
                          category.highlight ? "text-black/70" : "text-zinc-400"
                        }`}
                      >
                        {getCategoryPriceLabel(category)}
                      </span>
                    </span>
                  </span>
                  {backgroundImage ? (
                    <Image
                      src={backgroundImage}
                      alt=""
                      width={120}
                      height={60}
                      className="absolute right-16 top-1/2 h-12 w-24 -translate-y-1/2 rounded-lg object-cover opacity-30"
                      aria-hidden
                    />
                  ) : null}
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-5 w-5" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden bg-black/90"
                    >
                      <PackageCategoryPanel category={category} />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      <PackageCartBar />
    </main>
  );
}
