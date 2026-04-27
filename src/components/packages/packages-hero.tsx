"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import {
  BadgeCheck,
  Camera,
  CalendarDays,
  ChevronDown,
  Compass,
  Diamond,
  Download,
  HandHeart,
  Handshake,
  HeartHandshake,
  PartyPopper,
  Gem,
  Leaf,
  Mountain,
  Package,
  Sparkles,
  Video,
  UserRound,
  Truck,
  UserRoundCheck,
} from "lucide-react";

type PackageFeature = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

type PriceCategory = {
  title: string;
  price: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
};

const blobBaseUrl = process.env.NEXT_PUBLIC_BLOB_BASE_URL?.replace(/\/+$/, "");
const packageMedia = (fileName: string) =>
  blobBaseUrl ? `${blobBaseUrl}/${fileName}` : `/reels/${fileName}`;

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
      "Sadece Bekography ile birebir, kesintisiz ve dost.a iletişim kurarsınız.",
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

const priceCategories: PriceCategory[] = [
  { title: "Dış Çekim", price: "₺25.000 - ₺35.000", icon: Mountain },
  { title: "Düğün", price: "₺25.000 - ₺33.000", icon: Gem },
  { title: "Gelin Çıkışı", price: "₺17.000 - ₺22.000", icon: Sparkles },
  { title: "Kuaför", price: "₺12.000 - ₺15.000", icon: UserRound },
  {
    title: "Full Hikaye",
    price: "₺103.000 - ₺85.000",
    icon: Diamond,
    highlight: true,
  },
  { title: "Söz/İsteme", price: "₺22.000 - ₺28.000", icon: HandHeart },
  { title: "Kına", price: "₺25.000 - ₺30.000", icon: PartyPopper },
  { title: "Nişan", price: "₺25.000 - ₺30.000", icon: HeartHandshake },
];

function FeatureCard({
  feature,
  variant,
}: {
  feature: PackageFeature;
  variant: "dark" | "green";
}) {
  const Icon = feature.icon;
  const isGreen = variant === "green";

  return (
    <article
      className={`rounded-xl px-4 py-5 text-center md:px-6 md:py-6 ${
        isGreen ? "bg-[#00f27a] text-[#04170b]" : "bg-black text-[#00f27a]"
      }`}
    >
      <Icon
        className={`mx-auto h-6 w-6 md:h-6 md:w-6 ${
          isGreen ? "text-[#04170b]" : "text-[#00f27a]"
        }`}
      />
      <h3 className="mt-2 text-center text-lg font-bold leading-tight md:mt-3 md:text-xl">
        {feature.title}
      </h3>
      <p
        className={`mx-auto mt-2 max-w-[18ch] text-center text-[10px] leading-snug md:max-w-none md:text-sm md:leading-relaxed ${
          isGreen ? "text-[#0c3f21]" : "text-[#8affc0]"
        }`}
      >
        {feature.description}
      </p>
    </article>
  );
}

