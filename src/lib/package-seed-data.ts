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
  /** Vitrinde başlığın altında italic gösterilen kısa açıklama. */
  subtitle?: string;
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
  { title: "Fotoğraf Çekimi", subLines, iconKey: "Camera" },
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

function st(
  label: string,
  cash: number,
  installment: number,
): SeedShootType {
  return { label, cash, installment };
}

function pkg(
  slug: string,
  title: string,
  sortOrder: number,
  tags: string[],
  shootTypes: SeedShootType[],
): SeedPackage {
  return { slug, title, sortOrder, tags, shootTypes };
}

/** Salon tipi: Video Film veya Fotoğraf + Video Film. */
function salonShootTypes(
  videoCash: number,
  videoInstallment: number,
  comboCash: number,
  comboInstallment: number,
): SeedShootType[] {
  return [
    st("Video Film", videoCash, videoInstallment),
    st("Fotoğraf + Video Film", comboCash, comboInstallment),
  ];
}

/** Dış çekim combo etiketi fiyat listesine göre. */
function outdoorCombo(
  cash: number,
  installment: number,
): SeedShootType {
  return st("Video Film + Fotoğraf", cash, installment);
}

/** Sadece Fotoğraf + Video Film kombosu. */
function comboOnly(cash: number, installment: number): SeedShootType[] {
  return [st("Fotoğraf + Video Film", cash, installment)];
}

