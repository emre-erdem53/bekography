import { LazyBlobProductImage } from "@/components/about/lazy-blob-product-image";
import { Reveal } from "@/components/motion/reveal";
import { turkishUppercase } from "@/lib/turkish-text";
import { getUrunImageSrc } from "@/lib/urun-media";

type VisualItem = { label: string; fileName: string };

type CategoryVisual = {
  id: string;
  title: string;
  items: VisualItem[];
};

type CategoryTextOnly = {
  id: string;
  title: string;
  items: string[];
  textOnly: true;
};

const CAMERA_ITEMS: VisualItem[] = [
  { label: "Sony a7 RV (2x)", fileName: "Sonya7RV.png" },
  { label: "Sony Fx3", fileName: "SonyaFX3.png" },
];

const DRONE_ITEMS: VisualItem[] = [
  { label: "DJI Mavic 3 Classic", fileName: "DJIMavic3Classic.png" },
  { label: "DJI Avata 2", fileName: "DJIAvata2.png" },
];

const LENS_ITEMS: VisualItem[] = [
  { label: "Sony FE 50mm f/1.2 GM", fileName: "SonyFE50mmf12GM.png" },
  { label: "Sony FE 24-70mm f/2.8 GM II", fileName: "SonyFE24-70mmf28GMII.png" },
  { label: "Sony FE 16-35mm f/2.8 GM", fileName: "SonyFE16-35mmf28GM.png" },
  { label: "Sony FE 85mm f/1.8", fileName: "SonyFE85mmf18.png" },
];

const GIMBAL_ITEMS: VisualItem[] = [
  { label: "DJI RS4", fileName: "DJIRS4.png" },
  { label: "DJI RS3", fileName: "DJIRS3.png" },
];

const COMPUTER_ITEMS: VisualItem[] = [
  { label: "Apple MacBook Pro M5 16”", fileName: "AppleMacBookProM516.png" },
];

const MONITOR_ITEMS: VisualItem[] = [
  { label: "Apple Studio Display", fileName: "AppleStudioDisplay.png" },
];

const LIGHT_ITEMS: VisualItem[] = [
  { label: "Aputure Amaran 60x RGB", fileName: "AputureAmaran60xRGB.png" },
  { label: "Aputure Amaran 60x S BiColor", fileName: "AputureAmaran60xSBiColor.png" },
  { label: "Zhiyun Molus x100 RGB", fileName: "ZhiyunMolusx100RGB.png" },
];

const FLASH_ITEMS: VisualItem[] = [{ label: "Godox V1 Pro", fileName: "GodoxV1Pro.png" }];

const ACCESSORY_ITEMS: VisualItem[] = [
  { label: "Sony VG-C4EM Battery Grip", fileName: "SonyVG-C4EMBatteryGrip.png" },
];

const VISUAL_CATEGORIES: CategoryVisual[] = [
  { id: "camera", title: "Kamera", items: CAMERA_ITEMS },
  { id: "drone", title: "Drone", items: DRONE_ITEMS },
  { id: "lens", title: "Lens", items: LENS_ITEMS },
  { id: "gimbal", title: "Gimbal", items: GIMBAL_ITEMS },
  { id: "computer", title: "Bilgisayar", items: COMPUTER_ITEMS },
  { id: "monitor", title: "Monitör", items: MONITOR_ITEMS },
  { id: "light", title: "Işık", items: LIGHT_ITEMS },
  { id: "flash", title: "Tepe Flaşı", items: FLASH_ITEMS },
  { id: "accessory", title: "Aksesuar", items: ACCESSORY_ITEMS },
];

const TEXT_ONLY: CategoryTextOnly[] = [
  {
    id: "disk",
    title: "Harici Disk",
    textOnly: true,
    items: [
      "Sandisk Professional PRO-Blade Station",
      "Sandisk Professional PRO-Blade Transport",
      "Sandisk Professional 4TB PRO-Blade SSD Mag (4x)",
    ],
  },
  {
    id: "media",
    title: "Hafıza Kartı",
    textOnly: true,
    items: [
      "Exascend Essential 240GB Cfexpress Type-A (4x)",
      "SanDisk 256 GB Extreme PRO microSDXC (2x)",
      "Sandisk 256 GB Extreme Pro SDXC (2x)",
    ],
  },
];

