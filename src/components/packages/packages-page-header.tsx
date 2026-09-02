import { PACKAGES_TAGLINE } from "@/components/packages/packages-intro-overlay";

export function PackagesPageHeader() {
  return (
    <>
      <div className="text-center">
        <p className="mx-auto max-w-md text-base italic leading-relaxed text-white sm:text-[1.05rem]">
          {PACKAGES_TAGLINE}
        </p>
      </div>

      <div className="mx-auto mt-5 max-w-lg text-center sm:mt-6">
        <p className="text-xs font-medium tracking-wide text-zinc-400 sm:text-sm">
          • Akış Planlama • Rehberlik • Tüm Dijitaller
        </p>
        <div
          className="mx-auto mt-3 h-px w-full max-w-sm bg-white/15"
          aria-hidden
        />
      </div>
    </>
  );
}
