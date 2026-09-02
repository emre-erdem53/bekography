import type { ScheduleType } from "@/lib/package-types";
import { hasAnyWorkflowStageTags } from "@/lib/package-workflow-stage-tags";

export type WorkflowStageTagsMap = Record<string, string[]>;

const REZERVASYON_TAGS = ["Whatsapp", "Onaylı"] as const;
const CEKIM_TAGS = ["Profesyonel Ekip", "Rehberlik", "3 Saat"] as const;
const DIJITAL_TAGS = [
  "En Fazla 7 Günde Hazır",
  "Tüm Çekilenler",
  "Diskinizle Teslim Edilir",
  "30 Günde Almalısınız",
] as const;
const SECIM_TAGS = ["30 Günde", "1 Müzik", "Whatsapp'dan Gönder"] as const;
const DUZENLEME_INDOOR_TAGS = ["En fazla 70 gün", "Salon Filmi"] as const;
const DUZENLEME_OUTDOOR_TAGS = [
  "18 Fotoğraf",
  "Dış Çekim Filmi",
  "70 Gün",
] as const;
const BASKI_TAGS = ["Albüm", "3 Çerçeve", "30 Gün"] as const;

/** Tüm çekim türleri için başlangıç süreç etiketleri; admin panelden özelleştirilebilir. */
export function buildDefaultWorkflowStageTags(
  scheduleType: ScheduleType = "indoor",
): WorkflowStageTagsMap {
  const tags: WorkflowStageTagsMap = {
    rezervasyon: [...REZERVASYON_TAGS],
    cekim: [...CEKIM_TAGS],
    dijital: [...DIJITAL_TAGS],
    secim: [...SECIM_TAGS],
    duzenleme:
      scheduleType === "outdoor"
        ? [...DUZENLEME_OUTDOOR_TAGS]
        : [...DUZENLEME_INDOOR_TAGS],
  };

  if (scheduleType === "outdoor") {
    tags.baski = [...BASKI_TAGS];
  }

  return tags;
}

export function ensureWorkflowStageTags(
  existing: WorkflowStageTagsMap | undefined,
  scheduleType: ScheduleType = "indoor",
): WorkflowStageTagsMap {
  if (existing && hasAnyWorkflowStageTags(existing)) {
    return existing;
  }
  return buildDefaultWorkflowStageTags(scheduleType);
}
