"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export function SiteHeader({
  variant = "default",
}: {
  variant?: "default" | "lightOnDark";
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isDark = variant === "lightOnDark";

  return (
    <header
      className={`fixed top-0 z-50 w-full border-b backdrop-blur-md ${
        isDark
          ? "border-white/10 bg-[#111121]/85"
          : "border-black/5 bg-white/80"
      }`}
    >
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-8 md:px-10">
        <Link
          href="/"
          className={`text-2xl font-black tracking-[0.15em] transition-opacity hover:opacity-70 md:text-3xl ${
            isDark ? "text-white" : "text-black"
          }`}
        >
          BEKOGRAPHY
        </Link>
        <nav className="hidden items-center gap-12 md:flex">
          {links.map(({ href, label }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`nav-link text-[10px] font-bold uppercase tracking-[0.3em] transition-colors ${
                  isDark
                    ? active
                      ? "text-white"
                      : "text-white/60 hover:text-white"
                    : active
                      ? "text-black"
                      : "text-black/50 hover:text-black"
                } ${active ? "after:w-full" : ""}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          className={`flex h-10 w-10 items-center justify-center md:hidden ${
            isDark ? "text-white" : "text-black"
          }`}
          aria-expanded={open}
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="text-2xl leading-none">{open ? "×" : "☰"}</span>
        </button>
      </div>
      {open ? (
        <div
          className={`border-t px-8 py-6 md:hidden ${
            isDark ? "border-white/10 bg-[#111121]" : "border-black/10 bg-white"
          }`}
        >
          <div className="flex flex-col gap-4">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-xs font-bold uppercase tracking-[0.3em] ${
                  isDark ? "text-white" : "text-black"
                }`}
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
