import { ChevronDown } from "lucide-react";
import type { PackageDetailSection } from "@/lib/package-seed-data";

export function PackageDetailSectionsList({
  sections,
  emptyMessage = "Bu çekim türü için detay bilgisi yakında eklenecek.",
}: {
  sections: PackageDetailSection[];
  emptyMessage?: string;
}) {
  return (
    <section className="mt-5 border-t border-white/10 pt-5 sm:mt-6 sm:pt-6">
      <div className="flex items-center justify-center gap-1.5 text-sm text-zinc-500">
        <ChevronDown className="h-4 w-4 shrink-0 animate-bounce" aria-hidden />
        <span>Açıklama</span>
      </div>

      {sections.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">{emptyMessage}</p>
      ) : (
        <div className="mt-5 space-y-6 sm:mt-6 sm:space-y-7">
          {sections.map((section) => (
            <div key={section.id}>
              <h4 className="text-lg font-bold uppercase tracking-wide text-white sm:text-xl">
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
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
