import { PAYMENT_TYPE_LABELS, WHATSAPP_NUMBER } from "@/lib/constants";

type CartItemForMessage = {
  categoryTitle: string;
  optionLabel: string;
  paymentType: "pesin" | "taksitli";
};

export function buildRequestWhatsAppMessage(
  brideName: string,
  groomName: string,
  items: CartItemForMessage[],
) {
  const packageList = items
    .map(
      (item) =>
        `${item.categoryTitle} - ${item.optionLabel} (${PAYMENT_TYPE_LABELS[item.paymentType]})`,
    )
    .join(", ");

  return `Merhabalar, ben ${brideName} (gelin) ve ${groomName} (damat). ${packageList} için sizden bilgi almak ve iletişime geçmek istiyorum.`;
}

export function buildWhatsAppUrl(message: string) {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
}
