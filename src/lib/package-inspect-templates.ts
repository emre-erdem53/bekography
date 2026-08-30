import type { PackageDetailSection } from "@/lib/package-seed-data";

const REZERVASYON = {
  title: "REZERVASYON",
  tags: ["Whatsapp", "Onaylı"],
  body: "Talebinizi oluşturduğunuzda size en kısa sürede dönüş sağlıyoruz. Telefonla veya yüz yüze tüm detayları görüştükten sonra gelin ve damadın olduğu bir Whatsapp grubu açıyoruz. Anlaşmayla ilgili tüm detayları grupta paylaşıyoruz ve onayınızı alarak rezervasyonu gerçekleştiriyoruz. Rezervasyondan sonra süreç boyunca WhatsApp grubundan iletişim kurmaya devam ediyoruz.",
};

const DIJITAL_TESLIMAT = {
  title: "DİJİTAL TESLİMAT",
  tags: [
    "En Fazla 7 Günde Hazır",
    "Tüm Çekilenler",
    "Diskinizle Teslim Edilir",
    "30 Günde Almalısınız",
  ],
  body: "Çekimden sonraki 7 gün içinde tüm çekilen orijinal işlenmemiş görüntüler dijital olarak teslimata hazır olur. Bir indirme bağlantısıyla da görüntüleri teslim alabilirsiniz ancak dosya boyutu çok yüksek olduğundan harici diskinizle teslim almanızı öneririz. Harici diskinizle almak isterseniz diskinizi çekim günü bize teslim etmeniz daha sağlıklı olacaktır. Çekimden sonraki 30 gün içinde çift tarafından tüm dijitaller teslim alınmalıdır.",
};

const DUZELTME_TALEPLERI = {
  title: "DÜZELTME TALEPLERİ",
  tags: ["7 Günde Bildir", "Bekography Onayıyla Yapılır"],
  body: "Film üzerinde beğenmediğiniz sahneleri, renkleri veya parlaklık ayarlarını bizim de onayımızla yeniden düzenleyebiliyoruz ancak her isteğin yapılacağının garantisini veremiyoruz.",
};

const BASKI = {
  title: "BASKI",
  tags: ["Albüm", "3 Çerçeve", "30 Gün"],
  body: "30x60x2,5 cm albüm (7 sayfa, 5 fotoğraf, mat) ve 25x25x3 cm 3 adet çerçeve 30 gün içinde ücretsiz kargo ile adresinize gönderilir.",
};

type PackageInspectContext = {
  slug: string;
  categoryTitle: string;
  optionLabel: string;
  scheduleType?: "outdoor" | "indoor";
};

function includesPhoto(optionLabel: string): boolean {
  const label = optionLabel.toLocaleLowerCase("tr");
  return label.includes("fotoğraf") || label.includes("fotograf");
}

function includesVideo(optionLabel: string): boolean {
  const label = optionLabel.toLocaleLowerCase("tr");
  return (
    label.includes("video") ||
    label.includes("film") ||
    label.includes("hikaye")
  );
}

function isOutdoor(ctx: PackageInspectContext): boolean {
  return ctx.scheduleType === "outdoor";
}

function createSection(
  title: string,
  body: string,
  tags: string[],
  sortOrder: number,
): PackageDetailSection {
  return {
    id: crypto.randomUUID(),
    title,
    body,
    tags,
    sortOrder,
  };
}

function salonBeforeShootBody(ctx: PackageInspectContext): string {
  const event = ctx.categoryTitle.toLocaleLowerCase("tr");
  return `${ctx.categoryTitle}e en az birkaç gün kala özel istekleri, ${event === "düğün salon" ? "düğün salonunun" : "mekanın"} fiziki şartlarını ve akış planımızı teyid ediyoruz. Karşılıklı gerekli hatırlatma ve önerilerde bulunarak ${event}e hazırlanıyoruz.`;
}

