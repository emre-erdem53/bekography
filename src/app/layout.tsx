import type { Metadata } from "next";
import localFont from "next/font/local";
import { AuthSessionProvider } from "@/components/auth-session-provider";
import { SiteShell } from "@/components/site-shell";
import "./globals.css";

const gilroy = localFont({
  src: "../../public/fonts/Gilroy-Medium.ttf",
  variable: "--font-gilroy",
  display: "swap",
});

const andes = localFont({
  src: "../../public/fonts/andes.ttf",
  variable: "--font-andes",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bekography.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "bekography | Monochrome Studio",
    template: "%s | bekography",
  },
  description:
    "Fine art monochrome photography — cinematic narratives, high contrast, timeless frames.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-48.png", type: "image/png", sizes: "48x48" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${gilroy.variable} ${andes.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <AuthSessionProvider>
          <SiteShell>{children}</SiteShell>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
