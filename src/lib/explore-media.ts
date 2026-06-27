import type {
  DisplayPattern,
  ExploreCarouselSlide,
  ExploreMediaItem,
} from "@/lib/explore-media-types";

export type {
  DisplayPattern,
  ExploreCarouselSlide,
  ExploreMediaItem,
} from "@/lib/explore-media-types";

// Files whose source media is landscape (verified via dimensions).
const LANDSCAPE_FILES = new Set<string>([
  "30.jpg",
  "31.jpg",
  "video1.mp4",
  "video2.mp4",
  "video3.mp4",
  "video4.mp4",
  "video5.mp4",
  "video7.mp4",
  "video9.mp4",
  "video11.mp4",
  "video13.mp4",
]);

function getOrientation(fileName: string): "portrait" | "landscape" {
  return LANDSCAPE_FILES.has(fileName) ? "landscape" : "portrait";
}

const blobBaseUrl = process.env.NEXT_PUBLIC_BLOB_BASE_URL?.replace(/\/+$/, "");
const blobReelsPath = process.env.NEXT_PUBLIC_BLOB_REELS_PATH
  ?.replace(/^\/+/, "")
  .replace(/\/+$/, "");

function createMediaUrl(fileName: string) {
  if (!blobBaseUrl) {
    return `/reels/${fileName}`;
  }

  const prefix = blobReelsPath ? `${blobReelsPath}/` : "";
  return `${blobBaseUrl}/${prefix}${fileName}`;
}

const instagramUrlByFile: Record<string, string> = {
  "video1.mp4":
    "https://www.instagram.com/reel/DVMJ1yijr7b/?igsh=MXI1bWd1aXY4dWRqbQ==",
  "video2.mp4":
    "https://www.instagram.com/reel/DQuQN3kDLYL/?igsh=MWNwdHhiZTQ4NjBhYw==",
  "video3.mp4":
    "https://www.instagram.com/reel/DLZ1GZntC2j/?igsh=MWt4M2J3eWg0aTl6Nw==",
  "video4.mp4":
    "https://www.instagram.com/reel/DLLDULltyhX/?igsh=MW5udmJwMWVreDExcA==",
  "video5.mp4":
    "https://www.instagram.com/reel/DTfDMzgjOXU/?igsh=MWRtZWxnMG9rMGwwdA==",
  "video6.mp4":
    "https://www.instagram.com/reel/DD96Be0NbFF/?igsh=MWFtYWRxdXhjbDUycA==",
  "video7.mp4":
    "https://www.instagram.com/reel/DC4XRLQN9SA/?igsh=YnA4bXlzOHAweHY5",
  "video8.mp4":
    "https://www.instagram.com/reel/DOi_Je4DHFc/?igsh=NWRoNjFjbDRrdHNu",
  "video9.mp4":
    "https://www.instagram.com/reel/DQrpXyHjAki/?igsh=MWJoOXU3ajd5YTlhaw==",
  "video10.mp4":
    "https://www.instagram.com/reel/C-V7UTctcOz/?igsh=N2NoN25tYnYwbDMy",
  "video11.mp4":
    "https://www.instagram.com/reel/DCKgTH2NDks/?igsh=MWFzbjcxaHEza3l4NA==",
  "video12.mp4":
    "https://www.instagram.com/reel/DLf17E4N0Vs/?igsh=YnY1Zm9heWYxeXBs",
  "video13.mp4":
    "https://www.instagram.com/reel/DQrpXyHjAki/?igsh=MWJoOXU3ajd5YTlhaw==",
};

const HAZIRAN_FILES = Array.from(
  { length: 15 },
  (_, index) => `haziran-${index + 1}.png`,
);

const imageCarouselGroups: Array<{ files: string[]; url: string }> = [
  {
    files: HAZIRAN_FILES,
    url: "https://www.instagram.com/p/DZSnbdljkIS/?igsh=MXkyMzI5dXhmNmYxOA%3D%3D",
  },
  {
    files: ["38.jpg", "39.jpg", "40.jpg", "41.jpg", "42.jpg", "43.jpg"],
    url: "https://www.instagram.com/p/DS28G3sDtaZ/?igsh=anQzMjM5NXJmNGhh",
  },
  {
    files: ["33.jpg", "34.jpg", "35.jpg", "36.jpg", "37.jpg"],
    url: "https://www.instagram.com/reel/DShYMHUjtH4/?igsh=bGg0YmdrOWU3cmJp",
  },
  {
    files: ["26.jpg", "28.jpg", "29.jpg", "30.jpg", "31.jpg", "32.jpg"],
    url: "https://www.instagram.com/p/DQrbg85jHYQ/?igsh=N21xZGlrZmpna255",
  },
  {
    files: ["27.jpg", "25.jpg", "24.jpg", "23.jpg", "22.jpg"],
    url: "https://www.instagram.com/p/DPzNw9pjuKx",
  },
  {
    files: ["18.jpg", "20.jpg", "21.jpg"],
    url: "https://www.instagram.com/p/DO8qjE6DIzs/?igsh=NmM2MGlmcHcxYXFj",
  },
  {
    files: ["14.jpg", "15.jpg", "16.jpg", "17.jpg", "19.jpg"],
    url: "https://www.instagram.com/p/DPHAgRWDAEW/?igsh=c2ZxMmtnNDJqNHN4",
  },
  {
    files: ["6.jpg", "7.jpg", "8.jpg", "9.jpg", "10.jpg", "11.jpg", "12.jpg", "13.jpg"],
    url: "https://www.instagram.com/p/DNvIB9MWCGJ/?igsh=MTM5dWx2YWx0MHZyNw==",
  },
  {
    files: ["1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg"],
    url: "https://www.instagram.com/p/DMBSKU1tsjk/?igsh=cGZycjJ0MTEyZ2F0",
  },
];

