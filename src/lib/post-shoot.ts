import type { PackageCategoryContent } from "@/lib/package-seed-data";
import {
  getDefaultPostShootTokensForCategory,
  type PostShootTemplateSettingsData,
  type PostShootVariableDefinition,
} from "@/lib/post-shoot-template-settings";

export type PostShootSection = {
  pills: string[];
  description: string;
};

/** @deprecated Paket bazlı şablonlar kaldırıldı; global şablon + token kullanın. */
export type PostShootTemplates = {
  digital: PostShootSection;
  editing: PostShootSection;
  printing?: PostShootSection;
};

export type PostShootSnapshot = {
  digital: PostShootSection;
  editing: PostShootSection;
  printing: PostShootSection;
  source?: "template" | "manual";
};

type PackageLike = {
  id: string;
  slug: string;
  title: string;
  accentColor: string;
  content: Partial<PackageCategoryContent>;
};

type LegacyPostShootPackageBlock = {
  categoryId: string;
  pills: string[];
  description: string;
};

type LegacyPostShootSectionGroup = {
  items: LegacyPostShootPackageBlock[];
};

function parseSection(value: unknown): PostShootSection {
  if (!value || typeof value !== "object") {
    return { pills: [], description: "" };
  }
  const obj = value as Partial<PostShootSection>;
  return {
    pills: Array.isArray(obj.pills)
      ? obj.pills.filter((pill): pill is string => typeof pill === "string")
      : [],
    description: typeof obj.description === "string" ? obj.description : "",
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

function collapseLegacyGroup(value: unknown): PostShootSection {
  if (!value || typeof value !== "object") {
    return { pills: [], description: "" };
  }

  if (isLegacySectionGroup(value)) {
    return parseSection(value);
  }

  const group = value as Partial<LegacyPostShootSectionGroup>;
  if (!Array.isArray(group.items) || group.items.length === 0) {
    return { pills: [], description: "" };
  }

  if (group.items.length === 1) {
    return {
      pills: group.items[0]?.pills ?? [],
      description: group.items[0]?.description ?? "",
    };
  }

  const pills = [
    ...new Set(group.items.flatMap((item) => item.pills ?? [])),
  ];
  const description = group.items
    .map((item) => item.description?.trim())
    .filter(Boolean)
    .join("\n\n");

  return { pills, description };
}

export function emptyPostShootSnapshot(): PostShootSnapshot {
  return {
    digital: { pills: [], description: "" },
    editing: { pills: [], description: "" },
    printing: { pills: [], description: "" },
    source: "template",
  };
}

export function parsePostShootSnapshot(value: unknown): PostShootSnapshot {
  if (!value || typeof value !== "object") {
    return emptyPostShootSnapshot();
  }

  const data = value as Partial<PostShootSnapshot> & {
    digital?: unknown;
    editing?: unknown;
    printing?: unknown;
  };

  const digital = data.digital
    ? collapseLegacyGroup(data.digital)
    : { pills: [], description: "" };
  const editing = data.editing
    ? collapseLegacyGroup(data.editing)
    : { pills: [], description: "" };
  const printing = data.printing
    ? collapseLegacyGroup(data.printing)
    : { pills: [], description: "" };

  return {
    digital,
    editing,
    printing,
    source: data.source === "manual" ? "manual" : "template",
  };
}

export function isOutdoorCategory(
  slug: string,
  content: Partial<PackageCategoryContent>,
): boolean {
  return content.scheduleType === "outdoor" || slug === "dis-cekim";
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

export function hasPrintingPackages(
  categories: { slug: string; content: Partial<PackageCategoryContent> }[],
): boolean {
  return categories.some(
    (category) => !isOutdoorCategory(category.slug, category.content),
  );
}

/** @deprecated Global şablon sistemi kullanın. */
export function shouldShowPrintingSection(
  categories: {
    slug: string;
    content: Partial<PackageCategoryContent>;
  }[],
): boolean {
  return hasPrintingPackages(categories);
}

function parseNumericValue(value: string): number | null {
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function mergeTokenValues(
  values: string[],
  strategy: PostShootVariableDefinition["mergeStrategy"],
): string {
  const nonEmpty = values.map((value) => value.trim()).filter(Boolean);
  if (nonEmpty.length === 0) return "";

  switch (strategy) {
    case "join":
      return nonEmpty.join(" ve ");
    case "sum": {
      const numbers = nonEmpty
        .map(parseNumericValue)
        .filter((value): value is number => value !== null);
      if (numbers.length === 0) return nonEmpty[0] ?? "";
      return String(numbers.reduce((sum, value) => sum + value, 0));
    }
    case "max": {
      const numbers = nonEmpty
        .map(parseNumericValue)
        .filter((value): value is number => value !== null);
      if (numbers.length === 0) return nonEmpty[0] ?? "";
      return String(Math.max(...numbers));
    }
    case "first":
      return nonEmpty[0] ?? "";
    case "unique_list":
      return [...new Set(nonEmpty)].join(" ve ");
    default:
      return nonEmpty[0] ?? "";
  }
}

export function renderPostShootTemplate(
  template: string,
  tokenValues: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    return tokenValues[key] ?? "";
  });
}

function renderPills(
  pills: string[],
  tokenValues: Record<string, string>,
): string[] {
  return pills
    .map((pill) => renderPostShootTemplate(pill, tokenValues).trim())
    .filter(Boolean);
}

function collectTokenValues(
  categories: PackageLike[],
  variables: PostShootVariableDefinition[],
): Record<string, string> {
  const buckets = new Map<string, string[]>();

  for (const variable of variables) {
    buckets.set(variable.key, []);
  }

  for (const category of categories) {
    const defaults = getDefaultPostShootTokensForCategory(
      category.slug,
      category.content.scheduleType,
    );
    const packageTokens = {
      ...defaults,
      ...(category.content.postShootTokens ?? {}),
    };

    for (const variable of variables) {
      const value = packageTokens[variable.key];
      if (typeof value === "string" && value.trim()) {
        buckets.get(variable.key)?.push(value.trim());
      }
    }
  }

  const merged: Record<string, string> = {};
  for (const variable of variables) {
    const values = buckets.get(variable.key) ?? [];
    merged[variable.key] = mergeTokenValues(values, variable.mergeStrategy);
  }

  return merged;
}

function buildSectionFromTemplate(
  templateSection: PostShootSection,
  tokenValues: Record<string, string>,
): PostShootSection {
  return {
    pills: renderPills(templateSection.pills, tokenValues),
    description: renderPostShootTemplate(
      templateSection.description,
      tokenValues,
    ).trim(),
  };
}

export function buildPostShootSnapshot(
  items: { packageOptionId: string }[],
  categories: (PackageLike & { options?: { id: string }[] })[],
  settings: PostShootTemplateSettingsData,
): PostShootSnapshot {
  const activeCategories = getUniqueCategoriesFromItems(items, categories);
  const tokenValues = collectTokenValues(
    activeCategories,
    settings.variables,
  );

  const digital = buildSectionFromTemplate(settings.digital, tokenValues);
  const editing = buildSectionFromTemplate(settings.editing, tokenValues);

  const printing = hasPrintingPackages(activeCategories)
    ? buildSectionFromTemplate(settings.printing, tokenValues)
    : {
        pills: [],
        description: settings.noPrintingText,
      };

  return {
    digital,
    editing,
    printing,
    source: "template",
  };
}

export function syncPostShootWithItems(
  current: PostShootSnapshot,
  items: { packageOptionId: string }[],
  categories: (PackageLike & { options?: { id: string }[] })[],
  settings: PostShootTemplateSettingsData,
  options?: { forceReset?: boolean },
): PostShootSnapshot {
  if (current.source === "manual" && !options?.forceReset) {
    return current;
  }

  return buildPostShootSnapshot(items, categories, settings);
}

export function getPackagePostShootTokens(
  content: Partial<PackageCategoryContent>,
  slug: string,
  variableKeys: string[],
): Record<string, string> {
  const defaults = getDefaultPostShootTokensForCategory(
    slug,
    content.scheduleType,
  );
  const stored = content.postShootTokens ?? {};
  const result: Record<string, string> = {};

  for (const key of variableKeys) {
    const value = stored[key] ?? defaults[key] ?? "";
    result[key] = typeof value === "string" ? value : "";
  }

  return result;
}
