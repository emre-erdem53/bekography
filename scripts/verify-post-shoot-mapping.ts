import { PrismaClient } from "@prisma/client";
import {
  buildPostShootFromInspect,
  normalizePostShootSectionTitle,
} from "../src/lib/post-shoot-from-inspect";
import { serializeServiceAreas } from "../src/lib/packages";
import { flattenShootTypes } from "../src/lib/shoot-type-context";

const prisma = new PrismaClient();

async function main() {
  const titles = [
    "REZERVASYON",
    "ÇEKİM ÖNCESİ",
    "ÇEKİM",
    "DİJİTAL TESLİMAT",
    "SEÇİM",
    "DÜZENLEME",
    "DÜZELTME TALEPLERİ",
    "BASKI",
    "Dijital",
    "Düzenleme",
    "Baskı",
  ];

  console.log("=== Title mapping ===");
  for (const title of titles) {
    console.log(`${title} -> ${normalizePostShootSectionTitle(title) ?? "null"}`);
  }

  const rows = await prisma.serviceArea.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      packages: {
        orderBy: { sortOrder: "asc" },
        include: { shootTypes: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });
  const serviceAreas = serializeServiceAreas(rows);
  const flattened = flattenShootTypes(serviceAreas);

  console.log(
    `\n=== Hierarchy: ${serviceAreas.length} service areas, ${flattened.length} shoot types ===`,
  );

  const outdoor = flattened.find(
    (entry) => entry.serviceArea.scheduleType === "outdoor",
  );
  if (outdoor) {
    const snapshot = buildPostShootFromInspect(
      [
        {
          shootTypeId: outdoor.shootType.id,
          serviceAreaTitle: outdoor.serviceArea.title,
        },
      ],
      serviceAreas,
    );
    console.log(
      `\n=== ${outdoor.serviceArea.title} / ${outdoor.package.title} / ${outdoor.shootType.label} (outdoor) ===`,
    );
    console.log("digital:", snapshot.digital.pills.join(", "));
    console.log("editing:", snapshot.editing.pills.join(", "));
    console.log("printing:", snapshot.printing.pills.join(", "));
  }

  const indoor = flattened.find(
    (entry) => entry.serviceArea.scheduleType === "indoor",
  );
  if (indoor) {
    const snapshot = buildPostShootFromInspect(
      [
        {
          shootTypeId: indoor.shootType.id,
          serviceAreaTitle: indoor.serviceArea.title,
        },
      ],
      serviceAreas,
    );
    console.log(
      `\n=== ${indoor.serviceArea.title} / ${indoor.package.title} / ${indoor.shootType.label} (indoor) ===`,
    );
    console.log("digital:", snapshot.digital.pills.slice(0, 4).join(", "));
    console.log("editing:", snapshot.editing.pills.join(", "));
    console.log(
      "printing empty:",
      snapshot.printing.pills.length === 0 && !snapshot.printing.description,
    );
  }

  const missingSections = flattened.filter(
    (entry) => (entry.shootType.content.detailSections ?? []).length === 0,
  );
  if (missingSections.length > 0) {
    console.log("\n=== Shoot types without detail sections ===");
    for (const entry of missingSections) {
      console.log(
        `- ${entry.serviceArea.slug} / ${entry.package.slug} / ${entry.shootType.label}`,
      );
    }
  } else {
    console.log("\nAll shoot types have detail sections.");
  }

  const reservation = await prisma.reservation.findFirst({
    where: { deletedAt: null },
    include: {
      items: {
        include: {
          shootType: { include: { package: { include: { serviceArea: true } } } },
        },
      },
    },
  });

  if (reservation) {
    const items = reservation.items.map((item) => ({
      shootTypeId: item.shootTypeId,
      serviceAreaTitle: item.shootType.package.serviceArea.title,
    }));
    const built = buildPostShootFromInspect(items, serviceAreas);
    const stored = reservation.postShoot as {
      digital?: { pills?: string[]; description?: string };
      editing?: { pills?: string[]; description?: string };
    };

    console.log(`\n=== Reservation: ${reservation.brideName} ===`);
    console.log("built digital pills count:", built.digital.pills.length);
    console.log("built editing pills count:", built.editing.pills.length);
    console.log("stored digital pills count:", stored.digital?.pills?.length ?? 0);
    console.log("stored editing pills count:", stored.editing?.pills?.length ?? 0);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
