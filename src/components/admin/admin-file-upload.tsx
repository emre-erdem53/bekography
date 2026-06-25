"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";

type AdminFileUploadProps = {
  accept: string;
  onFileSelect: (file: File) => void;
  label?: string;
  hint?: string;
  fileLabel?: string | null;
  disabled?: boolean;
};

export function AdminFileUpload({
  accept,
  onFileSelect,
  label = "Dosya Yükle",
  hint,
  fileLabel,
  disabled = false,
}: AdminFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFile(file: File | undefined) {
    if (!file || disabled) return;
    onFileSelect(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="min-w-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          handleFile(event.dataTransfer.files?.[0]);
        }}
        className={`group mt-2 flex w-full min-w-0 items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3 text-sm transition-all duration-200 ${
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer"
        } ${
          dragOver
            ? "scale-[1.01] border-white bg-white/10 text-white shadow-lg shadow-white/5"
            : "border-white/20 bg-white/[0.03] text-zinc-400 hover:border-white/40 hover:bg-white/[0.06] hover:text-white hover:shadow-md hover:shadow-black/20"
        }`}
      >
        <Upload className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:-translate-y-0.5" />
        <span className="truncate">{fileLabel || label}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
      {hint ? <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{hint}</p> : null}
    </div>
  );
}