for (const group of imageCarouselGroups) {
  for (const file of group.files) {
    instagramUrlByFile[file] = group.url;
  }
}

function getInstagramUrl(fileName: string) {
  return instagramUrlByFile[fileName] ?? "https://www.instagram.com/bekography/";
}

const imageFiles = [
  ...HAZIRAN_FILES,
  ...Array.from({ length: 29 }, (_, i) => `${i + 1}.jpg`),
  "30.jpg",
  "31.jpg",
  ...Array.from({ length: 12 }, (_, i) => `${i + 32}.jpg`),
];

const videoFiles = Array.from({ length: 13 }, (_, i) => `video${i + 1}.mp4`);

const imageItems: ExploreMediaItem[] = imageFiles.map((file, index) => ({
  id: `i-${index + 1}`,
  type: "image",
  fileName: file,
  src: createMediaUrl(file),
  title: `Fotoğraf ${index + 1}`,
  instagramUrl: getInstagramUrl(file),
  orientation: getOrientation(file),
}));

const videoItems: ExploreMediaItem[] = videoFiles.map((file, index) => ({
  id: `v-${index + 1}`,
  type: "video",
  fileName: file,
  src: createMediaUrl(file),
  poster: createMediaUrl(`${Math.min(index + 1, imageFiles.length)}.jpg`),
  title: `Video ${index + 1}`,
  instagramUrl: getInstagramUrl(file),
  orientation: getOrientation(file),
}));

const imageItemByFile = new Map(imageItems.map((item) => [item.fileName, item]));

const carouselGroupByFile = new Map<
  string,
  { coverFile: string; files: string[]; url: string }
>();

for (const group of imageCarouselGroups) {
  const coverFile = group.files[0];
  if (!coverFile) {
    continue;
  }
  for (const fileName of group.files) {
    carouselGroupByFile.set(fileName, {
      coverFile,
      files: group.files,
      url: group.url,
    });
  }
}

function toCarouselSlide(item: ExploreMediaItem): ExploreCarouselSlide {
  return {
    id: item.id,
    type: item.type,
    fileName: item.fileName,
    src: item.src,
    poster: item.poster,
    title: item.title,
    orientation: item.orientation,
  };
}

function buildFeedCandidates(items: ExploreMediaItem[]): ExploreMediaItem[] {
  const result: ExploreMediaItem[] = [];

  for (const item of items) {
    if (item.type !== "image") {
      result.push(item);
      continue;
    }

    const group = carouselGroupByFile.get(item.fileName);
    if (!group) {
      result.push(item);
      continue;
    }

    // Only show the group's cover image in grid/feed.
    if (item.fileName !== group.coverFile) {
      continue;
    }

    const slides = group.files
      .map((fileName) => imageItemByFile.get(fileName))
      .filter((entry): entry is ExploreMediaItem => entry !== undefined)
      .map(toCarouselSlide);

    result.push({
      ...item,
      carouselItems: slides.length > 1 ? slides : undefined,
    });
  }

  return result;
}

const MIXED_PATTERN: DisplayPattern[] = [
  { colSpan: 3, rowSpan: 1 },
  { colSpan: 1, rowSpan: 2 },
  { colSpan: 1, rowSpan: 1 },
  { colSpan: 1, rowSpan: 1 },
  { colSpan: 2, rowSpan: 1 },
  { colSpan: 1, rowSpan: 1 },
  { colSpan: 1, rowSpan: 1 },
  { colSpan: 1, rowSpan: 1 },
  { colSpan: 2, rowSpan: 1 },
  { colSpan: 1, rowSpan: 1 },
];

function withPattern(item: ExploreMediaItem, pattern: DisplayPattern): ExploreMediaItem {
  return { ...item, displayPattern: pattern };
}

type GridPlacement = {
  item: ExploreMediaItem;
  pattern: DisplayPattern;
};

const GRID_COLS = 3;