function salonShootBodyVideo(ctx: PackageInspectContext): string {
  const event = ctx.categoryTitle;
  return `${event}den en az yarım saat önce salonda hazır oluyoruz. ${event}ün akışını ve özel istekleri teyid ediyoruz. ${event}ün gelin ve damat girişini, ilk dansı, varsa nikahı ve eğlence anlarını farklı açılardan kayıt altına alıyoruz.

Ekstra olarak dahil edilmediği sürece takı veya konuk masalarını birebir kayda almıyoruz.

Başlangıç saatinden itibaren 3 saat boyunca sizinle oluyoruz. Vedalaşmadan önce özel bir isteğiniz varsa yarım saat daha esneklik sağlıyoruz.`;
}

function salonShootBodyPhotoVideo(ctx: PackageInspectContext): string {
  const event = ctx.categoryTitle;
  return `${event}den en az yarım saat önce salonda hazır oluyoruz. ${event}ün akışını ve özel istekleri teyid ediyoruz. ${event}ün gelin ve damat girişini, ilk dansı, varsa nikahı ve eğlence anlarını farklı açılardan kayıt altına alıyoruz.

Ekstra olarak dahil edilmediği sürece takı veya konuk masalarını birebir kayda almıyoruz. Aile fotoğraflarımızı terleyebileceğimiz için, kıyafetlerimiz bozulabileceği için ve görsel olarak hoş olmayabileceğimiz için ${event.toLocaleLowerCase("tr")} sonuna bırakmıyoruz.

Başlangıç saatinden itibaren 3 saat boyunca sizinle oluyoruz. Vedalaşmadan önce özel bir isteğiniz varsa yarım saat daha esneklik sağlıyoruz.`;
}

function salonSelectionBody(ctx: PackageInspectContext): string {
  const eventFilm = `${ctx.categoryTitle.toLocaleLowerCase("tr")} filminde`;
  if (includesPhoto(ctx.optionLabel)) {
    return `Çekimden sonraki 30 gün içinde düzenlenecek ${eventFilm} kullanılmasını istediğiniz müziği gruba gönderiyorsunuz ya da seçimi bize bırakabiliyorsunuz. Fotoğraf çekimi dahilse seçeceğiniz fotoğrafları da bu süreçte birlikte netleştiriyoruz.`;
  }
  return `Çekimden sonraki 30 gün içinde düzenlenecek ${eventFilm} kullanılmasını istediğiniz müziği gruba gönderiyorsunuz ya da seçimi bize bırakabiliyorsunuz.`;
}

function salonEditingBody(ctx: PackageInspectContext): string {
  const event = ctx.categoryTitle.toLocaleLowerCase("tr");
  if (includesPhoto(ctx.optionLabel)) {
    return `Seçim konusu netleştikten sonra en geç 70 gün içinde ${event}de çektiğimiz videolardan 30-60 saniye arasında değişen bir ${event} filmini ve anlaşmaya dahil fotoğraf adedini düzenleyerek yüksek çözünürlükte gruba gönderiyoruz.`;
  }
  return `Seçim konusu netleştikten sonra en geç 70 gün içinde ${event}de çektiğimiz videolardan 30-60 saniye arasında değişen bir ${event} filmini düzenliyoruz ve filminizi yüksek çözünürlükte gruba gönderiyoruz.`;
}

function outdoorBeforeShootBody(): string {
  return "Çekimden en az birkaç gün kala rota, mekan, saat ve özel istekleri teyid ediyoruz. Hava koşullarına göre alternatif planlar öneriyor ve çekim gününe hazırlanıyoruz.";
}

