import type { Metadata } from "next";
import { FooterDark } from "@/components/footer-dark";
import localFont from "next/font/local";
import { FloatingContactButtons } from "@/components/floating-contact-buttons";
import { SiteHeader } from "@/components/site-header";
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
      { url: "/logo/logo-black.png", type: "image/png" },
      { url: "/logo/logo-black.svg", type: "image/svg+xml" },
    ],
    shortcut: "/logo/logo-black.png",
    apple: "/logo/logo-black.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${gilroy.variable} ${andes.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <SiteHeader />
          {children}
          <FooterDark />
          <FloatingContactButtons />
        </ThemeProvider>
      </body>
    </html>
  );
}
