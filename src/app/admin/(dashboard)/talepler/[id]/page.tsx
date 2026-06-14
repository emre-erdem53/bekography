import { RequestDetailClient } from "@/components/admin/request-detail-client";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RequestDetailClient requestId={id} />;
}
