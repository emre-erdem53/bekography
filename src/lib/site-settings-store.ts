import { prisma } from "@/lib/prisma";
import {
  defaultSiteSettings,
  parseSiteSettings,
  type SiteSettingsData,
} from "@/lib/site-settings";

export async function getSiteSettings(): Promise<SiteSettingsData> {
  const defaults = defaultSiteSettings();

  const row = await prisma.appSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      settings: defaults,
    },
    update: {},
  });

  return parseSiteSettings(row.settings);
}

export async function saveSiteSettings(settings: SiteSettingsData) {
  const parsed = parseSiteSettings(settings);

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

  return parsed;
}
