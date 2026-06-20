import type { PostShootTemplates } from "@/lib/post-shoot";

export type PackageServiceItem = {
  title: string;
  subLines: string[];
  iconKey: string;
};

export type PackageGalleryImage = {
  url: string;
  alt?: string;
};

export type PackageDetailSection = {
  id: string;
  title: string;
  body: string;
  tags?: string[];
  sortOrder: number;
};

export type PackageRequestFieldLabels = {
  dateLabel: string;
  cityLabel: string;
};

export type PackageCategoryContent = {
  serviceGridColor: string;
  serviceTextColor: string;
  serviceSubTextColor: string;
  services: PackageServiceItem[];
  shootTitle: string;
  shootDescription: string;
  afterShootTitle: string;
  afterShootDescription: string;
  afterShootExtra?: string;
  scheduleType?: "outdoor" | "indoor";
  postShootTemplates?: PostShootTemplates;
  highlightTags?: string[];
  highlightTagsByOption?: Record<string, string[]>;
  optionIconKeys?: Record<string, string>;
  galleryImages?: PackageGalleryImage[];
  detailSections?: PackageDetailSection[];
  detailSectionsByOption?: Record<string, PackageDetailSection[]>;
  inspectEnabledByOption?: Record<string, boolean>;
  requestFieldLabels?: PackageRequestFieldLabels;
};

export function defaultRequestFieldLabels(
  title: string,
  scheduleType: "outdoor" | "indoor" = "indoor",
): PackageRequestFieldLabels {
  if (scheduleType === "outdoor") {
    return {
      dateLabel: `${title} Tarihi`,
      cityLabel: "Çekim Yapılacak Şehir",
    };
  }
  return {
    dateLabel: `${title} Tarihi`,
    cityLabel: `${title} Yapılacak Şehir`,
  };
}

export function defaultOutdoorPostShootTemplates(): PostShootTemplates {
  return {
    digital: {
      pills: ["Tüm Çekilenler", "7 Günde Hazır", "30 Günde Alınmalı"],
      description:
        "Çekimden kalan tüm görüntüleri yüksek çözünürlükte, 7 gün içinde indirme linki veya harici disk ile teslim ediyoruz. Teslimden sonra 30 gün içinde alınmalıdır.",
    },
    editing: {
      pills: ["18 Fotoğraf", "Albüm", "Dış Çekim Filmi", "70 Gün"],
      description:
        "Seçilen 18 fotoğraf düzenlenir, albüm tasarımı hazırlanır ve 30-60 saniyelik dış çekim filmi 70 gün içinde teslim edilir.",
    },
  };
}

export function defaultIndoorPostShootTemplates(): PostShootTemplates {
  return {
    digital: {
      pills: ["Tüm Çekilenler", "7 Günde Hazır", "30 Günde Alınmalı"],
      description:
        "Çekilen tüm görüntüleri yüksek çözünürlükte, 7 gün içinde indirme linki veya harici disk ile teslim ediyoruz. Teslimden sonra 30 gün içinde alınmalıdır.",
    },
    editing: {
      pills: ["18 Fotoğraf", "Salon Filmi", "70 Gün"],
      description:
        "Seçilen fotoğraflar düzenlenir ve seçtiğiniz müzikle salon filminiz 70 gün içinde hazırlanır.",
    },
    printing: {
      pills: ["Albüm", "3 Çerçeve", "30 Gün"],
      description:
        "30x60x2,5 cm albüm (7 sayfa, 5 fotoğraf, mat) ve 25x25x3 cm 3 adet çerçeve 30 gün içinde ücretsiz kargo ile adresinize gönderilir.",
    },
  };
}

export type SeedPackageCategory = {
  slug: string;
  title: string;
  accentColor: string;
  iconKey: string;
  highlight?: boolean;
  backgroundImage?: string;
  heroImage?: string;
  sortOrder: number;
  content: PackageCategoryContent;
  options: { label: string; cash: number; installment: number }[];
};

