import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { WHATSAPP_NUMBER } from "@/lib/constants";

const WHATSAPP_GREETING_NAME = "Bekir Bey";

type CartItemForMessage = {
  categoryTitle: string;
  optionLabel: string;
  shootDate: string;
  city: string;
};

function formatShootDate(shootDate: string) {
  return format(new Date(shootDate), "d MMMM yyyy", { locale: tr });
}

function formatContactRole(contactRole: "gelin" | "damat") {
  return contactRole === "gelin" ? "Gelin" : "Damat";
}

export function buildRequestWhatsAppMessage(
  contactFirstName: string,
  contactLastName: string,
  contactRole: "gelin" | "damat",
  items: CartItemForMessage[],
) {
  const contactName = `${contactFirstName.trim()} ${contactLastName.trim()}`.trim();
  const packageLines = items
    .map(
      (item) =>
        `•${item.categoryTitle} - ${item.optionLabel} (${formatShootDate(item.shootDate)}, ${item.city})`,
    )
    .join("\n");

  return `Merhaba ${WHATSAPP_GREETING_NAME}. 😊 Ben ${contactName} (${formatContactRole(contactRole)}). Aşağıdaki bilgilerle çekim talep ediyorum.\n\n${packageLines}`;
}

export function buildWhatsAppUrl(message: string) {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
}
