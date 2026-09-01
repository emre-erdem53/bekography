import type { PackageDetailSection } from "@/lib/package-seed-data";

function sec(
  key: string,
  title: string,
  body: string,
  tags: string[],
  sortOrder: number,
): PackageDetailSection {
  return { id: `catalog-${key}-${sortOrder}`, title, body, tags, sortOrder };
}

const REZERVASYON_TAGS = ["Whatsapp", "Onaylı"];
const REZERVASYON_BODY =
  "Anlaşmayla ilgili detaylar telefonla veya yüz yüze görüşüldükten sonra çiftin dahil olduğu bir WhatsApp grubu açılır. Çiftin onayı alınarak rezervasyon kesinleştirilir.";

const CEKIM_ONCESI_TAGS = ["Değerlendirme", "Öneriler", "İstekler"];
const CEKIM_ONCESI_BODY =
  "En geç çekimden bir gün önce plan teyit edilir, çiftin istekleri dinlenir ve profesyonel öneriler sunulur.";

const BASKI_TAGS = [
  "1 Albüm (30x60 cm)",
  "3 Çerçeve (25x25 cm)",
  "Ücretsiz Kargo",
];
const BASKI_BODY =
  "1 adet 30x60x2,5 cm ölçülerinde, 7 yapraklı, 15 fotoğraflı, tam fotoğraf kaplı ve mat baskılı albüm hazırlanır. 3 adet 25x25x3 cm ölçülerinde, mat baskılı, camsız, plastik malzemeli (tercihen siyah veya beyaz) çerçeve üretilir. Ürünler 30 gün içinde çiftin adresine ücretsiz olarak kargolanır.";

const OUTDOOR_PHOTO_DIJITAL_TAGS = [
  "Orijinal Fotoğraflar",
  "3 Günde Hazır",
  "İndirme Bağlantısı",
];
const OUTDOOR_PHOTO_DIJITAL_BODY =
  "Çekimden sonraki 3 gün içinde tüm orijinal fotoğraflar dijital olarak teslimata hazır hale getirilir. Veriler, indirme bağlantısı paylaşılarak veya çiftin getirdiği harici diske kopyalanarak teslim edilir.";

const OUTDOOR_COMBO_DIJITAL_TAGS = [
  "Orijinal Fotoğraflar",
  "Ham Videolar",
  "Uzun Metrajlı Video",
  "3 Günde Hazır",
  "İndirme Bağlantısı",
];
const OUTDOOR_COMBO_DIJITAL_BODY =
  "Çekimden sonraki 3 gün içinde tüm orijinal fotoğraf ve ham videolar ile ayrıca izleyebilmeniz için hazırlanan uzun metrajlı renklendirilmiş video dijital olarak teslimata hazır hale getirilir. Veriler, indirme bağlantısı paylaşılarak veya çiftin getirdiği harici diske kopyalanarak teslim edilir.";

const OUTDOOR_PHOTO_SECIM_TAGS = ["18 Fotoğraf", "Whatsapp’dan Gönderim"];
const OUTDOOR_PHOTO_SECIM_BODY =
  "Çekimden sonraki 30 gün içinde albüm ve çerçeve tasarımlarında kullanılacak fotoğraflar WhatsApp grubu üzerinden çift tarafından iletilir. İstenildiği takdirde seçimler tamamen Bekography’e bırakılabilir.";

const OUTDOOR_COMBO_SECIM_TAGS = [
  "1 Müzik",
  "18 Fotoğraf",
  "Whatsapp’dan Gönderim",
];
const OUTDOOR_COMBO_SECIM_BODY =
  "Çekimden sonraki 30 gün içinde albüm ve çerçeve tasarımlarında kullanılacak fotoğraflar ve Video Filmde kullanılması istenen müzik WhatsApp grubu üzerinden çift tarafından iletilir. İstenildiği takdirde seçimler tamamen Bekography’e bırakılabilir.";

const OUTDOOR_PHOTO_DUZENLEME_TAGS = [
  "18 Fotoğraf",
  "1 Albüm Tasarımı",
  "3 Çerçeve Tasarımı",
];
const OUTDOOR_PHOTO_DUZENLEME_BODY =
  "Seçim süreci tamamlandıktan sonra en geç 70 gün içinde seçilen fotoğraflar düzenlenir, albüm ve çerçeve tasarımları tamamlanır. Hazırlanan tasarımlar ve yüksek çözünürlüklü düzenlenmiş fotoğraflar WhatsApp grubu üzerinden paylaşılır.";

const OUTDOOR_ZIRVE_PHOTO_DUZENLEME_BODY =
  "Seçim süreci tamamlandıktan sonra en geç 70 gün içinde seçilen fotoğraflar düzenlenir, albüm ve çerçeve tasarımları tamamlanır. Düzenlenen çalışma ve yüksek çözünürlüklü düzenlenmiş fotoğraflar WhatsApp grubu üzerinden paylaşılır.";

const OUTDOOR_COMBO_DUZENLEME_TAGS = [
  "Video Film",
  "18 Fotoğraf",
  "1 Albüm Tasarımı",
  "3 Çerçeve Tasarımı",
];
const OUTDOOR_COMBO_DUZENLEME_BODY =
  "Seçim süreci tamamlandıktan sonra en geç 70 gün içinde seçilen fotoğraflar düzenlenir, albüm ve çerçeve tasarımları tamamlanır. Ayrıca 30 ile 60 saniye arasında değişen Video Film düzenlenir. Düzenlenen çalışma ve yüksek çözünürlüklü düzenlenmiş fotoğraflar WhatsApp grubu üzerinden paylaşılır.";

