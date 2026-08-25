import type { ShootTypeData } from "@/lib/package-types";

/** Çekim türünün takip ekranı süreç etiketleri — aşama id veya built-in key ile anahtarlı. */
export function resolveShootTypeWorkflowStageTags(
  shootType: Pick<ShootTypeData, "content"> | undefined,
): Record<string, string[]> {
  const stored = shootType?.content?.workflowStageTags;
  if (!stored) return {};

  const tags: Record<string, string[]> = {};
  for (const [stageId, pills] of Object.entries(stored)) {
    if (Array.isArray(pills)) {
      tags[stageId] = pills.filter(Boolean);
    }
  }
  return tags;
}

export function hasAnyWorkflowStageTags(
  tags: Record<string, string[]>,
): boolean {
  return Object.values(tags).some((entries) => entries.length > 0);
}
