import type { ExploreMediaItem } from "@/lib/explore-media-types";

/** CSS viewport — iPhone 17 Pro Max (en geniş telefon ekranı referansı). */
export const IPHONE_17_PRO_MAX = {
  viewportWidth: 440,
  viewportHeight: 956,
  /** `HomeExploreCarousel` üst boşluğu (`pt-24`). */
  headerOffset: 96,
} as const;

const GRID_GAP_PX = 1;
const GRID_ROW_UNIT_VW = 0.3;

export function exploreGridRowUnitPx(viewportWidth: number): number {
  return viewportWidth * GRID_ROW_UNIT_VW;
}

export function exploreGridBottomRow(
  items: ExploreMediaItem[],
  count: number,
): number {
  let maxEndRow = 0;
  for (let i = 0; i < Math.min(count, items.length); i++) {
    const pattern = items[i]?.displayPattern;
    if (!pattern?.rowStart) continue;
    const endRow = pattern.rowStart + pattern.rowSpan - 1;
    if (endRow > maxEndRow) maxEndRow = endRow;
  }
  return maxEndRow;
}

export function exploreGridHeightPx(
  items: ExploreMediaItem[],
  count: number,
  viewportWidth: number = IPHONE_17_PRO_MAX.viewportWidth,
): number {
  const maxEndRow = exploreGridBottomRow(items, count);
  if (maxEndRow === 0) return 0;
  const rowPx = exploreGridRowUnitPx(viewportWidth);
  return maxEndRow * rowPx + (maxEndRow - 1) * GRID_GAP_PX;
}

function availableGridHeightPx(): number {
  return (
    IPHONE_17_PRO_MAX.viewportHeight - IPHONE_17_PRO_MAX.headerOffset
  );
}

/** Grid yüksekliği `maxHeightPx` içine sığan öğe sayısı. */
export function countExploreItemsFittingHeight(
  items: ExploreMediaItem[],
  maxHeightPx: number,
  viewportWidth: number = IPHONE_17_PRO_MAX.viewportWidth,
): number {
  let best = 0;
  for (let n = 1; n <= items.length; n++) {
    const height = exploreGridHeightPx(items, n, viewportWidth);
    if (height <= maxHeightPx) best = n;
    else break;
  }
  return Math.max(1, best);
}

/** İlk yükleme: Pro Max ekranına sığan karo sayısı. */
export function getInitialExploreVisibleCount(
  items: ExploreMediaItem[],
): number {
  if (items.length === 0) return 0;
  return countExploreItemsFittingHeight(items, availableGridHeightPx());
}

/** Scroll ile bir ekran daha içerik: mevcut sayıdan sonra eklenecek karo adedi. */
export function getExploreLoadMoreCount(
  items: ExploreMediaItem[],
  currentCount: number,
): number {
  if (currentCount >= items.length) return 0;

  const viewportWidth = IPHONE_17_PRO_MAX.viewportWidth;
  const currentHeight = exploreGridHeightPx(items, currentCount, viewportWidth);
  const targetHeight = currentHeight + availableGridHeightPx();

  let end = currentCount;
  for (let n = currentCount + 1; n <= items.length; n++) {
    end = n;
    const height = exploreGridHeightPx(items, n, viewportWidth);
    if (height >= targetHeight) break;
  }

  return Math.max(1, end - currentCount);
}
