import { PackageForm } from "@/components/admin/package-form";

export default async function NewPackagePage({
  searchParams,
}: {
  searchParams: Promise<{ copyFrom?: string; serviceAreaId?: string }>;
}) {
  const { copyFrom, serviceAreaId } = await searchParams;
  return (
    <PackageForm
      copyFromId={copyFrom}
      preselectedServiceAreaId={serviceAreaId}
    />
  );
}
