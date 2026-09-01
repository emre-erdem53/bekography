import { ServiceAreaForm } from "@/components/admin/service-area-form";

export default async function EditServiceAreaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ServiceAreaForm serviceAreaId={id} />;
}
