import type { Metadata } from "next";
import localFont from "next/font/local";
import { AuthSessionProvider } from "@/components/auth-session-provider";
import { SiteShell } from "@/components/site-shell";
import { ThemeProvider } from "@/components/theme-provider";
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

export const metadata: Metadata = {
  title: {
    default: "bekography | Monochrome Studio",
    template: "%s | bekography",
  },
  description:
    "Fine art monochrome photography — cinematic narratives, high contrast, timeless frames.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
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
      className={`${gilroy.variable} ${andes.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <AuthSessionProvider>
            <SiteShell>{children}</SiteShell>
          </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
