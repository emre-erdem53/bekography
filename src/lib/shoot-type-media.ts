/** Çekim türü adından fotoğraf / video kapsamı. */

export function includesPhoto(optionLabel: string): boolean {
  const label = optionLabel.toLocaleLowerCase("tr");
  return label.includes("fotoğraf") || label.includes("fotograf");
}

export function includesVideo(optionLabel: string): boolean {
  const label = optionLabel.toLocaleLowerCase("tr");
  return (
    label.includes("video") ||
    label.includes("film") ||
    label.includes("hikaye")
  );
}

export function tagImpliesPhoto(tag: string): boolean {
  const t = tag.toLocaleLowerCase("tr");
  return (
    t.includes("fotoğraf") ||
    t.includes("fotograf") ||
    t.includes("albüm") ||
    t.includes("album") ||
    t.includes("çerçeve") ||
    t.includes("cerceve")
  );
}

export function tagImpliesVideo(tag: string): boolean {
  const t = tag.toLocaleLowerCase("tr");
  return (
    t.includes("video") ||
    t.includes("film") ||
    t.includes("müzik") ||
    t.includes("muzik")
  );
}

/**
 * Video-only paketten fotoğraf / albüm etiketlerini,
 * fotoğraf-only paketten video / müzik etiketlerini çıkarır.
 * Adında ikisi de yoksa (belirsiz) dokunulmaz.
 */
export function filterTagsForShootTypeMedia(
  tags: string[],
  optionLabel: string,
): string[] {
  const hasPhoto = includesPhoto(optionLabel);
  const hasVideo = includesVideo(optionLabel);
  if (!hasPhoto && !hasVideo) return tags;

  return tags.filter((tag) => {
    if (!hasVideo && tagImpliesVideo(tag)) return false;
    if (!hasPhoto && tagImpliesPhoto(tag)) return false;
    return true;
  });
}

export function filterStageTagsForShootTypeMedia<
  T extends Record<string, string[]>,
>(stageTags: T, optionLabel: string): T {
  const hasPhoto = includesPhoto(optionLabel);
  const hasVideo = includesVideo(optionLabel);
  if (!hasPhoto && !hasVideo) return stageTags;

  const next = { ...stageTags };
  for (const [stageId, tags] of Object.entries(stageTags)) {
    // Baskı yalnızca fotoğraf ürünleri içindir.
    if (
      !hasPhoto &&
      (stageId === "baski" || stageId.toLocaleLowerCase("tr").includes("baski"))
    ) {
      next[stageId as keyof T] = [] as unknown as T[keyof T];
      continue;
    }
    next[stageId as keyof T] = filterTagsForShootTypeMedia(
      tags,
      optionLabel,
    ) as unknown as T[keyof T];
  }
  return next;
}
