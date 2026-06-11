export type DisplayPattern = {
  colSpan: 1 | 2 | 3;
  rowSpan: 1 | 2 | 3 | 4 | 5 | 6;
  /** 1 tabanlı CSS grid başlangıç sütunu (paketleyici atar). */
  colStart?: number;
  /** 1 tabanlı CSS grid başlangıç satırı (paketleyici atar). */
  rowStart?: number;
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