function getBasePattern(item: ExploreMediaItem): DisplayPattern {
  const fallback = item.displayPattern ?? { colSpan: 1, rowSpan: 1 };

  if (item.fileName === "video1.mp4") {
    return { colSpan: 3, rowSpan: 2 };
  }
  if (item.fileName === "haziran-1.png") {
    return { colSpan: 2, rowSpan: 3 };
  }
  if (item.fileName === "6.jpg") {
    return { colSpan: 1, rowSpan: 2 };
  }
  if (item.fileName === "video2.mp4") {
    return { colSpan: 2, rowSpan: 1 };
  }
  if (item.fileName === "video3.mp4") {
    return { colSpan: 3, rowSpan: 2 };
  }
  if (item.fileName === "video5.mp4") {
    return { colSpan: 3, rowSpan: 1 };
  }
  if (item.fileName === "video8.mp4") {
    return { colSpan: 2, rowSpan: 3 };
  }
  if (item.fileName === "video6.mp4") {
    return { colSpan: 1, rowSpan: 3 };
  }
  if (item.fileName === "video10.mp4") {
    return { colSpan: 1, rowSpan: 2 };
  }
  if (item.fileName === "video9.mp4" || item.fileName === "video11.mp4") {
    return { colSpan: 1, rowSpan: 1 };
  }
  if (item.fileName === "video12.mp4") {
    return { colSpan: 2, rowSpan: 2 };
  }

  return { colSpan: fallback.colSpan, rowSpan: fallback.rowSpan };
}

function cellKey(row: number, col: number) {
  return `${row},${col}`;
}

function patternCells(pattern: DisplayPattern): Array<{ row: number; col: number }> {
  const startRow = pattern.rowStart ?? 1;
  const startCol = pattern.colStart ?? 1;
  const cells: Array<{ row: number; col: number }> = [];
  for (let r = startRow; r < startRow + pattern.rowSpan; r++) {
    for (let c = startCol; c < startCol + pattern.colSpan; c++) {
      cells.push({ row: r, col: c });
    }
  }
  return cells;
}

function patternsOverlap(a: DisplayPattern, b: DisplayPattern) {
  const aCells = new Set(patternCells(a).map(({ row, col }) => cellKey(row, col)));
  return patternCells(b).some(({ row, col }) => aCells.has(cellKey(row, col)));
}

class ExploreGridPacker {
  private occupied = new Set<string>();
  private placements: GridPlacement[] = [];

  private isFree(row: number, col: number, w: number, h: number) {
    if (col < 1 || row < 1 || col + w - 1 > GRID_COLS) return false;
    for (let r = row; r < row + h; r++) {
      for (let c = col; c < col + w; c++) {
        if (this.occupied.has(cellKey(r, c))) return false;
      }
    }
    return true;
  }

  private occupy(pattern: DisplayPattern) {
    for (const { row, col } of patternCells(pattern)) {
      this.occupied.add(cellKey(row, col));
    }
  }

  private release(pattern: DisplayPattern) {
    for (const { row, col } of patternCells(pattern)) {
      this.occupied.delete(cellKey(row, col));
    }
  }

  findFirst(w: number, h: number, minRow = 1) {
    for (let row = minRow; row < 500; row++) {
      for (let col = 1; col <= GRID_COLS - w + 1; col++) {
        if (this.isFree(row, col, w, h)) {
          return { row, col };
        }
      }
    }
    throw new Error("Grid yerleşimi taştı.");
  }

  anchorForNextSingleCell() {
    return this.findFirst(1, 1);
  }

  place(item: ExploreMediaItem, pattern: DisplayPattern): GridPlacement {
    let rowStart = pattern.rowStart;
    let colStart = pattern.colStart;

    if (rowStart === undefined || colStart === undefined) {
      const slot = this.findFirst(pattern.colSpan, pattern.rowSpan);
      rowStart = rowStart ?? slot.row;
      colStart = colStart ?? slot.col;
    }

    if (!this.isFree(rowStart, colStart, pattern.colSpan, pattern.rowSpan)) {
      const slot = this.findFirst(pattern.colSpan, pattern.rowSpan);
      rowStart = slot.row;
      colStart = slot.col;
    }

    const resolved: DisplayPattern = {
      colSpan: pattern.colSpan,
      rowSpan: pattern.rowSpan,
      rowStart,
      colStart,
    };

    this.occupy(resolved);
    const placement = { item, pattern: resolved };
    this.placements.push(placement);
    return placement;
  }

  evictOverlapping(target: DisplayPattern): GridPlacement[] {
    const evicted = this.placements.filter((p) => patternsOverlap(p.pattern, target));
    for (const placement of evicted) {
      this.release(placement.pattern);
      this.placements = this.placements.filter((p) => p !== placement);
    }
    return evicted;
  }

  isPlaced(item: ExploreMediaItem) {
    return this.placements.some((p) => p.item.id === item.id);
  }

  getResultsSorted() {
    return [...this.placements].sort(
      (a, b) =>
        (a.pattern.rowStart ?? 0) - (b.pattern.rowStart ?? 0) ||
        (a.pattern.colStart ?? 0) - (b.pattern.colStart ?? 0),
    );
  }
}

function dedupePlacements(list: GridPlacement[]): GridPlacement[] {
  const seen = new Set<string>();
  return list.filter((entry) => {
    if (seen.has(entry.item.id)) return false;
    seen.add(entry.item.id);
    return true;
  });
}

