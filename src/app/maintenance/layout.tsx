import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yenileniyor | Bekography",
  robots: { index: false, follow: false },
};

export default function MaintenanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
