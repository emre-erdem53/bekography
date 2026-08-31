import { redirect } from "next/navigation";
import { BekographyBrand } from "@/components/bekography-brand";
import {
  getMaintenanceMessage,
  isMaintenanceModeEnabled,
} from "@/lib/maintenance-mode";

export default function MaintenancePage() {
  if (!isMaintenanceModeEnabled()) {
    redirect("/");
  }

  const message = getMaintenanceMessage();

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-black px-6 py-16 text-center text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(147, 248, 182, 0.12), transparent 60%), radial-gradient(ellipse 50% 40% at 80% 100%, rgba(255, 154, 94, 0.08), transparent 55%)",
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center">
        <BekographyBrand href={null} />

        <p className="mt-10 text-xs font-semibold uppercase tracking-[0.34em] text-zinc-500">
          Kısa süreli bakım
        </p>

        <h1 className="mt-4 text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
          {message}
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          Sitemizi daha iyi bir deneyim için güncelliyoruz. Çok yakında tekrar
          buradayız.
        </p>

        <div className="mt-10 h-px w-16 bg-white/15" aria-hidden />

        <p className="mt-6 text-xs text-zinc-500">
          Sorularınız için{" "}
          <a
            href="https://wa.me/905469370464"
            className="text-zinc-300 underline-offset-4 hover:text-white hover:underline"
          >
            WhatsApp
          </a>{" "}
          üzerinden bize ulaşabilirsiniz.
        </p>
      </div>
    </div>
  );
}
