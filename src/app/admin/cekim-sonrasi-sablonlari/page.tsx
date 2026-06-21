import type { Metadata } from "next";
import { PostShootTemplatesAdminClient } from "@/components/admin/post-shoot-templates-admin-client";

export const metadata: Metadata = {
  title: "Çekim Sonrası Şablonları",
};

export default function PostShootTemplatesAdminPage() {
  return <PostShootTemplatesAdminClient />;
}
