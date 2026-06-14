import { prisma } from "@/lib/prisma";
import { normalizeHexColor } from "@/lib/color-utils";

export async function getActivePackages() {
  return prisma.packageCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      options: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}

export async function getAllPackages() {
  return prisma.packageCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      options: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}

export function serializePackageCategories(
  categories: Awaited<ReturnType<typeof getActivePackages>>,
) {
  return categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    title: category.title,
    accentColor: normalizeHexColor(category.accentColor) ?? category.accentColor,
    iconKey: category.iconKey,
    highlight: category.highlight,
    backgroundImageUrl: category.backgroundImageUrl,
    heroImageUrl: category.heroImageUrl,
    content: category.content,
    options: category.options.map((option) => ({
      id: option.id,
      label: option.label,
      cashPrice: option.cashPrice,
      installmentPrice: option.installmentPrice,
    })),
  }));
}
