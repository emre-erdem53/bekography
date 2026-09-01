"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const inputClass =
  "box-border w-full min-w-0 max-w-full rounded-xl border border-white/10 bg-[#141414] px-4 py-2.5 text-white outline-none focus:border-white/30";

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length || from === to) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function ReorderableTagsEditor({
  title,
  tags,
  onChange,
  placeholder = "Etiket ekle...",
  maxTags,
}: {
  title: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}) {
  const [input, setInput] = useState("");
  const limitReached = maxTags !== undefined && tags.length >= maxTags;

  function addTag() {
    const value = input.trim();
    if (!value || limitReached) return;
    onChange([...tags, value]);
    setInput("");
  }

  return (
    <div className="space-y-3 rounded-xl border border-white/5 bg-white/5 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium text-white">{title}</h3>
        {maxTags !== undefined ? (
          <span className="text-xs text-zinc-500">
            {tags.length}/{maxTags}
          </span>
        ) : null}
      </div>
      {tags.length > 0 ? (
        <ul className="space-y-2">
          {tags.map((tag, index) => (
            <li
              key={`${tag}-${index}`}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2"
            >
              <div className="flex shrink-0 flex-col">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => onChange(moveItem(tags, index, index - 1))}
                  className="rounded p-0.5 text-zinc-500 hover:text-white disabled:opacity-30"
                  aria-label="Yukarı taşı"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={index === tags.length - 1}
                  onClick={() => onChange(moveItem(tags, index, index + 1))}
                  className="rounded p-0.5 text-zinc-500 hover:text-white disabled:opacity-30"
                  aria-label="Aşağı taşı"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              <span className="min-w-0 flex-1 text-sm text-zinc-200">{tag}</span>
              <button
                type="button"
                onClick={() => onChange(tags.filter((_, i) => i !== index))}
                className="shrink-0 text-zinc-400 hover:text-white"
                aria-label="Kaldır"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-zinc-500">Henüz etiket yok.</p>
      )}
      <div className="flex min-w-0 gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder={placeholder}
          disabled={limitReached}
          className={`${inputClass} min-w-0 flex-1 disabled:cursor-not-allowed disabled:opacity-50`}
        />
        <button
          type="button"
          onClick={addTag}
          disabled={limitReached}
          className="shrink-0 rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Ekle
        </button>
      </div>
      {limitReached ? (
        <p className="text-xs text-amber-400">
          En fazla {maxTags} etiket girebilirsiniz.
        </p>
      ) : null}
    </div>
  );
}