function outdoorShootBody(ctx: PackageInspectContext): string {
  if (includesPhoto(ctx.optionLabel) && includesVideo(ctx.optionLabel)) {
    return "Çekimi 10.00-14.00 veya 13.00-17.00 saatleri arasında gerçekleştiriyoruz. Belirlenen sürede bir rota üzerindeki farklı mekanlarda fotoğraf ve video çekimi yapıyoruz. Otel çekimi istenirse otel ile anlaşma sağlayabiliyor ve çekim esnasında rahat hissetmenizi desteklemek adına yönlendirme sağlıyoruz.";
  }
  if (includesPhoto(ctx.optionLabel)) {
    return "Çekimi 10.00-14.00 veya 13.00-17.00 saatleri arasında gerçekleştiriyoruz. Belirlenen sürede bir rota üzerindeki farklı mekanlarda fotoğraf çekimi yapıyoruz. Otel çekimi istenirse otel ile anlaşma sağlayabiliyor ve çekim esnasında yönlendirme sağlıyoruz.";
  }
  return "Çekimi 10.00-14.00 veya 13.00-17.00 saatleri arasında gerçekleştiriyoruz. Belirlenen sürede bir rota üzerindeki farklı mekanlarda video çekimi yapıyoruz. Otel çekimi istenirse otel ile anlaşma sağlayabiliyor ve çekim esnasında yönlendirme sağlıyoruz.";
}

function outdoorSelectionBody(ctx: PackageInspectContext): string {
  if (includesPhoto(ctx.optionLabel)) {
    return "Çekimden sonraki 30 gün içinde dış çekim filminde kullanılmasını istediğiniz müziği gruba gönderiyorsunuz ya da seçimi bize bırakabiliyorsunuz. Albüm ve çerçeve için fotoğraf seçimlerinizi de bu süreçte birlikte netleştiriyoruz.";
  }
  return "Çekimden sonraki 30 gün içinde dış çekim filminde kullanılmasını istediğiniz müziği gruba gönderiyorsunuz ya da seçimi bize bırakabiliyorsunuz.";
}

function outdoorEditingBody(ctx: PackageInspectContext): string {
  if (includesPhoto(ctx.optionLabel)) {
    return "Seçimlerden sonra en geç 70 günde dış çekimde çekilen fotoğraflardan 18 fotoğraf ve dış çekim videolarından 30-60 saniye arasında değişen bir dış çekim filmi düzenlenir.";
  }
  return "Seçimlerden sonra en geç 70 günde dış çekim videolarından 30-60 saniye arasında değişen bir dış çekim filmi düzenlenir.";
}

function gelinCikisiBeforeShootBody(): string {
  return "Gelin çıkışından en az birkaç gün kala aile buluşması, kurdele ve vedalaşma akışını teyid ediyoruz. Özel istekleri not alıyor ve çekim gününe hazırlanıyoruz.";
}

function gelinCikisiShootBody(ctx: PackageInspectContext): string {
  if (includesPhoto(ctx.optionLabel)) {
    return "Gelin çıkışının tüm detaylarında size rehberlik ederek süreci yönetiyoruz. Damat gelmeden önce gelinin ailesiyle vedalaşma, kurdele bağlama ve aile detaylarını çekiyoruz. Ardından damadın geliş karşılama anı ve çıkış anını kayıt altına alıyoruz. Anlaşmaya dahil fotoğraf çekimi varsa bu anları fotoğrafla da belgeliyoruz.";
  }
  return "Gelin çıkışının tüm detaylarında size rehberlik ederek süreci yönetiyoruz. Damat gelmeden önce gelinin ailesiyle vedalaşma, kurdele bağlama ve aile detaylarını kayıt altına alıyoruz. Ardından damadın geliş karşılama anı ve çıkış anını video olarak kaydediyoruz.";
}

function gelinCikisiEditingBody(ctx: PackageInspectContext): string {
  if (includesPhoto(ctx.optionLabel)) {
    return "Seçim konusu netleştikten sonra en geç 70 gün içinde gelin çıkışında çekilen videolardan kısa bir çıkış filmini ve anlaşmaya dahil fotoğrafları düzenleyerek yüksek çözünürlükte gruba gönderiyoruz.";
  }
  return "Seçim konusu netleştikten sonra en geç 70 gün içinde gelin çıkışında çekilen videolardan kısa bir çıkış filmini düzenliyoruz ve yüksek çözünürlükte gruba gönderiyoruz.";
}

