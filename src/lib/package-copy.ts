import type { PackageCategoryContent } from "@/lib/package-seed-data";
import { slugify } from "@/lib/constants";

type OptionLike = { id?: string; label: string };

function remapOptionKeyedRecord<T>(
  source: Record<string, T> | undefined,
  options: OptionLike[],
): Record<string, T> {
  if (!source) return {};

  const result: Record<string, T> = {};

  for (const option of options) {
    const label = option.label.trim();
    if (!label) continue;

    const fromId = option.id ? source[option.id] : undefined;
    const fromLabel = source[label];
    const value = fromId ?? fromLabel;

    if (value !== undefined) {
      result[label] = value;
    }
  }

  return result;
}

export function remapPackageContentForCopy(
  content: PackageCategoryContent,
  sourceOptions: OptionLike[],
): PackageCategoryContent {
  return {
    ...content,
    highlightTagsByOption: remapOptionKeyedRecord(
      content.highlightTagsByOption,
      sourceOptions,
    ),
    optionIconKeys: remapOptionKeyedRecord(content.optionIconKeys, sourceOptions),
    galleryMediaByOption: remapOptionKeyedRecord(
      content.galleryMediaByOption,
      sourceOptions,
    ),
    detailSectionsByOption: remapOptionKeyedRecord(
      content.detailSectionsByOption,
      sourceOptions,
    ),
    inspectEnabledByOption: remapOptionKeyedRecord(
      content.inspectEnabledByOption,
      sourceOptions,
    ),
    workflowStageTagsByOption: remapOptionKeyedRecord(
      content.workflowStageTagsByOption,
      sourceOptions,
    ),
    workflowStagesByOption: remapOptionKeyedRecord(
      content.workflowStagesByOption,
      sourceOptions,
    ),
  };
}

export function buildCopyTitle(title: string) {
  const trimmed = title.trim();
  if (!trimmed) return "Yeni Paket (Kopya)";
  if (trimmed.endsWith("(Kopya)")) return trimmed;
  return `${trimmed} (Kopya)`;
}

export function buildCopySlug(title: string) {
  const base = slugify(buildCopyTitle(title)) || "paket-kopya";
  const suffix = Date.now().toString(36).slice(-4);
  return `${base}-${suffix}`;
}

export type PackageCopySource = {
  title: string;
  accentColor: string;
  iconKey: string;
  sortOrder: number;
  content: PackageCategoryContent;
  options: Array<{
    id: string;
    label: string;
    cashPrice: number;
    installmentPrice: number;
  }>;
};

export function applyPackageCopyTransform(source: PackageCopySource) {
  const sourceOptions = source.options.map((option) => ({
    id: option.id,
    label: option.label,
  }));

  const rawContent = source.content ?? {};
  const content = remapPackageContentForCopy(rawContent, sourceOptions);

  return {
    title: buildCopyTitle(source.title),
    slug: buildCopySlug(source.title),
    accentColor: source.accentColor,
    iconKey: source.iconKey,
    sortOrder: source.sortOrder,
    isActive: false,
    content,
    options: source.options.map((option) => ({
      label: option.label,
      cashPrice: option.cashPrice,
      installmentPrice: option.installmentPrice,
    })),
  };
}