export const seedServiceAreas: SeedServiceArea[] = [
  {
    slug: "hazirlik-bride",
    title: "Hazırlık Bride",
    accentColor: "#f6b8c2",
    iconKey: "UserRound",
    sortOrder: 0,
    scheduleType: "indoor",
    isCompanionOnly: true,
    content: {
      subtitle: "Gelin & Damat Hazırlığı, İlk Görüş",
      services: defaultServices(["Makyaj", "Hazırlık"]),
    },
    packages: [
      pkg(
        "standart",
        "Standart",
        0,
        ["1 Saat Süre", "Rize Şehir Merkezi"],
        salonShootTypes(19000, 21000, 21000, 24000),
      ),
    ],
  },
  {
    slug: "dis-cekim",
    title: "Dış Çekim",
    accentColor: "#ff9a5e",
    iconKey: "/deneme.png",
    backgroundImage: "dis-cekim.png",
    heroImage: "dis-cekim.png",
    sortOrder: 1,
    scheduleType: "outdoor",
    content: {
      subtitle: "Albüm, Çerçeve Seti | Vadi, Sahil & Yayla Rotaları",
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
    packages: [
      pkg(
        "sade-prime",
        "Sade Prime",
        0,
        ["10.00-12.00", "2 Saat Süre", "Tek Mekan", "30 km Sınırlı"],
        [st("Fotoğraf", 19000, 21000)],
      ),
      pkg(
        "standart-prime",
        "Standart Prime",
        1,
        ["13.00-17.00", "4 Saat Süre", "3+ Mekan", "Vadi Rotalı"],
        [
          st("Fotoğraf", 25000, 28500),
          outdoorCombo(37000, 42000),
        ],
      ),
      pkg(
        "sahil-prime",
        "Sahil Prime",
        2,
        ["14.00-Gün Batımı", "4+ Saat Süre", "4+ Mekan", "Sahilde Bitiş"],
        [
          st("Fotoğraf", 33000, 37500),
          outdoorCombo(43000, 48000),
        ],
      ),
      pkg(
        "zirve-prime",
        "Zirve Prime",
        3,
        ["13.00-Gün Batımı", "7+ Saat Süre", "4+ Mekan", "Zirvede Bitiş"],
        [
          st("Fotoğraf", 39000, 45000),
          outdoorCombo(49000, 55500),
        ],
      ),
    ],
  },
  {
    slug: "dugun-salon",
    title: "Düğün Salon",
    accentColor: "#8fffb0",
    iconKey: "/deneme2.png",
    backgroundImage: "dugun.png",
    heroImage: "dugun.png",
    sortOrder: 2,
    scheduleType: "indoor",
    content: {
      subtitle: "Sadece güzel bir çekim değil stressiz bir düğün.",
      services: defaultServices(),
    },
    packages: [
      pkg(
        "giris-dans",
        "Giriş & Dans",
        0,
        ["1 Saat Süre", "Giriş", "Dans", "Varsa Nikah"],
        salonShootTypes(19000, 21000, 22000, 25000),
      ),
      pkg(
        "giris-dans-eglence",
        "Giriş, Dans, Eğlence",
        1,
        ["4 Saat Süre", "Giriş", "Dans", "Varsa Nikah", "Eğlence"],
        salonShootTypes(27000, 30000, 32000, 36000),
      ),
    ],
  },
  {
    slug: "full-dugun-gunu",
    title: "Full Düğün Günü",
    accentColor: "#ffb200",
    iconKey: "Diamond",
    highlight: true,
    backgroundImage: "full-hikaye.png",
    heroImage: "full-hikaye.png",
    sortOrder: 3,
    scheduleType: "indoor",
    content: {
      subtitle: "En çok tercih edilen, kampanyalı",
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
    packages: [
      pkg(
        "romantik-full",
        "Romantik Full",
        0,
        ["13.00-20.00", "Dış Çekim", "Gelin Çıkışı", "Düğün Giriş"],
        comboOnly(75000, 85500),
      ),
      pkg(
        "prime-full",
        "Prime Full",
        1,
        ["12.00-23.00", "Hazırlık", "Dış Çekim", "Gelin Çıkışı", "Düğün Full"],
        comboOnly(95000, 108000),
      ),
    ],
  },
  {
    slug: "gelin-cikisi",
    title: "Gelin Çıkışı",
    accentColor: "#f3d46b",
    iconKey: "Sparkles",
    backgroundImage: "gelin-cikisi.png",
    heroImage: "gelin-cikisi.png",
    sortOrder: 4,
    scheduleType: "indoor",
    isCompanionOnly: true,
    content: {
      subtitle: "Konvoy, Vedalaşma, Ritüeller",
      services: defaultServices(),
    },
    packages: [
      pkg(
        "standart",
        "Standart",
        0,
        ["1 Saat Süre", "Rize Şehir Merkezi"],
        salonShootTypes(19000, 21000, 22000, 25000),
      ),
    ],
  },
  {
    slug: "soz",
    title: "Söz",
    accentColor: "#c8b5f0",
    iconKey: "HandHeart",
    backgroundImage: "soz-isteme.png",
    heroImage: "soz-isteme.png",
    sortOrder: 5,
    scheduleType: "indoor",
    content: {
      subtitle: "Karşılama, Kahveler, İsteme, Yüzükler",
      services: defaultServices(),
    },
    packages: [
      pkg(
        "rize-merkez",
        "Rize Merkez",
        0,
        ["2 Saat Süre", "Rize Şehir Merkezi"],
        salonShootTypes(24000, 27000, 27000, 30000),
      ),
      pkg(
        "ilce-koyler",
        "İlçeler & Köyler",
        1,
        ["2 Saat Süre", "İlçeler & Köyler"],
        salonShootTypes(29000, 33000, 32000, 36000),
      ),
    ],
  },
  {
    slug: "nisan-salon",
    title: "Nişan Salon",
    accentColor: "#9beefe",
    iconKey: "HeartHandshake",
    backgroundImage: "nisan.png",
    heroImage: "nisan.png",
    sortOrder: 6,
    scheduleType: "indoor",
    content: {
      subtitle: "Giriş, Dans, Yüzük Merasimi, Eğlence",
      services: defaultServices(),
    },
    packages: [
      pkg(
        "giris-dans",
        "Giriş & Dans",
        0,
        ["1 Saat Süre", "Giriş", "Dans", "Yüzükler", "Rize Şehir Merkezi"],
        salonShootTypes(19000, 21000, 22000, 25000),
      ),
      pkg(
        "giris-dans-eglence",
        "Giriş, Dans, Eğlence",
        1,
        ["4 Saat Süre", "Giriş", "Dans", "Yüzükler", "Eğlence"],
        salonShootTypes(27000, 30000, 32000, 36000),
      ),
    ],
  },
  {
    slug: "soz-nisan-salon",
    title: "Söz + Nişan Salon",
    accentColor: "#b8a0e8",
    iconKey: "Handshake",
    sortOrder: 7,
    scheduleType: "indoor",
    content: {
      subtitle: "Konvoy, Kahve İkramı, İsteme, Giriş, Dans, Yüzükler, Eğlence",
      services: defaultServices(),
    },
    packages: [
      pkg(
        "rize-merkez",
        "Rory Merkez",
        0,
        ["6 Saat Süre", "Rize Şehir Merkezi"],
        salonShootTypes(42000, 48000, 47000, 54000),
      ),
      pkg(
        "ilce-koyler",
        "İlçeler & Köyler",
        1,
        ["6 Saat Süre", "İlçeler & Köyler"],
        salonShootTypes(47000, 54000, 53000, 60000),
      ),
    ],
  },
  {
    slug: "kina-salon",
    title: "Kına Salon",
    accentColor: "#ff2b47",
    iconKey: "PartyPopper",
    backgroundImage: "kina.png",
    heroImage: "kina.png",
    sortOrder: 8,
    scheduleType: "indoor",
    content: {
      subtitle: "Giriş, Ağıt, Kına Yakma, Eğlence",
      services: defaultServices(["Ağıt", "Eğlence"]),
    },
    packages: [
      pkg(
        "giris-agit",
        "Giriş & Ağıt",
        0,
        ["1 Saat Süre", "Giriş", "Ağıt", "Kına Yakma", "Rize Şehir Merkezi"],
        salonShootTypes(19000, 21000, 22000, 25000),
      ),
      pkg(
        "giris-agit-eglence",
        "Giriş, Ağıt, Eğlence",
        1,
        ["4 Saat Süre", "Giriş", "Ağıt", "Eğlence", "After"],
        salonShootTypes(27000, 30000, 33000, 36000),
      ),
    ],
  },
];
