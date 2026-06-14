import type { PackageCategoryContent } from "@/lib/package-seed-data";

export type PostShootSection = {
  pills: string[];
  description: string;
};

export type PostShootTemplates = {
  digital: PostShootSection;
  editing: PostShootSection;
  printing?: PostShootSection;
};

export type PostShootPackageBlock = {
  categoryId: string;
  categorySlug: string;
  categoryTitle: string;
  accentColor: string;
  pills: string[];
  description: string;
};

export type PostShootSectionGroup = {
  items: PostShootPackageBlock[];
};

export type PostShootSnapshot = {
  digital: PostShootSectionGroup;
  editing: PostShootSectionGroup;
  printing?: PostShootSectionGroup;
};

type PackageLike = {
  id: string;
  slug: string;
  title: string;
  accentColor: string;
  content: Partial<PackageCategoryContent>;
};

export function isOutdoorCategory(
  slug: string,
  content: Partial<PackageCategoryContent>,
): boolean {
  return content.scheduleType === "outdoor" || slug === "dis-cekim";
}

function parseSection(value: unknown): PostShootSection {
  if (!value || typeof value !== "object") {
    return { pills: [], description: "" };
  }
  const obj = value as Partial<PostShootSection>;
  return {
    pills: Array.isArray(obj.pills)
      ? obj.pills.filter((p): p is string => typeof p === "string")
      : [],
    description: typeof obj.description === "string" ? obj.description : "",
  };
}

function parsePackageBlock(value: unknown): PostShootPackageBlock | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Partial<PostShootPackageBlock>;
  if (typeof obj.categoryId !== "string") return null;

  const section = parseSection(value);
  return {
    categoryId: obj.categoryId,
    categorySlug: typeof obj.categorySlug === "string" ? obj.categorySlug : "",
    categoryTitle:
      typeof obj.categoryTitle === "string" ? obj.categoryTitle : "Paket",
    accentColor: typeof obj.accentColor === "string" ? obj.accentColor : "#ffffff",
    pills: section.pills,
    description: section.description,
  };
}

function isLegacySectionGroup(value: unknown): value is PostShootSection {
  return (
    !!value &&
    typeof value === "object" &&
    "pills" in value &&
    !("items" in value)
  );
}

function parseSectionGroup(
  value: unknown,
  legacyTitle = "Kayıtlı içerik",
): PostShootSectionGroup {
  if (!value || typeof value !== "object") {
    return { items: [] };
  }

  if (isLegacySectionGroup(value)) {
    const section = parseSection(value);
    if (section.pills.length === 0 && !section.description.trim()) {
      return { items: [] };
    }
    return {
      items: [
        {
          categoryId: "__legacy__",
          categorySlug: "",
          categoryTitle: legacyTitle,
          accentColor: "#ffffff",
          pills: section.pills,
          description: section.description,
        },
      ],
    };
  }

  const obj = value as Partial<PostShootSectionGroup>;
  if (!Array.isArray(obj.items)) {
    return { items: [] };
  }

  return {
    items: obj.items
      .map(parsePackageBlock)
      .filter((block): block is PostShootPackageBlock => block !== null),
  };
}

export function emptyPostShootSnapshot(): PostShootSnapshot {
  return {
    digital: { items: [] },
    editing: { items: [] },
  };
}

export function parsePostShootSnapshot(value: unknown): PostShootSnapshot {
  if (!value || typeof value !== "object") {
    return emptyPostShootSnapshot();
  }

  const data = value as Partial<PostShootSnapshot>;
  const snapshot: PostShootSnapshot = {
    digital: parseSectionGroup(data.digital),
    editing: parseSectionGroup(data.editing),
  };

  if (data.printing) {
    const printing = parseSectionGroup(data.printing);
    if (printing.items.length > 0) {
      snapshot.printing = printing;
    }
  }

  return snapshot;
}

export function getUniqueCategoriesFromItems(
  items: { packageOptionId: string }[],
  categories: (PackageLike & { options?: { id: string }[] })[],
): PackageLike[] {
  const seen = new Set<string>();
  const result: PackageLike[] = [];

  for (const item of items) {
    const category = categories.find((c) =>
      c.options?.some((o) => o.id === item.packageOptionId),
    );
    if (!category || seen.has(category.id)) continue;
    seen.add(category.id);
    result.push(category);
  }

  return result;
}

export function syncPostShootWithItems(
  current: PostShootSnapshot,
  items: { packageOptionId: string }[],
  categories: (PackageLike & { options?: { id: string }[] })[],
  options?: { forceReset?: boolean },
): PostShootSnapshot {
  const forceReset = options?.forceReset ?? false;
  const activeCategories = getUniqueCategoriesFromItems(items, categories);

  function syncGroup(
    sectionKey: "digital" | "editing" | "printing",
    getTemplate: (category: PackageLike) => PostShootSection | undefined,
  ): PostShootSectionGroup {
    const currentItems = current[sectionKey]?.items ?? [];
    const nextItems: PostShootPackageBlock[] = [];

    for (const category of activeCategories) {
      const template = getTemplate(category);

      if (sectionKey === "printing") {
        if (
          !template ||
          isOutdoorCategory(category.slug, category.content)
        ) {
          continue;
        }
      } else if (!template) {
        continue;
      }

      const existing = currentItems.find(
        (block) => block.categoryId === category.id,
      );

      if (existing && !forceReset) {
        nextItems.push({
          ...existing,
          categorySlug: category.slug,
          categoryTitle: category.title,
          accentColor: category.accentColor,
        });
      } else {
        nextItems.push({
          categoryId: category.id,
          categorySlug: category.slug,
          categoryTitle: category.title,
          accentColor: category.accentColor,
          pills: [...(template?.pills ?? [])],
          description: template?.description ?? "",
        });
      }
    }

    return { items: nextItems };
  }

  const digital = syncGroup(
    "digital",
    (category) => category.content.postShootTemplates?.digital,
  );
  const editing = syncGroup(
    "editing",
    (category) => category.content.postShootTemplates?.editing,
  );
  const printing = syncGroup(
    "printing",
    (category) => category.content.postShootTemplates?.printing,
  );

  const snapshot: PostShootSnapshot = { digital, editing };

  if (printing.items.length > 0) {
    snapshot.printing = printing;
  }

  return snapshot;
}

export function shouldShowPrintingSection(
  categories: {
    slug: string;
    content: Partial<PackageCategoryContent>;
  }[],
): boolean {
  return categories.some(
    (category) =>
      !isOutdoorCategory(category.slug, category.content) &&
      Boolean(category.content.postShootTemplates?.printing),
  );
}