function kuaforBeforeShootBody(): string {
  return "Kuaför randevusundan en az birkaç gün kala hazırlık saati, mekan ve özel istekleri teyid ediyoruz. Çekim akışını birlikte netleştiriyoruz.";
}

function kuaforShootBody(ctx: PackageInspectContext): string {
  if (includesPhoto(ctx.optionLabel)) {
    return "Gelinin kuaförde çiftin hazırlığının son aşamasını video çekimiyle ve anlaşmaya dahilinde fotoğraf çekimiyle kayıt altına alıyoruz.";
  }
  return "Gelinin kuaförde çiftin hazırlığının son aşamasını video çekimiyle kayıt altına alıyoruz.";
}

function kuaforEditingBody(ctx: PackageInspectContext): string {
  if (includesPhoto(ctx.optionLabel)) {
    return "Seçim konusu netleştikten sonra en geç 70 gün içinde kuaför çekiminden hazırlanan kısa filmi ve anlaşmaya dahil fotoğrafları düzenleyerek yüksek çözünürlükte gruba gönderiyoruz.";
  }
  return "Seçim konusu netleştikten sonra en geç 70 gün içinde kuaför çekiminden hazırlanan kısa filmi düzenliyoruz ve yüksek çözünürlükte gruba gönderiyoruz.";
}

function fullHikayeBeforeShootBody(): string {
  return "Hazırlık, dış çekim, gelin çıkışı ve düğün gününüzün tamamı için tüm aşamaları birlikte planlıyoruz. Her adımın tarihini, mekanını ve özel isteklerinizi teyid ediyoruz.";
}

function fullHikayeShootBody(): string {
  return "Hazırlık, dış çekim, gelin çıkışı ve düğün gününüzün tamamını tek pakette, kesintisiz bir hikaye olarak kayıt altına alıyoruz. Her aşamada size rehberlik ederek tüm süreci planlıyor ve yönetiyoruz.";
}

function fullHikayeEditingBody(): string {
  return "Seçimler tamamlandıktan sonra en geç 70 gün içinde tüm çekimlerden karma film ve uzun metraj düğün filminizi hazırlıyor, albüm ve çerçeve tasarımlarınızı tamamlayıp adresinize gönderiyoruz.";
}

function buildSalonSections(ctx: PackageInspectContext): PackageDetailSection[] {
  const shootBody = includesPhoto(ctx.optionLabel)
    ? salonShootBodyPhotoVideo(ctx)
    : salonShootBodyVideo(ctx);

  return [
    createSection(REZERVASYON.title, REZERVASYON.body, REZERVASYON.tags, 0),
    createSection(
      "ÇEKİM ÖNCESİ",
      salonBeforeShootBody(ctx),
      ["Değerlendirme", "Öneriler", "İstekler"],
      1,
    ),
    createSection(
      "ÇEKİM",
      shootBody,
      includesPhoto(ctx.optionLabel)
        ? ["Fotoğraf", "Video", "3 saat", "+Süre Eklenebilir"]
        : ["Video", "3 saat", "+Süre Eklenebilir"],
      2,
    ),
    createSection(
      DIJITAL_TESLIMAT.title,
      DIJITAL_TESLIMAT.body,
      DIJITAL_TESLIMAT.tags,
      3,
    ),
    createSection(
      "SEÇİM",
      salonSelectionBody(ctx),
      ["30 Günde", "1 Müzik", "Whatsapp'dan Gönder"],
      4,
    ),
    createSection(
      "DÜZENLEME",
      salonEditingBody(ctx),
      ["En fazla 70 gün", `${ctx.categoryTitle} Filmi`],
      5,
    ),
    createSection(
      DUZELTME_TALEPLERI.title,
      DUZELTME_TALEPLERI.body,
      DUZELTME_TALEPLERI.tags,
      6,
    ),
  ];
}

