import type { Metadata } from "next";
import localFont from "next/font/local";
import { AuthSessionProvider } from "@/components/auth-session-provider";
import { SiteJsonLd } from "@/components/seo/json-ld";
import { SiteSettingsProvider } from "@/components/site-settings-provider";
import { SiteShell } from "@/components/site-shell";
import { createRootMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/site-settings-store";
import "./globals.css";

const gilroy = localFont({
  src: "../../public/fonts/Gilroy-Medium.ttf",
  variable: "--font-gilroy",
  display: "swap",
});

const operetta = localFont({
  src: "../../public/fonts/operetta-18-bold.ttf",
  variable: "--font-couple",
  display: "swap",
});

const andes = localFont({
  src: "../../public/fonts/andes.ttf",
  variable: "--font-andes",
  display: "swap",
});

export const metadata: Metadata = createRootMetadata();

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteSettings = await getSiteSettings();

  return (
    <html
      lang="tr"
      className={`${gilroy.variable} ${andes.variable} ${operetta.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <SiteJsonLd />
        <AuthSessionProvider>
          <SiteSettingsProvider initialSettings={siteSettings}>
            <SiteShell>{children}</SiteShell>
          </SiteSettingsProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
