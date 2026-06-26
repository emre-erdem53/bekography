import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  ensureItemWorkflows,
  parsePostShootSnapshot,
  setItemWorkflowFlags,
} from "@/lib/post-shoot";
import {
  TRACKING_WORKFLOW_STAGE_ORDER,
  mergeWorkflowAction,
  parseTrackingWorkflowFlags,
  workflowFlagsForAdminStage,
  type TrackingWorkflowAction,
  type TrackingWorkflowStageId,
} from "@/lib/tracking-workflow";

const workflowStageSchema = z.object({
  itemId: z.string().min(1),
  stage: z.enum(
    TRACKING_WORKFLOW_STAGE_ORDER as [
      TrackingWorkflowStageId,
      ...TrackingWorkflowStageId[],
    ],
  ),
});

const workflowActionSchema = z.object({
  itemId: z.string().min(1),
  action: z.enum([
    "digital_delivered",
    "selection_completed",
    "editing_completed",
    "printing_completed",
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
      include: { items: { select: { id: true } } },
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

    if (!reservation.items.some((item) => item.id === itemId)) {
      return NextResponse.json(
        { error: "Paket bulunamadı" },
        { status: 404 },
      );
    }

    let postShoot = ensureItemWorkflows(
      parsePostShootSnapshot(reservation.postShoot),
      reservation.items.map((item) => item.id),
    );

    const hasPrinting = postShoot.printing.pills.length > 0;
    const currentFlags = parseTrackingWorkflowFlags(
      postShoot.itemWorkflows?.[itemId],
    );

    const nextFlags = stageParsed.success
      ? workflowFlagsForAdminStage(stageParsed.data.stage, hasPrinting)
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
