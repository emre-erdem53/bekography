import type {
  PackageData,
  ServiceAreaData,
  ShootTypeData,
} from "@/lib/package-types";

export type ShootTypeContext = {
  serviceArea: ServiceAreaData;
  package: PackageData;
  shootType: ShootTypeData;
};

/**
 * Bir çekim türünün üç seviyeli bağlamını bulur. İki seviyede yeterli olan
 * `categories.find(c => c.options.some(...))` deseninin karşılığı.
 */
export function findShootTypeContext(
  serviceAreas: ServiceAreaData[],
  shootTypeId: string,
): ShootTypeContext | null {
  for (const serviceArea of serviceAreas) {
    for (const pkg of serviceArea.packages) {
      const shootType = pkg.shootTypes.find(
        (candidate) => candidate.id === shootTypeId,
      );
      if (shootType) {
        return { serviceArea, package: pkg, shootType };
      }
    }
  }
  return null;
}

/** Vitrin / dropdown listelerinde kullanılan düz çekim türü listesi. */
export function flattenShootTypes(
  serviceAreas: ServiceAreaData[],
): ShootTypeContext[] {
  const result: ShootTypeContext[] = [];
  for (const serviceArea of serviceAreas) {
    for (const pkg of serviceArea.packages) {
      for (const shootType of pkg.shootTypes) {
        result.push({ serviceArea, package: pkg, shootType });
      }
    }
  }
  return result;
}

/** `Hizmet Alanı › Paket — Çekim Türü` biçiminde tek satırlık etiket. */
export function formatShootTypePath(context: ShootTypeContext): string {
  return `${context.serviceArea.title} › ${context.package.title} — ${context.shootType.label}`;
}
