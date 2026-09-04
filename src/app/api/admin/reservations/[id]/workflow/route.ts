import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  ensureItemWorkflows,
  parsePostShootSnapshot,
  setItemWorkflowFlags,
} from "@/lib/post-shoot";
import type { ScheduleType } from "@/lib/package-types";
import type { ShootTypeContent } from "@/lib/package-seed-data";
import {
  packageHasPrintingStage,
  resolveWorkflowStages,
} from "@/lib/package-workflow-stages";
import {
  mergeWorkflowAction,
  parseTrackingWorkflowFlags,
  workflowFlagsForAdminStage,
  type TrackingWorkflowAction,
  type TrackingWorkflowDeadlineOverrideKey,
  type TrackingWorkflowFlags,
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

const deadlineOverrideSchema = z.object({
  itemId: z.string().min(1),
  deadlineOverrides: z.object({
    dijital: z.string().nullable().optional(),
    secim: z.string().nullable().optional(),
    duzenleme: z.string().nullable().optional(),
    baski: z.string().nullable().optional(),
  }),
});

function mergeDeadlineOverrides(
  current: TrackingWorkflowFlags["deadlineOverrides"],
  patch: Record<string, string | null | undefined>,
): TrackingWorkflowFlags["deadlineOverrides"] {
  const next = { ...(current ?? {}) };
  const keys: TrackingWorkflowDeadlineOverrideKey[] = [
    "dijital",
    "secim",
    "duzenleme",
    "baski",
  ];

  for (const key of keys) {
    if (!(key in patch)) continue;
    const value = patch[key];
    if (value === null || value === "") {
      next[key] = null;
    } else if (typeof value === "string") {
      next[key] = value.slice(0, 10);
    }
  }

  return next;
}

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
    const deadlineParsed = deadlineOverrideSchema.safeParse(body);

    if (
      !stageParsed.success &&
      !actionParsed.success &&
      !deadlineParsed.success
    ) {
      return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        items: {
          select: {
            id: true,
            shootType: {
              select: {
                id: true,
                label: true,
                content: true,
                package: {
                  select: { serviceArea: { select: { scheduleType: true } } },
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
      : actionParsed.success
        ? actionParsed.data.itemId
        : deadlineParsed.data!.itemId;

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

    const scheduleType = item.shootType.package.serviceArea
      .scheduleType as ScheduleType;
    const stageDefinitions = resolveWorkflowStages(
      { content: (item.shootType.content ?? {}) as ShootTypeContent },
      scheduleType,
    );
    const validStageIds = new Set(stageDefinitions.map((def) => def.id));
    const hasPrinting = packageHasPrintingStage(stageDefinitions);

    if (stageParsed.success && !validStageIds.has(stageParsed.data.stage)) {
      return NextResponse.json({ error: "Geçersiz aşama" }, { status: 400 });
    }

    const currentFlags = parseTrackingWorkflowFlags(
      postShoot.itemWorkflows?.[itemId],
    );

    let nextFlags: TrackingWorkflowFlags;

    if (deadlineParsed.success && !stageParsed.success && !actionParsed.success) {
      nextFlags = {
        ...currentFlags,
        deadlineOverrides: mergeDeadlineOverrides(
          currentFlags.deadlineOverrides,
          deadlineParsed.data.deadlineOverrides,
        ),
      };
    } else if (stageParsed.success) {
      const staged = stageDefinitions.length
        ? workflowFlagsForAdminStageFromDefinitions(
            stageParsed.data.stage,
            stageDefinitions,
          )
        : workflowFlagsForAdminStage(
            stageParsed.data.stage as Parameters<
              typeof workflowFlagsForAdminStage
            >[0],
            hasPrinting,
          );
      nextFlags = {
        ...staged,
        deadlineOverrides: currentFlags.deadlineOverrides,
        customCompletedAt: {
          ...(currentFlags.customCompletedAt ?? {}),
          ...(staged.customCompletedAt ?? {}),
        },
      };
    } else {
      nextFlags = mergeWorkflowAction(
        currentFlags,
        actionParsed.data!.action as TrackingWorkflowAction,
      );
    }

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
