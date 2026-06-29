import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  ensureItemWorkflows,
  itemHasPrintingStage,
  parsePostShootSnapshot,
  setItemWorkflowFlags,
} from "@/lib/post-shoot";
import type { PackageCategoryContent } from "@/lib/package-seed-data";
import {
  resolveWorkflowStagesForOption,
} from "@/lib/package-workflow-stages";
import {
  mergeWorkflowAction,
  parseTrackingWorkflowFlags,
  workflowFlagsForAdminStage,
  type TrackingWorkflowAction,
} from "@/lib/tracking-workflow";
import { workflowFlagsForAdminStageFromDefinitions } from "@/lib/tracking-workflow-dynamic";

const workflowStageSchema = z.object({
  itemId: z.string().min(1),
  stage: z.string().min(1),
});

const workflowActionSchema = z.object({
  itemId: z.string().min(1),
  action: z.enum([
    "digital_delivered",
    "selection_completed",
    "editing_completed",
    "printing_completed",
    "mark_delivered",
    "unmark_delivered",
  ]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const body = await request.json();
    const stageParsed = workflowStageSchema.safeParse(body);
    const actionParsed = workflowActionSchema.safeParse(body);

    if (!stageParsed.success && !actionParsed.success) {
      return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        items: {
          select: {
            id: true,
            packageOption: {
              select: {
                id: true,
                label: true,
                category: {
                  select: { slug: true, content: true },
                },
              },
            },
          },
        },
      },
    });
    if (!reservation) {
      return NextResponse.json(
        { error: "Rezervasyon bulunamadı" },
        { status: 404 },
      );
    }

    const itemId = stageParsed.success
      ? stageParsed.data.itemId
      : actionParsed.data!.itemId;

    const item = reservation.items.find((entry) => entry.id === itemId);
    if (!item) {
      return NextResponse.json(
        { error: "Paket bulunamadı" },
        { status: 404 },
      );
    }

    let postShoot = ensureItemWorkflows(
      parsePostShootSnapshot(reservation.postShoot),
      reservation.items.map((entry) => entry.id),
    );

    const categoryContent =
      item.packageOption.category.content &&
      typeof item.packageOption.category.content === "object"
        ? (item.packageOption.category.content as PackageCategoryContent)
        : undefined;
    const stageDefinitions = resolveWorkflowStagesForOption(
      categoryContent,
      item.packageOption.id,
      item.packageOption.label,
    );
    const validStageIds = new Set(stageDefinitions.map((def) => def.id));
    const hasPrinting = itemHasPrintingStage(
      item.packageOption.category.slug,
      categoryContent,
      item.packageOption.id,
      item.packageOption.label,
    );

    if (stageParsed.success && !validStageIds.has(stageParsed.data.stage)) {
      return NextResponse.json({ error: "Geçersiz aşama" }, { status: 400 });
    }

    const currentFlags = parseTrackingWorkflowFlags(
      postShoot.itemWorkflows?.[itemId],
    );

    const nextFlags = stageParsed.success
      ? stageDefinitions.length
        ? workflowFlagsForAdminStageFromDefinitions(
            stageParsed.data.stage,
            stageDefinitions,
          )
        : workflowFlagsForAdminStage(
            stageParsed.data.stage as Parameters<
              typeof workflowFlagsForAdminStage
            >[0],
            hasPrinting,
          )
      : mergeWorkflowAction(
          currentFlags,
          actionParsed.data!.action as TrackingWorkflowAction,
        );

    postShoot = setItemWorkflowFlags(postShoot, itemId, nextFlags);

    await prisma.reservation.update({
      where: { id },
      data: { postShoot },
    });

    return NextResponse.json({ postShoot });
  } catch (error) {
    console.error("POST /api/admin/reservations/[id]/workflow", error);
    return NextResponse.json(
      { error: "Süreç güncellenemedi" },
      { status: 500 },
    );
  }
}
