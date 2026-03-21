import type { Metadata } from "next";
import { ContactPageClient } from "@/components/contact/contact-page-client";

export const metadata: Metadata = {
  title: "Contact",
  description: "Let’s create together — commissions and collaborations.",
};

export default function ContactPage() {
  return <ContactPageClient />;
}
