import { PackageForm } from "@/components/admin/package-form";

export default async function NewPackagePage({
  searchParams,
}: {
  searchParams: Promise<{ copyFrom?: string }>;
}) {
  const { copyFrom } = await searchParams;
  return <PackageForm copyFromId={copyFrom} />;
}