export function PackagesHero() {
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const categoriesWithoutDetails = ["Söz/İsteme", "Kına", "Nişan"];

  return (
    <main className="min-h-screen flex-1 bg-black pt-24 text-[#00f27a]">
      <section className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
        <div className="rounded-2xl border border-white/10 bg-black p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] md:p-6">
          <div className="relative mb-5 overflow-hidden rounded-2xl">
            <Image
              src={packageMedia("5.jpg")}
              alt="Neden Bekography"
              width={1600}
              height={700}
              className="h-40 w-full object-cover brightness-50 md:h-56"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/45 to-black/55" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-5xl font-extrabold leading-none text-[#00f27a] md:text-7xl">
                  Neden?
                </h1>
                <p className="font-brand mt-2 text-2xl tracking-wide text-[#00f27a] md:text-3xl">
                  bekography
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {topFeatures.map((feature) => (
              <FeatureCard key={feature.title} feature={feature} variant="dark" />
            ))}
          </div>

          <div className="my-3 grid grid-cols-3 gap-[2px] rounded-xl bg-[#00f27a] p-[2px]">
            {middleFeatures.map((feature) => (
              <FeatureCard key={feature.title} feature={feature} variant="green" />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {bottomFeatures.map((feature) => (
              <FeatureCard key={feature.title} feature={feature} variant="dark" />
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-[#030303] p-4 md:p-6">
          <div className="relative mb-5 overflow-hidden rounded-2xl">
            <Image
              src={packageMedia("2.jpg")}
              alt="Fiyat Listesi"
              width={1600}
              height={700}
              className="h-36 w-full object-cover brightness-50 md:h-48"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/65" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/85">
                Özgürce çekim içeriğini seç
              </p>
              <h2 className="mt-1 text-4xl font-light text-white md:text-6xl">
                Fiyat Listesi
              </h2>
            </div>
          </div>

          <div className="space-y-2">
            {priceCategories.map((category) => {
              const Icon = category.icon;
              const isOpen = openCategory === category.title;
              const hasDetails = !categoriesWithoutDetails.includes(category.title);

              return (
                <div
                  key={category.title}
                  className={`overflow-hidden rounded-2xl border ${
                    category.highlight
                      ? "border-amber-300/60"
                      : "border-white/10"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (!hasDetails) return;
                      setOpenCategory((prev) =>
                        prev === category.title ? null : category.title,
                      );
                    }}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors md:px-5 ${
                      category.highlight
                        ? "bg-amber-400 text-black hover:bg-amber-300"
                        : "bg-[#050505] text-white hover:bg-[#0e0e0e]"
                    }`}
                    aria-expanded={hasDetails ? isOpen : false}
                    aria-controls={`category-${category.title}`}
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-3">
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="truncate text-base font-semibold md:text-xl">
                        {category.title}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="text-right text-sm font-medium md:text-xl">
                        {category.title === "Full Hikaye" ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="opacity-85 line-through decoration-2">
                              ₺103.000
                            </span>
                            <span>-</span>
                            <span>₺85.000</span>
                          </span>
                        ) : (
                          category.price
                        )}
                      </span>
                      {hasDetails ? (
                        <motion.span
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="h-5 w-5" />
                        </motion.span>
                      ) : null}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && hasDetails ? (
                      <motion.div
                        id={`category-${category.title}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="bg-black/90"
                      >
                        {category.title === "Dış Çekim" ? (
                          <div className="space-y-2.5 px-3 py-3 md:space-y-4 md:px-5 md:py-5">
                            <div className="relative overflow-hidden rounded-2xl">
                              <Image
                                src={packageMedia("4.jpg")}
                                alt="Dış çekim detayları"
                                width={1600}
                                height={700}
                                className="h-24 w-full object-cover brightness-75 md:h-44"
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/40 to-black/60" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center text-[#ff9a5e]">
                                  <p className="text-[10px] font-semibold uppercase tracking-[0.13em]">
                                    Stres yok, kahkaha ve güven çok.
                                  </p>
                                  <h4 className="mt-1 text-5xl font-semibold leading-none md:text-7xl">
                                    Dış Çekim
                                  </h4>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-[1px] overflow-hidden rounded-2xl bg-[#ff8a45] md:grid-cols-4">
                              {[
                                {
                                  title: "Fotoğraf Çekimi",
                                  sub: "Albüm Çerçeveler",
                                  icon: Camera,
                                },
                                {
                                  title: "Video Çekimi",
                                  sub: "Film Uzun Metraj",
                                  icon: Video,
                                },
                                {
                                  title: "Rehberlik Hizmeti",
                                  sub: "Gün Planlama Öneriler",
                                  icon: Compass,
                                },
                                {
                                  title: "Tüm Dijitaller",
                                  sub: "Çekilenler Düzenlenir",
                                  icon: Download,
                                },
                              ].map((item) => {
                                const Icon = item.icon;
                                return (
                                  <div
                                    key={item.title}
                                    className="bg-[#ff8a45] px-2 py-2 text-center text-[#111]"
                                  >
                                    <Icon className="mx-auto h-5 w-5" />
                                    <p className="mt-1.5 text-xs font-bold leading-tight md:mt-2 md:text-sm">
                                      {item.title}
                                    </p>
                                    <p className="mt-1 text-[10px] leading-tight text-[#3a2314] md:text-[11px]">
                                      {item.sub}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="space-y-2 rounded-2xl bg-black/80 p-2.5 md:space-y-3 md:p-4">
                              <div>
                                <h5 className="text-center text-2xl font-bold text-[#ff9a5e]">
                                  Çekim
                                </h5>
                                <p className="mt-2 text-center text-[10px] leading-relaxed text-zinc-300 md:text-base">
                                  Çekimi 10.00-14.00 veya 13.00-17.00 saatleri
                                  arasında gerçekleştiriyoruz. Belirlenen sürede,
                                  bir rota üzerindeki farklı mekanlarda çekim
                                  yapabiliyoruz. Otel çekimi istenirse, otel ile
                                  anlaşma sağlayabiliyor ve çekim esnasında rahat
                                  hissetmenizi desteklemek adına yönlendirme
                                  sağlıyoruz.
                                </p>
                              </div>
                              <div>
                                <h5 className="text-center text-2xl font-bold text-[#ff9a5e]">
                                  Çekim Sonrası
                                </h5>
                                <p className="mt-2 text-center text-[10px] leading-relaxed text-zinc-300 md:text-base">
                                  Çekimden kalan tüm görüntüleri yüksek
                                  çözünürlükte, 1 hafta içinde teslim ediyoruz.
                                  Seçilen fotoğraflar düzenlenir, özel albüm ve
                                  çerçeve tasarımları hazırlanır. İstediğiniz
                                  seçimleriniz tamamlandıktan sonra baskılarınız
                                  adresinize kargo ile gönderilir.
                                </p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              {[
                                { label: "Fotoğraf", price: "₺25.000" },
                                {
                                  label: "Fotoğraf + Video Film",
                                  price: "₺35.000",
                                },
                              ].map((price) => (
                                <div
                                  key={price.label}
                                  className="flex items-center justify-between rounded-2xl bg-[#1d2333] px-3 py-2.5 text-[#ff9a5e]"
                                >
                                  <span className="text-sm font-semibold md:text-lg">
                                    {price.label}
                                  </span>
                                  <span className="text-xl font-extrabold md:text-2xl">
                                    {price.price}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : category.title === "Düğün" ? (
                          <div className="space-y-2.5 px-3 py-3 md:space-y-4 md:px-5 md:py-5">
                            <div className="relative overflow-hidden rounded-2xl">
                              <Image
                                src={packageMedia("3.jpg")}
                                alt="Düğün detayları"
                                width={1600}
                                height={700}
                                className="h-24 w-full object-cover brightness-75 md:h-44"
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/40 to-black/60" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center text-[#8fffb0]">
                                  <p className="text-[10px] font-semibold uppercase tracking-[0.13em]">
                                    Asalet, romantizm ve bol coşku.
                                  </p>
                                  <h4 className="mt-1 text-5xl font-semibold leading-none md:text-7xl">
                                    Düğün
                                  </h4>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-[1px] overflow-hidden rounded-2xl bg-[#93f8b6] md:grid-cols-4">
                              {[
                                {
                                  title: "Fotoğraf Çekimi",
                                  sub: "Aile Anlar",
                                  icon: Camera,
                                },
                                {
                                  title: "Video Çekimi",
                                  sub: "Film Uzun Metraj",
                                  icon: Video,
                                },
                                {
                                  title: "Rehberlik Hizmeti",
                                  sub: "Gün Planlama Öneriler",
                                  icon: Compass,
                                },
                                {
                                  title: "Tüm Dijitaller",
                                  sub: "Çekilenler Düzenlenir",
                                  icon: Download,
                                },
                              ].map((item) => {
                                const Icon = item.icon;
                                return (
                                  <div
                                    key={item.title}
                                    className="bg-[#93f8b6] px-2 py-2 text-center text-[#0d2d17]"
                                  >
                                    <Icon className="mx-auto h-5 w-5" />
                                    <p className="mt-1.5 text-xs font-bold leading-tight md:mt-2 md:text-sm">
                                      {item.title}
                                    </p>
                                    <p className="mt-1 text-[10px] leading-tight text-[#234c30] md:text-[11px]">
                                      {item.sub}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="space-y-2 rounded-2xl bg-black/80 p-2.5 md:space-y-3 md:p-4">
                              <div>
                                <h5 className="text-center text-2xl font-bold text-[#8fffb0]">
                                  Çekim
                                </h5>
                                <p className="mt-2 text-center text-[10px] leading-relaxed text-zinc-300 md:text-base">
                                  Organizasyonunuzun tüm detaylarında size rehberlik
                                  ederek çekim sürecini yönetiyoruz. Düğün
                                  başlamadan önce salonda buluşup tüm akışı
                                  planlıyoruz. Törenin giriş, ilk dans ve eğlence
                                  bölümleri en az 2 kamera ile kayıt altına
                                  alınıyor.
                                </p>
                              </div>
                              <div>
                                <h5 className="text-center text-2xl font-bold text-[#8fffb0]">
                                  Çekim Sonrası
                                </h5>
                                <p className="mt-2 text-center text-[10px] leading-relaxed text-zinc-300 md:text-base">
                                  Çekilen tüm görüntüleri yüksek çözünürlükte, 1
                                  hafta içinde teslim ediyoruz. Seçtiğiniz müzikle
                                  düğün salon filminizi düzenliyor, fotoğrafları
                                  baskı ve dijital teslim için hazır hale
                                  getiriyoruz.
                                </p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              {[
                                { label: "Video Film", price: "₺25.000" },
                                {
                                  label: "Fotoğraf + Video Film",
                                  price: "₺33.000",
                                },
                              ].map((price) => (
                                <div
                                  key={price.label}
                                  className="flex items-center justify-between rounded-2xl bg-[#1d2333] px-3 py-2.5 text-[#8fffb0]"
                                >
                                  <span className="text-sm font-semibold md:text-lg">
                                    {price.label}
                                  </span>
                                  <span className="text-xl font-extrabold md:text-2xl">
                                    {price.price}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : category.title === "Gelin Çıkışı" ? (
                          <div className="space-y-2.5 px-3 py-3 md:space-y-4 md:px-5 md:py-5">
                            <div className="relative overflow-hidden rounded-2xl">
                              <Image
                                src={packageMedia("1.jpg")}
                                alt="Gelin çıkışı detayları"
                                width={1600}
                                height={700}
                                className="h-24 w-full object-cover brightness-75 md:h-44"
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/40 to-black/60" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center text-[#f3d46b]">
                                  <p className="text-[10px] font-semibold uppercase tracking-[0.13em]">
                                    Tüm ailemiz bir arada.
                                  </p>
                                  <h4 className="mt-1 text-5xl font-semibold leading-none md:text-7xl">
                                    Gelin Çıkışı
                                  </h4>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-[1px] overflow-hidden rounded-2xl bg-[#f3d46b] md:grid-cols-4">
                              {[
                                {
                                  title: "Fotoğraf Çekimi",
                                  sub: "Aile Anlar",
                                  icon: Camera,
                                },
                                {
                                  title: "Video Çekimi",
                                  sub: "Film Uzun Metraj",
                                  icon: Video,
                                },
                                {
                                  title: "Rehberlik Hizmeti",
                                  sub: "Gün Planlama Öneriler",
                                  icon: Compass,
                                },
                                {
                                  title: "Tüm Dijitaller",
                                  sub: "Çekilenler Düzenlenir",
                                  icon: Download,
                                },
                              ].map((item) => {
                                const Icon = item.icon;
                                return (
                                  <div
                                    key={item.title}
                                    className="bg-[#f3d46b] px-2 py-2 text-center text-[#2e2510]"
                                  >
                                    <Icon className="mx-auto h-5 w-5" />
                                    <p className="mt-1.5 text-xs font-bold leading-tight md:mt-2 md:text-sm">
                                      {item.title}
                                    </p>
                                    <p className="mt-1 text-[10px] leading-tight text-[#574829] md:text-[11px]">
                                      {item.sub}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="space-y-2 rounded-2xl bg-black/80 p-2.5 md:space-y-3 md:p-4">
                              <div>
                                <h5 className="text-center text-2xl font-bold text-[#f3d46b]">
                                  Çekim
                                </h5>
                                <p className="mt-2 text-center text-[10px] leading-relaxed text-zinc-300 md:text-base">
                                  Gelin çıkışının tüm detaylarında size rehberlik
                                  ederek süreci yönetiyoruz. Damat gelmeden önce
                                  gelinin ailesiyle vedalaşma, kurdele bağlama ve
                                  aile detaylarını çekiyoruz. Ardından damadın
                                  geliş karşılama anı ve çıkış anını da kayıt
                                  altına alarak organizasyonu sonlandırıyoruz.
                                </p>
                              </div>
                              <div>
                                <h5 className="text-center text-2xl font-bold text-[#f3d46b]">
                                  Çekim Sonrası
                                </h5>
                                <p className="mt-2 text-center text-[10px] leading-relaxed text-zinc-300 md:text-base">
                                  Çekilen tüm görüntüleri yüksek çözünürlükte
                                  teslim ediyoruz. Seçtiğiniz müzikle çıkış
                                  filminizi düzenliyor, fotoğrafları dijital ve
                                  baskı sürecine hazırlıyoruz.
                                </p>
                                <p className="mt-2 text-center text-[10px] text-zinc-300 md:text-base">
                                  Bu hizmet dış çekim veya düğün filmine ek olarak
                                  satın alınabilir.
                                </p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              {[
                                { label: "Video Film", price: "₺17.000" },
                                {
                                  label: "Fotoğraf + Video Film",
                                  price: "₺22.000",
                                },
                              ].map((price) => (
                                <div
                                  key={price.label}
                                  className="flex items-center justify-between rounded-2xl bg-[#1f2f2c] px-3 py-2.5 text-[#f3d46b]"
                                >
                                  <span className="text-sm font-semibold md:text-lg">
                                    {price.label}
                                  </span>
                                  <span className="text-xl font-extrabold md:text-2xl">
                                    {price.price}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : category.title === "Kuaför" ? (
                          <div className="space-y-2.5 px-3 py-3 md:space-y-4 md:px-5 md:py-5">
                            <div className="relative overflow-hidden rounded-2xl">
                              <Image
                                src={packageMedia("2.jpg")}
                                alt="Kuaför hazırlık detayları"
                                width={1600}
                                height={700}
                                className="h-24 w-full object-cover brightness-75 md:h-44"
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/40 to-black/60" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center text-[#f6b8c2]">
                                  <p className="text-[10px] font-semibold uppercase tracking-[0.13em]">
                                    Büyük günün özel başlangıcı.
                                  </p>
                                  <h4 className="mt-1 text-5xl font-semibold leading-none md:text-7xl">
                                    Hazırlık
                                  </h4>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-[1px] overflow-hidden rounded-2xl bg-[#f6b8c2] md:grid-cols-4">
                              {[
                                {
                                  title: "Fotoğraf Çekimi",
                                  sub: "Makyaj Aksesuarlar",
                                  icon: Camera,
                                },
                                {
                                  title: "Video Çekimi",
                                  sub: "Film Uzun Metraj",
                                  icon: Video,
                                },
                                {
                                  title: "Rehberlik Hizmeti",
                                  sub: "Gün Planlama Öneriler",
                                  icon: Compass,
                                },
                                {
                                  title: "Tüm Dijitaller",
                                  sub: "Çekilenler Düzenlenir",
                                  icon: Download,
                                },
                              ].map((item) => {
                                const Icon = item.icon;
                                return (
                                  <div
                                    key={item.title}
                                    className="bg-[#f6b8c2] px-2 py-2 text-center text-[#2d1a1f]"
                                  >
                                    <Icon className="mx-auto h-5 w-5" />
                                    <p className="mt-1.5 text-xs font-bold leading-tight md:mt-2 md:text-sm">
                                      {item.title}
                                    </p>
                                    <p className="mt-1 text-[10px] leading-tight text-[#5a3640] md:text-[11px]">
                                      {item.sub}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="space-y-2 rounded-2xl bg-black/80 p-2.5 md:space-y-3 md:p-4">
                              <div>
                                <h5 className="text-center text-2xl font-bold text-[#f6b8c2]">
                                  Çekim
                                </h5>
                                <p className="mt-2 text-center text-[10px] leading-relaxed text-zinc-300 md:text-base">
                                  Gelinin kuaförde çiftin hazırlığının son
                                  aşamasını, video çekimiyle ve anlaşmaya
                                  dahilinde fotoğraf çekimiyle yapıyoruz.
                                </p>
                              </div>
                              <div>
                                <h5 className="text-center text-2xl font-bold text-[#f6b8c2]">
                                  Çekim Sonrası
                                </h5>
                                <p className="mt-2 text-center text-[10px] leading-relaxed text-zinc-300 md:text-base">
                                  Çekilen tüm orijinal görüntüleri yüksek
                                  çözünürlükte, 1 hafta içinde teslim ediyoruz.
                                  Çektiğimiz video görüntülerini dış çekim veya
                                  düğün filminde kullanıyor; fotoğraf çekimi varsa
                                  düzenleyip dijital olarak teslim ediyoruz.
                                </p>
                                <p className="mt-2 text-center text-[10px] text-zinc-300 md:text-base">
                                  Bu hizmet dış çekim veya düğün filmine ek olarak
                                  satın alınabilir.
                                </p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              {[
                                { label: "Video Film", price: "₺12.000" },
                                {
                                  label: "Fotoğraf + Video Film",
                                  price: "₺15.000",
                                },
                              ].map((price) => (
                                <div
                                  key={price.label}
                                  className="flex items-center justify-between rounded-2xl bg-[#2f2f24] px-3 py-2.5 text-[#f6b8c2]"
                                >
                                  <span className="text-sm font-semibold md:text-lg">
                                    {price.label}
                                  </span>
                                  <span className="text-xl font-extrabold md:text-2xl">
                                    {price.price}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : category.title === "Full Hikaye" ? (
                          <div className="space-y-2.5 px-3 py-3 md:space-y-4 md:px-5 md:py-5">
                            <div className="relative overflow-hidden rounded-2xl">
                              <Image
                                src={packageMedia("3.jpg")}
                                alt="Full hikaye detayları"
                                width={1600}
                                height={700}
                                className="h-24 w-full object-cover brightness-75 md:h-44"
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/40 to-black/60" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center text-[#ffb200]">
                                  <p className="text-[10px] font-semibold uppercase tracking-[0.13em]">
                                    Hazırlık, Dış Çekim, Gelin Çıkışı, Düğün
                                  </p>
                                  <h4 className="mt-1 text-5xl font-semibold leading-none md:text-7xl">
                                    Full Hikaye
                                  </h4>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-[1px] overflow-hidden rounded-2xl bg-[#ffb200] md:grid-cols-4">
                              {[
                                {
                                  title: "Fotoğraf Çekimi",
                                  sub: "Albüm Çerçeveler",
                                  icon: Camera,
                                },
                                {
                                  title: "Video Çekimi",
                                  sub: "Karma Film Uzun Metraj",
                                  icon: Video,
                                },
                                {
                                  title: "Rehberlik Hizmeti",
                                  sub: "Gün Planlama Öneriler",
                                  icon: Compass,
                                },
                                {
                                  title: "Tüm Dijitaller",
                                  sub: "Çekilenler Düzenlenir",
                                  icon: Download,
                                },
                              ].map((item) => {
                                const Icon = item.icon;
                                return (
                                  <div
                                    key={item.title}
                                    className="bg-[#ffb200] px-2 py-2 text-center text-[#231604]"
                                  >
                                    <Icon className="mx-auto h-5 w-5" />
                                    <p className="mt-1.5 text-xs font-bold leading-tight md:mt-2 md:text-sm">
                                      {item.title}
                                    </p>
                                    <p className="mt-1 text-[10px] leading-tight text-[#5a3a0b] md:text-[11px]">
                                      {item.sub}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="space-y-2 rounded-2xl bg-black/80 p-2.5 md:space-y-3 md:p-4">
                              <div>
                                <h5 className="text-center text-2xl font-bold text-[#ffb200]">
                                  Çekim
                                </h5>
                                <p className="mt-2 text-center text-[10px] leading-relaxed text-zinc-300 md:text-base">
                                  Kuaförden başlayarak dış çekim, gelin çıkışı ve
                                  düğün dahilinde fotoğraf ve video çekimi
                                  yapıyoruz. Dış çekimde ağırlıklı fotoğraf çekimi,
                                  düğünde ise bir mekanda video çekimi
                                  yapıyoruz. Diğer bölümlerde ise ağırlıklı video
                                  çekimi ve yalnızca kaydı yapılamayan anlarda
                                  fotoğraf çekimi tamamlıyoruz.
                                </p>
                              </div>
                              <div>
                                <h5 className="text-center text-2xl font-bold text-[#ffb200]">
                                  Çekim Sonrası
                                </h5>
                                <p className="mt-2 text-center text-[10px] leading-relaxed text-zinc-300 md:text-base">
                                  Çekilen tüm orijinal görüntüleri yüksek
                                  çözünürlükte teslim ediyoruz. Seçtiğiniz müzikle
                                  tüm günü özetleyen karma bir film düzenliyor;
                                  dış çekimde seçilen fotoğrafları düzenleyip
                                  teslim ediyoruz. Diğer bölümlerde çekilen
                                  fotoğraflar ve videolar düzenlenip dijital
                                  olarak teslim edilir.
                                </p>
                              </div>
                            </div>

                            <div className="rounded-2xl bg-[#202042] px-3 py-3 text-center text-[#ffb200]">
                              <p className="text-3xl font-semibold md:text-4xl">₺85.000</p>
                              <p className="mt-1 text-xl font-medium opacity-80 line-through decoration-2 md:text-2xl">
                                ₺103.000
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="px-4 py-3 text-sm text-zinc-300 md:px-5 md:text-base">
                            Bu kategoriye ait paket detayları yakında eklenecek.
                          </div>
                        )}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
