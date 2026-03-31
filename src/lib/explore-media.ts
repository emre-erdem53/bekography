export type ExploreMediaItem = {
  id: string;
  type: "image" | "video";
  src: string;
  poster?: string;
  title: string;
  instagramUrl: string;
};

export const exploreMediaItems: ExploreMediaItem[] = [
  {
    id: "v-1",
    type: "video",
    src: "/video1.mp4",
    poster: "/gorsel-1.png",
    title: "Urban Detail",
    instagramUrl: "https://instagram.com",
  },
  {
    id: "i-1",
    type: "image",
    src: "/gorsel-1.png",
    title: "Preparation",
    instagramUrl: "https://instagram.com",
  },
  {
    id: "v-2",
    type: "video",
    src: "/video2.mp4",
    poster: "/gorsel-2.png",
    title: "Cabin Story",
    instagramUrl: "https://instagram.com",
  },
  {
    id: "i-2",
    type: "image",
    src: "/gorsel-2.png",
    title: "Cut Process",
    instagramUrl: "https://instagram.com",
  },
  {
    id: "v-3",
    type: "video",
    src: "/video3.mp4",
    poster: "/gorsel-3.png",
    title: "Console Shot",
    instagramUrl: "https://instagram.com",
  },
  {
    id: "i-3",
    type: "image",
    src: "/gorsel-3.png",
    title: "Marble Texture",
    instagramUrl: "https://instagram.com",
  },
  {
    id: "v-4",
    type: "video",
    src: "/video4.mp4",
    poster: "/gorsel-4.png",
    title: "Story Frame",
    instagramUrl: "https://instagram.com",
  },
  {
    id: "i-4",
    type: "image",
    src: "/gorsel-4.png",
    title: "Dash Light",
    instagramUrl: "https://instagram.com",
  },
  {
    id: "i-5",
    type: "image",
    src: "/gorsel-5.png",
    title: "Cockpit",
    instagramUrl: "https://instagram.com",
  },
  {
    id: "i-6",
    type: "image",
    src: "/gorsel-1.png",
    title: "Rolling Shot",
    instagramUrl: "https://instagram.com",
  },
  {
    id: "i-7",
    type: "image",
    src: "/gorsel-2.png",
    title: "Coffee Run",
    instagramUrl: "https://instagram.com",
  },
  {
    id: "i-8",
    type: "image",
    src: "/gorsel-5.png",
    title: "Grill Prep",
    instagramUrl: "https://instagram.com",
  },
  {
    id: "v-5",
    type: "video",
    src: "/video1.mp4",
    poster: "/gorsel-3.png",
    title: "Street Reel",
    instagramUrl: "https://instagram.com",
  },
  {
    id: "v-6",
    type: "video",
    src: "/video2.mp4",
    poster: "/gorsel-4.png",
    title: "Motion Clip",
    instagramUrl: "https://instagram.com",
  },
];

export const photoMediaItems = exploreMediaItems.filter(
  (item) => item.type === "image",
);

export const videoMediaItems = exploreMediaItems.filter(
  (item) => item.type === "video",
);
