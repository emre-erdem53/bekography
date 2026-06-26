"use client";

import type { PostShootSection } from "@/lib/post-shoot";
import { ReorderableTagsEditor } from "@/components/admin/reorderable-tags-editor";

const inputClass =
  "box-border w-full min-w-0 max-w-full rounded-xl border border-white/10 bg-[#141414] px-4 py-2.5 text-white outline-none focus:border-white/30";

export function PostShootSectionEditor({
  title,
  section,
  onChange,
}: {
  title: string;
  section: PostShootSection;
  onChange: (section: PostShootSection) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-white/5 bg-white/5 p-4">
      <h3 className="text-sm font-medium text-white">{title}</h3>
      <ReorderableTagsEditor
        title="Etiketler"
        tags={section.pills}
        onChange={(pills) => onChange({ ...section, pills })}
        placeholder="Etiket ekle..."
      />
      <label className="block min-w-0">
        <span className="mb-2 block text-xs text-zinc-500">Açıklama</span>
        <textarea
          value={section.description}
          onChange={(e) =>
            onChange({ ...section, description: e.target.value })
          }
          rows={5}
          className={inputClass}
        />
      </label>
    </div>
  );
}