/** video3 altında: solda 26.jpg (1×2) + 38.jpg (1×1), sağda video8 (2×3), altında video5 (3×1). */
function placeVideo8BandAfterVideo3(
  packer: ExploreGridPacker,
  items: ExploreMediaItem[],
  output: GridPlacement[],
  rowAfterVideo3: number,
  displacedPool: GridPlacement[],
) {
  const item26 = items.find((entry) => entry.fileName === "26.jpg");
  const item38 = items.find((entry) => entry.fileName === "38.jpg");
  const itemVideo8 = items.find((entry) => entry.fileName === "video8.mp4");
  const itemVideo5 = items.find((entry) => entry.fileName === "video5.mp4");
  const pinnedIds = new Set(
    [item26?.id, item38?.id, itemVideo8?.id, itemVideo5?.id].filter(
      (id): id is string => Boolean(id),
    ),
  );

  const pattern26: DisplayPattern = {
    colSpan: 1,
    rowSpan: 2,
    colStart: 1,
    rowStart: rowAfterVideo3,
  };

  const pattern38: DisplayPattern = {
    colSpan: 1,
    rowSpan: 1,
    colStart: 1,
    rowStart: rowAfterVideo3 + pattern26.rowSpan,
  };

  const patternVideo8: DisplayPattern = {
    colSpan: 2,
    rowSpan: 3,
    colStart: 2,
    rowStart: rowAfterVideo3,
  };

  const rowAfterVideo8 = rowAfterVideo3 + patternVideo8.rowSpan;
  const patternVideo5: DisplayPattern = {
    colSpan: 3,
    rowSpan: 1,
    colStart: 1,
    rowStart: rowAfterVideo8,
  };

  const evicted = dedupePlacements(
    [pattern26, pattern38, patternVideo8, patternVideo5].flatMap((pattern) =>
      packer.evictOverlapping(pattern),
    ),
  ).filter((entry) => !pinnedIds.has(entry.item.id));

  if (item26 && !packer.isPlaced(item26)) {
    output.push(packer.place(item26, pattern26));
  }

  if (item38 && !packer.isPlaced(item38)) {
    output.push(packer.place(item38, pattern38));
  }

  if (itemVideo8 && !packer.isPlaced(itemVideo8)) {
    output.push(packer.place(itemVideo8, patternVideo8));
  }

  if (itemVideo5 && !packer.isPlaced(itemVideo5)) {
    output.push(packer.place(itemVideo5, patternVideo5));
  }

  relocateBelow(
    packer,
    dedupePlacements([
      ...displacedPool.filter((entry) => !pinnedIds.has(entry.item.id)),
      ...evicted,
    ]),
    rowAfterVideo8 + patternVideo5.rowSpan,
    output,
  );
}

/** 3 sütunluk bant: solda 27.jpg (1×2), sağda 33.jpg (2×2); altında video3.mp4 tam genişlik (3×2). */
function place27And33Pair(
  packer: ExploreGridPacker,
  item27: ExploreMediaItem,
  item33: ExploreMediaItem,
  items: ExploreMediaItem[],
  output: GridPlacement[],
) {
  const band = packer.findFirst(3, 2);

  const pattern27: DisplayPattern = {
    colSpan: 1,
    rowSpan: 2,
    colStart: band.col,
    rowStart: band.row,
  };

  const pattern33: DisplayPattern = {
    colSpan: 2,
    rowSpan: 2,
    colStart: band.col + 1,
    rowStart: band.row,
  };

  const displaced = dedupePlacements([
    ...packer.evictOverlapping(pattern27),
    ...packer.evictOverlapping(pattern33),
  ]);

  output.push(packer.place(item27, pattern27));
  output.push(packer.place(item33, pattern33));

  const belowRow = band.row + 2;
  const itemVideo3 = items.find((entry) => entry.fileName === "video3.mp4");
  const pinnedVideo3Id = itemVideo3?.id;

  const patternVideo3: DisplayPattern | undefined = itemVideo3
    ? {
        colSpan: 3,
        rowSpan: 2,
        colStart: band.col,
        rowStart: belowRow,
      }
    : undefined;

  const displacedBelow = dedupePlacements([
    ...(patternVideo3 ? packer.evictOverlapping(patternVideo3) : []),
  ]).filter(
    (entry) => !pinnedVideo3Id || entry.item.id !== pinnedVideo3Id,
  );

  if (itemVideo3 && patternVideo3 && !packer.isPlaced(itemVideo3)) {
    output.push(packer.place(itemVideo3, patternVideo3));
  }

  const rowAfterVideo3 = belowRow + (patternVideo3?.rowSpan ?? 1);

  placeVideo8BandAfterVideo3(
    packer,
    items,
    output,
    rowAfterVideo3,
    dedupePlacements([
      ...displaced.filter(
        (entry) => !pinnedVideo3Id || entry.item.id !== pinnedVideo3Id,
      ),
      ...displacedBelow,
    ]),
  );
}

