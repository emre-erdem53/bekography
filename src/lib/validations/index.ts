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
  brideName: z.string().min(2, "Gelin ad soyad en az 2 karakter olmalı"),
  bridePhone: z.string().min(10, "Gelin telefonu en az 10 haneli olmalı"),
  groomName: z.string().min(2, "Damat ad soyad en az 2 karakter olmalı"),
  groomPhone: z.string().min(10, "Damat telefonu en az 10 haneli olmalı"),
  items: z
    .array(
      z.object({
        packageOptionId: z.string().min(1),
        paymentType: z.enum(["pesin", "taksitli"]),
        shootDate: z.string().min(1, "Çekim tarihi seçin"),
        city: z.string().min(2, "Şehir girin"),
      }),
    )
    .min(1, "En az bir paket seçin"),
});

export const updateRequestStatusSchema = z.object({
  status: z.enum(["yeni", "teklif_verildi", "onaylandi", "iptal"]),
});

const packageGalleryImageSchema = z.object({
  url: z.string().min(1),
  alt: z.string().optional(),
});

const packageDetailSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  body: z.string(),
  sortOrder: z.number().int(),
});

const packageRequestFieldLabelsSchema = z.object({
  dateLabel: z.string().min(1),
  cityLabel: z.string().min(1),
});

const packageServiceItemSchema = z.object({
  title: z.string().min(1),
  subLines: z.array(z.string()),
  iconKey: z.string().min(1),
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
      highlightTags: z.array(z.string()).optional(),
      galleryImages: z.array(packageGalleryImageSchema).optional(),
      detailSections: z.array(packageDetailSectionSchema).optional(),
      requestFieldLabels: packageRequestFieldLabelsSchema.optional(),
      services: z.array(packageServiceItemSchema).optional(),
      displayTitle: z.string().optional(),
      shootTitle: z.string().optional(),
      afterShootTitle: z.string().optional(),
    })
    .catchall(z.unknown())
    .passthrough()
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

const postShootPackageBlockSchema = z.object({
  categoryId: z.string().min(1),
  categorySlug: z.string(),
  categoryTitle: z.string().min(1),
  accentColor: z.string(),
  pills: z.array(z.string()),
  description: z.string(),
});

const postShootSectionGroupSchema = z.object({
  items: z.array(postShootPackageBlockSchema),
});

const postShootSnapshotSchema = z.object({
  digital: postShootSectionGroupSchema,
  editing: postShootSectionGroupSchema,
  printing: postShootSectionGroupSchema.optional(),
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
