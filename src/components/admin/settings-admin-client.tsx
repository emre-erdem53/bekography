"use client";

import { FormEvent, useEffect, useState } from "react";
import type { SiteSettingsData } from "@/lib/site-settings";
import { useSiteSettingsActions } from "@/components/site-settings-provider";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-white/25";

export function SettingsAdminClient() {
  const { refreshSettings } = useSiteSettingsActions();
  const [settings, setSettings] = useState<SiteSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then(setSettings)
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!settings) return;

    setSaving(true);
    setError("");
    setSuccess(false);

    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });

    setSaving(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Ayarlar kaydedilemedi");
      return;
    }

    const saved = await response.json();
    setSettings(saved);
    setSuccess(true);
    await refreshSettings();
  }

  if (loading) return <p className="text-zinc-400">Yükleniyor...</p>;
  if (!settings) return <p className="text-red-400">Ayarlar yüklenemedi.</p>;

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white sm:text-2xl">Ayarlar</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Site genelinde kullanılan metinleri buradan yönetin.
        </p>
      </div>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
        <div>
          <h2 className="font-semibold text-white">Ödeme Türleri</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Paket listesi, detay ve sepet ekranlarında görünen ödeme başlıkları
            ve açıklama metinleri.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {(["pesin", "taksitli"] as const).map((type) => (
            <div
              key={type}
              className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {type === "pesin" ? "Hemen ödeme" : "Parçalı ödeme"} alanı
              </p>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-zinc-500">
                  Başlık
                </span>
                <input
                  value={settings.paymentTypes[type].label}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      paymentTypes: {
                        ...settings.paymentTypes,
                        [type]: {
                          ...settings.paymentTypes[type],
                          label: e.target.value,
                        },
                      },
                    })
                  }
                  required
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-zinc-500">
                  Detay metni
                </span>
                <textarea
                  value={settings.paymentTypes[type].description}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      paymentTypes: {
                        ...settings.paymentTypes,
                        [type]: {
                          ...settings.paymentTypes[type],
                          description: e.target.value,
                        },
                      },
                    })
                  }
                  required
                  rows={3}
                  className={inputClass}
                />
              </label>
            </div>
          ))}
        </div>
      </section>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {success ? (
        <p className="text-sm text-emerald-400">Ayarlar kaydedildi.</p>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
      >
        {saving ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}