/** 27+33 bandı; kalan görselleri video blokları olmadan altına sıkıştırır. */
function place27And33PairImageOnly(
  packer: ExploreGridPacker,
  item27: ExploreMediaItem,
  item33: ExploreMediaItem,
  items: ExploreMediaItem[],
  output: GridPlacement[],
) {
  const band = packer.findFirst(3, 2);

  const pattern27: DisplayPattern = {
    colSpan: 1,
    rowSpan: 2,
    colStart: band.col,
    rowStart: band.row,
  };

  const pattern33: DisplayPattern = {
    colSpan: 2,
    rowSpan: 2,
    colStart: band.col + 1,
    rowStart: band.row,
  };

  const displaced = dedupePlacements([
    ...packer.evictOverlapping(pattern27),
    ...packer.evictOverlapping(pattern33),
  ]);

  output.push(packer.place(item27, pattern27));
  output.push(packer.place(item33, pattern33));

  const belowRow = band.row + 2;
  const displacedIds = new Set(displaced.map((entry) => entry.item.id));
  const remaining = items.filter(
    (entry) => !packer.isPlaced(entry) && !displacedIds.has(entry.id),
  );

  relocateBelow(
    packer,
    dedupePlacements([
      ...displaced,
      ...remaining.map((item) => ({
        item,
        pattern: getBasePattern(item),
      })),
    ]),
    belowRow,
    output,
  );
}

/** Fotoğraf akışında 18.jpg, video2 yerine satırı 2 sütuna yayar. */
function fixPhoto18Row(items: ExploreMediaItem[]): ExploreMediaItem[] {
  const img18 = items.find((entry) => entry.fileName === "18.jpg");
  if (!img18?.displayPattern?.rowStart) {
    return items;
  }

  const row = img18.displayPattern.rowStart;
  const img18Pattern: DisplayPattern = {
    colSpan: 2,
    rowSpan: 1,
    colStart: 1,
    rowStart: row,
  };

  const overlappers = items.filter(
    (entry) =>
      entry.fileName !== "18.jpg" &&
      entry.displayPattern &&
      patternsOverlap(img18Pattern, entry.displayPattern),
  );

  if (overlappers.length === 0) {
    return items.map((entry) =>
      entry.fileName === "18.jpg"
        ? { ...entry, displayPattern: img18Pattern }
        : entry,
    );
  }

  const packer = new ExploreGridPacker();
  const fixed = items.map((entry) =>
    entry.fileName === "18.jpg"
      ? { ...entry, displayPattern: img18Pattern }
      : entry,
  );

  for (const entry of fixed) {
    if (
      overlappers.some((overlapper) => overlapper.id === entry.id) ||
      !entry.displayPattern?.colStart ||
      !entry.displayPattern?.rowStart
    ) {
      continue;
    }
    packer.place(entry, entry.displayPattern);
  }

  for (const entry of overlappers) {
    const base = getBasePattern(entry);
    const slot = packer.findFirst(base.colSpan, base.rowSpan, row + 1);
    packer.place(entry, {
      ...base,
      colStart: slot.col,
      rowStart: slot.row,
    });
  }

  return packer.getResultsSorted().map((placement) => ({
    ...placement.item,
    displayPattern: placement.pattern,
  }));
}

/** Görseller dışı akışlar (videolar vb.): her öğeye grid konumu ata. */
function packMediaGrid(items: ExploreMediaItem[]): ExploreMediaItem[] {
  const packer = new ExploreGridPacker();
  const output: GridPlacement[] = [];

  for (const item of items) {
    if (packer.isPlaced(item)) continue;

    const base = getBasePattern(item);
    const slot = packer.findFirst(base.colSpan, base.rowSpan);
    output.push(
      packer.place(item, {
        ...base,
        colStart: slot.col,
        rowStart: slot.row,
      }),
    );
  }

  return packer.getResultsSorted().map((placement) => ({
    ...placement.item,
    displayPattern: placement.pattern,
  }));
}

/** Sadece görseller: video yerleşim kuralları ve boş video hücreleri yok. */
function packImageOnlyGrid(items: ExploreMediaItem[]): ExploreMediaItem[] {
  const packer = new ExploreGridPacker();
  const output: GridPlacement[] = [];

  for (const item of items) {
    if (packer.isPlaced(item)) continue;

    if (
      item.fileName === "27.jpg" ||
      item.fileName === "26.jpg" ||
      item.fileName === "38.jpg"
    ) {
      continue;
    }

    if (item.fileName === "33.jpg") {
      const item27 = items.find((entry) => entry.fileName === "27.jpg");
      if (item27 && !packer.isPlaced(item27)) {
        place27And33PairImageOnly(packer, item27, item, items, output);
      } else {
        const pattern33: DisplayPattern = {
          colSpan: 2,
          rowSpan: 2,
          colStart: 2,
          rowStart: packer.findFirst(2, 2).row,
        };
        const displaced = packer.evictOverlapping(pattern33);
        output.push(packer.place(item, pattern33));
        relocateBelow(
          packer,
          displaced,
          pattern33.rowStart! + pattern33.rowSpan,
          output,
        );
      }
      continue;
    }

    const base = getBasePattern(item);
    const slot = packer.findFirst(base.colSpan, base.rowSpan);
    output.push(
      packer.place(item, {
        ...base,
        colStart: slot.col,
        rowStart: slot.row,
      }),
    );
  }

  const packed = packer.getResultsSorted().map((placement) => ({
    ...placement.item,
    displayPattern: placement.pattern,
  }));

  return fixPhoto18Row(packed);
}

