import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  isMaintenanceBypassPath,
  isMaintenanceModeEnabled,
} from "@/lib/maintenance-mode";

export default auth((request) => {
  const { pathname } = request.nextUrl;

  if (pathname === "/maintenance" && !isMaintenanceModeEnabled()) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isMaintenanceModeEnabled()) {
    const isAdmin = !!request.auth?.user;

    if (
      !isAdmin &&
      !isMaintenanceBypassPath(pathname) &&
      pathname !== "/maintenance"
    ) {
      return NextResponse.rewrite(new URL("/maintenance", request.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf)$).*)",
  ],
};
