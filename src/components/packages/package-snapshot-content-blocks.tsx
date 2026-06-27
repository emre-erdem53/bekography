import { getPackageIcon } from "@/components/packages/package-icon";
import { PACKAGE_SERVICE_THEME } from "@/lib/package-service-theme";
import type { ReservationProductSnapshot } from "@/lib/reservation-product-snapshot";
import type { PackageDetailSection } from "@/lib/package-seed-data";

export function PackageSnapshotServicesGrid({
  product,
}: {
  product: ReservationProductSnapshot;
}) {
  if (product.services.length === 0) return null;

  return (
    <div
      className="mt-5 grid grid-cols-2 gap-[1px] overflow-hidden rounded-2xl md:grid-cols-4"
      style={{ backgroundColor: PACKAGE_SERVICE_THEME.serviceGridColor }}
    >
      {product.services.map((item) => {
        const Icon = getPackageIcon(item.iconKey);
        return (
          <div
            key={item.title}
            className="px-2 py-2 text-center"
            style={{
              backgroundColor: PACKAGE_SERVICE_THEME.serviceGridColor,
              color: PACKAGE_SERVICE_THEME.serviceTextColor,
            }}
          >
            <Icon className="mx-auto h-6 w-6 md:h-7 md:w-7" />
            <p className="mt-1.5 text-xs font-bold leading-tight md:mt-2 md:text-sm">
              {item.title}
            </p>
            <div
              className="mt-1 space-y-px text-[10px] leading-none md:text-[11px]"
              style={{ color: PACKAGE_SERVICE_THEME.serviceSubTextColor }}
            >
              {item.subLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PackageSnapshotShootBlocks({
  product,
}: {
  product: ReservationProductSnapshot;
}) {
  const hasShoot = Boolean(product.shootDescription.trim());
  const hasAfterShoot =
    Boolean(product.afterShootDescription.trim()) ||
    Boolean(product.afterShootExtra?.trim());

  if (!hasShoot && !hasAfterShoot) return null;

  return (
    <div className="mt-5 space-y-2 rounded-2xl bg-black/80 p-3 md:space-y-3 md:p-4">
      {hasShoot ? (
        <div>
          <h5
            className="text-center text-xl font-bold md:text-2xl"
            style={{ color: product.accentColor }}
          >
            {product.shootTitle || "Çekim"}
          </h5>
          <p className="mt-2 text-center text-sm leading-relaxed text-zinc-300">
            {product.shootDescription}
          </p>
        </div>
      ) : null}
      {hasAfterShoot ? (
        <div>
          <h5
            className="text-center text-xl font-bold md:text-2xl"
            style={{ color: product.accentColor }}
          >
            {product.afterShootTitle || "Çekim Sonrası"}
          </h5>
          {product.afterShootDescription.trim() ? (
            <p className="mt-2 text-center text-sm leading-relaxed text-zinc-300">
              {product.afterShootDescription}
            </p>
          ) : null}
          {product.afterShootExtra?.trim() ? (
            <p className="mt-2 text-center text-sm text-zinc-300">
              {product.afterShootExtra}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function PackageInspectSections({
  sections,
  emptyMessage = "Bu paket için detay bilgisi yakında eklenecek.",
}: {
  sections: PackageDetailSection[];
  emptyMessage?: string;
}) {
  if (sections.length === 0) {
    return <p className="mt-6 text-sm text-zinc-500">{emptyMessage}</p>;
  }

  return (
    <div className="mt-6 space-y-6 sm:space-y-7">
      {sections.map((section) => (
        <section key={section.id}>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-white sm:text-base">
            {section.title}
          </h4>
          {section.tags && section.tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {section.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/80 px-2.5 py-0.5 text-[11px] text-white"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
            {section.body}
          </p>
        </section>
      ))}
    </div>
  );
}