function relocateBelow(
  packer: ExploreGridPacker,
  displaced: GridPlacement[],
  belowRow: number,
  output: GridPlacement[],
) {
  for (const entry of displaced) {
    const base = getBasePattern(entry.item);
    const slot = packer.findFirst(base.colSpan, base.rowSpan, belowRow);
    output.push(
      packer.place(entry.item, {
        ...base,
        colStart: slot.col,
        rowStart: slot.row,
      }),
    );
  }
}

/** İki öğenin grid konumunu (colStart/rowStart) takas eder; boyutlar aynı kalır. */
function swapGridPositions(
  items: ExploreMediaItem[],
  fileA: string,
  fileB: string,
): ExploreMediaItem[] {
  const itemA = items.find((entry) => entry.fileName === fileA);
  const itemB = items.find((entry) => entry.fileName === fileB);
  const patternA = itemA?.displayPattern;
  const patternB = itemB?.displayPattern;

  if (
    !patternA ||
    !patternB ||
    patternA.colStart === undefined ||
    patternA.rowStart === undefined ||
    patternB.colStart === undefined ||
    patternB.rowStart === undefined
  ) {
    return items;
  }

  const posA = { colStart: patternA.colStart, rowStart: patternA.rowStart };
  const posB = { colStart: patternB.colStart, rowStart: patternB.rowStart };

  return items.map((entry) => {
    if (entry.fileName === fileA) {
      return {
        ...entry,
        displayPattern: { ...patternA, ...posB },
      };
    }
    if (entry.fileName === fileB) {
      return {
        ...entry,
        displayPattern: { ...patternB, ...posA },
      };
    }
    return entry;
  });
}

/**
 * 18.jpg ↔ video2.mp4 takasından sonra: video2 sağda 2 sütun (2–3), 18 solda 1 sütun.
 * Aksi halde video2 tek hücrede kalıp ortada boş (siyah) kutucuk oluşuyor.
 */
function fixSwappedVideo2Row(items: ExploreMediaItem[]): ExploreMediaItem[] {
  const video2Item = items.find((entry) => entry.fileName === "video2.mp4");
  const img18Item = items.find((entry) => entry.fileName === "18.jpg");
  if (
    !video2Item?.displayPattern?.rowStart ||
    !img18Item?.displayPattern?.rowStart
  ) {
    return items;
  }

  const row = video2Item.displayPattern.rowStart;
  if (row !== img18Item.displayPattern.rowStart) {
    return items;
  }

  const video2Pattern: DisplayPattern = {
    colSpan: 2,
    rowSpan: 1,
    colStart: 2,
    rowStart: row,
  };
  const img18Pattern: DisplayPattern = {
    colSpan: 1,
    rowSpan: 1,
    colStart: 1,
    rowStart: row,
  };

  const blockPatterns = [video2Pattern, img18Pattern];
  const overlappers = items.filter(
    (entry) =>
      entry.fileName !== "video2.mp4" &&
      entry.fileName !== "18.jpg" &&
      entry.displayPattern &&
      blockPatterns.some((block) =>
        patternsOverlap(block, entry.displayPattern!),
      ),
  );

  const fixed = items.map((entry) => {
    if (entry.fileName === "video2.mp4") {
      return { ...entry, displayPattern: video2Pattern };
    }
    if (entry.fileName === "18.jpg") {
      return { ...entry, displayPattern: img18Pattern };
    }
    return entry;
  });

  if (overlappers.length === 0) {
    return fixed;
  }

  const packer = new ExploreGridPacker();
  for (const entry of fixed) {
    if (
      overlappers.some((o) => o.id === entry.id) ||
      !entry.displayPattern?.colStart ||
      !entry.displayPattern?.rowStart
    ) {
      continue;
    }
    packer.place(entry, entry.displayPattern);
  }

  const belowRow = row + 1;
  for (const entry of overlappers) {
    const base = getBasePattern(entry);
    const slot = packer.findFirst(base.colSpan, base.rowSpan, belowRow);
    packer.place(entry, {
      ...base,
      colStart: slot.col,
      rowStart: slot.row,
    });
  }

  return packer.getResultsSorted().map((placement) => ({
    ...placement.item,
    displayPattern: placement.pattern,
  }));
}

/**
 * Sağda video6 (1×3); solda video9 + video11 (1×1); altında video10 (1×2) + video12 (2×2).
 */
