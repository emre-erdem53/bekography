"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { AdminNav, AdminSidebar, getAdminPageTitle } from "@/components/admin/admin-sidebar";
import { ApprovedRequestAlerts } from "@/components/admin/approved-request-alerts";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const pageTitle = getAdminPageTitle(pathname);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div className="flex min-h-screen bg-black text-white">
      <AdminSidebar />

      <AnimatePresence>
        {menuOpen ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-[60] bg-black/70 md:hidden"
              aria-label="Menüyü kapat"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed inset-y-0 left-0 z-[70] flex w-[min(18rem,85vw)] flex-col border-r border-white/10 bg-[#0a0a0a] md:hidden"
            >
              <div className="flex items-center justify-end border-b border-white/10 p-3">
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white"
                  aria-label="Menüyü kapat"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <AdminNav onNavigate={() => setMenuOpen(false)} />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-50 flex items-center gap-3 border-b border-white/10 bg-black/95 px-4 py-3 backdrop-blur-md md:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="rounded-lg p-2 text-zinc-300 hover:bg-white/5 hover:text-white"
            aria-label="Menüyü aç"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{pageTitle}</p>
            <p className="text-xs text-zinc-500">Bekography Admin</p>
          </div>
        </header>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
          <ApprovedRequestAlerts />
          <div className="min-w-0 flex-1 p-4 sm:p-6 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
