import { PrismaClient } from "@prisma/client";
import {
  ensureWorkflowStageTags,
  type WorkflowStageTagsMap,
} from "../src/lib/default-workflow-stage-tags";
import { hasAnyWorkflowStageTags } from "../src/lib/package-workflow-stage-tags";
import type { ShootTypeContent } from "../src/lib/package-seed-data";

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry-run");

function parseContent(raw: unknown): ShootTypeContent {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  return raw as ShootTypeContent;
}

async function main() {
  const shootTypes = await prisma.shootType.findMany({
    where: { isActive: true },
    include: {
      package: {
        include: {
          serviceArea: {
            select: { slug: true, title: true, scheduleType: true },
          },
        },
      },
    },
  });

  let updated = 0;
  let skipped = 0;

  for (const shootType of shootTypes) {
    const content = parseContent(shootType.content);
    const existing = content.workflowStageTags as WorkflowStageTagsMap | undefined;

    if (existing && hasAnyWorkflowStageTags(existing)) {
      skipped += 1;
      continue;
    }

    const scheduleType =
      shootType.package.serviceArea.scheduleType === "outdoor"
        ? "outdoor"
        : "indoor";
    const workflowStageTags = ensureWorkflowStageTags(undefined, scheduleType);
    const nextContent: ShootTypeContent = {
      ...content,
      workflowStageTags,
    };

    const label = `${shootType.package.serviceArea.slug}/${shootType.package.slug}/${shootType.label}`;
    console.log(`${DRY_RUN ? "[dry-run] " : ""}update ${label}`);

    if (!DRY_RUN) {
      await prisma.shootType.update({
        where: { id: shootType.id },
        data: { content: nextContent },
      });
    }

    updated += 1;
  }

  console.log(
    `Done. updated=${updated}, skipped=${skipped}, total=${shootTypes.length}`,
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