function placeVideo6To12Layout(items: ExploreMediaItem[]): ExploreMediaItem[] {
  const video6Item = items.find((entry) => entry.fileName === "video6.mp4");
  const video9Item = items.find((entry) => entry.fileName === "video9.mp4");
  const video10Item = items.find((entry) => entry.fileName === "video10.mp4");
  const video11Item = items.find((entry) => entry.fileName === "video11.mp4");
  const video12Item = items.find((entry) => entry.fileName === "video12.mp4");
  const video13Item = items.find((entry) => entry.fileName === "video13.mp4");
  if (
    !video6Item ||
    !video9Item?.displayPattern?.rowStart ||
    !video10Item?.displayPattern?.rowStart ||
    !video10Item.displayPattern?.colStart
  ) {
    return items;
  }

  const blockRow = video9Item.displayPattern.rowStart;

  const video6Pattern: DisplayPattern = {
    colSpan: 1,
    rowSpan: 3,
    colStart: video10Item.displayPattern.colStart,
    rowStart: video10Item.displayPattern.rowStart,
  };

  const video9Pattern: DisplayPattern = {
    colSpan: 1,
    rowSpan: 1,
    colStart: 1,
    rowStart: blockRow,
  };

  const video11Pattern: DisplayPattern = {
    colSpan: 1,
    rowSpan: 1,
    colStart: 2,
    rowStart: blockRow,
  };

  const video10Pattern: DisplayPattern = {
    colSpan: 1,
    rowSpan: 2,
    colStart: 1,
    rowStart: blockRow + 1,
  };

  const video12Pattern: DisplayPattern = {
    colSpan: 2,
    rowSpan: 2,
    colStart: 2,
    rowStart: blockRow + 1,
  };

  const rowAfterBlock = blockRow + 1 + video10Pattern.rowSpan;
  const video13Pattern: DisplayPattern | undefined = video13Item
    ? {
        colSpan: 3,
        rowSpan: 1,
        colStart: 1,
        rowStart: rowAfterBlock,
      }
    : undefined;

  const pinnedFileNames = [
    "video6.mp4",
    "video9.mp4",
    "video10.mp4",
    "video11.mp4",
    "video12.mp4",
    "video13.mp4",
  ];
  const blockPatterns = [
    video6Pattern,
    video9Pattern,
    video11Pattern,
    video10Pattern,
    video12Pattern,
    ...(video13Pattern ? [video13Pattern] : []),
  ];
  const overlappers = items.filter(
    (entry) =>
      !pinnedFileNames.includes(entry.fileName) &&
      entry.displayPattern &&
      blockPatterns.some((block) =>
        patternsOverlap(block, entry.displayPattern!),
      ),
  );

  const fixed = items.map((entry) => {
    if (entry.fileName === "video6.mp4") {
      return { ...entry, displayPattern: video6Pattern };
    }
    if (entry.fileName === "video9.mp4") {
      return { ...entry, displayPattern: video9Pattern };
    }
    if (entry.fileName === "video10.mp4") {
      return { ...entry, displayPattern: video10Pattern };
    }
    if (entry.fileName === "video11.mp4" && video11Item) {
      return { ...entry, displayPattern: video11Pattern };
    }
    if (entry.fileName === "video12.mp4" && video12Item) {
      return { ...entry, displayPattern: video12Pattern };
    }
    if (entry.fileName === "video13.mp4" && video13Pattern) {
      return { ...entry, displayPattern: video13Pattern };
    }
    return entry;
  });

  if (overlappers.length === 0) {
    return fixed;
  }

  const packer = new ExploreGridPacker();
  for (const entry of fixed) {
    if (
      overlappers.some((overlapper) => overlapper.id === entry.id) ||
      !entry.displayPattern?.colStart ||
      !entry.displayPattern?.rowStart
    ) {
      continue;
    }
    packer.place(entry, entry.displayPattern);
  }

  const belowRow = Math.max(
    video6Pattern.rowStart! + video6Pattern.rowSpan,
    rowAfterBlock + (video13Pattern?.rowSpan ?? 0),
  );

  for (const entry of overlappers) {
    const base = getBasePattern(entry);
    const slot = packer.findFirst(base.colSpan, base.rowSpan, belowRow);
    packer.place(entry, {
      ...base,
      colStart: slot.col,
      rowStart: slot.row,
    });
  }

  return packer.getResultsSorted().map((placement) => ({
    ...placement.item,
    displayPattern: placement.pattern,
  }));
}

