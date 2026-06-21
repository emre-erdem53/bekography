import { prisma } from "@/lib/prisma";
import {
  defaultPostShootTemplateSettings,
  parsePostShootTemplateSettings,
  type PostShootTemplateSettingsData,
} from "@/lib/post-shoot-template-settings";

export async function getPostShootTemplateSettings(): Promise<PostShootTemplateSettingsData> {
  const row = await prisma.postShootTemplateSettings.findUnique({
    where: { id: "default" },
  });

  if (!row) {
    const defaults = defaultPostShootTemplateSettings();
    await prisma.postShootTemplateSettings.create({
      data: {
        id: "default",
        variables: defaults.variables,
        digital: defaults.digital,
        editing: defaults.editing,
        printing: defaults.printing,
        noPrintingText: defaults.noPrintingText,
      },
    });
    return defaults;
  }

  return parsePostShootTemplateSettings({
    variables: row.variables,
    digital: row.digital,
    editing: row.editing,
    printing: row.printing,
    noPrintingText: row.noPrintingText,
  });
}

export async function savePostShootTemplateSettings(
  settings: PostShootTemplateSettingsData,
) {
  const parsed = parsePostShootTemplateSettings(settings);

  await prisma.postShootTemplateSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      variables: parsed.variables,
      digital: parsed.digital,
      editing: parsed.editing,
      printing: parsed.printing,
      noPrintingText: parsed.noPrintingText,
    },
    update: {
      variables: parsed.variables,
      digital: parsed.digital,
      editing: parsed.editing,
      printing: parsed.printing,
      noPrintingText: parsed.noPrintingText,
    },
  });

  return parsed;
}
