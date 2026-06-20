import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  fetchLiveGoogleReviewsForArchive,
  type GoogleReview,
} from "../src/lib/google-reviews";

const ARCHIVE_PATH = path.join(
  process.cwd(),
  "src/data/google-reviews-archive.json",
);

function reviewDedupeKey(review: GoogleReview) {
  const author = review.authorName.trim().toLowerCase();
  const text = review.text.trim().toLowerCase().slice(0, 120);
  return `${author}::${text}`;
}

function mergeArchive(
  existing: GoogleReview[],
  incoming: GoogleReview[],
  max = 40,
) {
  const seen = new Set<string>();
  const merged: GoogleReview[] = [];

  for (const review of [...incoming, ...existing]) {
    if (review.rating !== 5 || !review.text.trim()) continue;
    const key = reviewDedupeKey(review);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(review);
    if (merged.length >= max) break;
  }

  return merged;
}

async function main() {
  const incoming = await fetchLiveGoogleReviewsForArchive();
  let existing: GoogleReview[] = [];

  try {
    const raw = await readFile(ARCHIVE_PATH, "utf8");
    existing = JSON.parse(raw) as GoogleReview[];
  } catch {
    existing = [];
  }

  const merged = mergeArchive(existing, incoming);
  await mkdir(path.dirname(ARCHIVE_PATH), { recursive: true });
  await writeFile(ARCHIVE_PATH, `${JSON.stringify(merged, null, 2)}\n`, "utf8");

  console.log(
    `Arşiv güncellendi: ${merged.length} yorum (API: ${incoming.length}, önceki arşiv: ${existing.length}).`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
