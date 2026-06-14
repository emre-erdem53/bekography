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

export type PostShootSnapshot = PostShootTemplates;

export function isOutdoorCategory(
  slug: string,
  content: Partial<PackageCategoryContent>,
): boolean {
  return content.scheduleType === "outdoor" || slug === "dis-cekim";
}

function mergeSection(
  sections: PostShootSection[],
): PostShootSection {
  const pills = [...new Set(sections.flatMap((s) => s.pills).filter(Boolean))];
  const description = sections
    .map((s) => s.description.trim())
    .filter(Boolean)
    .join("\n\n");

  return { pills, description };
}

export function mergePostShootTemplates(
  categories: {
    slug: string;
    content: Partial<PackageCategoryContent>;
  }[],
): PostShootSnapshot {
  const digitalSections: PostShootSection[] = [];
  const editingSections: PostShootSection[] = [];
  const printingSections: PostShootSection[] = [];

  for (const category of categories) {
    const templates = category.content.postShootTemplates;
    if (!templates) continue;

    if (templates.digital) digitalSections.push(templates.digital);
    if (templates.editing) editingSections.push(templates.editing);
    if (
      templates.printing &&
      !isOutdoorCategory(category.slug, category.content)
    ) {
      printingSections.push(templates.printing);
    }
  }

  const result: PostShootSnapshot = {
    digital: mergeSection(
      digitalSections.length > 0
        ? digitalSections
        : [{ pills: [], description: "" }],
    ),
    editing: mergeSection(
      editingSections.length > 0
        ? editingSections
        : [{ pills: [], description: "" }],
    ),
  };

  if (printingSections.length > 0) {
    result.printing = mergeSection(printingSections);
  }

  return result;
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

export function emptyPostShootSnapshot(): PostShootSnapshot {
  const empty = { pills: [] as string[], description: "" };
  return { digital: { ...empty }, editing: { ...empty } };
}

export function parsePostShootSnapshot(value: unknown): PostShootSnapshot {
  if (!value || typeof value !== "object") {
    return emptyPostShootSnapshot();
  }

  const data = value as Partial<PostShootSnapshot>;
  const section = (s: unknown): PostShootSection => {
    if (!s || typeof s !== "object") return { pills: [], description: "" };
    const obj = s as Partial<PostShootSection>;
    return {
      pills: Array.isArray(obj.pills)
        ? obj.pills.filter((p): p is string => typeof p === "string")
        : [],
      description: typeof obj.description === "string" ? obj.description : "",
    };
  };

  const snapshot: PostShootSnapshot = {
    digital: section(data.digital),
    editing: section(data.editing),
  };

  if (data.printing) {
    snapshot.printing = section(data.printing);
  }

  return snapshot;
}
