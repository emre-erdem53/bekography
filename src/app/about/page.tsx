import type { Metadata } from "next";
import { AboutPageContent } from "@/components/about/about-page-content";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Hakkımızda",
  description:
    "Bekography ekibinin düğün fotoğrafçılığı ve film hikayesi. Kevser Topçu ve Bekir Topçu'nun biyografileri.",
  path: "/about",
});

export default function AboutPage() {
  return <AboutPageContent variant="page" />;
}
