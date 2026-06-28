import type {
  PackageCategoryContent,
  PackageDetailSection,
} from "@/lib/package-seed-data";
import { resolveDetailSectionsForOption } from "@/lib/package-detail-section";
import {
  buildPackageInspectSections,
  hasRichInspectSections,
} from "@/lib/package-inspect-templates";
import {
  hasAnyWorkflowStageTags,
  resolvePackageWorkflowStageTags,
} from "@/lib/package-workflow-stage-tags";
import { normalizePostShootSectionTitle } from "@/lib/post-shoot-from-inspect";
import type { PostShootSnapshot } from "@/lib/post-shoot";
import type { TrackingWorkflowStageId } from "@/lib/tracking-workflow";

const EMPTY_STAGE_TAGS: Record<TrackingWorkflowStageId, string[]> = {
  rezervasyon: [],
  cekim: [],
  dijital: [],
  secim: [],
  duzenleme: [],
  baski: [],
};

function mapSectionTitleToWorkflowStage(
  title: string,
): TrackingWorkflowStageId | null {
  const key = title.trim().toLocaleLowerCase("tr");

  if (key.includes("rezervasyon")) return "rezervasyon";
  if (key.includes("seçim") || key.includes("secim")) return "secim";
  if (key === "çekim") return "cekim";

  const postShootKind = normalizePostShootSectionTitle(title);
  if (postShootKind === "digital") return "dijital";
  if (postShootKind === "editing") return "duzenleme";
  if (postShootKind === "printing") return "baski";

  return null;
}

export { mapSectionTitleToWorkflowStage };

type PackageInspectContextScheduleType = "outdoor" | "indoor";

function scheduleTypeForSlug(slug: string): PackageInspectContextScheduleType {
  return slug === "dis-cekim" ? "outdoor" : "indoor";
}

function mergeSnapshotSectionTags(
  base: PackageDetailSection[],
  snapshotSections: PackageDetailSection[],
): PackageDetailSection[] {
  const snapshotTagsByStage = new Map<TrackingWorkflowStageId, string[]>();

  for (const section of snapshotSections) {
    const stageId = mapSectionTitleToWorkflowStage(section.title);
    const tags = (section.tags ?? []).filter(Boolean);
    if (stageId && tags.length > 0) {
      snapshotTagsByStage.set(stageId, tags);
    }
  }

  if (snapshotTagsByStage.size === 0) return base;

  return base.map((section) => {
    const stageId = mapSectionTitleToWorkflowStage(section.title);
    if (!stageId || !snapshotTagsByStage.has(stageId)) return section;
    return { ...section, tags: snapshotTagsByStage.get(stageId)! };
  });
}

function sectionsHaveBodyText(sections: PackageDetailSection[]): boolean {
  return sections.some((section) => Boolean(section.body?.trim()));
}

function pickInspectSectionBase(
  fromLivePackage: PackageDetailSection[],
  fromTemplate: PackageDetailSection[],
): PackageDetailSection[] {
  if (hasRichInspectSections(fromLivePackage) && sectionsHaveBodyText(fromLivePackage)) {
    return fromLivePackage;
  }
  if (hasRichInspectSections(fromTemplate) && sectionsHaveBodyText(fromTemplate)) {
    return fromTemplate;
  }
  if (fromLivePackage.length > 0) return fromLivePackage;
  return fromTemplate;
}

/** Satın alınan ürün detayı için inceleme metinlerini tamamlar. */
export function resolveDetailSectionsForStageTags(input: {
  detailSections: PackageDetailSection[];
  categorySlug: string;
  categoryTitle: string;
  optionLabel: string;
  packageOptionId?: string;
  categoryContent?: Partial<PackageCategoryContent>;
}): PackageDetailSection[] {
  const fromLivePackage =
    input.categoryContent && input.packageOptionId
      ? resolveDetailSectionsForOption(
          input.categoryContent,
          input.packageOptionId,
          input.optionLabel,
        )
      : [];

  if (
    hasRichInspectSections(input.detailSections) &&
    sectionsHaveBodyText(input.detailSections)
  ) {
    return input.detailSections;
  }

  const fromTemplate = buildPackageInspectSections({
    slug: input.categorySlug,
    categoryTitle: input.categoryTitle,
    optionLabel: input.optionLabel,
    scheduleType: scheduleTypeForSlug(input.categorySlug),
  });

  const base = pickInspectSectionBase(fromLivePackage, fromTemplate);

  if (input.detailSections.length === 0) {
    return base;
  }

  return mergeSnapshotSectionTags(base, input.detailSections);
}

/** Rezervasyon / paket tanımından süreç etiketlerini çözümler. */
export function buildWorkflowStageTags(
  _detailSections: unknown,
  postShoot?: PostShootSnapshot,
  context?: {
    categorySlug: string;
    categoryTitle: string;
    optionLabel: string;
    packageOptionId?: string;
    categoryContent?: Partial<PackageCategoryContent>;
  },
  itemId?: string,
): Record<TrackingWorkflowStageId, string[]> {
  if (itemId && postShoot?.itemStageTags?.[itemId]) {
    const overrides = postShoot.itemStageTags[itemId];
    const tags = emptyStageTagsFromOverrides(overrides);
    if (hasAnyWorkflowStageTags(tags)) return tags;
  }

  if (context?.categoryContent && context.packageOptionId) {
    const fromPackage = resolvePackageWorkflowStageTags(
      context.categoryContent,
      context.packageOptionId,
      context.optionLabel,
    );
    if (hasAnyWorkflowStageTags(fromPackage)) {
      return fromPackage;
    }
  }

  return { ...EMPTY_STAGE_TAGS };
}

function emptyStageTagsFromOverrides(
  overrides: Record<TrackingWorkflowStageId, string[]>,
): Record<TrackingWorkflowStageId, string[]> {
  return {
    rezervasyon: [...(overrides.rezervasyon ?? [])],
    cekim: [...(overrides.cekim ?? [])],
    dijital: [...(overrides.dijital ?? [])],
    secim: [...(overrides.secim ?? [])],
    duzenleme: [...(overrides.duzenleme ?? [])],
    baski: [...(overrides.baski ?? [])],
  };
}

export function getStageTagsForWorkflow(
  stageTags: Record<TrackingWorkflowStageId, string[]>,
  stageId: TrackingWorkflowStageId,
): string[] {
  return stageTags[stageId] ?? EMPTY_STAGE_TAGS[stageId];
}
