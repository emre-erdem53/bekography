import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { parsePostShootSnapshot } from "@/lib/post-shoot";
import {
  mergeWorkflowAction,
  parseTrackingWorkflowFlags,
  type TrackingWorkflowAction,
} from "@/lib/tracking-workflow";

const workflowActionSchema = z.object({
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
    const parsed = workflowActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
    }

    const reservation = await prisma.reservation.findUnique({ where: { id } });
    if (!reservation) {
      return NextResponse.json(
        { error: "Rezervasyon bulunamadı" },
        { status: 404 },
      );
    }

    const postShoot = parsePostShootSnapshot(reservation.postShoot);
    const currentFlags = parseTrackingWorkflowFlags(postShoot.workflow);
    const nextFlags = mergeWorkflowAction(
      currentFlags,
      parsed.data.action as TrackingWorkflowAction,
    );
    const updatedPostShoot = {
      ...postShoot,
      workflow: nextFlags,
    };

    await prisma.reservation.update({
      where: { id },
      data: { postShoot: updatedPostShoot },
    });

    return NextResponse.json({ postShoot: updatedPostShoot });
  } catch (error) {
    console.error("POST /api/admin/reservations/[id]/workflow", error);
    return NextResponse.json(
      { error: "Süreç güncellenemedi" },
      { status: 500 },
    );
  }
}
