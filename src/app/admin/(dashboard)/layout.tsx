import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { SiteSettingsProvider } from "@/components/site-settings-provider";
import { getSiteSettings } from "@/lib/site-settings-store";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login");
  }

  const siteSettings = await getSiteSettings();

  return (
    <SiteSettingsProvider initialSettings={siteSettings}>
      <AdminShell>{children}</AdminShell>
    </SiteSettingsProvider>
  );
}
