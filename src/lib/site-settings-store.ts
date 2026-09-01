import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  defaultSiteSettings,
  parseSiteSettings,
  type SiteSettingsData,
} from "@/lib/site-settings";

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function getSiteSettings(): Promise<SiteSettingsData> {
  const defaults = defaultSiteSettings();

  const existing = await prisma.appSettings.findUnique({
    where: { id: "default" },
  });
  if (existing) {
    return parseSiteSettings(existing.settings);
  }

  // Build-time prerender runs many pages in parallel; concurrent creates race
  // on the singleton id. Treat P2002 as "already created" and re-read.
  try {
    const created = await prisma.appSettings.create({
      data: {
        id: "default",
        settings: defaults,
      },
    });
    return parseSiteSettings(created.settings);
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
    const row = await prisma.appSettings.findUniqueOrThrow({
      where: { id: "default" },
    });
    return parseSiteSettings(row.settings);
  }
}

export async function saveSiteSettings(settings: SiteSettingsData) {
  const parsed = parseSiteSettings(settings);

  try {
    await prisma.appSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        settings: parsed,
      },
      update: {
        settings: parsed,
      },
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
    await prisma.appSettings.update({
      where: { id: "default" },
      data: { settings: parsed },
    });
  }

  return parsed;
}
