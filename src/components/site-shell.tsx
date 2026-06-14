"use client";

import { usePathname } from "next/navigation";
import { FooterDark } from "@/components/footer-dark";
import { FloatingContactButtons } from "@/components/floating-contact-buttons";
import { SiteHeader } from "@/components/site-header";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isTracking = pathname.startsWith("/takip");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader />
      {children}
      {!isTracking && <FooterDark />}
      {!isTracking && <FloatingContactButtons />}
    </>
  );
}
