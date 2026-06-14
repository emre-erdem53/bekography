import { NextResponse } from "next/server";
import {
  getActivePackages,
  serializePackageCategories,
} from "@/lib/packages";

export async function GET() {
  try {
    const categories = await getActivePackages();
    return NextResponse.json(serializePackageCategories(categories));
  } catch (error) {
    console.error("GET /api/packages", error);
    return NextResponse.json(
      { error: "Paketler yüklenemedi" },
      { status: 500 },
    );
  }
}
