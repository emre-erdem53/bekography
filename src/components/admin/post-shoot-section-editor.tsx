"use client";

import { ReorderableTagsEditor } from "@/components/admin/reorderable-tags-editor";

export function PostShootTagsEditor({
  title,
  tags,
  onChange,
}: {
  title: string;
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-white/5 bg-white/5 p-4">
      <h3 className="text-sm font-medium text-white">{title}</h3>
      <ReorderableTagsEditor
        title="Etiketler"
        tags={tags}
        onChange={onChange}
        placeholder="Etiket ekle..."
      />
    </div>
  );
}
