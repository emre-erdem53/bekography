export const DEFAULT_MAINTENANCE_MESSAGE =
  "Bekography yeni paketler ve hizmetleriyle yenileniyor.";

export function isMaintenanceModeEnabled() {
  return process.env.MAINTENANCE_MODE === "true";
}

export function getMaintenanceMessage() {
  const custom = process.env.MAINTENANCE_MESSAGE?.trim();
  return custom || DEFAULT_MAINTENANCE_MESSAGE;
}

/** Bakım modunda oturum gerektirmeden erişilebilen yollar. */
export function isMaintenanceBypassPath(pathname: string) {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/maintenance"
  );
}
