export type DisplayPattern = {
  colSpan: 1 | 2 | 3;
  rowSpan: 1 | 2;
};

export type ExploreCarouselSlide = {
  id: string;
  type: "image" | "video";
  fileName: string;
  src: string;
  poster?: string;
  title: string;
  orientation: "portrait" | "landscape";
};

export type ExploreMediaItem = {
  id: string;
  type: "image" | "video";
  fileName: string;
  src: string;
  poster?: string;
  title: string;
  instagramUrl: string;
  orientation: "portrait" | "landscape";
  displayPattern?: DisplayPattern;
  carouselItems?: ExploreCarouselSlide[];
};

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

const imageCarouselGroups: Array<{ files: string[]; url: string }> = [
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
    "1.jpg",
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
    ordered.push(entry);
    used.add(entry.id);
  }

  return buildAsymmetricLayout(ordered);
})();

export const exploreMediaItems: ExploreMediaItem[] = manuallyOrderedMediaItems;

export const photoMediaItems = buildAsymmetricLayout(
  manuallyOrderedMediaItems.filter((item) => item.type === "image"),
);

export const videoMediaItems = buildAsymmetricLayout(
  manuallyOrderedMediaItems.filter((item) => item.type === "video"),
);
