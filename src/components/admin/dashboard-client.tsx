"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

type DashboardData = {
  stats: {
    pendingRequests: number;
    activeReservations: number;
  };
  todayShoots: {
    id: string;
    customerName: string;
    city: string;
    shootDate: string;
  }[];
  upcomingShoots: {
    id: string;
    customerName: string;
    city: string;
    shootDate: string;
  }[];
};

export function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-zinc-400">Yükleniyor...</p>;
  }

  if (!data) {
    return <p className="text-red-400">Dashboard yüklenemedi.</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-400">Genel özet ve uyarılar</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          {
            label: "Bekleyen Talepler",
            value: data.stats.pendingRequests,
            href: "/admin/talepler",
          },
          {
            label: "Aktif Rezervasyonlar",
            value: data.stats.activeReservations,
            href: "/admin/rezervasyonlar",
          },
        ].map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-5 transition-colors hover:border-white/20"
          >
            <p className="text-sm text-zinc-400">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-white">{card.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
          <h2 className="text-lg font-semibold text-white">Bugünkü Çekimler</h2>
          {data.todayShoots.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">Bugün çekim yok.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.todayShoots.map((shoot) => (
                <li key={shoot.id}>
                  <Link
                    href={`/admin/rezervasyonlar/${shoot.id}`}
                    className="block rounded-xl border border-white/5 px-4 py-3 hover:bg-white/5"
                  >
                    <p className="font-medium text-white">{shoot.customerName}</p>
                    <p className="text-sm text-zinc-400">{shoot.city}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
          <h2 className="text-lg font-semibold text-white">Yaklaşan Çekimler</h2>
          {data.upcomingShoots.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">Yaklaşan çekim yok.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.upcomingShoots.map((shoot) => (
                <li key={shoot.id}>
                  <Link
                    href={`/admin/rezervasyonlar/${shoot.id}`}
                    className="block rounded-xl border border-white/5 px-4 py-3 hover:bg-white/5"
                  >
                    <p className="font-medium text-white">{shoot.customerName}</p>
                    <p className="text-sm text-zinc-400">
                      {format(new Date(shoot.shootDate), "d MMMM yyyy", {
                        locale: tr,
                      })}{" "}
                      — {shoot.city}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
