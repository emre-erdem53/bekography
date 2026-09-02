import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { createRequestSchema } from "@/lib/validations";
import { joinPersonName } from "@/lib/reservation-utils";
import {
  cartRequiresAdditionalPackage,
  getCompanionRequirementMessage,
} from "@/lib/cart-companion-rules";
import {
  resolveRequestUnitPrice,
  type CartDiscountItem,
} from "@/lib/cart-bundle-discount";
import {
  itemShootTypeInclude,
  shootTypeWithParentsInclude,
} from "@/lib/prisma-includes";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Geçersiz veri" },
        { status: 400 },
      );
    }

    const { contactFirstName, contactLastName, contactRole, items } =
      parsed.data;
    const roleLabel = contactRole === "gelin" ? "Gelin" : "Damat";
    const contactFullName = joinPersonName(contactFirstName, contactLastName);
    const customerName = `${contactFullName} (${roleLabel})`;
    const customerPhone = "—";

    const shootTypes = await prisma.shootType.findMany({
      where: {
        id: { in: items.map((item) => item.shootTypeId) },
        isActive: true,
        package: { isActive: true, serviceArea: { isActive: true } },
      },
      include: shootTypeWithParentsInclude,
    });

    if (shootTypes.length !== items.length) {
      return NextResponse.json(
        { error: "Seçilen paketlerden biri geçersiz" },
        { status: 400 },
      );
    }

    const companionFlags = shootTypes.map((shootType) => ({
      isCompanionOnly: shootType.package.serviceArea.isCompanionOnly,
    }));

    if (cartRequiresAdditionalPackage(companionFlags)) {
      return NextResponse.json(
        { error: getCompanionRequirementMessage() },
        { status: 400 },
      );
    }

    const itemDates = items.map((item) => startOfDay(new Date(item.shootDate)));
    const earliestDate = itemDates.reduce((earliest, date) =>
      date < earliest ? date : earliest,
    );
    const citySummary = [...new Set(items.map((item) => item.city))].join(", ");

    const discountItems: CartDiscountItem[] = items.map((item) => {
      const shootType = shootTypes.find(
        (candidate) => candidate.id === item.shootTypeId,
      )!;
      return {
        cashPrice: shootType.cashPrice,
        installmentPrice: shootType.installmentPrice,
        scheduleType: shootType.package.serviceArea.scheduleType as
          | "indoor"
          | "outdoor",
        areaSlug: shootType.package.serviceArea.slug,
        isCompanionOnly: shootType.package.serviceArea.isCompanionOnly,
        shootDate: item.shootDate,
      };
    });

    const requestRecord = await prisma.request.create({
      data: {
        publicId: nanoid(8).toUpperCase(),
        customerName,
        contactFirstName: contactFirstName.trim(),
        contactLastName: contactLastName.trim(),
        contactRole,
        customerPhone,
        city: citySummary,
        shootDate: earliestDate,
        items: {
          create: items.map((item, itemIndex) => {
            const shootType = shootTypes.find(
              (candidate) => candidate.id === item.shootTypeId,
            )!;
            const basePrice =
              item.paymentType === "pesin"
                ? shootType.cashPrice
                : shootType.installmentPrice;
            const unitPrice = resolveRequestUnitPrice(
              basePrice,
              itemIndex,
              discountItems,
            );
            return {
              shootTypeId: item.shootTypeId,
              paymentType: item.paymentType,
              unitPrice,
              shootDate: startOfDay(new Date(item.shootDate)),
              city: item.city,
            };
          }),
        },
      },
      include: { items: { include: itemShootTypeInclude } },
    });

    return NextResponse.json({
      id: requestRecord.id,
      publicId: requestRecord.publicId,
      items: requestRecord.items.map((item) => ({
        serviceAreaTitle: item.shootType.package.serviceArea.title,
        packageTitle: item.shootType.package.title,
        shootTypeLabel: item.shootType.label,
        paymentType: item.paymentType,
        shootDate: item.shootDate,
        city: item.city,
      })),
    });
  } catch (error) {
    console.error("POST /api/requests", error);
    return NextResponse.json(
      { error: "Talep oluşturulamadı" },
      { status: 500 },
    );
  }
}
