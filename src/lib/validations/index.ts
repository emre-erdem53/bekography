import { z } from "zod";
import { isValidHexColor, normalizeHexColor } from "@/lib/color-utils";
import {
  isValidTurkishMobilePhone,
  normalizeTurkishMobileForStorage,
} from "@/lib/phone-utils";
import { normalizePersonNamePartForStorage } from "@/lib/person-name-input";

const hexColorSchema = z
  .string()
  .min(1)
  .refine((value) => isValidHexColor(value), {
    message: "Geçerli bir hex renk kodu girin (örn. #ff9a5e)",
  })
  .transform((value) => normalizeHexColor(value)!);

const postShootSectionSchema = z.object({
  pills: z.array(z.string()).default([]),
  description: z.string().default(""),
});

const workflowStageTagsSchema = z.record(
  z.string(),
  z.array(z.string()).default([]),
);

const tcSchema = z
  .string()
  .regex(/^\d{11}$/, "TC kimlik numarası 11 haneli olmalıdır")
  .or(z.literal(""));

const personFirstNameSchema = z
  .string()
  .min(1, "Ad girin")
  .max(80)
  .transform((value) => normalizePersonNamePartForStorage(value));
const personLastNameSchema = z
  .string()
  .min(1, "Soyad girin")
  .max(80)
  .transform((value) => normalizePersonNamePartForStorage(value));

const turkishMobilePhoneSchema = z
  .string()
  .transform((value) => normalizeTurkishMobileForStorage(value))
  .refine((value) => isValidTurkishMobilePhone(value), {
    message: "Geçerli bir cep telefonu girin (10 haneli, 5 ile başlamalı)",
  });

export const createRequestSchema = z.object({
  contactFirstName: personFirstNameSchema,
  contactLastName: personLastNameSchema,
  contactRole: z.enum(["gelin", "damat"], {
    message: "Gelin veya damat seçin",
  }),
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

const packageGalleryMediaSchema = z.object({
  url: z.string().min(1),
  alt: z.string().optional(),
  type: z.enum(["image", "video"]).optional(),
});

const packageDetailSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  body: z.string(),
  tags: z.array(z.string()).optional(),
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
      highlightTags: z.array(z.string()).optional(),
      highlightTagsByOption: z.record(z.string(), z.array(z.string())).optional(),
      galleryImages: z.array(packageGalleryImageSchema).optional(),
      galleryMediaByOption: z
        .record(z.string(), z.array(packageGalleryMediaSchema))
        .optional(),
      detailSections: z.array(packageDetailSectionSchema).optional(),
      requestFieldLabels: packageRequestFieldLabelsSchema.optional(),
      services: z.array(packageServiceItemSchema).optional(),
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
  itemKey: z.string().optional(),
  workflowStageTags: workflowStageTagsSchema.optional(),
});

const installmentSchema = z.object({
  amount: z.number().int().positive(),
  dueDate: z.string().min(1, "Vade tarihi seçin"),
});

const trackingWorkflowFlagsSchema = z.object({
  digitalDeliveredAt: z.string().nullable().optional(),
  selectionCompletedAt: z.string().nullable().optional(),
  editingCompletedAt: z.string().nullable().optional(),
  printingCompletedAt: z.string().nullable().optional(),
  deliveredAt: z.string().nullable().optional(),
  shootCompletedAt: z.string().nullable().optional(),
  adminStage: z.string().nullable().optional(),
  customCompletedAt: z.record(z.string(), z.string()).optional(),
});

const postShootSnapshotSchema = z.object({
  digital: postShootSectionSchema,
  editing: postShootSectionSchema,
  printing: postShootSectionSchema,
  source: z.enum(["template", "manual", "inspect"]).optional(),
  workflow: trackingWorkflowFlagsSchema.optional(),
  itemWorkflows: z.record(z.string(), trackingWorkflowFlagsSchema).optional(),
  itemStageTags: z.record(z.string(), workflowStageTagsSchema).optional(),
});

export const createReservationSchema = z.object({
  requestId: z.string().optional(),
  brideFirstName: personFirstNameSchema,
  brideLastName: personLastNameSchema,
  brideTc: tcSchema.optional(),
  bridePhone: turkishMobilePhoneSchema,
  groomFirstName: personFirstNameSchema,
  groomLastName: personLastNameSchema,
  groomTc: tcSchema.optional(),
  groomPhone: turkishMobilePhoneSchema,
  totalPrice: z.number().int().positive(),
  cancellationFeeMax: z.number().int().min(0),
  discountAmount: z.number().int().min(0),
  discountEnabled: z.boolean().default(false),
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

export const trackReservationSchema = z.object({
  tc: z
    .string()
    .min(1, "TC kimlik numarası girin")
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => /^\d{11}$/.test(value), {
      message: "TC kimlik numarası 11 haneli olmalıdır",
    }),
});