const VIDEO_DIJITAL_TAGS = [
  "Ham Videolar",
  "Uzun Metrajlı Video",
  "3 Günde Hazır",
  "İndirme Bağlantısı",
];
const VIDEO_DIJITAL_BODY =
  "Çekimden sonraki 3 gün içinde tüm ham videolar ile ayrıca izleyebilmeniz için hazırlanan uzun metrajlı renklendirilmiş video dijital olarak teslimata hazır hale getirilir. Veriler, indirme bağlantısı paylaşılarak veya çiftin getirdiği harici diske kopyalanarak teslim edilir.";

const VIDEO_DIJITAL_BODY_SHORT =
  "Çekimden sonraki 3 gün içinde ham videolar ile ayrıca izleyebilmeniz için hazırlanan uzun metrajlı renklendirilmiş video dijital olarak teslimata hazır hale getirilir. Veriler, indirme bağlantısı paylaşılarak veya çiftin getirdiği harici diske kopyalanarak teslim edilir.";

const COMBO_DIJITAL_TAGS = [
  "Orijinal Fotoğraflar",
  "Ham Videolar",
  "Uzun Metrajlı Video",
  "3 Günde Hazır",
  "İndirme Bağlantısı",
];
const COMBO_DIJITAL_BODY = OUTDOOR_COMBO_DIJITAL_BODY;

const SALON_SECIM_TAGS = ["1 Müzik", "Whatsapp’dan Gönderim"];
const SALON_SECIM_BODY =
  "Çekimden sonraki 30 gün içinde Video Filmde kullanılması istenen müzik WhatsApp grubu üzerinden çift tarafından iletilir. İstenildiği takdirde seçimler tamamen Bekography’e bırakılabilir.";

const SALON_DUZENLEME_TAGS = ["Video Film"];
const SALON_DUZENLEME_BODY =
  "Seçim süreci tamamlandıktan sonra en geç 70 gün içinde 30 ile 60 saniye arasında değişen Video Film düzenlenir. Düzenlenen film WhatsApp grubu üzerinden paylaşılır.";

function sharedStart(key: string): PackageDetailSection[] {
  return [
    sec(key, "Rezervasyon", REZERVASYON_BODY, REZERVASYON_TAGS, 0),
    sec(key, "Çekim Öncesi", CEKIM_ONCESI_BODY, CEKIM_ONCESI_TAGS, 1),
  ];
}

function outdoorPhotoFlow(
  key: string,
  cekimTags: string[],
  cekimBody: string,
  duzenlemeBody: string = OUTDOOR_PHOTO_DUZENLEME_BODY,
): PackageDetailSection[] {
  return [
    ...sharedStart(key),
    sec(key, "Çekim", cekimBody, cekimTags, 2),
    sec(
      key,
      "Dijital Teslimat",
      OUTDOOR_PHOTO_DIJITAL_BODY,
      OUTDOOR_PHOTO_DIJITAL_TAGS,
      3,
    ),
    sec(key, "Seçim", OUTDOOR_PHOTO_SECIM_BODY, OUTDOOR_PHOTO_SECIM_TAGS, 4),
    sec(key, "Düzenleme", duzenlemeBody, OUTDOOR_PHOTO_DUZENLEME_TAGS, 5),
    sec(key, "Baskı", BASKI_BODY, BASKI_TAGS, 6),
  ];
}

function outdoorComboFlow(
  key: string,
  cekimTags: string[],
  cekimBody: string,
  secimBody: string = OUTDOOR_COMBO_SECIM_BODY,
): PackageDetailSection[] {
  return [
    ...sharedStart(key),
    sec(key, "Çekim", cekimBody, cekimTags, 2),
    sec(
      key,
      "Dijital Teslimat",
      OUTDOOR_COMBO_DIJITAL_BODY,
      OUTDOOR_COMBO_DIJITAL_TAGS,
      3,
    ),
    sec(key, "Seçim", secimBody, OUTDOOR_COMBO_SECIM_TAGS, 4),
    sec(
      key,
      "Düzenleme",
      OUTDOOR_COMBO_DUZENLEME_BODY,
      OUTDOOR_COMBO_DUZENLEME_TAGS,
      5,
    ),
    sec(key, "Baskı", BASKI_BODY, BASKI_TAGS, 6),
  ];
}

function salonVideoFlow(
  key: string,
  cekimTags: string[],
  cekimBody: string,
  dijitalBody: string = VIDEO_DIJITAL_BODY,
): PackageDetailSection[] {
  return [
    ...sharedStart(key),
    sec(key, "Çekim", cekimBody, cekimTags, 2),
    sec(key, "Dijital Teslimat", dijitalBody, VIDEO_DIJITAL_TAGS, 3),
    sec(key, "Seçim", SALON_SECIM_BODY, SALON_SECIM_TAGS, 4),
    sec(key, "Düzenleme", SALON_DUZENLEME_BODY, SALON_DUZENLEME_TAGS, 5),
  ];
}

