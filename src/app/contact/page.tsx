import type { Metadata } from "next";
import { ContactPageClient } from "@/components/contact/contact-page-client";

export const metadata: Metadata = {
  title: "İletişim",
  description: "Birlikte üretelim — teklif ve iş birlikleri için bizimle iletişime geçin.",
};

export default function ContactPage() {
  return <ContactPageClient />;
}
