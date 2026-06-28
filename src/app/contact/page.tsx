import type { Metadata } from "next";
import { ContactPageClient } from "@/components/contact/contact-page-client";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "İletişim",
  description:
    "Düğün fotoğraf & film teklifleri için Bekography ile iletişime geçin. WhatsApp, telefon ve stüdyo adresi.",
  path: "/contact",
});

export default function ContactPage() {
  return <ContactPageClient />;
}
