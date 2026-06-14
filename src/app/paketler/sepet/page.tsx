import type { Metadata } from "next";
import { PackagesCartClient } from "@/components/packages/packages-cart-client";

export const metadata: Metadata = {
  title: "Sepetim",
  description: "Seçtiğiniz paketler ve talep oluşturma.",
};

export default function PaketlerSepetPage() {
  return <PackagesCartClient />;
}
