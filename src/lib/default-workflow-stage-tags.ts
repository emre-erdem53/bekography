import type { ScheduleType } from "@/lib/package-types";
import { hasAnyWorkflowStageTags } from "@/lib/package-workflow-stage-tags";
import { filterStageTagsForShootTypeMedia } from "@/lib/shoot-type-media";

export type WorkflowStageTagsMap = Record<string, string[]>;

const REZERVASYON_TAGS = ["Whatsapp", "Onaylı"] as const;

const CEKIM_INDOOR_TAGS = ["Profesyonel Ekip", "Rehberlik", "3 Saat"] as const;
const CEKIM_OUTDOOR_TAGS = ["Dış Çekim", "Fotoğraf", "Video"] as const;

const DIJITAL_INDOOR_TAGS = [
  "En Fazla 7 Günde Hazır",
  "Tüm Çekilenler",
  "Diskinizle Teslim Edilir",
  "30 Günde Almalısınız",
] as const;
const DIJITAL_OUTDOOR_TAGS = [
  "Ham Parça Videolar",
  "Videolar Tek Parça",
  "Orijinal Fotoğraflar",
] as const;

const SECIM_INDOOR_TAGS = ["30 Günde", "1 Müzik", "Whatsapp'dan Gönder"] as const;
const SECIM_OUTDOOR_TAGS = [
  "18 Fotoğraf",
  "1 Müzik",
  "Whatsapp'dan Gönder",
] as const;

const DUZENLEME_INDOOR_TAGS = ["En fazla 70 gün", "Salon Filmi"] as const;
const DUZENLEME_OUTDOOR_TAGS = [
  "18 Fotoğraf",
  "1 Albüm Tasarımı",
  "3 Çerçeve Tasarımı",
  "Film (30-60 Sn.)",
] as const;

const BASKI_TAGS = [
  "1 Albüm (30x60 cm)",
  "3 Çerçeve (25x25 cm)",
  "Ücretsiz Kargo",
] as const;

type BuildOptions = {
  scheduleType?: ScheduleType;
  /** Çekim türü adı — "Fotoğraf", "Video", "Fotoğraf + Video" vb. */
  optionLabel?: string;
};

/** Tüm çekim türleri için başlangıç süreç etiketleri; admin panelden özelleştirilebilir. */
export function buildDefaultWorkflowStageTags(
  scheduleTypeOrOptions: ScheduleType | BuildOptions = "indoor",
  optionLabelArg?: string,
): WorkflowStageTagsMap {
  const scheduleType =
    typeof scheduleTypeOrOptions === "string"
      ? scheduleTypeOrOptions
      : (scheduleTypeOrOptions.scheduleType ?? "indoor");
  const optionLabel =
    typeof scheduleTypeOrOptions === "string"
      ? (optionLabelArg ?? "")
      : (scheduleTypeOrOptions.optionLabel ?? "");

  const isOutdoor = scheduleType === "outdoor";

  const tags: WorkflowStageTagsMap = {
    rezervasyon: [...REZERVASYON_TAGS],
    cekim: isOutdoor ? [...CEKIM_OUTDOOR_TAGS] : [...CEKIM_INDOOR_TAGS],
    dijital: isOutdoor ? [...DIJITAL_OUTDOOR_TAGS] : [...DIJITAL_INDOOR_TAGS],
    secim: isOutdoor ? [...SECIM_OUTDOOR_TAGS] : [...SECIM_INDOOR_TAGS],
    duzenleme: isOutdoor
      ? [...DUZENLEME_OUTDOOR_TAGS]
      : [...DUZENLEME_INDOOR_TAGS],
  };

  if (isOutdoor) {
    tags.baski = [...BASKI_TAGS];
  }

  if (!optionLabel.trim()) return tags;
  return filterStageTagsForShootTypeMedia(tags, optionLabel);
}

export function ensureWorkflowStageTags(
  existing: WorkflowStageTagsMap | undefined,
  scheduleType: ScheduleType = "indoor",
  optionLabel = "",
): WorkflowStageTagsMap {
  if (existing && hasAnyWorkflowStageTags(existing)) {
    if (!optionLabel.trim()) return existing;
    return filterStageTagsForShootTypeMedia(existing, optionLabel);
  }
  return buildDefaultWorkflowStageTags(scheduleType, optionLabel);
}