const defaultServices = (
  subLines: [string, string] = ["Aile", "Anlar"],
): PackageServiceItem[] => [
  { title: "Fotoğraf Çekimi", subLines: subLines, iconKey: "Camera" },
  { title: "Video Çekimi", subLines: ["Film", "Uzun Metraj"], iconKey: "Video" },
  {
    title: "Rehberlik Hizmeti",
    subLines: ["Gün Planlama", "Öneriler"],
    iconKey: "Compass",
  },
  {
    title: "Tüm Dijitaller",
    subLines: ["Çekilenler", "Düzenlenenler"],
    iconKey: "Download",
  },
];

export const seedPackageCategories: SeedPackageCategory[] = [
  {
    slug: "dis-cekim",
    title: "Dış Çekim",
    accentColor: "#ff9a5e",
    iconKey: "Mountain",
    backgroundImage: "dis-cekim.png",
    heroImage: "dis-cekim.png",
    sortOrder: 0,
    content: {
      serviceGridColor: "#ff8a45",
      serviceTextColor: "#111",
      serviceSubTextColor: "#3a2314",
      services: [
        {
          title: "Fotoğraf Çekimi",
          subLines: ["1 Albüm", "3 Çerçeve"],
          iconKey: "Camera",
        },
        {
          title: "Video Çekimi",
          subLines: ["Film", "Uzun Metraj"],
          iconKey: "Video",
        },
        {
          title: "Rehberlik Hizmeti",
          subLines: ["Gün Planlama", "Öneriler"],
          iconKey: "Compass",
        },
        {
          title: "Tüm Dijitaller",
          subLines: ["Çekilenler", "Düzenlenenler"],
          iconKey: "Download",
        },
      ],
      shootTitle: "Çekim",
      shootDescription:
        "Çekimi 10.00-14.00 veya 13.00-17.00 saatleri arasında gerçekleştiriyoruz. Belirlenen sürede, bir rota üzerindeki farklı mekanlarda çekim yapabiliyoruz. Otel çekimi istenirse, otel ile anlaşma sağlayabiliyor ve çekim esnasında rahat hissetmenizi desteklemek adına yönlendirme sağlıyoruz.",
      afterShootTitle: "Çekim Sonrası",
      afterShootDescription:
        "Çekimden kalan tüm görüntüleri yüksek çözünürlükte, 1 hafta içinde teslim ediyoruz. Seçilen fotoğraflar düzenlenir, özel albüm ve çerçeve tasarımları hazırlanır. İstediğiniz seçimleriniz tamamlandıktan sonra baskılarınız adresinize kargo ile gönderilir.",
      scheduleType: "outdoor",
      postShootTemplates: defaultOutdoorPostShootTemplates(),
    },
    options: [
      { label: "Fotoğraf", cash: 26000, installment: 32000 },
      { label: "Fotoğraf + Video Film", cash: 37000, installment: 45000 },
    ],
  },
  {
    slug: "dugun",
    title: "Düğün",
    accentColor: "#8fffb0",
    iconKey: "Gem",
    backgroundImage: "dugun.png",
    heroImage: "dugun.png",
    sortOrder: 1,
    content: {
      serviceGridColor: "#93f8b6",
      serviceTextColor: "#0d2d17",
      serviceSubTextColor: "#234c30",
      services: defaultServices(),
      shootTitle: "Çekim",
      shootDescription:
        "Organizasyonunuzun tüm detaylarında size rehberlik ederek çekim sürecini yönetiyoruz. Düğün başlamadan önce salonda buluşup tüm akışı planlıyoruz. Törenin giriş, ilk dans ve eğlence bölümleri en az 2 kamera ile kayıt altına alınıyor.",
      afterShootTitle: "Çekim Sonrası",
      afterShootDescription:
        "Çekilen tüm görüntüleri yüksek çözünürlükte, 1 hafta içinde teslim ediyoruz. Seçtiğiniz müzikle düğün salon filminizi düzenliyor, fotoğrafları baskı ve dijital teslim için hazır hale getiriyoruz.",
      scheduleType: "indoor",
      postShootTemplates: defaultIndoorPostShootTemplates(),
    },
    options: [
      { label: "Video Film", cash: 26000, installment: 32000 },
      { label: "Fotoğraf + Video Film", cash: 35000, installment: 43000 },
    ],
  },
  {
    slug: "gelin-cikisi",
    title: "Gelin Çıkışı",
    accentColor: "#f3d46b",
    iconKey: "Sparkles",
    backgroundImage: "gelin-cikisi.png",
    heroImage: "gelin-cikisi.png",
    sortOrder: 2,
    content: {
      serviceGridColor: "#f3d46b",
      serviceTextColor: "#2e2510",
      serviceSubTextColor: "#574829",
      services: defaultServices(),
      shootTitle: "Çekim",
      shootDescription:
        "Gelin çıkışının tüm detaylarında size rehberlik ederek süreci yönetiyoruz. Damat gelmeden önce gelinin ailesiyle vedalaşma, kurdele bağlama ve aile detaylarını çekiyoruz. Ardından damadın geliş karşılama anı ve çıkış anını da kayıt altına alarak organizasyonu sonlandırıyoruz.",
      afterShootTitle: "Çekim Sonrası",
      afterShootDescription:
        "Çekilen tüm görüntüleri yüksek çözünürlükte teslim ediyoruz. Seçtiğiniz müzikle çıkış filminizi düzenliyor, fotoğrafları dijital ve baskı sürecine hazırlıyoruz.",
      afterShootExtra:
        "Bu hizmet dış çekim veya düğün filmine ek olarak satın alınabilir.",
      scheduleType: "indoor",
      postShootTemplates: defaultIndoorPostShootTemplates(),
    },
    options: [
      { label: "Video Film", cash: 20000, installment: 26000 },
      { label: "Fotoğraf + Video Film", cash: 27000, installment: 35000 },
    ],
  },
  {
    slug: "kuafor",
    title: "Kuaför",
    accentColor: "#f6b8c2",
    iconKey: "UserRound",
    heroImage: "2.jpg",
    sortOrder: 3,
    content: {
      serviceGridColor: "#f6b8c2",
      serviceTextColor: "#2d1a1f",
      serviceSubTextColor: "#5a3640",
      services: [
        {
          title: "Fotoğraf Çekimi",
          subLines: ["Makyaj", "Aksesuarlar"],
          iconKey: "Camera",
        },
        {
          title: "Video Çekimi",
          subLines: ["Film", "Uzun Metraj"],
          iconKey: "Video",
        },
        {
          title: "Rehberlik Hizmeti",
          subLines: ["Gün Planlama", "Öneriler"],
          iconKey: "Compass",
        },
        {
          title: "Tüm Dijitaller",
          subLines: ["Çekilenler", "Düzenlenenler"],
          iconKey: "Download",
        },
      ],
      shootTitle: "Çekim",
      shootDescription:
        "Gelinin kuaförde çiftin hazırlığının son aşamasını, video çekimiyle ve anlaşmaya dahilinde fotoğraf çekimiyle yapıyoruz.",
      afterShootTitle: "Çekim Sonrası",
      afterShootDescription:
        "Çekilen tüm orijinal görüntüleri yüksek çözünürlükte, 1 hafta içinde teslim ediyoruz. Çektiğimiz video görüntülerini dış çekim veya düğün filminde kullanıyor; fotoğraf çekimi varsa düzenleyip dijital olarak teslim ediyoruz.",
      afterShootExtra:
        "Bu hizmet dış çekim veya düğün filmine ek olarak satın alınabilir.",
      scheduleType: "indoor",
      postShootTemplates: defaultIndoorPostShootTemplates(),
    },
    options: [
      { label: "Video Film", cash: 17000, installment: 23000 },
      { label: "Fotoğraf + Video Film", cash: 25000, installment: 32000 },
    ],
  },
  {
    slug: "full-hikaye",
    title: "Full Hikaye",
    accentColor: "#ffb200",
    iconKey: "Diamond",
    highlight: true,
    backgroundImage: "full-hikaye.png",
    heroImage: "full-hikaye.png",
    sortOrder: 4,
    content: {
      serviceGridColor: "#ffb200",
      serviceTextColor: "#231604",
      serviceSubTextColor: "#5a3a0b",
      services: [
        {
          title: "Fotoğraf Çekimi",
          subLines: ["Albüm", "Çerçeveler"],
          iconKey: "Camera",
        },
        {
          title: "Video Çekimi",
          subLines: ["Karma Film", "Uzun Metraj"],
          iconKey: "Video",
        },
        {
          title: "Rehberlik Hizmeti",
          subLines: ["Gün Planlama", "Öneriler"],
          iconKey: "Compass",
        },
        {
          title: "Tüm Dijitaller",
          subLines: ["Çekilenler", "Düzenlenenler"],
          iconKey: "Download",
        },
      ],
      shootTitle: "Çekim",
      shootDescription:
        "Hazırlık, dış çekim, gelin çıkışı ve düğün gününüzün tamamını tek pakette, kesintisiz bir hikaye olarak kayıt altına alıyoruz. Her aşamada size rehberlik ederek tüm süreci planlıyor ve yönetiyoruz.",
      afterShootTitle: "Çekim Sonrası",
      afterShootDescription:
        "Tüm çekimlerden elde edilen görüntüleri yüksek çözünürlükte teslim ediyoruz. Karma film ve uzun metraj düğün filminizi hazırlıyor, albüm ve çerçeve tasarımlarınızı tamamlayıp adresinize gönderiyoruz.",
      scheduleType: "indoor",
      postShootTemplates: defaultIndoorPostShootTemplates(),
    },
    options: [{ label: "Full Hikaye", cash: 95000, installment: 135000 }],
  },
  {
    slug: "soz-isteme",
    title: "Söz/İsteme",
    accentColor: "#c8b5f0",
    iconKey: "HandHeart",
    backgroundImage: "soz-isteme.png",
    heroImage: "soz-isteme.png",
    sortOrder: 5,
    content: {
      serviceGridColor: "#c8b5f0",
      serviceTextColor: "#2b1f44",
      serviceSubTextColor: "#4b3f66",
      services: defaultServices(),
      shootTitle: "Çekim",
      shootDescription:
        "Sözünüzün tüm detaylarında size rehberlik ederek uçtan uca organizasyonu yönetiyoruz. Söz başlamadan önce evde buluşarak tüm akışı birlikte prova ediyoruz. Damat tarafını karşılama, kahve hazırlığı ve ikramı, isteme anı, yüzük merasimi ve detayları en az 2 kamera ile film (video) olarak; anlaşmamız dahilindeyse ek bir kamera ile fotoğraf olarak kayıt altına alıyoruz. Özel bir talep belirtilmediği sürece, takı töreni ve konuk masası çekimleri hizmet kapsamımız dışındadır.",
      afterShootTitle: "Çekim Sonrası",
      afterShootDescription:
        "Çekilen tüm orijinal görüntüleri yüksek çözünürlükte, 1 hafta içinde teslim ediyoruz. Seçtiğimiz bir müzikle söz/isteme filminizi düzenliyoruz. Anlaşmada fotoğraf çekimi varsa fotoğraflar üzerinde baskı ve düzenleme yapılmadan doğal halleriyle dijital olarak teslim ediyoruz.",
      scheduleType: "indoor",
      postShootTemplates: defaultIndoorPostShootTemplates(),
    },
    options: [
      { label: "Video Film", cash: 24000, installment: 29000 },
      { label: "Fotoğraf + Video Film", cash: 32000, installment: 39000 },
    ],
  },
  {
    slug: "kina",
    title: "Kına",
    accentColor: "#ff2b47",
    iconKey: "PartyPopper",
    backgroundImage: "kina.png",
    heroImage: "kina.png",
    sortOrder: 6,
    content: {
      serviceGridColor: "#ff2b47",
      serviceTextColor: "#24070b",
      serviceSubTextColor: "#4c151d",
      services: defaultServices(["Ağıt", "Eğlence"]),
      shootTitle: "Çekim",
      shootDescription:
        "Organizasyonunuzun tüm detaylarında size rehberlik ederek çekim sürecini uçtan uca yönetiyoruz. Kına başlamadan önce salonda buluşarak tüm akışı birlikte prova ediyoruz. Giriş, ağıt ve eğlence bölümlerinin en az 2 kamera ile film (video) olarak; anlaşmamız dahilindeyse ek bir kamera ile fotoğraf olarak kayıt altına alınıyor. Özel bir talep belirtilmediği sürece, takı töreni ve konuk masası çekimleri hizmet kapsamımız dışındadır.",
      afterShootTitle: "Çekim Sonrası",
      afterShootDescription:
        "Çekilen tüm orijinal görüntüleri yüksek çözünürlükte, 1 hafta içinde teslim ediyoruz. Seçtiğimiz bir müzikle kına salon filminizi düzenliyoruz. Anlaşmada fotoğraf çekimi varsa fotoğraflar üzerinde baskı ve düzenleme yapılmadan doğal halleriyle dijital olarak teslim ediliyor.",
      scheduleType: "indoor",
      postShootTemplates: defaultIndoorPostShootTemplates(),
    },
    options: [
      { label: "Video Film", cash: 26000, installment: 32000 },
      { label: "Fotoğraf + Video Film", cash: 35000, installment: 43000 },
    ],
  },
  {
    slug: "nisan",
    title: "Nişan",
    accentColor: "#9beefe",
    iconKey: "HeartHandshake",
    backgroundImage: "nisan.png",
    heroImage: "nisan.png",
    sortOrder: 7,
    content: {
      serviceGridColor: "#9beefe",
      serviceTextColor: "#0b2630",
      serviceSubTextColor: "#2d5060",
      services: defaultServices(),
      shootTitle: "Çekim",
      shootDescription:
        "Organizasyonunuzun tüm detaylarında size rehberlik ederek çekim sürecini uçtan uca yönetiyoruz. Nişan başlamadan önce salonda buluşarak tüm akışı birlikte prova ediyoruz. Törenin giriş, ilk dans, yüzük merasimi ve eğlence bölümlerinin en az 2 kamera ile film (video) olarak; anlaşmamız dahilindeyse ek bir kamera ile fotoğraf olarak kayıt altına alınıyor. Özel bir talep belirtilmediği sürece, takı töreni ve konuk masası çekimleri hizmet kapsamımız dışındadır.",
      afterShootTitle: "Çekim Sonrası",
      afterShootDescription:
        "Çekilen tüm orijinal görüntüleri yüksek çözünürlükte, 1 hafta içinde teslim ediyoruz. Seçtiğimiz bir müzikle nişan salon filminizi düzenliyoruz. Anlaşmada fotoğraf çekimi varsa fotoğraflar üzerinde baskı ve düzenleme yapılmadan doğal halleriyle dijital olarak teslim ediliyor.",
      scheduleType: "indoor",
      postShootTemplates: defaultIndoorPostShootTemplates(),
    },
    options: [
      { label: "Video Film", cash: 25000, installment: 35000 },
      { label: "Fotoğraf + Video Film", cash: 34000, installment: 41000 },
    ],
  },
];
