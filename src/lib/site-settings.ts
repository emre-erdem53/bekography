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

function copyFor(
  type: PaymentType,
  source: Partial<Record<PaymentType, Partial<PaymentTypeCopy>>> | undefined,
  defaults: SiteSettingsData,
): PaymentTypeCopy {
  const fromSource = source?.[type];
  return {
    label:
      typeof fromSource?.label === "string" && fromSource.label.trim()
        ? fromSource.label.trim()
        : defaults.paymentTypes[type].label,
    description:
      typeof fromSource?.description === "string" &&
      fromSource.description.trim()
        ? fromSource.description.trim()
        : defaults.paymentTypes[type].description,
  };
}

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
      vadeli: {
        label: PAYMENT_TYPE_LABELS.vadeli,
        description: PAYMENT_TYPE_DESCRIPTIONS.vadeli,
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
      pesin: copyFor("pesin", paymentTypes, defaults),
      taksitli: copyFor("taksitli", paymentTypes, defaults),
      vadeli: copyFor("vadeli", paymentTypes, defaults),
    },
  };
}

export function getPaymentTypeLabels(settings: SiteSettingsData) {
  return {
    pesin: settings.paymentTypes.pesin.label,
    taksitli: settings.paymentTypes.taksitli.label,
    vadeli: settings.paymentTypes.vadeli.label,
  } as const;
}

export function getPaymentTypeDescriptions(settings: SiteSettingsData) {
  return {
    pesin: settings.paymentTypes.pesin.description,
    taksitli: settings.paymentTypes.taksitli.description,
    vadeli: settings.paymentTypes.vadeli.description,
  } as const;
}
