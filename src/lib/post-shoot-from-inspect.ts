import type { PackageDetailSection } from "@/lib/package-seed-data";
import type { ServiceAreaData } from "@/lib/package-types";
import { getShootTypeDetailSections } from "@/lib/package-detail-section";
import {
  packageHasPrintingStage,
  resolveWorkflowStages,
} from "@/lib/package-workflow-stages";
import type { PostShootSection, PostShootSnapshot } from "@/lib/post-shoot";
import { syncItemStageTagsForItems } from "@/lib/item-workflow-stage-tags";
import { findShootTypeContext } from "@/lib/shoot-type-context";

export type PostShootSectionKind = "digital" | "editing" | "printing";

export type InspectPackageItem = {
  shootTypeId: string;
  /** Rezervasyon kaleminde dondurulmuş hizmet alanı başlığı; yoksa canlı veriden okunur. */
  serviceAreaTitle?: string;
  itemKey?: string;
};

type SectionContribution = {
  displayTitle: string;
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
  if (key === "baskı" || key === "baski" || key.startsWith("bask"))
    return "printing";
  return null;
}

function detailSectionToPostShoot(
  section: PackageDetailSection,
): PostShootSection {
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

function mergeContributions(
  contributions: SectionContribution[],
): PostShootSection {
  if (contributions.length === 0) return emptySection();

  const pills = [
    ...new Set(contributions.flatMap((entry) => entry.pills).filter(Boolean)),
  ];

  const descriptions = contributions
    .map((entry) =>
      formatContributionSentence(entry.displayTitle, entry.description),
    )
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
  serviceAreas: ServiceAreaData[],
  kind: PostShootSectionKind,
): SectionContribution[] {
  const contributions: SectionContribution[] = [];

  for (const item of items) {
    const context = findShootTypeContext(serviceAreas, item.shootTypeId);
    if (!context) continue;

    if (kind === "printing") {
      const stages = resolveWorkflowStages(
        context.shootType,
        context.serviceArea.scheduleType,
      );
      if (!packageHasPrintingStage(stages)) continue;
    }

    const sections = getShootTypeDetailSections(context.shootType);

    for (const section of sections) {
      const mapped = normalizePostShootSectionTitle(section.title);
      if (mapped !== kind) continue;

      const mappedSection = detailSectionToPostShoot(section);
      if (!mappedSection.description && mappedSection.pills.length === 0)
        continue;

      contributions.push({
        displayTitle:
          item.serviceAreaTitle?.trim() || context.serviceArea.title,
        pills: mappedSection.pills,
        description: mappedSection.description,
      });
    }
  }

  return contributions;
}

export function buildPostShootFromInspect(
  items: InspectPackageItem[],
  serviceAreas: ServiceAreaData[],
): PostShootSnapshot {
  return {
    digital: mergeContributions(
      collectContributions(items, serviceAreas, "digital"),
    ),
    editing: mergeContributions(
      collectContributions(items, serviceAreas, "editing"),
    ),
    printing: mergeContributions(
      collectContributions(items, serviceAreas, "printing"),
    ),
    source: "inspect",
  };
}

export function reservationHasPrintingPackage(
  items: InspectPackageItem[],
  serviceAreas: ServiceAreaData[],
): boolean {
  return items.some((item) => {
    const context = findShootTypeContext(serviceAreas, item.shootTypeId);
    if (!context) return false;
    const stages = resolveWorkflowStages(
      context.shootType,
      context.serviceArea.scheduleType,
    );
    return packageHasPrintingStage(stages);
  });
}

export function syncPostShootWithInspectItems(
  current: PostShootSnapshot,
  items: InspectPackageItem[],
  serviceAreas: ServiceAreaData[],
  options?: { forceReset?: boolean },
): PostShootSnapshot {
  if (current.source === "manual" && !options?.forceReset) {
    return current;
  }

  const built = buildPostShootFromInspect(items, serviceAreas);
  const itemKeys = items
    .filter((item): item is InspectPackageItem & { itemKey: string } =>
      Boolean(item.itemKey),
    )
    .map((item) => ({
      itemKey: item.itemKey,
      shootTypeId: item.shootTypeId,
    }));

  const itemStageTags =
    itemKeys.length > 0
      ? syncItemStageTagsForItems(
          current.itemStageTags,
          itemKeys,
          serviceAreas,
          options,
        )
      : current.itemStageTags;

  return {
    ...built,
    workflow: current.workflow,
    itemWorkflows: current.itemWorkflows,
    itemStageTags,
  };
}

export function hasPostShootSectionContent(section: PostShootSection): boolean {
  return section.pills.length > 0 || section.description.trim().length > 0;
}