function buildOutdoorSections(ctx: PackageInspectContext): PackageDetailSection[] {
  const sections = [
    createSection(REZERVASYON.title, REZERVASYON.body, REZERVASYON.tags, 0),
    createSection(
      "ÇEKİM ÖNCESİ",
      outdoorBeforeShootBody(),
      ["Değerlendirme", "Öneriler", "Rota"],
      1,
    ),
    createSection(
      "ÇEKİM",
      outdoorShootBody(ctx),
      includesPhoto(ctx.optionLabel)
        ? ["Fotoğraf", "Video", "4 Saat"]
        : includesVideo(ctx.optionLabel)
          ? ["Video", "4 Saat"]
          : ["Fotoğraf", "4 Saat"],
      2,
    ),
    createSection(
      DIJITAL_TESLIMAT.title,
      DIJITAL_TESLIMAT.body,
      DIJITAL_TESLIMAT.tags,
      3,
    ),
    createSection(
      "SEÇİM",
      outdoorSelectionBody(ctx),
      ["30 Günde", "1 Müzik", "Whatsapp'dan Gönder"],
      4,
    ),
    createSection(
      "DÜZENLEME",
      outdoorEditingBody(ctx),
      includesPhoto(ctx.optionLabel)
        ? ["18 Fotoğraf", "Dış Çekim Filmi", "70 Gün"]
        : ["Dış Çekim Filmi", "70 Gün"],
      5,
    ),
    createSection(
      DUZELTME_TALEPLERI.title,
      DUZELTME_TALEPLERI.body,
      DUZELTME_TALEPLERI.tags,
      6,
    ),
  ];

  if (includesPhoto(ctx.optionLabel)) {
    sections.push(
      createSection(BASKI.title, BASKI.body, BASKI.tags, 7),
    );
  }

  return sections;
}

function buildGelinCikisiSections(ctx: PackageInspectContext): PackageDetailSection[] {
  return [
    createSection(REZERVASYON.title, REZERVASYON.body, REZERVASYON.tags, 0),
    createSection(
      "ÇEKİM ÖNCESİ",
      gelinCikisiBeforeShootBody(),
      ["Değerlendirme", "Öneriler", "İstekler"],
      1,
    ),
    createSection(
      "ÇEKİM",
      gelinCikisiShootBody(ctx),
      includesPhoto(ctx.optionLabel)
        ? ["Fotoğraf", "Video"]
        : ["Video"],
      2,
    ),
    createSection(
      DIJITAL_TESLIMAT.title,
      DIJITAL_TESLIMAT.body,
      DIJITAL_TESLIMAT.tags,
      3,
    ),
    createSection(
      "SEÇİM",
      salonSelectionBody(ctx),
      ["30 Günde", "1 Müzik", "Whatsapp'dan Gönder"],
      4,
    ),
    createSection(
      "DÜZENLEME",
      gelinCikisiEditingBody(ctx),
      ["En fazla 70 gün", "Çıkış Filmi"],
      5,
    ),
    createSection(
      DUZELTME_TALEPLERI.title,
      DUZELTME_TALEPLERI.body,
      DUZELTME_TALEPLERI.tags,
      6,
    ),
  ];
}

function buildKuaforSections(ctx: PackageInspectContext): PackageDetailSection[] {
  return [
    createSection(REZERVASYON.title, REZERVASYON.body, REZERVASYON.tags, 0),
    createSection(
      "ÇEKİM ÖNCESİ",
      kuaforBeforeShootBody(),
      ["Değerlendirme", "Öneriler", "İstekler"],
      1,
    ),
    createSection(
      "ÇEKİM",
      kuaforShootBody(ctx),
      includesPhoto(ctx.optionLabel)
        ? ["Fotoğraf", "Video"]
        : ["Video"],
      2,
    ),
    createSection(
      DIJITAL_TESLIMAT.title,
      DIJITAL_TESLIMAT.body,
      DIJITAL_TESLIMAT.tags,
      3,
    ),
    createSection(
      "SEÇİM",
      salonSelectionBody(ctx),
      ["30 Günde", "1 Müzik", "Whatsapp'dan Gönder"],
      4,
    ),
    createSection(
      "DÜZENLEME",
      kuaforEditingBody(ctx),
      ["En fazla 70 gün", "Kuaför Filmi"],
      5,
    ),
    createSection(
      DUZELTME_TALEPLERI.title,
      DUZELTME_TALEPLERI.body,
      DUZELTME_TALEPLERI.tags,
      6,
    ),
  ];
}

