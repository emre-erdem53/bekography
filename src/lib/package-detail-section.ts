import type { PackageDetailSection } from "@/lib/package-seed-data";
import type { ShootTypeData } from "@/lib/package-types";

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

/** Çekim türünün İncele bölümleri — içerik artık kendi satırında. */
export function getShootTypeDetailSections(
  shootType: Pick<ShootTypeData, "content">,
): PackageDetailSection[] {
  return normalizeDetailSections(shootType.content.detailSections).sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
}

export function isShootTypeInspectEnabled(
  shootType: Pick<ShootTypeData, "content">,
): boolean {
  return shootType.content.inspectEnabled ?? true;
}
