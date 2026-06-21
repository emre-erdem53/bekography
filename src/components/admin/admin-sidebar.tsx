"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  CalendarCheck,
  type LucideIcon,
} from "lucide-react";
import { signOut } from "next-auth/react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const adminNavItems: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/paketler", label: "Paketler", icon: Package },
  {
    href: "/admin/cekim-sonrasi-sablonlari",
    label: "Çekim Sonrası",
    icon: FileText,
  },
  { href: "/admin/talepler", label: "Talepler", icon: ClipboardList },
  { href: "/admin/takvim", label: "Takvimim", icon: CalendarDays },
  { href: "/admin/rezervasyonlar", label: "Rezervasyonlar", icon: CalendarCheck },
];

export function getAdminPageTitle(pathname: string) {
  if (pathname === "/admin") return "Dashboard";
  if (pathname.startsWith("/admin/paketler/yeni")) return "Yeni Paket";
  if (pathname.match(/^\/admin\/paketler\/[^/]+$/)) return "Paket Düzenle";
  if (pathname.startsWith("/admin/paketler")) return "Paketler";
  if (pathname.startsWith("/admin/cekim-sonrasi-sablonlari")) {
    return "Çekim Sonrası Şablonları";
  }
  if (pathname.match(/^\/admin\/talepler\/[^/]+$/)) return "Talep Detayı";
  if (pathname.startsWith("/admin/talepler")) return "Talepler";
  if (pathname.startsWith("/admin/takvim")) return "Takvimim";
  if (pathname.includes("/rezervasyonlar/yeni")) return "Yeni Rezervasyon";
  if (pathname.startsWith("/admin/rezervasyonlar/gecmis")) return "Geçmiş Rezervasyonlar";
  if (pathname.includes("/duzenle")) return "Rezervasyon Düzenle";
  if (pathname.match(/^\/admin\/rezervasyonlar\/[^/]+$/)) return "Rezervasyon";
  if (pathname.startsWith("/admin/rezervasyonlar")) return "Rezervasyonlar";
  return "Yönetim Paneli";
}

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <div className="border-b border-white/10 px-5 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Bekography
        </p>
        <h1 className="mt-1 text-lg font-semibold text-white">Yönetim Paneli</h1>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Çıkış Yap
        </button>
      </div>
    </>
  );
}

export function AdminSidebar() {
  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-[#0a0a0a] md:flex">
      <AdminNav />
    </aside>
  );
}
