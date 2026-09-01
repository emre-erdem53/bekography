import { SECOND_PACKAGE_DISCOUNT_NOTE } from "@/lib/cart-bundle-discount";

export function PackagesBundleDiscountNote() {
  return (
    <p className="mx-auto mt-6 max-w-2xl rounded-2xl border border-[#93f8b6]/20 bg-[#93f8b6]/[0.06] px-4 py-3 text-center text-sm leading-relaxed text-zinc-300">
      <span className="font-medium text-[#93f8b6]">Not:</span>{" "}
      {SECOND_PACKAGE_DISCOUNT_NOTE}
    </p>
  );
}
