"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { FooterDark } from "@/components/footer-dark";
import { GlobalCartRequestModal } from "@/components/packages/global-cart-request-modal";
import { CompanionCartWarning } from "@/components/packages/companion-cart-warning";
import { PackageCartBar, useCartBottomInset } from "@/components/packages/package-cart-bar";
import { SiteHeader } from "@/components/site-header";
import { useCartStore } from "@/stores/cart-store";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isTracking = pathname.startsWith("/takip");
  const cartBottomInset = useCartBottomInset();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    useCartStore.persist.rehydrate();
    setMounted(true);
  }, []);

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader />
      <div className={mounted && !isTracking ? cartBottomInset : undefined}>
        {children}
      </div>
      {!isTracking ? <PackageCartBar /> : null}
      {!isTracking ? <CompanionCartWarning /> : null}
      {!isTracking ? <GlobalCartRequestModal /> : null}
      {!isTracking && <FooterDark />}
    </>
  );
}