function salonComboFlow(
  key: string,
  cekimTags: string[],
  cekimBody: string,
): PackageDetailSection[] {
  return [
    ...sharedStart(key),
    sec(key, "Çekim", cekimBody, cekimTags, 2),
    sec(key, "Dijital Teslimat", COMBO_DIJITAL_BODY, COMBO_DIJITAL_TAGS, 3),
    sec(key, "Seçim", SALON_SECIM_BODY, SALON_SECIM_TAGS, 4),
    sec(key, "Düzenleme", SALON_DUZENLEME_BODY, SALON_DUZENLEME_TAGS, 5),
  ];
}

function companionVideoFlow(
  key: string,
  cekimTags: string[],
  cekimBody: string,
  duzenlemeTags: string[],
  duzenlemeBody: string,
  includePhotoDigital: boolean,
): PackageDetailSection[] {
  const dijitalTags = includePhotoDigital
    ? COMBO_DIJITAL_TAGS
    : VIDEO_DIJITAL_TAGS;
  const dijitalBody = includePhotoDigital
    ? COMBO_DIJITAL_BODY
    : VIDEO_DIJITAL_BODY;
  return [
    ...sharedStart(key),
    sec(key, "Çekim", cekimBody, cekimTags, 2),
    sec(key, "Dijital Teslimat", dijitalBody, dijitalTags, 3),
    sec(key, "Düzenleme", duzenlemeBody, duzenlemeTags, 4),
  ];
}

const HAZIRLIK_CEKIM_BODY =
  "Belirlenen buluşma saatinde gelin kuaföründe buluşulur, gelin ve damat hazırlığının son aşamaları kayıt altına alınır. Talep edilmesi durumunda arkadaşların eşlik ettiği anlar çekilir ve çiftin birbirini ilk gördüğü o özel an ölümsüzleştirilir.";

const HAZIRLIK_DUZENLEME_TAGS = [
  "Dış çekim veya düğün salon klibine ekleme.",
];
const HAZIRLIK_DUZENLEME_BODY =
  "Hazırlık bride çekimi hangi pakete ek olarak alındıysa çekilen videolar ek olarak alındığı paketin klibinde kullanılır. Ayrıca bağımsız bir kuaför hazırlık klibi anlaşma kapsamında değildir.";

const HAZIRLIK_VIDEO_DIJITAL_BODY =
  "Çekimden sonraki 3 gün içinde tüm ham videolar ile ayrıca izleyebilmeniz için hazırlanan uzun metrajlı renklendirilmiş video dijital olarak teslimata hazır hale getirilir. Veriler, indirme bağlantısı paylaşılarak veya çiftin getirdiği harici diske kopyalanarak teslim edilir.";

const HAZIRLIK_VIDEO_DIJITAL_TAGS = [
  "Tüm Çekilenler",
  "3 Günde Hazır",
  "İndirme Bağlantısı",
];

const GELIN_DUZENLEME_TAGS = [
  "Dış çekim veya düğün salon klibine ekleme.",
];
const GELIN_DUZENLEME_BODY =
  "Gelin çıkış çekimi hangi pakete ek olarak alındıysa çekilen videolar ek olarak alındığı paketin klibinde kullanılır. Ayrıca bağımsız bir gelin çıkış klibi anlaşma kapsamında değildir.";

const GELIN_VIDEO_CEKIM_BODY =
  "Programdan en az yarım saat önce gelin evinde hazır olunur; akış ve özel istekler teyit edilir. Gelin evindeki detaylar, vedalaşmalar, kuşak bağlama ve duvak takma gibi ritüeller, damat ailesinin gelişi, dua ve gelin çıkışı kayıt altına alınır. Program öncesi hazırlık ve prova için yarım saat, program boyunca yarım saat toplamda, 1 saatlik bir çekim süreci yürütülür.";

const SADE_CEKIM_BODY =
  "Belirlenen süre içinde tek bir noktada fotoğraf çekimi gerçekleştirilir. Çekim esnasında kareler çiftle gösterilir; sohbet eşliğinde yönlendirmeler yapılarak rahat bir atmosfer yaratılır ve süreç birlikte şekillendirilir.";

const STANDART_PHOTO_CEKIM_BODY =
  "Rize merkeze 1 saatlik mesafeye kadar olan farklı noktalarda çekim yapılabilir. Çekim esnasında kareler çiftle paylaşılır; sohbet eşliğinde yönlendirmeler yapılarak rahat bir atmosfer yaratılır ve süreç birlikte şekillendirilir.";

const STANDART_COMBO_CEKIM_BODY =
  "Rize merkeze 1 saatlik mesafeye kadar olan farklı noktalarda çekim yapılabilir. Belirlenen noktalardan birinde, hem yerden kamerayla hem de hava koşullarının elverdiği sürece drone ile video kayıtları alınır. Çekim esnasında kareler çiftle paylaşılır; sohbet eşliğinde yönlendirmeler yapılarak rahat bir atmosfer yaratılır ve süreç birlikte şekillendirilir.";

const SAHIL_PHOTO_CEKIM_BODY =
  "Rize merkeze 1 saatlik mesafeye kadar olan vadi rotalarında başlayıp farklı noktada devam eden fotoğraf çekimi, gün batımı için sahil kenarına geçilerek tamamlanır. Çekim esnasında kareler çiftle paylaşılır; sohbet eşliğinde yönlendirmeler yapılarak rahat bir atmosfer yaratılır ve süreç birlikte şekillendirilir. Mevsime göre gün batımı saatlerine bağlı olarak başlangıç saati daha erkene alınabilir.";

