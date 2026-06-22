import type { ReactNode } from "react";
import { WhatsAppIcon } from "@/components/whatsapp-icon";

type RequestActionLabelProps = {
  children: ReactNode;
  iconVariant?: "brand" | "monochrome" | "onDark";
};

export function RequestActionLabel({ children }: RequestActionLabelProps) {
  return (
    <span className="inline-flex items-center justify-center gap-2">
      <WhatsAppIcon />
      <span>{children}</span>
    </span>
  );
}
