"use client";

import { ChevronRight, Folder, FolderPlus, Home } from "lucide-react";
import {
  formatBlobFolderLabel,
  getBlobFolderSegments,
  normalizeBlobFolderPrefix,
  sanitizeBlobFolderSegment,
  type BlobMediaFolder,
} from "@/lib/blob-media";

type BlobMediaFolderNavProps = {
  prefix: string;
  folders: BlobMediaFolder[];
  onPrefixChange: (prefix: string) => void;
  onCreateFolder: (folderPrefix: string) => void;
  showFolderGrid?: boolean;
};

function buildPrefixFromSegments(segments: string[]): string {
  if (segments.length === 0) return "";
  return `${segments.join("/")}/`;
}

export function BlobMediaFolderNav({
  prefix,
  folders,
  onPrefixChange,
  onCreateFolder,
  showFolderGrid = true,
}: BlobMediaFolderNavProps) {
  const segments = getBlobFolderSegments(prefix);

  function handleCreateFolder() {
    const input = window.prompt("Yeni klasör adı (ör. Dış Çekim Standart Prime):");
    if (!input) return;

    try {
      const folderSegment = sanitizeBlobFolderSegment(input);
      const nextPrefix = normalizeBlobFolderPrefix(
        `${prefix}${folderSegment}`,
      );
      onCreateFolder(nextPrefix);
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Klasör oluşturulamadı",
      );
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav
          aria-label="Klasör yolu"
          className="flex min-w-0 flex-wrap items-center gap-1 text-sm"
        >
          <button
            type="button"
            onClick={() => onPrefixChange("")}
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 transition ${
              prefix
                ? "text-zinc-400 hover:bg-white/5 hover:text-white"
                : "bg-white/10 text-white"
            }`}
          >
            <Home className="h-3.5 w-3.5" />
            Ana
          </button>
          {segments.map((segment, index) => {
            const crumbPrefix = buildPrefixFromSegments(
              segments.slice(0, index + 1),
            );
            const isLast = index === segments.length - 1;

            return (
              <span key={crumbPrefix} className="flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
                <button
                  type="button"
                  onClick={() => onPrefixChange(crumbPrefix)}
                  className={`rounded-lg px-2 py-1 transition ${
                    isLast
                      ? "bg-white/10 text-white"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {formatBlobFolderLabel(segment)}
                </button>
              </span>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={handleCreateFolder}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
        >
          <FolderPlus className="h-4 w-4" />
          Yeni klasör
        </button>
      </div>

      {showFolderGrid && folders.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {folders.map((folder) => (
            <button
              key={folder.prefix}
              type="button"
              onClick={() => onPrefixChange(folder.prefix)}
              className="group flex flex-col items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-white/20 hover:bg-white/[0.06]"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300 transition group-hover:bg-amber-400/15">
                <Folder className="h-6 w-6" />
              </span>
              <span className="line-clamp-2 text-sm font-medium text-white">
                {folder.name}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