function buildFullHikayeSections(ctx: PackageInspectContext): PackageDetailSection[] {
  return [
    createSection(REZERVASYON.title, REZERVASYON.body, REZERVASYON.tags, 0),
    createSection(
      "ÇEKİM ÖNCESİ",
      fullHikayeBeforeShootBody(),
      ["Değerlendirme", "Öneriler", "Planlama"],
      1,
    ),
    createSection(
      "ÇEKİM",
      fullHikayeShootBody(),
      ["Fotoğraf", "Video", "Tüm Gün"],
      2,
    ),
    createSection(
      DIJITAL_TESLIMAT.title,
      DIJITAL_TESLIMAT.body,
      DIJITAL_TESLIMAT.tags,
      3,
    ),
    createSection(
      "SEÇİM",
      "Çekimden sonraki 30 gün içinde düzenlenecek filmlerde kullanılmasını istediğiniz müziği gruba gönderiyorsunuz ya da seçimi bize bırakabiliyorsunuz. Albüm ve çerçeve için fotoğraf seçimlerinizi de bu süreçte birlikte netleştiriyoruz.",
      ["30 Günde", "1 Müzik", "Whatsapp'dan Gönder"],
      4,
    ),
    createSection(
      "DÜZENLEME",
      fullHikayeEditingBody(),
      ["En fazla 70 gün", "Karma Film", "Uzun Metraj"],
      5,
    ),
    createSection(
      DUZELTME_TALEPLERI.title,
      DUZELTME_TALEPLERI.body,
      DUZELTME_TALEPLERI.tags,
      6,
    ),
    createSection(BASKI.title, BASKI.body, BASKI.tags, 7),
  ];
}

const SALON_SLUGS = new Set([
  "dugun",
  "dugun-salon",
  "kina",
  "kina-salon",
  "nisan",
  "nisan-salon",
  "soz",
  "soz-isteme",
  "soz-nisan-salon",
]);

/** Hizmet alanı slug'ı ve çekim türüne göre tam Açıklama bölümlerini üretir. */
export function buildPackageInspectSections(
  ctx: PackageInspectContext,
): PackageDetailSection[] {
  if (isOutdoor(ctx)) {
    return buildOutdoorSections(ctx);
  }
  if (ctx.slug === "gelin-cikisi") {
    return buildGelinCikisiSections(ctx);
  }
  if (ctx.slug === "hazirlik-bride" || ctx.slug === "kuafor") {
    return buildKuaforSections(ctx);
  }
  if (ctx.slug === "full-hikaye" || ctx.slug === "full-dugun-gunu") {
    return buildFullHikayeSections(ctx);
  }
  if (SALON_SLUGS.has(ctx.slug)) {
    return buildSalonSections(ctx);
  }
  return buildSalonSections(ctx);
}

export function hasRichInspectSections(sections: PackageDetailSection[]): boolean {
  if (sections.length < 5) return false;
  const titles = sections.map((section) =>
    section.title.trim().toLocaleUpperCase("tr"),
  );
  return (
    titles.includes("REZERVASYON") &&
    titles.includes("ÇEKİM") &&
    titles.includes("DİJİTAL TESLİMAT")
  );
}

/** Çekim türünde zengin içerik yoksa şablondan üretir. */
export function ensureShootTypeInspectSections(
  existing: PackageDetailSection[],
  ctx: PackageInspectContext,
): PackageDetailSection[] {
  if (hasRichInspectSections(existing)) {
    return [...existing].sort((a, b) => a.sortOrder - b.sortOrder);
  }
  return buildPackageInspectSections(ctx);
}
