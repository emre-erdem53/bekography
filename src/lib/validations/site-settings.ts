import { z } from "zod";

const paymentTypeCopySchema = z.object({
  label: z.string().trim().min(1, "Başlık gerekli"),
  description: z.string().trim().min(1, "Açıklama gerekli"),
});

export const updateSiteSettingsSchema = z.object({
  paymentTypes: z.object({
    pesin: paymentTypeCopySchema,
    taksitli: paymentTypeCopySchema,
  }),
});
