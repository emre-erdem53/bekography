import type { ReactNode } from "react";
import { WhatsAppIcon } from "@/components/whatsapp-icon";

type RequestActionLabelProps = {
  children: ReactNode;
  iconVariant?: "brand" | "monochrome" | "onDark";
};

/** Ortak buton hizası — ikon + metin tek satırda tam ortada. */
export const requestActionSurfaceClass =
  "inline-flex items-center justify-center gap-2 leading-none";

export const requestActionSurfaceClassFull =
  "flex w-full items-center justify-center gap-2 leading-none";

export function RequestActionLabel({ children }: RequestActionLabelProps) {
  return (
    <>
      <WhatsAppIcon />
      <span>{children}</span>
    </>
  );
}
