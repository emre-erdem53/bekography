import type { Metadata } from "next";
import { AboutPageContent } from "@/components/about/about-page-content";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description:
    "Kevser Topçu ve Bekir Topçu'nun biyografileriyle bekography hikayesi.",
};

export default function AboutPage() {
  return <AboutPageContent variant="page" />;
}
