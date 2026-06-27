import type {
  PackageCategoryContent,
  PackageDetailSection,
} from "@/lib/package-seed-data";

export function parseDetailSectionTitle(title: string): {
  title: string;
  tags: string[];
} {
  const tags: string[] = [];
  const tagPattern = /\(([^)]+)\)/g;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(title)) !== null) {
    const tag = match[1]?.trim();
    if (tag) tags.push(tag);
  }

  const cleanTitle = title.replace(/\s*\([^)]+\)/g, "").trim();

  return {
    title: cleanTitle || title.trim(),
    tags,
  };
}

export function normalizeDetailSection(
  section: PackageDetailSection,
): PackageDetailSection {
  const existingTags = section.tags ?? [];

  if (existingTags.length > 0) {
    return { ...section, tags: existingTags };
  }

  if (!section.title.includes("(")) {
    return { ...section, tags: [] };
  }

  const parsed = parseDetailSectionTitle(section.title);
  return {
    ...section,
    title: parsed.title,
    tags: parsed.tags,
  };
}

export function normalizeDetailSections(
  sections: PackageDetailSection[] | undefined,
): PackageDetailSection[] {
  return (sections ?? []).map(normalizeDetailSection);
}

/** Paket detay / İncele: option id ve etiket anahtarlarından en zengin listeyi seçer. */
export function resolveDetailSectionsForOption(
  content: Partial<PackageCategoryContent>,
  packageOptionId: string,
  optionLabel?: string,
): PackageDetailSection[] {
  const byOption = content.detailSectionsByOption ?? {};
  const trimmedLabel = optionLabel?.trim() ?? "";
  const candidateKeys = [
    packageOptionId,
    trimmedLabel,
    optionLabel ?? "",
  ].filter(Boolean);

  const lists: PackageDetailSection[][] = [];
  for (const key of candidateKeys) {
    if (byOption[key]?.length) {
      lists.push(byOption[key]);
    }
  }

  if (lists.length === 0) {
    const lowerLabel = trimmedLabel.toLocaleLowerCase("tr");
    for (const [key, sections] of Object.entries(byOption)) {
      if (!sections.length) continue;
      if (
        key === packageOptionId ||
        key.trim().toLocaleLowerCase("tr") === lowerLabel
      ) {
        lists.push(sections);
      }
    }
  }

  if (lists.length === 0) {
    return normalizeDetailSections(content.detailSections).sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
  }

  const best = lists.reduce((longest, current) =>
    current.length > longest.length ? current : longest,
  );

  return normalizeDetailSections(best).sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
}
