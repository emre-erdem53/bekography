"use client";

import { useState } from "react";
import {
  hasOutdoorPackageInItems,
  parsePostShootSnapshot,
  type PostShootSection,
  type PostShootSnapshot,
} from "@/lib/post-shoot";
import { PostShootSectionEditor } from "@/components/admin/post-shoot-section-editor";
import type { TrackingData } from "@/lib/tracking-types";

export function ReservationPostShootAdmin({
  reservationId,
  postShoot: initialPostShoot,
  items,
  onSaved,
}: {
  reservationId: string;
  postShoot: PostShootSnapshot;
  items: TrackingData["items"];
  onSaved: (postShoot: PostShootSnapshot) => void;
}) {
  const [postShoot, setPostShoot] = useState(initialPostShoot);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const showPrinting = items.some((item) => item.isOutdoor);

  function updateSection(
    key: "digital" | "editing" | "printing",
    section: PostShootSection,
  ) {
    setPostShoot((prev) => ({
      ...prev,
      [key]: section,
      source: "manual",
    }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const response = await fetch(`/api/admin/reservations/${reservationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postShoot }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Kaydedilemedi");
      }

      const parsed = parsePostShootSnapshot(postShoot);
      onSaved(parsed);
      setSaved(true);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Kaydedilemedi",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mb-8 space-y-4 rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Çekim Sonrası Metinleri</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Müşteri takip sayfasında görünen birleşik çekim sonrası metinleri.
          Kaydettikten sonra müşteri sayfayı yenilediğinde güncellenir.
        </p>
      </div>

      <PostShootSectionEditor
        title="Dijital"
        section={postShoot.digital}
        onChange={(section) => updateSection("digital", section)}
      />
      <PostShootSectionEditor
        title="Düzenleme"
        section={postShoot.editing}
        onChange={(section) => updateSection("editing", section)}
      />
      {showPrinting ? (
        <PostShootSectionEditor
          title="Baskı"
          section={postShoot.printing}
          onChange={(section) => updateSection("printing", section)}
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
        >
          {saving ? "Kaydediliyor..." : "Çekim Sonrasını Kaydet"}
        </button>
        {saved ? (
          <span className="text-sm text-emerald-400">Kaydedildi.</span>
        ) : null}
        {error ? <span className="text-sm text-red-400">{error}</span> : null}
      </div>
    </section>
  );
}
