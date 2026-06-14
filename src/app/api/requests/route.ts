import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { createRequestSchema } from "@/lib/validations";

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

    const { customerName, customerPhone, city, shootDate, items } = parsed.data;

    const options = await prisma.packageOption.findMany({
      where: {
        id: { in: items.map((item) => item.packageOptionId) },
        isActive: true,
      },
      include: { category: true },
    });

    if (options.length !== items.length) {
      return NextResponse.json(
        { error: "Seçilen paketlerden biri geçersiz" },
        { status: 400 },
      );
    }

    const requestRecord = await prisma.request.create({
      data: {
        publicId: nanoid(8).toUpperCase(),
        customerName,
        customerPhone,
        city,
        shootDate: startOfDay(new Date(shootDate)),
        items: {
          create: items.map((item) => {
            const option = options.find((o) => o.id === item.packageOptionId)!;
            const unitPrice =
              item.paymentType === "pesin"
                ? option.cashPrice
                : option.installmentPrice;
            return {
              packageOptionId: item.packageOptionId,
              paymentType: item.paymentType,
              unitPrice,
            };
          }),
        },
      },
      include: {
        items: {
          include: {
            packageOption: { include: { category: true } },
          },
        },
      },
    });

    return NextResponse.json({
      id: requestRecord.id,
      publicId: requestRecord.publicId,
      items: requestRecord.items.map((item) => ({
        categoryTitle: item.packageOption.category.title,
        optionLabel: item.packageOption.label,
        paymentType: item.paymentType,
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
