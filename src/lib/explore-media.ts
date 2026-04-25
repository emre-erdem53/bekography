export type ExploreMediaItem = {
  id: string;
  type: "image" | "video";
  fileName: string;
  src: string;
  poster?: string;
  title: string;
  instagramUrl: string;
  orientation?: "portrait" | "landscape";
};

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

const imageGroups: Array<{ files: string[]; url: string }> = [
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

for (const group of imageGroups) {
  for (const file of group.files) {
    instagramUrlByFile[file] = group.url;
  }
}

function getInstagramUrl(fileName: string) {
  return instagramUrlByFile[fileName] ?? "https://www.instagram.com/bekography/";
}

const imageFiles = [
  ...Array.from({ length: 29 }, (_, i) => `${i + 1}.jpg`),
  "30.png",
  "31.png",
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
}));

const videoItems: ExploreMediaItem[] = videoFiles.map((file, index) => ({
  id: `v-${index + 1}`,
  type: "video",
  fileName: file,
  src: createMediaUrl(file),
  poster: createMediaUrl(`${Math.min(index + 1, imageFiles.length)}.jpg`),
  title: `Video ${index + 1}`,
  instagramUrl: getInstagramUrl(file),
}));

const manuallyOrderedMediaItems = (() => {
  const allItems = [...imageItems, ...videoItems];
  const byFileName = new Map(allItems.map((item) => [item.fileName, item]));
  const used = new Set<string>();

  const priorityOrder = [
    "1.jpg",
    "video1.mp4",
    "video2.mp4",
    "2.jpg",
    "3.jpg",
    "video3.mp4",
    "video4.mp4",
    "4.jpg",
  ] as const;

  const baseOrder: ExploreMediaItem[] = [];

  for (const fileName of priorityOrder) {
    const item = byFileName.get(fileName);
    if (!item || used.has(item.id)) {
      continue;
    }
    baseOrder.push(item);
    used.add(item.id);
  }

  for (const item of allItems) {
    if (used.has(item.id)) {
      continue;
    }
    baseOrder.push(item);
    used.add(item.id);
  }

  const isLandscape = (item: ExploreMediaItem) => item.type === "video";
  const portraitQueue = baseOrder.filter((item) => !isLandscape(item));
  const landscapeQueue = baseOrder.filter((item) => isLandscape(item));
  const arranged: ExploreMediaItem[] = [];

  let rowIndex = 0;
  while (portraitQueue.length > 0 && landscapeQueue.length > 0) {
    const portraitItem = portraitQueue.shift();
    const landscapeItem = landscapeQueue.shift();

    if (!portraitItem || !landscapeItem) {
      break;
    }

    // Row pattern:
    // - Even row: portrait left, landscape right
    // - Odd row: landscape left, portrait right
    if (rowIndex % 2 === 0) {
      arranged.push(portraitItem, landscapeItem);
    } else {
      arranged.push(landscapeItem, portraitItem);
    }

    rowIndex += 1;
  }

  // Append leftovers while keeping their own order.
  arranged.push(...portraitQueue, ...landscapeQueue);
  return arranged;
})();

export const exploreMediaItems: ExploreMediaItem[] = manuallyOrderedMediaItems;

export const photoMediaItems = exploreMediaItems.filter(
  (item) => item.type === "image",
);

export const videoMediaItems = exploreMediaItems.filter(
  (item) => item.type === "video",
);
