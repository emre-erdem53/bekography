import { buildDefaultInspectSections } from "@/lib/default-inspect-sections";

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

export type PackageCategoryContent = {
  serviceGridColor: string;
  serviceTextColor: string;
  serviceSubTextColor: string;
  services: PackageServiceItem[];
  scheduleType?: "outdoor" | "indoor";
  highlightTags?: string[];
  highlightTagsByOption?: Record<string, string[]>;
  optionIconKeys?: Record<string, string>;
  galleryImages?: PackageGalleryImage[];
  galleryMediaByOption?: Record<string, PackageGalleryMedia[]>;
  detailSections?: PackageDetailSection[];
  detailSectionsByOption?: Record<string, PackageDetailSection[]>;
  inspectEnabledByOption?: Record<string, boolean>;
  /** Takip ekranı süreç etiketleri — aşama id veya built-in key. */
  workflowStageTagsByOption?: Record<
    string,
    Partial<Record<string, string[]>>
  >;
  /** Paket varsayılan süreç aşamaları. */
  workflowStages?: PackageWorkflowStageDefinition[];
  /** Çekim türüne göre süreç aşamaları (option id veya label anahtarı). */
  workflowStagesByOption?: Record<string, PackageWorkflowStageDefinition[]>;
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

export function enrichSeedCategoryContent(
  slug: string,
  content: PackageCategoryContent,
  optionLabels: string[],
): PackageCategoryContent {
  const detailSectionsByOption = { ...(content.detailSectionsByOption ?? {}) };

  for (const label of optionLabels) {
    if (!detailSectionsByOption[label]?.length) {
      detailSectionsByOption[label] = buildDefaultInspectSections(
        slug,
        content.scheduleType,
      );
    }
  }

  return {
    ...content,
    detailSectionsByOption,
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
      scheduleType: "outdoor",
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
      scheduleType: "indoor",
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
      scheduleType: "indoor",
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
      scheduleType: "indoor",
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
      scheduleType: "indoor",
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
      scheduleType: "indoor",
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
      scheduleType: "indoor",
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
      scheduleType: "indoor",
    },
    options: [
      { label: "Video Film", cash: 25000, installment: 35000 },
      { label: "Fotoğraf + Video Film", cash: 34000, installment: 41000 },
    ],
  },
];
