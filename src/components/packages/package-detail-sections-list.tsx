import { ChevronDown } from "lucide-react";
import type { PackageDetailSection } from "@/lib/package-seed-data";

export function PackageDetailSectionsList({
  sections,
  emptyMessage = "Bu çekim türü için detay bilgisi yakında eklenecek.",
  tagsOnly = false,
}: {
  sections: PackageDetailSection[];
  emptyMessage?: string;
  tagsOnly?: boolean;
}) {
  const visibleSections = tagsOnly
    ? sections.filter((section) => (section.tags?.length ?? 0) > 0)
    : sections;

  return (
    <section className="mt-5 border-t border-white/10 pt-5 sm:mt-6 sm:pt-6">
      <div className="flex items-center justify-center gap-1.5 text-sm text-zinc-500">
        <ChevronDown className="h-4 w-4 shrink-0 animate-bounce" aria-hidden />
        <span>{tagsOnly ? "Etiketler" : "Açıklama"}</span>
      </div>

      {visibleSections.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">{emptyMessage}</p>
      ) : (
        <div className="mt-5 space-y-6 sm:mt-6 sm:space-y-7">
          {visibleSections.map((section) => (
            <div key={section.id}>
              <h4 className="text-lg font-bold uppercase tracking-wide text-white sm:text-xl">
                {section.title}
              </h4>
              {section.tags && section.tags.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {section.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center justify-center rounded-full border border-white/80 px-2.5 py-1 text-[11px] font-medium leading-none text-white"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
              {!tagsOnly && section.body ? (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
                  {section.body}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
