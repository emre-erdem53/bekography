import type { Prisma } from "@prisma/client";

/** Çekim türünü paket ve hizmet alanı ile birlikte getirir. */
export const shootTypeWithParentsInclude = {
  package: { include: { serviceArea: true } },
} satisfies Prisma.ShootTypeInclude;

/** Talep / rezervasyon kalemlerinde üç seviyeli paket bilgisi. */
export const itemShootTypeInclude = {
  shootType: { include: shootTypeWithParentsInclude },
} as const;
