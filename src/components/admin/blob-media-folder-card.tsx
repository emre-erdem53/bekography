"use client";

import { Folder } from "lucide-react";
import type { BlobMediaFolder } from "@/lib/blob-media";

type BlobMediaFolderCardProps = {
  folder: BlobMediaFolder;
  onOpen: (prefix: string) => void;
};

export function BlobMediaFolderCard({ folder, onOpen }: BlobMediaFolderCardProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(folder.prefix)}
      className="group flex aspect-square flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-4 text-center transition hover:border-amber-400/35 hover:bg-amber-400/10"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300 transition group-hover:bg-amber-400/20">
        <Folder className="h-7 w-7" />
      </span>
      <span className="line-clamp-3 text-xs font-medium leading-snug text-white">
        {folder.name}
      </span>
      <span className="text-[10px] text-amber-200/70">Klasör</span>
    </button>
  );
}
