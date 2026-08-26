export type PackageServiceItem = {
  title: string;
  subLines: string[];
  iconKey: string;
};

export type PackageGalleryImage = {
  url: string;
  alt?: string;
};

export type PackageGalleryMedia = {
  url: string;
  alt?: string;
  type?: "image" | "video";
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

export type PackageWorkflowStageDefinition = {
  id: string;
  label: string;
  kind: "builtin" | "custom";
  builtinKey?:
    | "rezervasyon"
    | "cekim"
    | "dijital"
    | "secim"
    | "duzenleme"
    | "baski";
  daysAfterPrevious?: number;
};

/** Hizmet alanı düzeyinde kalan içerik. Çekim türüne ait olan her şey ShootTypeContent'e taşındı. */
export type ServiceAreaContent = {
  services: PackageServiceItem[];
  requestFieldLabels?: PackageRequestFieldLabels;
};

/** Bir çekim türünün kendi satırında yaşayan içeriği. */
export type ShootTypeContent = {
  galleryMedia?: PackageGalleryMedia[];
  detailSections?: PackageDetailSection[];
  inspectEnabled?: boolean;
  workflowStages?: PackageWorkflowStageDefinition[];
  /** Takip ekranı süreç etiketleri — aşama id veya built-in key. */
  workflowStageTags?: Record<string, string[]>;
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

export type SeedShootType = {
  label: string;
  cash: number;
  installment: number;
  tags?: string[];
};

export type SeedPackage = {
  slug: string;
  title: string;
  sortOrder: number;
  tags?: string[];
  shootTypes: SeedShootType[];
};

export type SeedServiceArea = {
  slug: string;
  title: string;
  accentColor: string;
  iconKey: string;
  highlight?: boolean;
  backgroundImage?: string;
  heroImage?: string;
  sortOrder: number;
  scheduleType: "outdoor" | "indoor";
  isCompanionOnly?: boolean;
  tags?: string[];
  content: ServiceAreaContent;
  packages: SeedPackage[];
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

/** Her hizmet alanında 3 paket; her pakette Fotoğraf + Fotoğraf/Video. */
const photoAndVideoShootTypes = (
  photoCash: number,
  photoInstallment: number,
  comboCash: number,
  comboInstallment: number,
): SeedShootType[] => [
  { label: "Fotoğraf", cash: photoCash, installment: photoInstallment },
  {
    label: "Fotoğraf + Video",
    cash: comboCash,
    installment: comboInstallment,
  },
];

const primePackages = (
  photoCash: number,
  photoInstallment: number,
  comboCash: number,
  comboInstallment: number,
): SeedPackage[] => {
  const shootTypes = photoAndVideoShootTypes(
    photoCash,
    photoInstallment,
    comboCash,
    comboInstallment,
  );
  return [
    {
      slug: "sade-prime",
      title: "Sade Prime",
      sortOrder: 0,
      shootTypes: shootTypes.map((shootType) => ({ ...shootType })),
    },
    {
      slug: "super-prime",
      title: "Süper Prime",
      sortOrder: 1,
      shootTypes: shootTypes.map((shootType) => ({
        ...shootType,
        cash: Math.round(shootType.cash * 1.2),
        installment: Math.round(shootType.installment * 1.2),
      })),
    },
    {
      slug: "ultra-prime",
      title: "Ultra Prime",
      sortOrder: 2,
      shootTypes: shootTypes.map((shootType) => ({
        ...shootType,
        cash: Math.round(shootType.cash * 1.45),
        installment: Math.round(shootType.installment * 1.45),
      })),
    },
  ];
};

export const seedServiceAreas: SeedServiceArea[] = [
  {
    slug: "dis-cekim",
    title: "Dış Çekim",
    accentColor: "#ff9a5e",
    iconKey: "Mountain",
    backgroundImage: "dis-cekim.png",
    heroImage: "dis-cekim.png",
    sortOrder: 0,
    scheduleType: "outdoor",
    content: {
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
    },
    packages: primePackages(26000, 32000, 37000, 45000),
  },
  {
    slug: "dugun",
    title: "Düğün",
    accentColor: "#8fffb0",
    iconKey: "Gem",
    backgroundImage: "dugun.png",
    heroImage: "dugun.png",
    sortOrder: 1,
    scheduleType: "indoor",
    content: { services: defaultServices() },
    packages: primePackages(26000, 32000, 35000, 43000),
  },
  {
    slug: "gelin-cikisi",
    title: "Gelin Çıkışı",
    accentColor: "#f3d46b",
    iconKey: "Sparkles",
    backgroundImage: "gelin-cikisi.png",
    heroImage: "gelin-cikisi.png",
    sortOrder: 2,
    scheduleType: "indoor",
    isCompanionOnly: true,
    content: { services: defaultServices() },
    packages: primePackages(20000, 26000, 27000, 35000),
  },
  {
    slug: "kuafor",
    title: "Kuaför",
    accentColor: "#f6b8c2",
    iconKey: "UserRound",
    heroImage: "2.jpg",
    sortOrder: 3,
    scheduleType: "indoor",
    isCompanionOnly: true,
    content: {
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
    },
    packages: primePackages(17000, 23000, 25000, 32000),
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
    scheduleType: "indoor",
    content: {
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
    },
    packages: primePackages(75000, 95000, 95000, 135000),
  },
  {
    slug: "soz-isteme",
    title: "Söz/İsteme",
    accentColor: "#c8b5f0",
    iconKey: "HandHeart",
    backgroundImage: "soz-isteme.png",
    heroImage: "soz-isteme.png",
    sortOrder: 5,
    scheduleType: "indoor",
    content: { services: defaultServices() },
    packages: primePackages(24000, 29000, 32000, 39000),
  },
  {
    slug: "kina",
    title: "Kına",
    accentColor: "#ff2b47",
    iconKey: "PartyPopper",
    backgroundImage: "kina.png",
    heroImage: "kina.png",
    sortOrder: 6,
    scheduleType: "indoor",
    content: { services: defaultServices(["Ağıt", "Eğlence"]) },
    packages: primePackages(26000, 32000, 35000, 43000),
  },
  {
    slug: "nisan",
    title: "Nişan",
    accentColor: "#9beefe",
    iconKey: "HeartHandshake",
    backgroundImage: "nisan.png",
    heroImage: "nisan.png",
    sortOrder: 7,
    scheduleType: "indoor",
    content: { services: defaultServices() },
    packages: primePackages(25000, 35000, 34000, 41000),
  },
];
