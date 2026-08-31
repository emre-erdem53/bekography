"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { FooterDark } from "@/components/footer-dark";
import { GlobalCartRequestModal } from "@/components/packages/global-cart-request-modal";
import { CompanionCartWarning } from "@/components/packages/companion-cart-warning";
import { PackageCartBar, useCartBottomInset, usePackageCartBarVisible } from "@/components/packages/package-cart-bar";
import { SiteHeader } from "@/components/site-header";
import { useCartStore } from "@/stores/cart-store";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isTracking = pathname.startsWith("/takip");
  const isMaintenance = pathname === "/maintenance";
  const showCartBar = usePackageCartBarVisible();
  const cartBottomInset = useCartBottomInset();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    useCartStore.persist.rehydrate();
    setMounted(true);
  }, []);

  if (isAdmin || isMaintenance) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader />
      <div
        className={`min-w-0 overflow-x-hidden ${mounted && !isTracking ? cartBottomInset : ""}`}
      >
        {children}
      </div>
      {!isTracking && showCartBar ? <PackageCartBar /> : null}
      {!isTracking ? <CompanionCartWarning /> : null}
      {!isTracking ? <GlobalCartRequestModal /> : null}
      {!isTracking && <FooterDark />}
    </>
  );
}
