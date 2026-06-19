import type { ExploreMediaItem } from "@/lib/explore-media-types";

const BATCH_TIMEOUT_MS = 45_000;

function preloadImageSrc(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    const finish = () => resolve();

    img.onload = () => {
      if (typeof img.decode === "function") {
        img.decode().then(finish).catch(finish);
        return;
      }
      finish();
    };
    img.onerror = finish;
    img.decoding = "async";
    img.src = src;
  });
}

function preloadVideoSrc(src: string, poster?: string): Promise<void> {
  const tasks: Promise<void>[] = [];
  if (poster) {
    tasks.push(preloadImageSrc(poster));
  }

  tasks.push(
    new Promise((resolve) => {
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";

      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        video.pause();
        video.removeAttribute("src");
        video.load();
        resolve();
      };

      video.addEventListener("canplaythrough", finish, { once: true });
      video.addEventListener("error", finish, { once: true });
      window.setTimeout(finish, 25_000);

      video.src = src;
      video.load();
    }),
  );

  return Promise.all(tasks).then(() => undefined);
}

export function preloadExploreMediaItem(item: ExploreMediaItem): Promise<void> {
  if (item.type === "video") {
    return preloadVideoSrc(item.src, item.poster);
  }
  return preloadImageSrc(item.src);
}

/** `fromIndex` dahil, `toIndex` hariç aralıktaki tüm medyayı önceden indirir. */
export async function preloadExploreBatch(
  items: ExploreMediaItem[],
  fromIndex: number,
  toIndex: number,
): Promise<void> {
  const slice = items.slice(fromIndex, toIndex);
  if (slice.length === 0) return;

  const preloadAll = Promise.all(slice.map(preloadExploreMediaItem));
  const timeout = new Promise<void>((resolve) => {
    window.setTimeout(resolve, BATCH_TIMEOUT_MS);
  });

  await Promise.race([preloadAll, timeout]);
}
