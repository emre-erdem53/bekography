import { z } from "zod";
import { isValidHexColor, normalizeHexColor } from "@/lib/color-utils";

const hexColorSchema = z
  .string()
  .min(1)
  .refine((value) => isValidHexColor(value), {
    message: "Geçerli bir hex renk kodu girin (örn. #ff9a5e)",
  })
  .transform((value) => normalizeHexColor(value)!);

export const createRequestSchema = z.object({
  customerName: z.string().min(2, "Ad soyad en az 2 karakter olmalı"),
  customerPhone: z.string().min(10, "Geçerli bir telefon numarası girin"),
  city: z.string().min(2, "Şehir girin"),
  shootDate: z.string().min(1, "Çekim tarihi seçin"),
  items: z
    .array(
      z.object({
        packageOptionId: z.string().min(1),
        paymentType: z.enum(["pesin", "taksitli"]),
      }),
    )
    .min(1, "En az bir paket seçin"),
});

export const updateRequestStatusSchema = z.object({
  status: z.enum(["yeni", "teklif_verildi", "onaylandi", "iptal"]),
});

export const packageCategorySchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).optional(),
  accentColor: hexColorSchema,
  iconKey: z.string().min(1),
  highlight: z.boolean().optional(),
  backgroundImageUrl: z.string().nullable().optional(),
  heroImageUrl: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  options: z
    .array(
      z.object({
        id: z.string().optional(),
        label: z.string().min(1),
        cashPrice: z.number().int().positive(),
        installmentPrice: z.number().int().positive(),
        sortOrder: z.number().int().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .optional(),
});

export const createReservationSchema = z.object({
  requestId: z.string().optional(),
  customerName: z.string().min(2),
  customerPhone: z.string().min(10),
  city: z.string().min(2),
  shootDate: z.string().min(1),
  agreedPrice: z.number().int().positive(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        packageOptionId: z.string().min(1),
        paymentType: z.enum(["pesin", "taksitli"]),
        unitPrice: z.number().int().positive(),
      }),
    )
    .min(1),
});

export const updateReservationStatusSchema = z.object({
  status: z.enum([
    "planlandi",
    "cekim_yapildi",
    "montaj_yapiliyor",
    "album_onaylandi",
    "album_siparisi_verildi",
    "album_kargoda",
    "teslim_edildi",
    "iptal",
  ]),
});

export const updateReservationSchema = createReservationSchema.partial().extend({
  status: updateReservationStatusSchema.shape.status.optional(),
});
