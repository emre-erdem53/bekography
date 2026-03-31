import type { Metadata } from "next";
import { FooterDark } from "@/components/footer-dark";
import { Inter, Newsreader, Playfair_Display } from "next/font/google";
import { FloatingContactButtons } from "@/components/floating-contact-buttons";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  style: ["normal", "italic"],
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "BEKOGRAPHY | Monochrome Studio",
    template: "%s | BEKOGRAPHY",
  },
  description:
    "Fine art monochrome photography — cinematic narratives, high contrast, timeless frames.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${newsreader.variable} h-full antialiased`}
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