/** Özel boyutlar + genişletmeler; yerinden edilen öğeler hemen alt satıra sırayla taşınır. */
function packExploreGrid(items: ExploreMediaItem[]): ExploreMediaItem[] {
  const packer = new ExploreGridPacker();
  const output: GridPlacement[] = [];

  for (const item of items) {
    if (packer.isPlaced(item)) continue;

    if (
      item.fileName === "27.jpg" ||
      item.fileName === "26.jpg" ||
      item.fileName === "38.jpg" ||
      item.fileName === "video3.mp4" ||
      item.fileName === "video8.mp4" ||
      item.fileName === "video5.mp4"
    ) {
      // 33.jpg / video3 bloğu ile birlikte yerleştirilir.
      continue;
    }

    if (item.fileName === "33.jpg") {
      const item27 = items.find((entry) => entry.fileName === "27.jpg");
      if (item27 && !packer.isPlaced(item27)) {
        place27And33Pair(packer, item27, item, items, output);
      } else {
        const pattern33: DisplayPattern = {
          colSpan: 2,
          rowSpan: 2,
          colStart: 2,
          rowStart: packer.findFirst(2, 2).row,
        };
        const displaced = packer.evictOverlapping(pattern33);
        output.push(packer.place(item, pattern33));
        relocateBelow(
          packer,
          displaced,
          pattern33.rowStart! + pattern33.rowSpan,
          output,
        );
      }
      continue;
    }

    const base = getBasePattern(item);
    const slot = packer.findFirst(base.colSpan, base.rowSpan);
    output.push(
      packer.place(item, {
        ...base,
        colStart: slot.col,
        rowStart: slot.row,
      }),
    );
  }

  const packed = packer.getResultsSorted().map((p) => ({
    ...p.item,
    displayPattern: p.pattern,
  }));

  const swappedVideo2 = swapGridPositions(packed, "18.jpg", "video2.mp4");
  const fixedVideo2 = fixSwappedVideo2Row(swappedVideo2);
  const swappedVideo6 = swapGridPositions(
    fixedVideo2,
    "video6.mp4",
    "video10.mp4",
  );
  return placeVideo6To12Layout(swappedVideo6);
}

function buildAsymmetricLayout(items: ExploreMediaItem[]): ExploreMediaItem[] {
  const landscapeQueue: ExploreMediaItem[] = [];
  const portraitQueue: ExploreMediaItem[] = [];

  for (const item of items) {
    if (item.orientation === "landscape") {
      landscapeQueue.push(item);
    } else {
      portraitQueue.push(item);
    }
  }

  const result: ExploreMediaItem[] = [];

  while (landscapeQueue.length >= 3 && portraitQueue.length >= 7) {
    for (const pattern of MIXED_PATTERN) {
      const queue = pattern.colSpan >= 2 ? landscapeQueue : portraitQueue;
      const entry = queue.shift();
      if (!entry) {
        break;
      }
      result.push(withPattern(entry, pattern));
    }
  }

  while (landscapeQueue.length > 0 && portraitQueue.length > 0) {
    const land = landscapeQueue.shift();
    const port = portraitQueue.shift();
    if (!land || !port) {
      break;
    }
    result.push(withPattern(land, { colSpan: 2, rowSpan: 1 }));
    result.push(withPattern(port, { colSpan: 1, rowSpan: 1 }));
  }

  while (portraitQueue.length > 0) {
    const entry = portraitQueue.shift();
    if (!entry) {
      break;
    }
    result.push(withPattern(entry, { colSpan: 1, rowSpan: 1 }));
  }

  while (landscapeQueue.length > 0) {
    const entry = landscapeQueue.shift();
    if (!entry) {
      break;
    }
    result.push(withPattern(entry, { colSpan: 3, rowSpan: 1 }));
  }

  return result;
}

const manuallyOrderedMediaItems = (() => {
  const allItems = buildFeedCandidates([...imageItems, ...videoItems]);
  const byFileName = new Map(allItems.map((item) => [item.fileName, item]));
  const used = new Set<string>();

  const priorityOrder = [
    "haziran-1.png",
    "video1.mp4",
    "video2.mp4",
    "6.jpg",
    "14.jpg",
    "18.jpg",
    "27.jpg",
    "26.jpg",
    "33.jpg",
    "38.jpg",
  ] as const;

  const ordered: ExploreMediaItem[] = [];

  for (const fileName of priorityOrder) {
    const entry = byFileName.get(fileName);
    if (!entry || used.has(entry.id)) {
      continue;
    }
    ordered.push(entry);
    used.add(entry.id);
  }

  for (const entry of allItems) {
    if (used.has(entry.id)) {
      continue;
    }
    if (entry.fileName === "1.jpg") {
      continue;
    }
    ordered.push(entry);
    used.add(entry.id);
  }

  return packExploreGrid(buildAsymmetricLayout(ordered));
})();

/** Anasayfa akışında gösterilecek son medya. */
export const HOME_EXPLORE_FEED_LAST_FILE = "video5.mp4";

const fullExploreMediaItems: ExploreMediaItem[] = manuallyOrderedMediaItems;

export function truncateExploreFeedAt(
  items: ExploreMediaItem[],
  lastFileName: string,
): ExploreMediaItem[] {
  const lastIndex = items.findIndex((item) => item.fileName === lastFileName);
  if (lastIndex === -1) return items;
  return items.slice(0, lastIndex + 1);
}

export const exploreMediaItems: ExploreMediaItem[] = fullExploreMediaItems;

/** Anasayfa: video5.mp4 dahil, sonrası gizli. */
export const homeExploreMediaItems = truncateExploreFeedAt(
  fullExploreMediaItems,
  HOME_EXPLORE_FEED_LAST_FILE,
);

export const photoMediaItems = packImageOnlyGrid(
  buildAsymmetricLayout(
    fullExploreMediaItems.filter((item) => item.type === "image"),
  ),
);

export const videoMediaItems = packMediaGrid(
  buildAsymmetricLayout(
    fullExploreMediaItems.filter((item) => item.type === "video"),
  ),
);
