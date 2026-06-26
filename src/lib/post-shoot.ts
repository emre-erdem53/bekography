import type { PackageCategoryContent } from "@/lib/package-seed-data";
import {
  buildPostShootFromInspect,
  syncPostShootWithInspectItems,
  type InspectCategory,
} from "@/lib/post-shoot-from-inspect";
import {
  emptyTrackingWorkflowFlags,
  parseTrackingWorkflowFlags,
  type TrackingWorkflowFlags,
} from "@/lib/tracking-workflow";

export type PostShootSection = {
  pills: string[];
  description: string;
};

export type PostShootWorkflowFlags = {
  digitalDeliveredAt?: string | null;
  selectionCompletedAt?: string | null;
  editingCompletedAt?: string | null;
  printingCompletedAt?: string | null;
  adminStage?: string | null;
};

export type PostShootSnapshot = {
  digital: PostShootSection;
  editing: PostShootSection;
  printing: PostShootSection;
  source?: "inspect" | "manual" | "template";
  workflow?: TrackingWorkflowFlags;
  itemWorkflows?: Record<string, TrackingWorkflowFlags>;
};

export function emptyPostShootSnapshot(): PostShootSnapshot {
  return {
    digital: { pills: [], description: "" },
    editing: { pills: [], description: "" },
    printing: { pills: [], description: "" },
    source: "inspect",
    workflow: emptyTrackingWorkflowFlags(),
  };
}

type LegacyPostShootPackageBlock = {
  categoryId: string;
  pills: string[];
  description: string;
};

type LegacyPostShootSectionGroup = {
  items: LegacyPostShootPackageBlock[];
};

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

export function parsePostShootSnapshot(raw: unknown): PostShootSnapshot {
  if (!raw || typeof raw !== "object") return emptyPostShootSnapshot();
  const data = raw as Record<string, unknown>;
  const source =
    data.source === "manual"
      ? "manual"
      : data.source === "inspect" || data.source === "template"
        ? "inspect"
        : undefined;

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
    source,
    workflow: parseTrackingWorkflowFlags(data.workflow),
    itemWorkflows:
      data.itemWorkflows && typeof data.itemWorkflows === "object"
        ? Object.fromEntries(
            Object.entries(data.itemWorkflows).map(([key, value]) => [
              key,
              parseTrackingWorkflowFlags(value),
            ]),
          )
        : undefined,
  };
}

function parseSection(raw: unknown): PostShootSection {
  if (!raw || typeof raw !== "object") {
    return { pills: [], description: "" };
  }
  const data = raw as Record<string, unknown>;
  return {
    pills: Array.isArray(data.pills)
      ? data.pills.filter((entry): entry is string => typeof entry === "string")
      : [],
    description: typeof data.description === "string" ? data.description : "",
  };
}

export function getItemWorkflowFlags(
  postShoot: PostShootSnapshot,
  itemId: string,
): TrackingWorkflowFlags {
  const itemFlags = postShoot.itemWorkflows?.[itemId];
  if (itemFlags) return itemFlags;
  return postShoot.workflow ?? emptyTrackingWorkflowFlags();
}

export function setItemWorkflowFlags(
  postShoot: PostShootSnapshot,
  itemId: string,
  flags: TrackingWorkflowFlags,
): PostShootSnapshot {
  return {
    ...postShoot,
    itemWorkflows: {
      ...(postShoot.itemWorkflows ?? {}),
      [itemId]: flags,
    },
  };
}

export function ensureItemWorkflows(
  postShoot: PostShootSnapshot,
  itemIds: string[],
): PostShootSnapshot {
  const fallback = postShoot.workflow ?? emptyTrackingWorkflowFlags();
  const itemWorkflows = { ...(postShoot.itemWorkflows ?? {}) };

  for (const itemId of itemIds) {
    if (!itemWorkflows[itemId]) {
      itemWorkflows[itemId] = { ...fallback };
    }
  }

  return { ...postShoot, itemWorkflows };
}

export function isOutdoorCategory(
  slug: string,
  content: Partial<PackageCategoryContent>,
): boolean {
  return content.scheduleType === "outdoor" || slug === "dis-cekim";
}

type ReservationItemInput = {
  packageOptionId: string;
  categoryTitle?: string;
};

type CategoryInput = {
  slug: string;
  title: string;
  content: Partial<PackageCategoryContent>;
  options?: { id: string; label: string }[];
};

export function syncPostShootWithItems(
  current: PostShootSnapshot,
  items: ReservationItemInput[],
  categories: CategoryInput[],
  options?: { forceReset?: boolean },
): PostShootSnapshot {
  return syncPostShootWithInspectItems(
    current,
    items,
    categories as InspectCategory[],
    options,
  );
}

export { buildPostShootFromInspect };

export function hasPrintingPackages(categories: { slug: string }[]): boolean {
  return categories.some((category) => category.slug === "dis-cekim");
}

export function hasPrintingProducts(postShoot: PostShootSnapshot): boolean {
  return (
    postShoot.printing.pills.length > 0 ||
    postShoot.printing.description.trim().length > 0
  );
}

export function itemHasPrintingStage(categorySlug: string): boolean {
  return categorySlug === "dis-cekim";
}

export function reservationHasPrintingPackage(
  items: { categorySlug?: string; hasPrinting?: boolean }[],
): boolean {
  return items.some(
    (item) => item.hasPrinting ?? itemHasPrintingStage(item.categorySlug ?? ""),
  );
}

export function hasOutdoorPackageInItems(
  items: ReservationItemInput[],
  categories: CategoryInput[],
): boolean {
  return items.some((item) => {
    const category = categories.find((entry) =>
      entry.options?.some((option) => option.id === item.packageOptionId),
    );
    return category?.slug === "dis-cekim";
  });
}
