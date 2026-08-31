export const DEFAULT_MAINTENANCE_MESSAGE =
  "Bekography yeni paketler ve hizmetleriyle yenileniyor.";

function parseMaintenanceFlag(value: string | undefined) {
  const normalized = value?.trim().replace(/^["']|["']$/g, "").toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

export function isMaintenanceModeEnabled() {
  return parseMaintenanceFlag(process.env.MAINTENANCE_MODE);
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