const SAHIL_COMBO_CEKIM_BODY =
  "Rory merkeze 1 saatlik mesafeye kadar olan vadi rotalarında başlayıp farklı noktada devam eden fotoğraf çekimi, gün batımı için sahil kenarına geçilerek tamamlanır. Belirlenen noktalardan birinde, hem yerden kamerayla hem de hava koşullarının elverdiği sürece drone ile video kayıtları alınır. Çekim esnasında kareler çiftle paylaşılır; sohbet eşliğinde yönlendirmeler yapılarak rahat bir atmosfer yaratılır ve süreç birlikte şekillendirilir. Mevsime göre gün batımı saatlerine bağlı olarak başlangıç saati daha erkene alınabilir.";

const ZIRVE_PHOTO_CEKIM_BODY =
  "Vadi rotalarında çekime başlayıp farklı noktalarda devam eden fotoğraf çekimi yapılır. Çiftin ayarladığı altı yüksek bir araçla gün batımı için merkeze tahmini 2,5-3 saatlik zirve yaylalara çıkılarak çekim tamamlanır. Çekim esnasında kareler çiftle paylaşılır; sohbet eşliğinde yönlendirmeler yapılarak rahat bir atmosfer yaratılır ve süreç birlikte şekillendirilir. Mevsime göre gün batımı saatlerine bağlı olarak başlangıç saati daha erkene alınabilir.";

const ZIRVE_COMBO_CEKIM_BODY =
  "Vadi rotalarında çekime başlayıp farklı noktalarda devam eden fotoğraf çekimi yapılır. Çiftin ayarladığı altı yüksek bir araçla gün batımı için merkeze tahmini 2,5-3 saatlik zirve yaylalara çıkılarak çekim tamamlanır. Belirlenen noktalardan birinde, hem yerden kamerayla hem de hava koşullarının elverdiği sürece drone ile video kayıtları alınır. Çekim esnasında kareler çiftle paylaşılır; sohbet eşliğinde yönlendirmeler yapılarak rahat bir atmosfer yaratılır ve süreç birlikte şekillendirilir. Mevsime göre gün batımı saatlerine bağlı olarak başlangıç saati daha erkene alınabilir.";

const ZIRVE_COMBO_SECIM_BODY =
  "Çekimden sonraki 30 gün içinde albüm ve çerçeve tasarımlarında kullanılacak fotoğraflar ve video filmde kullanılması istenen müzik WhatsApp grubu üzerinden çift tarafından iletilir. İstenildiği takdirde seçimler tamamen Bekography’e bırakılabilir.";

