import type { PackageDetailSection } from "@/lib/package-seed-data";
import { normalizePostShootSectionTitle } from "@/lib/post-shoot-from-inspect";
import type { PostShootSnapshot } from "@/lib/post-shoot";
import type { TrackingWorkflowStageId } from "@/lib/tracking-workflow";

const EMPTY_STAGE_TAGS: Record<TrackingWorkflowStageId, string[]> = {
  rezervasyon: [],
  cekim: [],
  dijital: [],
  secim: [],
  duzenleme: [],
  baski: [],
};

function mapSectionTitleToWorkflowStage(
  title: string,
): TrackingWorkflowStageId | null {
  const key = title.trim().toLocaleLowerCase("tr");

  if (key.includes("rezervasyon")) return "rezervasyon";
  if (key.includes("seçim") || key.includes("secim")) return "secim";
  if (key.includes("çekim öncesi") || key === "çekim" || key.startsWith("çekim "))
    return "cekim";

  const postShootKind = normalizePostShootSectionTitle(title);
  if (postShootKind === "digital") return "dijital";
  if (postShootKind === "editing") return "duzenleme";
  if (postShootKind === "printing") return "baski";

  return null;
}

function appendUniqueTags(
  target: Record<TrackingWorkflowStageId, string[]>,
  stageId: TrackingWorkflowStageId,
  tags: string[],
) {
  if (tags.length === 0) return;
  const existing = new Set(target[stageId]);
  for (const tag of tags) {
    const trimmed = tag.trim();
    if (!trimmed || existing.has(trimmed)) continue;
    existing.add(trimmed);
    target[stageId].push(trimmed);
  }
}

/** Paket incele bölümlerindeki etiketleri sipariş süreci aşamalarına eşler. */
export function buildWorkflowStageTags(
  detailSections: PackageDetailSection[],
  postShoot?: PostShootSnapshot,
): Record<TrackingWorkflowStageId, string[]> {
  const tags: Record<TrackingWorkflowStageId, string[]> = {
    rezervasyon: [],
    cekim: [],
    dijital: [],
    secim: [],
    duzenleme: [],
    baski: [],
  };

  for (const section of detailSections) {
    const stageId = mapSectionTitleToWorkflowStage(section.title);
    if (!stageId) continue;
    appendUniqueTags(tags, stageId, section.tags ?? []);
  }

  if (postShoot) {
    if (tags.dijital.length === 0) {
      appendUniqueTags(tags, "dijital", postShoot.digital.pills);
    }
    if (tags.duzenleme.length === 0) {
      appendUniqueTags(tags, "duzenleme", postShoot.editing.pills);
    }
    if (tags.baski.length === 0) {
      appendUniqueTags(tags, "baski", postShoot.printing.pills);
    }
  }

  return tags;
}

export function getStageTagsForWorkflow(
  stageTags: Record<TrackingWorkflowStageId, string[]>,
  stageId: TrackingWorkflowStageId,
): string[] {
  return stageTags[stageId] ?? EMPTY_STAGE_TAGS[stageId];
}
