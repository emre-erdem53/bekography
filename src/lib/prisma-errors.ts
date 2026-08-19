import { Prisma } from "@prisma/client";

export function prismaWriteErrorResponse(
  error: unknown,
  fallback: string,
): { status: number; error: string } {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.join(" ")
        : String(error.meta?.target ?? "");

      if (target.includes("slug")) {
        return {
          status: 409,
          error:
            "Bu paket başlığına ait bir kayıt zaten var. Başlığı değiştirip tekrar deneyin.",
        };
      }

      return {
        status: 409,
        error: "Aynı kayıttan bir tane daha olamaz. Alanları kontrol edin.",
      };
    }

    if (error.code === "P2025") {
      return {
        status: 404,
        error:
          "Güncellenmek istenen kayıt bulunamadı. Sayfayı yenileyip tekrar deneyin.",
      };
    }

    if (error.code === "P2003") {
      return {
        status: 409,
        error: "Bu kayıt başka verilerle bağlı olduğu için işlem yapılamadı.",
      };
    }
  }

  if (error instanceof SyntaxError) {
    return {
      status: 400,
      error: "Gönderilen veri okunamadı. Formu kontrol edip tekrar deneyin.",
    };
  }

  return { status: 500, error: fallback };
}