const CATALOG: Record<string, PackageDetailSection[]> = {
  // —— Hazırlık Bride ——
  "hazirlik-bride/standart/Video Film": [
    ...sharedStart("hazirlik-bride-standart-video"),
    sec(
      "hazirlik-bride-standart-video",
      "Çekim",
      HAZIRLIK_CEKIM_BODY,
      ["Video", "Gelin & Damat Hazırlığı", "İlk Görüş", "1 Saat Süre"],
      2,
    ),
    sec(
      "hazirlik-bride-standart-video",
      "Dijital Teslimat",
      HAZIRLIK_VIDEO_DIJITAL_BODY,
      HAZIRLIK_VIDEO_DIJITAL_TAGS,
      3,
    ),
    sec(
      "hazirlik-bride-standart-video",
      "Düzenleme",
      HAZIRLIK_DUZENLEME_BODY,
      HAZIRLIK_DUZENLEME_TAGS,
      4,
    ),
  ],
  "hazirlik-bride/standart/Fotoğraf + Video Film": [
    ...sharedStart("hazirlik-bride-standart-combo"),
    sec(
      "hazirlik-bride-standart-combo",
      "Çekim",
      HAZIRLIK_CEKIM_BODY,
      ["Fotoğraf + Video", "Gelin & Damat Hazırlığı", "İlk Görüş", "1 Saat Süre"],
      2,
    ),
    sec(
      "hazirlik-bride-standart-combo",
      "Dijital Teslimat",
      COMBO_DIJITAL_BODY,
      HAZIRLIK_VIDEO_DIJITAL_TAGS,
      3,
    ),
    sec(
      "hazirlik-bride-standart-combo",
      "Düzenleme",
      HAZIRLIK_DUZENLEME_BODY,
      HAZIRLIK_DUZENLEME_TAGS,
      4,
    ),
  ],

  // —— Dış Çekim ——
  "dis-cekim/sade-prime/Fotoğraf": outdoorPhotoFlow(
    "dis-cekim-sade-foto",
    ["2 Saat Süre", "Fotoğraf Çekimi", "30 km Sınırlı"],
    SADE_CEKIM_BODY,
  ),
  "dis-cekim/standart-prime/Fotoğraf": outdoorPhotoFlow(
    "dis-cekim-standart-foto",
    ["Fotoğraf", "13.00-17.00 Arası", "4 Saat Süre", "3+ Mekan", "Vadi Rotalı"],
    STANDART_PHOTO_CEKIM_BODY,
  ),
  "dis-cekim/standart-prime/Video Film + Fotoğraf": outdoorComboFlow(
    "dis-cekim-standart-combo",
    [
      "Fotoğraf + Video",
      "13.00-17.00 Arası",
      "4 Saat Süre",
      "3+ Mekan",
      "Vadi Rotalı",
    ],
    STANDART_COMBO_CEKIM_BODY,
  ),
  "dis-cekim/sahil-prime/Fotoğraf": outdoorPhotoFlow(
    "dis-cekim-sahil-foto",
    [
      "Fotoğraf",
      "14.00-Gün Batımı Arası",
      "4+ Saat Süre",
      "4+ Mekan",
      "Sahil Bitiş Rotalı",
    ],
    SAHIL_PHOTO_CEKIM_BODY,
  ),
  "dis-cekim/sahil-prime/Video Film + Fotoğraf": outdoorComboFlow(
    "dis-cekim-sahil-combo",
    [
      "Fotoğraf + Video",
      "14.00-Gün Batımı Arası",
      "4+ Saat Süre",
      "4+ Mekan",
      "Sahil Bitiş Rotalı",
    ],
    SAHIL_COMBO_CEKIM_BODY,
  ),
  "dis-cekim/zirve-prime/Fotoğraf": outdoorPhotoFlow(
    "dis-cekim-zirve-foto",
    [
      "Fotoğraf",
      "13.00-Gün Batımı Arası",
      "7+ Saat Süre",
      "4+ Mekan",
      "Zirve Bitiş Rotalı",
    ],
    ZIRVE_PHOTO_CEKIM_BODY,
    OUTDOOR_ZIRVE_PHOTO_DUZENLEME_BODY,
  ),
  "dis-cekim/zirve-prime/Video Film + Fotoğraf": outdoorComboFlow(
    "dis-cekim-zirve-combo",
    [
      "Fotoğraf + Video",
      "13.00-Gün Batımı Arası",
      "7+ Saat Süre",
      "4+ Mekan",
      "Zirve Bitiş Rotalı",
    ],
    ZIRVE_COMBO_CEKIM_BODY,
    ZIRVE_COMBO_SECIM_BODY,
  ),

  // —— Düğün Salon ——
  "dugun-salon/giris-dans/Video Film": salonVideoFlow(
    "dugun-giris-dans-video",
    ["Video", "1 Saat Süre", "Giriş", "Dans", "Varsa Nikah"],
    "Düğün programından en az yarım saat önce salonda hazır olunur; akış ve özel istekler teyit edilir. Gelin-damat girişi, ilk dans ve varsa nikâh anları kayıt altına alınır. Takı ve konuk masaları çekim kapsamında değildir. Program öncesi yarım saat, düğün başından yarım saat olmakla birlikte toplamda 1 saatlik bir çekim süreci yürütülür.",
  ),
  "dugun-salon/giris-dans/Fotoğraf + Video Film": salonComboFlow(
    "dugun-giris-dans-combo",
    ["Fotoğraf + Video", "1 Saat Süre", "Giriş", "Dans", "Varsa Nikah"],
    "Düğün programından en az yarım saat önce salonda hazır olunur; akış ve özel istekler teyit edilir. Gelin-damat girişi, ilk dans ve varsa nikâh anları kayıt altına alınır. Aile fotoğrafı, takı ve konuk masaları çekim kapsamında değildir. Sadece çifte özel fotoğraflar çekilir. Program öncesi yarım saat ve düğün başından yarım saat olmakla birlikte toplamda 1 saatlik bir çekim süreci yürütülür.",
  ),
  "dugun-salon/giris-dans-eglence/Video Film": salonVideoFlow(
    "dugun-giris-dans-eglence-video",
    ["Video", "4 Saat Süre", "Giriş", "Dans", "Varsa Nikah", "Eğlence"],
    "Düğün programından en az yarım saat önce salonda hazır olunur; akış ve özel istekler teyit edilir. Gelin-damat girişi, ilk dans, varsa nikâh ve eğlence anları kayıt altına alınır. Ekstra bir talep olmadığı sürece takı töreni ve konuk masaları çekim kapsamına dahil edilmez. Program öncesi yarım saat, düğün boyunca 3 saat ve kapanış/vedalaşma anları için sağlanan yarım saatlik esneklikle birlikte toplamda 4 saatlik bir çekim süreci yürütülür.",
  ),
  "dugun-salon/giris-dans-eglence/Fotoğraf + Video Film": salonComboFlow(
    "dugun-giris-dans-eglence-combo",
    ["Fotoğraf + Video", "4 Saat Süre", "Giriş", "Dans", "Varsa Nikah", "Eğlence"],
    "Düğün programından en az yarım saat önce salonda hazır olunur; akış ve özel istekler teyit edilir. Gelin-damat girişi, ilk dans, varsa nikâh ve eğlence anları kayıt altına alınır. Ekstra bir talep olmadığı sürece takı töreni ve konuk masaları çekim kapsamına dahil edilmez. Aile fotoğrafları kıyafetlerin ve formun korunması amacıyla düğün sonuna bırakılmaz nikah veya takı anında çekilir. Program öncesi yarım saat, düğün boyunca 3 saat ve kapanış/vedalaşma anları için sağlanan yarım saatlik esneklikle birlikte toplamda 4 saatlik bir çekim süreci yürütülür.",
  ),

  // —— Gelin Çıkışı (NO Seçim; NO independent clip) ——
  "gelin-cikisi/standart/Video Film": companionVideoFlow(
    "gelin-cikisi-standart-video",
    [
      "Video",
      "Konvoy",
      "Karşılama",
      "Aile Vedası",
      "Ritüeller",
      "1 Saat Süre",
      "Video Film",
      "Uzun Metraj Video",
    ],
    GELIN_VIDEO_CEKIM_BODY,
    GELIN_DUZENLEME_TAGS,
    GELIN_DUZENLEME_BODY,
    false,
  ),
  "gelin-cikisi/standart/Fotoğraf + Video Film": companionVideoFlow(
    "gelin-cikisi-standart-combo",
    [
      "Fotoğraf + Video",
      "Konvoy",
      "Karşılama",
      "Aile Vedası",
      "Ritüeller",
      "1 Saat Süre",
      "Video Film",
      "Uzun Metraj Video",
      "Anlık Kareler",
      "Aile Fotoğrafları",
    ],
    GELIN_VIDEO_CEKIM_BODY,
    GELIN_DUZENLEME_TAGS,
    GELIN_DUZENLEME_BODY,
    true,
  ),

  // —— Nişan Salon ——
  "nisan-salon/giris-dans/Video Film": salonVideoFlow(
    "nisan-giris-dans-video",
    ["Video", "1 Saat Süre", "Giriş", "Dans", "Yüzük Merasimi"],
    "Nişan programından en az yarım saat önce salonda hazır olunur; akış ve özel istekler teyit edilir. Gelin-damat girişi, ilk dans, yüzük merasimi anları kayıt altına alınır. Takı ve konuk masaları çekim kapsamında değildir. Program öncesi yarım saat ve düğün başından yarım saat olmakla birlikte toplamda 1 saatlik bir çekim süreci yürütülür.",
    VIDEO_DIJITAL_BODY_SHORT,
  ),
  "nisan-salon/giris-dans/Fotoğraf + Video Film": salonComboFlow(
    "nisan-giris-dans-combo",
    ["Fotoğraf + Video", "1 Saat Süre", "Giriş", "Dans", "Yüzük Merasimi"],
    "Nişan programından en az yarım saat önce salonda hazır olunur; akış ve özel istekler teyit edilir. Gelin-damat girişi, ilk dans, yüzük merasimi anları kayıt altına alınır. Aile fotoğrafı, takı ve konuk masaları çekim kapsamında değildir. Sadece çifte özel fotoğraflar çekilir. Program öncesi yarım saat ve düğün başından yarım saat olmakla birlikte toplamda 1 saatlik bir çekim süreci yürütülür.",
  ),
  "nisan-salon/giris-dans-eglence/Video Film": salonVideoFlow(
    "nisan-giris-dans-eglence-video",
    ["Video", "4 Saat Süre", "Giriş", "Dans", "Yüzük Merasimi", "Eğlence"],
    "Nişan programından en az yarım saat önce salonda hazır olunur; akış ve özel istekler teyit edilir. Gelin-damat girişi, ilk dans, yüzük merasimi ve eğlence anları kayıt altına alınır. Ekstra bir talep olmadığı sürece takı töreni ve konuk masaları çekim kapsamına dahil edilmez. Program öncesi yarım saat, düğün boyunca 3 saat ve kapanış/vedalaşma anları için sağlanan yarım saatlik esneklikle birlikte toplamda 4 saatlik bir çekim süreci yürütülür.",
  ),
  "nisan-salon/giris-dans-eglence/Fotoğraf + Video Film": salonComboFlow(
    "nisan-giris-dans-eglence-combo",
    [
      "Fotoğraf + Video",
      "4 Saat Süre",
      "Giriş",
      "Dans",
      "Yüzük Merasimi",
      "Eğlence",
    ],
    "Nişan programından en az yarım saat önce salonda hazır olunur; akış ve özel istekler teyit edilir. Gelin-damat girişi, ilk dans, yüzük merasimi ve eğlence anları kayıt altına alınır. Ekstra bir talep olmadığı sürece takı töreni ve konuk masaları çekim kapsamına dahil edilmez. Aile fotoğrafları kıyafetlerin ve formun korunması amacıyla düğün sonuna bırakılmaz yüzük merasimi veya takı anında çekilir. Program öncesi yarım saat, düğün boyunca 3 saat ve kapanış/vedalaşma anları için sağlanan yarım saatlik esneklikle birlikte toplamda 4 saatlik bir çekim süreci yürütülür.",
  ),

  // —— Söz ——
  "soz/rize-merkez/Video Film": salonVideoFlow(
    "soz-rize-merkez-video",
    ["Video", "2 Saat Süre", "Karşılama", "Kahveler", "İsteme", "Yüzük Merasimi"],
    "Söz programından en az yarım saat önce gelin evinde hazır olunur; akış ve özel istekler teyit edilir. Damat ailesinin gelişi, evdeki detaylar, isteme anı, kahve ikramı ve yüzük merasimi anları kayıt altına alınır. Ekstra bir talep olmadığı sürece takı töreni çekim kapsamına dahil edilmez. Program öncesi yarım saat, söz boyunca 1 saat ve kapanış/vedalaşma anları için sağlanan yarım saatlik esneklikle birlikte yol toplamda, 2 saatlik bir çekim süreci yürütülür.",
    VIDEO_DIJITAL_BODY_SHORT,
  ),
  "soz/rize-merkez/Fotoğraf + Video Film": salonComboFlow(
    "soz-rize-merkez-combo",
    [
      "Fotoğraf + Video",
      "2 Saat Süre",
      "Karşılama",
      "Kahveler",
      "İsteme",
      "Yüzük Merasimi",
      "Aile Fotoğrafları",
      "Anlık Kareler",
    ],
    "Söz programından en az yarım saat önce gelin evinde hazır olunur; akış ve özel istekler teyit edilir. Damat ailesinin gelişi, evdeki detaylar, isteme anı, kahve ikramı ve yüzük merasimi anları kayıt altına alınır. Ekstra bir talep olmadığı sürece takı töreni çekim kapsamına dahil edilmez. Program öncesi yarım saat, söz boyunca 1 saat ve kapanış/vedalaşma anları için sağlanan yarım saatlik esneklikle birlikte yol toplamda, 2 saatlik bir çekim süreci yürütülür.",
  ),
  "soz/ilce-koyler/Video Film": salonVideoFlow(
    "soz-ilce-koyler-video",
    ["Video", "2 Saat Süre", "Karşılama", "Kahveler", "İsteme", "Yüzük Merasimi"],
    "Söz programından en az yarım saat önce gelin evinde hazır olunur; akış ve özel istekler teyit edilir. Damat ailesinin gelişi, evdeki detaylar, isteme anı, kahve ikramı ve yüzük merasimi anları kayıt altına alınır. Ekstra bir talep olmadığı sürece takı töreni çekim kapsamına dahil edilmez. Program öncesi yarım saat, söz boyunca 1 saat ve kapanış/vedalaşma anları için sağlanan yarım saatlik esneklikle birlikte yol toplamda, 2 saatlik bir çekim süreci yürütülür.",
    VIDEO_DIJITAL_BODY_SHORT,
  ),
  "soz/ilce-koyler/Fotoğraf + Video Film": salonComboFlow(
    "soz-ilce-koyler-combo",
    [
      "Fotoğraf + Video",
      "2 Saat Süre",
      "Karşılama",
      "Kahveler",
      "İsteme",
      "Yüzük Merasimi",
      "Aile Fotoğrafları",
      "Anlık Kareler",
    ],
    "Söz programından en az yarım saat önce gelin evinde hazır olunur; akış ve özel istekler teyit edilir. Damat ailesinin gelişi, evdeki detaylar, isteme anı, kahve ikramı ve yüzük merasimi anları kayıt altına alınır. Ekstra bir talep olmadığı sürece takı töreni çekim kapsamına dahil edilmez. Program öncesi yarım saat, söz boyunca 1 saat ve kapanış/vedalaşma anları için sağlanan yarım saatlik esneklikle birlikte yol toplamda, 2 saatlik bir çekim süreci yürütülür.",
  ),

  // —— Söz + Nişan Salon ——
  "soz-nisan-salon/rize-merkez/Video Film": salonVideoFlow(
    "soz-nisan-rize-merkez-video",
    [
      "Video",
      "Konvoy",
      "6 Saat Süre",
      "Karşılama",
      "Kahveler",
      "İsteme",
      "Yüzük Merasimi",
      "Giriş",
      "Dans",
      "Eğlence",
      "Video Film",
      "Uzun Metraj Video",
    ],
    "Söz programından en az yarım saat önce mekanda hazır olunur; akış ve özel istekler teyit edilir. Damat ailesinin gelişi, mekandaki detaylar, isteme anı, kahve ikramı kayıt altına alınır. Kısa bir aradan sonra nişan için çiftin girişi, dansı, yüzük merasimi ve eğlence anları kaydedilir. Ekstra bir talep olmadığı sürece takı töreni çekim kapsamına dahil edilmez. Program öncesi hazırlık ve prova için 1 saat, söz boyunca 1 saat, iki organizasyon arasında yarım saat, nişan için 3 saat ve kapanış/vedalaşma anları için sağlanan yarım saatlik esneklikle birlikte yol toplamda, 6 saatlik bir çekim süreci yürütülür.",
  ),
  "soz-nisan-salon/rize-merkez/Fotoğraf + Video Film": salonComboFlow(
    "soz-nisan-rize-merkez-combo",
    [
      "Fotoğraf + Video",
      "Konvoy",
      "6 Saat Süre",
      "Karşılama",
      "Kahveler",
      "İsteme",
      "Yüzük Merasimi",
      "Giriş",
      "Dans",
      "Eğlence",
      "Video Film",
      "Uzun Metraj Video",
      "Anlık Kareler",
      "Aile Fotoğrafları",
    ],
    "Söz programından en az yarım saat önce mekanda hazır olunur; akış ve özel istekler teyit edilir. Damat ailesinin gelişi, mekandaki detaylar, isteme anı, kahve ikramı kayıt altına alınır. Kısa bir aradan sonra nişan için çiftin girişi, dansı, yüzük merasimi ve eğlence anları kaydedilir. Ekstra bir talep olmadığı sürece takı töreni çekim kapsamına dahil edilmez. Program öncesi hazırlık ve prova için 1 saat, söz boyunca 1 saat, iki organizasyon arasında yarım saat, nişan için 3 saat ve kapanış/vedalaşma anları için sağlanan yarım saatlik esneklikle birlikte yol toplamda, 6 saatlik bir çekim süreci yürütülür.",
  ),
  "soz-nisan-salon/ilce-koyler/Video Film": salonVideoFlow(
    "soz-nisan-ilce-koyler-video",
    [
      "Video",
      "Konvoy",
      "6 Saat Süre",
      "Karşılama",
      "Kahveler",
      "İsteme",
      "Yüzük Merasimi",
      "Giriş",
      "Dans",
      "Eğlence",
      "Video Film",
      "Uzun Metraj Video",
    ],
    "Söz programından en az yarım saat önce mekanda hazır olunur; akış ve özel istekler teyit edilir. Damat ailesinin gelişi, mekandaki detaylar, isteme anı, kahve ikramı kayıt altına alınır. Kısa bir aradan sonra nişan için çiftin girişi, dansı, yüzük merasimi ve eğlence anları kaydedilir. Ekstra bir talep olmadığı sürece takı töreni çekim kapsamına dahil edilmez. Program öncesi hazırlık ve prova için 1 saat, söz boyunca 1 saat, iki organizasyon arasında yarım saat, nişan için 3 saat ve kapanış/vedalaşma anları için sağlanan yarım saatlik esneklikle birlikte yol toplamda, 6 saatlik bir çekim süreci yürütülür.",
  ),
  "soz-nisan-salon/ilce-koyler/Fotoğraf + Video Film": salonComboFlow(
    "soz-nisan-ilce-koyler-combo",
    [
      "Fotoğraf + Video",
      "Konvoy",
      "6 Saat Süre",
      "Karşılama",
      "Kahveler",
      "İsteme",
      "Yüzük Merasimi",
      "Giriş",
      "Dans",
      "Eğlence",
      "Video Film",
      "Uzun Metraj Video",
      "Anlık Kareler",
      "Aile Fotoğrafları",
    ],
    "Söz programından en az yarım saat önce mekanda hazır olunur; akış ve özel istekler teyit edilir. Damat ailesinin gelişi, mekandaki detaylar, isteme anı, kahve ikramı kayıt altına alınır. Kısa bir aradan sonra nişan için çiftin girişi, dansı, yüzük merasimi ve eğlence anları kaydedilir. Ekstra bir talep olmadığı sürece takı töreni çekim kapsamına dahil edilmez. Program öncesi hazırlık ve prova için 1 saat, söz boyunca 1 saat, iki organizasyon arasında yarım saat, nişan için 3 saat ve kapanış/vedalaşma anları için sağlanan yarım saatlik esneklikle birlikte yol toplamda, 6 saatlik bir çekim süreci yürütülür.",
  ),

  // —— Kına Salon ——
  "kina-salon/giris-agit/Video Film": salonVideoFlow(
    "kina-giris-agit-video",
    ["Video", "1 Saat Süre", "Giriş", "Ağıt", "Kına Yakma"],
    "Kına programından en az yarım saat önce salonda hazır olunur; akış ve özel istekler teyit edilir. Kına girişi, ağıt, kına yakma anları kayıt altına alınır. Ekstra bir talep olmadığı sürece takı töreni ve konuk masaları çekim kapsamına dahil edilmez. Program öncesi yarım saat, kına boyunca yarım saat olmak üzere toplamda 1 saatlik bir çekim süreci yürütülür.",
  ),
  "kina-salon/giris-agit/Fotoğraf + Video Film": salonComboFlow(
    "kina-giris-agit-combo",
    ["Fotoğraf + Video", "1 Saat Süre", "Giriş", "Ağıt", "Kına Yakma"],
    "Kına programından en az yarım saat önce salonda hazır olunur; akış ve özel istekler teyit edilir. Kına girişi, ağıt, kına yakma anları kayıt altına alınır. Ekstra bir talep olmadığı sürece takı töreni, konuk masaları ve aile fotoğrafları çekim kapsamına dahil edilmez. Program öncesi yarım saat, kına boyunca da yarım saat olmak üzere toplamda 1 saatlik bir çekim süreci yürütülür.",
  ),
  "kina-salon/giris-agit-eglence/Video Film": salonVideoFlow(
    "kina-giris-agit-eglence-video",
    ["Video", "4 Saat Süre", "Giriş", "Ağıt", "Kına Yakma", "Eğlence"],
    "Kına programından en az yarım saat önce salonda hazır olunur; akış ve özel istekler teyit edilir. Kına girişi, ağıt, kına yakma ve eğlence anları kayıt altına alınır. Ekstra bir talep olmadığı sürece takı töreni ve konuk masaları çekim kapsamına dahil edilmez. Program öncesi yarım saat, kına boyunca 3 saat ve kapanış/vedalaşma anları için sağlanan yarım saatlik esneklikle birlikte toplamda 4 saatlik bir çekim süreci yürütülür.",
  ),
  "kina-salon/giris-agit-eglence/Fotoğraf + Video Film": salonComboFlow(
    "kina-giris-agit-eglence-combo",
    ["Fotoğraf + Video", "4 Saat Süre", "Giriş", "Ağıt", "Kına Yakma", "Eğlence"],
    "Kına programından en az yarım saat önce salonda hazır olunur; akış ve özel istekler teyit edilir. Kına girişi, ağıt, kına yakma ve eğlence anları kayıt altına alınır. Ekstra bir talep olmadığı sürece takı töreni ve konuk masaları çekim kapsamına dahil edilmez. Aile fotoğrafları kıyafetlerin ve formun korunması amacıyla kına sonuna bırakılmaz ağıttan sonra çekilir. Program öncesi yarım saat, kına boyunca 3 saat ve kapanış/vedalaşma anları için sağlanan yarım saatlik esneklikle birlikte toplamda 4 saatlik bir çekim süreci yürütülür.",
  ),
};

/** PDF-accurate İncele sections for a shoot type; null → seed falls back to templates. */
export function getCatalogInspectSections(input: {
  areaSlug: string;
  packageSlug: string;
  label: string;
}): PackageDetailSection[] | null {
  const key = `${input.areaSlug}/${input.packageSlug}/${input.label}`;
  const sections = CATALOG[key];
  return sections ? sections.map((section) => ({ ...section })) : null;
}
