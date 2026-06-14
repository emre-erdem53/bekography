import { z } from "zod";
import { isValidHexColor, normalizeHexColor } from "@/lib/color-utils";

const hexColorSchema = z
  .string()
  .min(1)
  .refine((value) => isValidHexColor(value), {
    message: "Geçerli bir hex renk kodu girin (örn. #ff9a5e)",
  })
  .transform((value) => normalizeHexColor(value)!);

const postShootSectionSchema = z.object({
  pills: z.array(z.string()),
  description: z.string(),
});

const postShootTemplatesSchema = z.object({
  digital: postShootSectionSchema,
  editing: postShootSectionSchema,
  printing: postShootSectionSchema.optional(),
});

const tcSchema = z
  .string()
  .regex(/^\d{11}$/, "TC kimlik numarası 11 haneli olmalıdır")
  .or(z.literal(""));

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
  content: z
    .object({
      scheduleType: z.enum(["outdoor", "indoor"]).optional(),
      postShootTemplates: postShootTemplatesSchema.optional(),
    })
    .catchall(z.unknown())
    .optional(),
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

const reservationItemSchema = z.object({
  packageOptionId: z.string().min(1),
  paymentType: z.enum(["pesin", "taksitli"]),
  unitPrice: z.number().int().positive(),
  shootDate: z.string().min(1, "Çekim günü seçin"),
  shootContent: z.string().min(1, "Çekim içeriği girin"),
  readyTime: z.string().optional(),
  location: z.string().optional(),
  agreedUnitPrice: z.number().int().positive(),
  departureTime: z.string().nullable().optional(),
  arrivalTime: z.string().nullable().optional(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
});

const installmentSchema = z.object({
  amount: z.number().int().positive(),
  dueDate: z.string().min(1, "Vade tarihi seçin"),
});

const postShootSnapshotSchema = z.object({
  digital: postShootSectionSchema,
  editing: postShootSectionSchema,
  printing: postShootSectionSchema.optional(),
});

export const createReservationSchema = z.object({
  requestId: z.string().optional(),
  brideName: z.string().min(2, "Gelin ad soyad girin"),
  brideTc: tcSchema.optional(),
  bridePhone: z.string().min(10, "Gelin telefonu girin"),
  groomName: z.string().min(2, "Damat ad soyad girin"),
  groomTc: tcSchema.optional(),
  groomPhone: z.string().min(10, "Damat telefonu girin"),
  totalPrice: z.number().int().positive(),
  cancellationFeeMax: z.number().int().min(0),
  discountAmount: z.number().int().min(0),
  postShoot: postShootSnapshotSchema,
  notes: z.string().optional(),
  items: z.array(reservationItemSchema).min(1, "En az bir paket seçin"),
  installments: z
    .array(installmentSchema)
    .min(1, "En az bir ödeme vadesi girin"),
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
