import { PACKAGES_TAGLINE } from "@/components/packages/packages-intro-overlay";

export function PackagesPageHeader() {
  return (
    <div className="text-center">
      <p className="mx-auto max-w-md text-base italic leading-relaxed text-white sm:text-[1.05rem]">
        {PACKAGES_TAGLINE}
      </p>
      <p className="mt-3 text-[11px] text-zinc-500 sm:text-xs">
        • Akış Planlama • Rehberlik • Tüm Dijitaller
      </p>
    </div>
  );
}
