import {
  PAYMENT_TYPE_DESCRIPTIONS,
  PAYMENT_TYPE_LABELS,
  type PaymentType,
} from "@/lib/constants";

export type PaymentTypeCopy = {
  label: string;
  description: string;
};

export type SiteSettingsData = {
  paymentTypes: Record<PaymentType, PaymentTypeCopy>;
};

export function defaultSiteSettings(): SiteSettingsData {
  return {
    paymentTypes: {
      pesin: {
        label: PAYMENT_TYPE_LABELS.pesin,
        description: PAYMENT_TYPE_DESCRIPTIONS.pesin,
      },
      taksitli: {
        label: PAYMENT_TYPE_LABELS.taksitli,
        description: PAYMENT_TYPE_DESCRIPTIONS.taksitli,
      },
    },
  };
}

export function parseSiteSettings(input: unknown): SiteSettingsData {
  const defaults = defaultSiteSettings();
  if (!input || typeof input !== "object") return defaults;

  const data = input as Partial<SiteSettingsData>;
  const paymentTypes = data.paymentTypes ?? defaults.paymentTypes;

  return {
    paymentTypes: {
      pesin: {
        label:
          typeof paymentTypes.pesin?.label === "string" &&
          paymentTypes.pesin.label.trim()
            ? paymentTypes.pesin.label.trim()
            : defaults.paymentTypes.pesin.label,
        description:
          typeof paymentTypes.pesin?.description === "string" &&
          paymentTypes.pesin.description.trim()
            ? paymentTypes.pesin.description.trim()
            : defaults.paymentTypes.pesin.description,
      },
      taksitli: {
        label:
          typeof paymentTypes.taksitli?.label === "string" &&
          paymentTypes.taksitli.label.trim()
            ? paymentTypes.taksitli.label.trim()
            : defaults.paymentTypes.taksitli.label,
        description:
          typeof paymentTypes.taksitli?.description === "string" &&
          paymentTypes.taksitli.description.trim()
            ? paymentTypes.taksitli.description.trim()
            : defaults.paymentTypes.taksitli.description,
      },
    },
  };
}

export function getPaymentTypeLabels(settings: SiteSettingsData) {
  return {
    pesin: settings.paymentTypes.pesin.label,
    taksitli: settings.paymentTypes.taksitli.label,
  } as const;
}

export function getPaymentTypeDescriptions(settings: SiteSettingsData) {
  return {
    pesin: settings.paymentTypes.pesin.description,
    taksitli: settings.paymentTypes.taksitli.description,
  } as const;
}
