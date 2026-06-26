import type { PackageCategoryContent, PackageDetailSection } from "@/lib/package-seed-data";
import { normalizeDetailSections } from "@/lib/package-detail-section";
import type { PostShootSection, PostShootSnapshot } from "@/lib/post-shoot";

export type PostShootSectionKind = "digital" | "editing" | "printing";

type InspectPackageItem = {
  packageOptionId: string;
  categoryTitle?: string;
};

export type InspectCategory = {
  slug: string;
  title: string;
  content: Partial<PackageCategoryContent>;
  options?: { id: string; label: string }[];
};

type SectionContribution = {
  packageTitle: string;
  categorySlug: string;
  pills: string[];
  description: string;
};

function emptySection(): PostShootSection {
  return { pills: [], description: "" };
}

export function normalizePostShootSectionTitle(
  title: string,
): PostShootSectionKind | null {
  const key = title.trim().toLocaleLowerCase("tr");
  if (key === "dijital" || key.startsWith("dijital ")) return "digital";
  if (key === "düzenleme" || key === "duzenleme" || key.startsWith("düzenle"))
    return "editing";
  if (key === "baskı" || key === "baski" || key.startsWith("bask")) return "printing";
  return null;
}

export function isPrintingCategorySlug(slug: string): boolean {
  return slug === "dis-cekim";
}

export function getDetailSectionsForOption(
  content: Partial<PackageCategoryContent>,
  packageOptionId: string,
  optionLabel?: string,
): PackageDetailSection[] {
  const byOption = content.detailSectionsByOption ?? {};
  const scoped =
    byOption[packageOptionId] ??
    (optionLabel ? byOption[optionLabel.trim()] : undefined) ??
    content.detailSections;
  return normalizeDetailSections(scoped).sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
}

function detailSectionToPostShoot(section: PackageDetailSection): PostShootSection {
  return {
    pills: [...(section.tags ?? [])].filter(Boolean),
    description: section.body.trim(),
  };
}

function formatContributionSentence(
  packageTitle: string,
  description: string,
): string {
  const body = description.trim();
  if (!body) return "";
  const endsWithPunctuation = /[.!?…]$/.test(body);
  const sentence = endsWithPunctuation ? body : `${body}.`;
  return `${packageTitle} için ${sentence.charAt(0).toLowerCase()}${sentence.slice(1)}`;
}

function mergeContributions(contributions: SectionContribution[]): PostShootSection {
  if (contributions.length === 0) return emptySection();

  const pills = [
    ...new Set(contributions.flatMap((entry) => entry.pills).filter(Boolean)),
  ];

  const descriptions = contributions
    .map((entry) => formatContributionSentence(entry.packageTitle, entry.description))
    .filter(Boolean);

  if (descriptions.length === 0) {
    return { pills, description: "" };
  }

  if (descriptions.length === 1) {
    return { pills, description: descriptions[0] };
  }

  const last = descriptions[descriptions.length - 1];
  const rest = descriptions.slice(0, -1);
  return {
    pills,
    description: `${rest.join(" ")} Ayrıca, ${last.charAt(0).toLowerCase()}${last.slice(1)}`,
  };
}

function collectContributions(
  items: InspectPackageItem[],
  categories: InspectCategory[],
  kind: PostShootSectionKind,
  options?: { printingOnlyOutdoor?: boolean },
): SectionContribution[] {
  const contributions: SectionContribution[] = [];

  for (const item of items) {
    const category = categories.find((entry) =>
      entry.options?.some((option) => option.id === item.packageOptionId),
    );
    if (!category) continue;

    if (options?.printingOnlyOutdoor && kind === "printing") {
      if (!isPrintingCategorySlug(category.slug)) continue;
    }

    const option = category.options?.find(
      (entry) => entry.id === item.packageOptionId,
    );
    const sections = getDetailSectionsForOption(
      category.content,
      item.packageOptionId,
      option?.label,
    );

    for (const section of sections) {
      const mapped = normalizePostShootSectionTitle(section.title);
      if (mapped !== kind) continue;

      const mappedSection = detailSectionToPostShoot(section);
      if (!mappedSection.description && mappedSection.pills.length === 0) continue;

      contributions.push({
        packageTitle: item.categoryTitle?.trim() || category.title,
        categorySlug: category.slug,
        pills: mappedSection.pills,
        description: mappedSection.description,
      });
    }
  }

  return contributions;
}

export function buildPostShootFromInspect(
  items: InspectPackageItem[],
  categories: InspectCategory[],
): PostShootSnapshot {
  const digital = mergeContributions(
    collectContributions(items, categories, "digital"),
  );
  const editing = mergeContributions(
    collectContributions(items, categories, "editing"),
  );
  const printing = mergeContributions(
    collectContributions(items, categories, "printing", {
      printingOnlyOutdoor: true,
    }),
  );

  return {
    digital,
    editing,
    printing,
    source: "inspect",
  };
}

export function reservationHasPrintingPackage(
  items: InspectPackageItem[],
  categories: InspectCategory[],
): boolean {
  return items.some((item) => {
    const category = categories.find((entry) =>
      entry.options?.some((option) => option.id === item.packageOptionId),
    );
    return category ? isPrintingCategorySlug(category.slug) : false;
  });
}

export function syncPostShootWithInspectItems(
  current: PostShootSnapshot,
  items: InspectPackageItem[],
  categories: InspectCategory[],
  options?: { forceReset?: boolean },
): PostShootSnapshot {
  if (current.source === "manual" && !options?.forceReset) {
    return current;
  }

  const built = buildPostShootFromInspect(items, categories);
  return {
    ...built,
    workflow: current.workflow,
    itemWorkflows: current.itemWorkflows,
  };
}

export function hasPostShootSectionContent(section: PostShootSection): boolean {
  return section.pills.length > 0 || section.description.trim().length > 0;
}
