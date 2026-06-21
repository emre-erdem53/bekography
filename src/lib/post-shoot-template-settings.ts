export type PostShootMergeStrategy =
  | "join"
  | "sum"
  | "max"
  | "first"
  | "unique_list";

export type PostShootVariableDefinition = {
  key: string;
  label: string;
  mergeStrategy: PostShootMergeStrategy;
  hint?: string;
};

export type PostShootTemplateSection = {
  pills: string[];
  description: string;
};

export type PostShootTemplateSettingsData = {
  variables: PostShootVariableDefinition[];
  digital: PostShootTemplateSection;
  editing: PostShootTemplateSection;
  printing: PostShootTemplateSection;
  noPrintingText: string;
};

export const POST_SHOOT_MERGE_STRATEGY_LABELS: Record<
  PostShootMergeStrategy,
  string
> = {
  join: "Birleştir (ve ile)",
  sum: "Topla (sayısal)",
  max: "En büyük değer",
  first: "İlk değer",
  unique_list: "Benzersiz liste (ve ile)",
};

export const POST_SHOOT_TEMPLATE_USAGE_GUIDE = `## Nasıl kullanılır?

1. **Dinamik alan tanımlayın** — Aşağıdaki listede anahtar (ör. \`shootMekan\`), etiket ve birleştirme kuralını belirleyin.
2. **Metne yerleştirin** — Açıklama veya etiket metninde \`{{anahtar}}\` yazın. Örnek: \`{{shootMekan}} çekilen fotoğraflar\`
3. **Paket değerleri** — Her paketin düzenleme sayfasında bu anahtarlar için değer girilir (ör. Dış Çekim → \`dış çekimde\`).
4. **Rezervasyon** — Birden fazla paket seçildiğinde değerler kurala göre birleştirilir; tek metin oluşur.

## Birleştirme kuralları

- **Birleştir (ve ile):** dış çekimde + salonda → \`dış çekimde ve salonda\`
- **Topla:** 18 + 18 → \`36\` (fotoğraf sayısı gibi)
- **En büyük:** 70 ve 30 → \`70\`
- **İlk değer:** ilk paketin değeri kullanılır
- **Benzersiz liste:** tekrarsız değerler \`ve\` ile birleştirilir

## Baskı

Salon/düğün gibi baskılı paket yoksa Baskı bölümünde «Baskı yok» metni gösterilir.

## Örnek düzenleme metni

\`Seçimlerden sonra en geç {{teslimGun}} günde {{shootMekan}} çekilen fotoğraflardan {{fotoSayisi}} fotoğraf ve {{shootMekan}} çekilen videolardan {{filmSure}} arasında değişen bir {{filmAdi}} düzenlenir.\`
`;

export function defaultPostShootTemplateSettings(): PostShootTemplateSettingsData {
  return {
    variables: [
      {
        key: "shootMekan",
        label: "Çekim mekanı (edatlı)",
        mergeStrategy: "join",
        hint: "Örn. dış çekimde, salonda",
      },
      {
        key: "filmAdi",
        label: "Film adı",
        mergeStrategy: "unique_list",
        hint: "Örn. dış çekim filmi, salon filmi",
      },
      {
        key: "fotoSayisi",
        label: "Fotoğraf sayısı",
        mergeStrategy: "sum",
        hint: "Sayısal değer; çoklu pakette toplanır",
      },
      {
        key: "filmSure",
        label: "Film süresi",
        mergeStrategy: "first",
        hint: "Örn. 30-60 saniye",
      },
      {
        key: "teslimGun",
        label: "Teslim günü",
        mergeStrategy: "max",
        hint: "Örn. 70",
      },
    ],
    digital: {
      pills: ["Tüm Çekilenler", "7 Günde Hazır", "30 Günde Alınmalı"],
      description:
        "Çekimden kalan tüm görüntüleri yüksek çözünürlükte, 7 gün içinde indirme linki veya harici disk ile teslim ediyoruz. Teslimden sonra 30 gün içinde alınmalıdır.",
    },
    editing: {
      pills: ["{{fotoSayisi}} Fotoğraf", "{{filmAdi}}", "{{teslimGun}} Gün"],
      description:
        "Seçimlerden sonra en geç {{teslimGun}} günde {{shootMekan}} çekilen fotoğraflardan {{fotoSayisi}} fotoğraf ve {{shootMekan}} çekilen videolardan {{filmSure}} arasında değişen bir {{filmAdi}} düzenlenir.",
    },
    printing: {
      pills: ["Albüm", "3 Çerçeve", "30 Gün"],
      description:
        "30x60x2,5 cm albüm (7 sayfa, 5 fotoğraf, mat) ve 25x25x3 cm 3 adet çerçeve 30 gün içinde ücretsiz kargo ile adresinize gönderilir.",
    },
    noPrintingText: "Baskı yok",
  };
}

function parseTemplateSection(value: unknown): PostShootTemplateSection {
  if (!value || typeof value !== "object") {
    return { pills: [], description: "" };
  }
  const obj = value as Partial<PostShootTemplateSection>;
  return {
    pills: Array.isArray(obj.pills)
      ? obj.pills.filter((pill): pill is string => typeof pill === "string")
      : [],
    description:
      typeof obj.description === "string" ? obj.description : "",
  };
}

function parseVariableDefinition(
  value: unknown,
): PostShootVariableDefinition | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Partial<PostShootVariableDefinition>;
  if (typeof obj.key !== "string" || !obj.key.trim()) return null;
  const mergeStrategy = obj.mergeStrategy;
  if (
    mergeStrategy !== "join" &&
    mergeStrategy !== "sum" &&
    mergeStrategy !== "max" &&
    mergeStrategy !== "first" &&
    mergeStrategy !== "unique_list"
  ) {
    return null;
  }
  return {
    key: obj.key.trim(),
    label: typeof obj.label === "string" ? obj.label : obj.key.trim(),
    mergeStrategy,
    hint: typeof obj.hint === "string" ? obj.hint : undefined,
  };
}

export function parsePostShootTemplateSettings(
  value: unknown,
): PostShootTemplateSettingsData {
  const defaults = defaultPostShootTemplateSettings();
  if (!value || typeof value !== "object") {
    return defaults;
  }

  const data = value as Partial<PostShootTemplateSettingsData>;
  const variables = Array.isArray(data.variables)
    ? data.variables
        .map(parseVariableDefinition)
        .filter((entry): entry is PostShootVariableDefinition => entry !== null)
    : defaults.variables;

  return {
    variables: variables.length > 0 ? variables : defaults.variables,
    digital: parseTemplateSection(data.digital),
    editing: parseTemplateSection(data.editing),
    printing: parseTemplateSection(data.printing),
    noPrintingText:
      typeof data.noPrintingText === "string" && data.noPrintingText.trim()
        ? data.noPrintingText.trim()
        : defaults.noPrintingText,
  };
}

export function getDefaultPostShootTokensForCategory(
  slug: string,
  scheduleType?: "outdoor" | "indoor",
): Record<string, string> {
  const outdoor = scheduleType === "outdoor" || slug === "dis-cekim";
  if (outdoor) {
    return {
      shootMekan: "dış çekimde",
      filmAdi: "dış çekim filmi",
      fotoSayisi: "18",
      filmSure: "30-60 saniye",
      teslimGun: "70",
    };
  }
  return {
    shootMekan: "salonda",
    filmAdi: "salon filmi",
    fotoSayisi: "18",
    teslimGun: "70",
    filmSure: "30-60 saniye",
  };
}
