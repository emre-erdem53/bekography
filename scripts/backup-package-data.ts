import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../src/lib/prisma";

/**
 * Snapshot of the two-level package tables plus the rows that point at them.
 * Taken before the irreversible hierarchical_packages rename migration so the
 * content-migration script has a reference copy to diff against.
 */
async function main() {
  const [categories, options, requestItems, reservationItems] =
    await prisma.$transaction([
      prisma.$queryRawUnsafe(`SELECT * FROM "PackageCategory" ORDER BY "sortOrder"`),
      prisma.$queryRawUnsafe(`SELECT * FROM "PackageOption" ORDER BY "sortOrder"`),
      prisma.$queryRawUnsafe(`SELECT * FROM "RequestItem"`),
      prisma.$queryRawUnsafe(`SELECT * FROM "ReservationItem"`),
    ]);

  const payload = {
    takenAt: new Date().toISOString(),
    categories,
    options,
    requestItems,
    reservationItems,
  };

  const dir = path.join(process.cwd(), "backups");
  await mkdir(dir, { recursive: true });
  const file = path.join(
    dir,
    `package-data-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );
  await writeFile(file, JSON.stringify(payload, null, 2), "utf8");

  console.log(`Backup written to ${file}`);
  console.log(
    `Categories: ${(categories as unknown[]).length}, options: ${(options as unknown[]).length}, requestItems: ${(requestItems as unknown[]).length}, reservationItems: ${(reservationItems as unknown[]).length}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
