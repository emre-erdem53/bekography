import type {
  PackageCategoryContent,
  PackageDetailSection,
} from "@/lib/package-seed-data";

export const STANDARD_INSPECT_SECTION_TITLES = [
  "Dijital",
  "Düzenleme",
  "Baskı",
] as const;

const DEFAULT_DIGITAL = {
  tags: ["Tüm Çekilenler", "7 Günde Hazır", "30 Günde Alınmalı"],
  body: "Çekimden kalan tüm görüntüleri yüksek çözünürlükte, 7 gün içinde indirme linki veya harici disk ile teslim ediyoruz. Teslimden sonra 30 gün içinde alınmalıdır.",
};

const DEFAULT_EDITING_INDOOR = {
  tags: ["Seçim", "Film", "70 Gün"],
  body: "Seçimlerden sonra en geç 70 günde salonda çekilen fotoğraflardan seçilen kadar fotoğraf ve videolardan düzenlenen bir salon filmi teslim edilir.",
};

const DEFAULT_EDITING_OUTDOOR = {
  tags: ["18 Fotoğraf", "Dış Çekim Filmi", "70 Gün"],
  body: "Seçimlerden sonra en geç 70 günde dış çekimde çekilen fotoğraflardan 18 fotoğraf ve dış çekim videolarından 30-60 saniye arasında değişen bir dış çekim filmi düzenlenir.",
};

const DEFAULT_PRINTING = {
  tags: ["Albüm", "3 Çerçeve", "30 Gün"],
  body: "30x60x2,5 cm albüm (7 sayfa, 5 fotoğraf, mat) ve 25x25x3 cm 3 adet çerçeve 30 gün içinde ücretsiz kargo ile adresinize gönderilir.",
};

export function buildDefaultInspectSections(
  slug: string,
  scheduleType: PackageCategoryContent["scheduleType"] = "indoor",
): PackageDetailSection[] {
  const isOutdoor = scheduleType === "outdoor" || slug === "dis-cekim";
  const sections: PackageDetailSection[] = [
    {
      id: "dijital",
      title: "Dijital",
      body: DEFAULT_DIGITAL.body,
      tags: DEFAULT_DIGITAL.tags,
      sortOrder: 0,
    },
    {
      id: "duzenleme",
      title: "Düzenleme",
      body: isOutdoor ? DEFAULT_EDITING_OUTDOOR.body : DEFAULT_EDITING_INDOOR.body,
      tags: isOutdoor ? DEFAULT_EDITING_OUTDOOR.tags : DEFAULT_EDITING_INDOOR.tags,
      sortOrder: 1,
    },
  ];

  if (isOutdoor) {
    sections.push({
      id: "baski",
      title: "Baskı",
      body: DEFAULT_PRINTING.body,
      tags: DEFAULT_PRINTING.tags,
      sortOrder: 2,
    });
  }

  return sections;
}

export function ensureDefaultInspectSectionsForOption(
  content: Partial<PackageCategoryContent>,
  optionKey: string,
  slug: string,
): Partial<PackageCategoryContent> {
  const existing = content.detailSectionsByOption?.[optionKey] ?? [];
  if (existing.length > 0) {
    return content;
  }

  return {
    ...content,
    detailSectionsByOption: {
      ...(content.detailSectionsByOption ?? {}),
      [optionKey]: buildDefaultInspectSections(slug, content.scheduleType),
    },
  };
}
