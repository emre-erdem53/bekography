"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { ReorderableTagsEditor } from "@/components/admin/reorderable-tags-editor";
import {
  defaultPostShootTemplateSettings,
  POST_SHOOT_MERGE_STRATEGY_LABELS,
  POST_SHOOT_TEMPLATE_USAGE_GUIDE,
  type PostShootMergeStrategy,
  type PostShootTemplateSection,
  type PostShootTemplateSettingsData,
  type PostShootVariableDefinition,
} from "@/lib/post-shoot-template-settings";
import type { PostShootSection } from "@/lib/post-shoot";

const inputClass =
  "box-border w-full min-w-0 max-w-full rounded-xl border border-white/10 bg-[#141414] px-4 py-2.5 text-sm text-white outline-none focus:border-white/30";

type SectionKey = "digital" | "editing" | "printing";

const sectionLabels: Record<SectionKey, string> = {
  digital: "Dijital",
  editing: "Düzenleme",
  printing: "Baskı",
};

export function PostShootTemplatesAdminClient() {
  const [settings, setSettings] = useState<PostShootTemplateSettingsData>(
    defaultPostShootTemplateSettings(),
  );
  const [activeSection, setActiveSection] = useState<SectionKey>("editing");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/post-shoot-templates")
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .catch(() => setError("Şablonlar yüklenemedi"))
      .finally(() => setLoading(false));
  }, []);

  function updateSection(key: SectionKey, section: PostShootTemplateSection) {
    setSettings((prev) => ({ ...prev, [key]: section }));
    setSaved(false);
  }

  function updateVariable(
    index: number,
    patch: Partial<PostShootVariableDefinition>,
  ) {
    setSettings((prev) => {
      const next = [...prev.variables];
      next[index] = { ...next[index], ...patch };
      return { ...prev, variables: next };
    });
    setSaved(false);
  }

  function addVariable() {
    setSettings((prev) => ({
      ...prev,
      variables: [
        ...prev.variables,
        {
          key: `alan${prev.variables.length + 1}`,
          label: "Yeni alan",
          mergeStrategy: "join",
        },
      ],
    }));
    setSaved(false);
  }

  function removeVariable(index: number) {
    setSettings((prev) => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index),
    }));
    setSaved(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    const keys = settings.variables.map((variable) => variable.key.trim());
    if (new Set(keys).size !== keys.length) {
      setError("Dinamik alan anahtarları benzersiz olmalıdır");
      setSaving(false);
      return;
    }

    const response = await fetch("/api/admin/post-shoot-templates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });

    setSaving(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Kaydedilemedi");
      return;
    }

    const data = await response.json();
    setSettings(data);
    setSaved(true);
  }

  if (loading) {
    return <p className="text-zinc-400">Yükleniyor...</p>;
  }

  const currentSection = settings[activeSection];

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-zinc-400 hover:text-white">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-white">
          Çekim Sonrası Şablonları
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Global metinler ve dinamik alanlar. Rezervasyon oluştururken seçilen
          paketlere göre otomatik birleştirilir.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
        <h2 className="font-semibold text-white">Kullanım kılavuzu</h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-300">
          {POST_SHOOT_TEMPLATE_USAGE_GUIDE.split("\n\n").map((block) => {
            if (block.startsWith("## ")) {
              return (
                <h3 key={block} className="pt-2 font-medium text-white">
                  {block.replace(/^##\s+/, "")}
                </h3>
              );
            }
            if (block.startsWith("- **")) {
              return (
                <ul key={block} className="list-disc space-y-1 pl-5">
                  {block.split("\n").map((line) => (
                    <li key={line}>{line.replace(/^- /, "")}</li>
                  ))}
                </ul>
              );
            }
            return <p key={block}>{block}</p>;
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-semibold text-white">Dinamik alanlar</h2>
          <button
            type="button"
            onClick={addVariable}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:text-white"
          >
            <Plus className="h-4 w-4" />
            Alan ekle
          </button>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Metinlerde <code className="text-zinc-300">{`{{anahtar}}`}</code> olarak
          kullanın. Her paket bu anahtarlar için kendi değerini tanımlar.
        </p>

        <div className="mt-4 space-y-3">
          {settings.variables.map((variable, index) => (
            <div
              key={`${variable.key}-${index}`}
              className="grid-safe grid gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[1fr_1fr_1fr_auto]"
            >
              <label className="block">
                <span className="mb-1 block text-xs text-zinc-500">Anahtar</span>
                <input
                  value={variable.key}
                  onChange={(e) =>
                    updateVariable(index, {
                      key: e.target.value.replace(/\s+/g, ""),
                    })
                  }
                  className={inputClass}
                  placeholder="shootMekan"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-zinc-500">Etiket</span>
                <input
                  value={variable.label}
                  onChange={(e) =>
                    updateVariable(index, { label: e.target.value })
                  }
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-zinc-500">
                  Birleştirme
                </span>
                <select
                  value={variable.mergeStrategy}
                  onChange={(e) =>
                    updateVariable(index, {
                      mergeStrategy: e.target.value as PostShootMergeStrategy,
                    })
                  }
                  className={inputClass}
                >
                  {Object.entries(POST_SHOOT_MERGE_STRATEGY_LABELS).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <button
                type="button"
                onClick={() => removeVariable(index)}
                className="self-end rounded-xl border border-red-500/20 p-2.5 text-red-300 hover:bg-red-500/10"
                aria-label="Alanı sil"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <label className="block md:col-span-4">
                <span className="mb-1 block text-xs text-zinc-500">
                  Açıklama (isteğe bağlı)
                </span>
                <input
                  value={variable.hint ?? ""}
                  onChange={(e) =>
                    updateVariable(index, { hint: e.target.value })
                  }
                  className={inputClass}
                  placeholder="Paket formunda görünecek ipucu"
                />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(sectionLabels) as SectionKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveSection(key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeSection === key
                  ? "bg-white text-black"
                  : "bg-white/10 text-zinc-300 hover:text-white"
              }`}
            >
              {sectionLabels[key]}
            </button>
          ))}
        </div>

        <div className="mt-5">
          <TemplateSectionEditor
            title={sectionLabels[activeSection]}
            section={currentSection}
            variableKeys={settings.variables.map((variable) => variable.key)}
            onChange={(section) => updateSection(activeSection, section)}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
        <label className="block">
          <span className="font-semibold text-white">Baskı yok metni</span>
          <p className="mt-1 text-xs text-zinc-500">
            Yalnızca dış çekim gibi baskısız paketler seçildiğinde Baskı
            bölümünde gösterilir.
          </p>
          <input
            value={settings.noPrintingText}
            onChange={(e) => {
              setSettings((prev) => ({
                ...prev,
                noPrintingText: e.target.value,
              }));
              setSaved(false);
            }}
            className={`${inputClass} mt-3`}
          />
        </label>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {saved ? (
        <p className="text-sm text-emerald-400">Şablonlar kaydedildi.</p>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black disabled:opacity-50"
      >
        {saving ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}

function TemplateSectionEditor({
  title,
  section,
  variableKeys,
  onChange,
}: {
  title: string;
  section: PostShootTemplateSection;
  variableKeys: string[];
  onChange: (section: PostShootTemplateSection) => void;
}) {
  function insertVariable(key: string) {
    onChange({
      ...section,
      description: `${section.description}{{${key}}}`,
    });
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-white">{title}</h3>

      {variableKeys.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {variableKeys.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => insertVariable(key)}
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300 hover:text-white"
            >
              {`{{${key}}}`}
            </button>
          ))}
        </div>
      ) : null}

      <ReorderableTagsEditor
        title="Etiketler"
        tags={section.pills}
        onChange={(pills) => onChange({ ...section, pills })}
        placeholder="Etiket veya {{değişken}}"
      />

      <label className="block">
        <span className="mb-2 block text-xs text-zinc-500">Açıklama</span>
        <textarea
          value={section.description}
          onChange={(e) =>
            onChange({ ...section, description: e.target.value })
          }
          rows={6}
          className={inputClass}
        />
      </label>
    </div>
  );
}

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
        placeholder="Etiket veya {{değişken}}"
      />
      <label className="block">
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
