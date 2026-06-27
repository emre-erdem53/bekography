import { PrismaClient } from "@prisma/client";
import {
  buildPostShootFromInspect,
  normalizePostShootSectionTitle,
} from "../src/lib/post-shoot-from-inspect";

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

  const categories = await prisma.packageCategory.findMany({
    include: { options: true },
  });
  const inspectCategories = categories.map((category) => ({
    slug: category.slug,
    title: category.title,
    content: category.content as object,
    options: category.options.map((option) => ({
      id: option.id,
      label: option.label,
    })),
  }));

  const disCekim = categories.find((category) => category.slug === "dis-cekim");
  const fotoOpt = disCekim?.options.find((option) => option.label === "Fotoğraf");
  if (disCekim && fotoOpt) {
    const snapshot = buildPostShootFromInspect(
      [{ packageOptionId: fotoOpt.id, categoryTitle: disCekim.title }],
      inspectCategories,
    );
    console.log("\n=== dis-cekim / Fotoğraf ===");
    console.log("digital:", snapshot.digital.pills.join(", "));
    console.log("editing:", snapshot.editing.pills.join(", "));
    console.log("printing:", snapshot.printing.pills.join(", "));
  }

  const dugunSalon = categories.find((category) => category.slug === "dugun-salon");
  const videoOpt = dugunSalon?.options.find(
    (option) => option.label === "Video Film",
  );
  if (dugunSalon && videoOpt) {
    const snapshot = buildPostShootFromInspect(
      [{ packageOptionId: videoOpt.id, categoryTitle: dugunSalon.title }],
      inspectCategories,
    );
    console.log("\n=== dugun-salon / Video Film ===");
    console.log("digital:", snapshot.digital.pills.slice(0, 4).join(", "));
    console.log("editing:", snapshot.editing.pills.join(", "));
    console.log(
      "printing empty:",
      snapshot.printing.pills.length === 0 && !snapshot.printing.description,
    );
  }

  const reservation = await prisma.reservation.findFirst({
    where: { deletedAt: null },
    include: {
      items: { include: { packageOption: { include: { category: true } } } },
    },
  });

  if (reservation) {
    const items = reservation.items.map((item) => ({
      packageOptionId: item.packageOptionId,
      categoryTitle: item.packageOption.category.title,
    }));
    const built = buildPostShootFromInspect(items, inspectCategories);
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