function EquipmentVisualCard({ label, fileName }: VisualItem) {
  const src = getUrunImageSrc(fileName);

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-zinc-900 dark:shadow-none dark:hover:shadow-lg dark:hover:shadow-black/20">
      <div className="relative aspect-[4/3] w-full bg-[linear-gradient(180deg,rgba(244,244,241,1)_0%,rgba(235,235,230,1)_100%)] dark:bg-[linear-gradient(180deg,rgba(39,39,42,0.9)_0%,rgba(24,24,27,1)_100%)]">
        <LazyBlobProductImage
          src={src}
          alt={label}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 22vw"
          imgClassName="object-contain p-3 md:p-4"
        />
      </div>
      <p className="border-t border-zinc-100 px-3 py-3 text-center text-[13px] font-medium leading-snug tracking-tight text-zinc-800 dark:border-white/10 dark:text-zinc-100 md:text-sm">
        {label}
      </p>
    </article>
  );
}

function CategoryVisualBlock({ title, items }: CategoryVisual) {
  return (
    <div className="space-y-4">
      <h4 className="text-[11px] tracking-[0.28em] text-zinc-500 dark:text-zinc-400">
        {turkishUppercase(title)}
      </h4>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <EquipmentVisualCard key={`${title}-${item.fileName}`} {...item} />
        ))}
      </div>
    </div>
  );
}

function CategoryTextBlock({ title, items }: CategoryTextOnly) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 p-5 dark:border-white/15 dark:bg-zinc-800/40 md:p-6">
      <h4 className="text-[11px] tracking-[0.28em] text-zinc-500 dark:text-zinc-400">
        {turkishUppercase(title)}
      </h4>
      <ul className="mt-4 space-y-2.5 text-sm font-light leading-relaxed text-zinc-700 dark:text-zinc-200 md:text-[15px]">
        {items.map((line) => (
          <li key={line} className="flex gap-2">
            <span className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-500" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AboutEquipment() {
  const [cameras, drone, lens, gimbal, computer, monitor, light, flash, accessory] =
    VISUAL_CATEGORIES;

  return (
    <section
      aria-labelledby="about-equipment-heading"
      className="mt-12 border-t border-zinc-200 pt-12 dark:border-white/10 md:mt-14 md:pt-14"
    >
      <Reveal y={20} viewportAmount="some" viewportMargin="0px">
        <p className="text-[11px] tracking-[0.35em] text-zinc-500 dark:text-zinc-400">
          {turkishUppercase("Ekipman Bilgisi")}
        </p>
        <h2
          id="about-equipment-heading"
          className="mt-3 text-3xl font-light tracking-tight md:text-4xl"
        >
          Ekipmanlarımız
        </h2>
        <p className="mt-3 max-w-2xl text-sm font-light leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-base">
          Çekimlerde kullandığımız profesyonel donanımlar; prodüksiyon kalitesinin omurgasıdır.
        </p>
      </Reveal>

      <div className="mt-12 space-y-14">
          <CategoryVisualBlock {...cameras} />

          <CategoryVisualBlock {...drone} />
          <CategoryVisualBlock {...lens} />
          <CategoryVisualBlock {...gimbal} />

          <CategoryVisualBlock {...computer} />
          <CategoryVisualBlock {...monitor} />

          <CategoryVisualBlock {...light} />
          <CategoryVisualBlock {...flash} />
          <CategoryVisualBlock {...accessory} />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {TEXT_ONLY.map((cat) => (
              <CategoryTextBlock key={cat.id} {...cat} />
            ))}
          </div>

          <p className="rounded-2xl border border-zinc-200 bg-white/60 px-5 py-4 text-sm font-light italic leading-relaxed text-zinc-600 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-300 md:px-6 md:text-[15px]">
            Not: Çekim türüne göre kullanılan set değişiklik gösterir.
          </p>
      </div>
    </section>
  );
}
