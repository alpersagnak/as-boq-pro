export const PROJECT_TYPES = [
  { id: "villa", label: "Villa" },
  { id: "apartment", label: "Apartman" },
  { id: "hotel", label: "Otel" },
  { id: "office", label: "Ofis" },
  { id: "school", label: "Okul" },
  { id: "factory", label: "Fabrika" },
];

const item = (pozNo, isKalemi, birim, kategori, discipline, info, typical = "") => ({
  pozNo, isKalemi, birim, kategori, discipline, tur: "Akıllı BOQ", info, typical,
});

export const WIZARD_TEMPLATES = {
  construction: [
    item("INS-001", "Makine ile yapı kazısı", "m³", "Hafriyat", "construction", "Temel ve bodrum imalatları için zeminin projedeki kotlara kadar kazılmasıdır.", "Kazı derinliği ve zemin sınıfına göre hesaplanır."),
    item("INS-002", "Kazı malzemesinin yüklenmesi ve nakli", "m³", "Hafriyat", "construction", "Kazıdan çıkan fazla toprağın kamyona yüklenerek döküm sahasına taşınmasıdır."),
    item("INS-003", "Sıkıştırılmış stabilize dolgu", "m³", "Dolgu", "construction", "Temel altı veya döşeme altında taşıma gücünü artıran tabakalı dolgudur.", "Tabakalar halinde serilir ve sıkıştırılır."),
    item("INS-004", "Temel altı grobeton", "m³", "Beton", "construction", "Taşıyıcı olmayan, temel donatısı için temiz ve düzgün çalışma yüzeyi sağlayan betondur.", "Genellikle 5–10 cm, C12/15 sınıfı."),
    item("INS-005", "Radye temel betonarmesi", "m³", "Betonarme", "construction", "Yapı yükünü zemine geniş bir yüzeyden aktaran sürekli temel sistemidir."),
    item("INS-006", "B420C nervürlü donatı çeliği", "kg", "Donatı", "construction", "Betonarme elemanların çekme dayanımını sağlayan nervürlü çelik çubuklardır."),
    item("INS-007", "Plywood betonarme kalıbı", "m²", "Kalıp", "construction", "Taze betona proje şekli veren geçici kalıp sistemidir."),
    item("INS-008", "Kolon, perde, kiriş ve döşeme betonu", "m³", "Betonarme", "construction", "Yapının ana taşıyıcı betonarme elemanlarının beton imalatıdır."),
    item("INS-009", "Betonarme merdiven", "m³", "Betonarme", "construction", "Katlar arası ulaşımı sağlayan taşıyıcı merdiven plağı ve basamaklarının betonarmesidir."),
    item("INS-010", "Çimento esaslı tesviye şapı", "m²", "Şap", "construction", "Zemin kaplaması öncesi düzgün kot ve yüzey oluşturan çimento esaslı tabakadır.", "Genellikle 4–6 cm."),
  ],
  architectural: [
    item("MIM-001", "Dış duvar gazbeton blok", "m²", "Duvar", "architectural", "Hafif, ısı yalıtımı yüksek duvar bloklarıyla dış duvar örülmesidir."),
    item("MIM-002", "İç bölme duvar", "m²", "Duvar", "architectural", "Mekânları birbirinden ayıran taşıyıcı olmayan duvar imalatıdır."),
    item("MIM-003", "Alçıpan bölme duvar sistemi", "m²", "Alçıpan", "architectural", "Metal karkas üzerine levha kaplanarak oluşturulan hafif bölme duvar sistemidir."),
    item("MIM-004", "Kaba ve ince sıva", "m²", "Sıva", "architectural", "Duvar yüzeyini düzeltip son kat kaplamaya hazırlayan sıva katmanlarıdır."),
    item("MIM-005", "Saten alçı ve iç cephe boyası", "m²", "Boya", "architectural", "Pürüzsüz yüzey hazırlığı ve dekoratif son kat boya uygulamasıdır."),
    item("MIM-006", "Islak hacim seramik kaplama", "m²", "Seramik", "architectural", "Banyo ve WC gibi alanlarda suya dayanıklı duvar ve zemin kaplamasıdır."),
    item("MIM-007", "Su yalıtımı", "m²", "Yalıtım", "architectural", "Su geçişini önleyen membran veya sürme esaslı yalıtım uygulamasıdır."),
    item("MIM-008", "İç kapılar", "adet", "Kapı", "architectural", "Mekân geçişlerini sağlayan kasa, kanat ve aksesuarlarıyla kapı sistemidir."),
  ],
  mechanical: [
    item("MEK-001", "Temiz su borulaması", "m", "Sıhhi Tesisat", "mechanical", "Kullanım suyunu armatürlere taşıyan basınçlı boru sistemidir."),
    item("MEK-002", "Atık su borulaması", "m", "Sıhhi Tesisat", "mechanical", "Pis ve kullanılmış suyu bina dışı kanalizasyona ileten eğimli boru sistemidir."),
    item("MEK-003", "Yağmur suyu tesisatı", "m", "Yağmur Suyu", "mechanical", "Çatı ve teras yağmur suyunu güvenli şekilde uzaklaştıran sistemdir."),
    item("MEK-004", "Sıhhi tesisat armatürleri", "adet", "Armatür", "mechanical", "Lavabo, klozet, batarya ve duş gibi kullanım ekipmanlarıdır."),
    item("MEK-005", "Isıtma-soğutma sistemi", "set", "HVAC", "mechanical", "Mahallerin sıcaklık ve konfor şartlarını sağlayan mekanik sistemdir."),
    item("MEK-006", "Havalandırma kanalı ve menfezleri", "m²", "Havalandırma", "mechanical", "Taze hava dağıtımı ve kirli havanın atılması için kullanılan kanal sistemidir."),
  ],
  electrical: [
    item("ELK-001", "Ana dağıtım panosu", "adet", "Pano", "electrical", "Elektrik enerjisini koruma elemanları üzerinden alt devrelere dağıtan panodur."),
    item("ELK-002", "Kuvvetli akım kablolaması", "m", "Kablo", "electrical", "Priz, cihaz ve mekanik ekipmanlara enerji taşıyan kablo sistemidir."),
    item("ELK-003", "Kablo tavası ve borulama", "m", "Taşıma Sistemi", "electrical", "Elektrik kablolarının düzenli ve korunmuş şekilde taşınmasını sağlar."),
    item("ELK-004", "Aydınlatma armatürleri", "adet", "Aydınlatma", "electrical", "İç ve dış mekânlarda gerekli ışık seviyesini sağlayan ürünlerdir."),
    item("ELK-005", "Priz ve anahtar grupları", "adet", "Priz-Anahtar", "electrical", "Kullanıcıların elektrik enerjisine erişimini ve aydınlatmayı kontrol etmesini sağlar."),
    item("ELK-006", "Topraklama ve eşpotansiyel sistem", "set", "Topraklama", "electrical", "Kaçak akımlara karşı can ve cihaz güvenliği sağlayan koruma sistemidir."),
  ],
  facade: [
    item("CEP-001", "Isı yalıtımlı dış cephe sistemi", "m²", "Cephe", "facade", "Dış duvarda ısı kayıplarını azaltan levha, sıva ve son kat kaplama sistemidir."),
    item("CEP-002", "Alüminyum doğrama", "m²", "Doğrama", "facade", "Pencere ve dış kapılarda kullanılan dayanıklı metal doğrama sistemidir."),
    item("CEP-003", "Cephe camı", "m²", "Cam", "facade", "Isı, güneş ve güvenlik performansına göre seçilen dış cephe camıdır."),
  ],
  landscape: [
    item("PEY-001", "Bitkisel toprak serilmesi", "m³", "Peyzaj", "landscape", "Bitki gelişimi için uygun verimli üst toprak tabakasıdır."),
    item("PEY-002", "Otomatik sulama sistemi", "m²", "Sulama", "landscape", "Bitkilerin kontrollü ve düzenli sulanmasını sağlayan boru, vana ve sprinkler sistemidir."),
    item("PEY-003", "Çim ve bitkilendirme", "m²", "Bitkilendirme", "landscape", "Peyzaj projesine göre çim, çalı ve ağaçların uygulanmasıdır."),
  ],
  pool: [
    item("HAV-001", "Havuz betonarme gövdesi", "m³", "Havuz", "pool", "Havuzun taşıyıcı taban ve perde betonarmesidir."),
    item("HAV-002", "Havuz su yalıtımı", "m²", "Yalıtım", "pool", "Havuz suyunun beton gövdeden kaçmasını önleyen yalıtım sistemidir."),
    item("HAV-003", "Havuz kaplaması", "m²", "Kaplama", "pool", "Suya ve kimyasallara dayanıklı seramik veya mozaik son kat kaplamadır."),
    item("HAV-004", "Filtrasyon ve sirkülasyon sistemi", "set", "Ekipman", "pool", "Havuz suyunu temizleyen, döndüren ve hijyenik tutan pompa-filtre sistemidir."),
  ],
  low_current: [
    item("ZAY-001", "Data ve network kablolaması", "m", "Zayıf Akım", "low_current", "İnternet ve yerel ağ iletişimini taşıyan düşük gerilimli kablo sistemidir."),
    item("ZAY-002", "CCTV kamera sistemi", "set", "Güvenlik", "low_current", "Görüntülü güvenlik izleme ve kayıt sistemidir."),
    item("ZAY-003", "Interkom sistemi", "set", "İletişim", "low_current", "Bina girişleri ve bağımsız bölümler arasında sesli/görüntülü iletişim sağlar."),
  ],
  fire: [
    item("YAN-001", "Yangın algılama ve ihbar sistemi", "set", "Yangın", "fire", "Duman veya ısıyı algılayıp kullanıcıları uyaran elektronik güvenlik sistemidir."),
    item("YAN-002", "Yangın dolabı ve hidrant sistemi", "adet", "Yangın", "fire", "Yangına ilk müdahale için su ve hortum sağlayan sabit tesisattır."),
    item("YAN-003", "Sprinkler tesisatı", "m²", "Yangın", "fire", "Yangını otomatik algılayıp su püskürterek kontrol altına alan sistemdir."),
  ],
  infrastructure: [
    item("ALT-001", "Bina çevresi drenaj hattı", "m", "Altyapı", "infrastructure", "Yeraltı ve yüzey sularını yapıdan uzaklaştıran delikli boru sistemidir."),
    item("ALT-002", "Kanalizasyon bağlantısı", "m", "Altyapı", "infrastructure", "Bina atık suyunu ana kanalizasyon sistemine bağlayan dış hat imalatıdır."),
    item("ALT-003", "Saha yağmur suyu hattı", "m", "Altyapı", "infrastructure", "Açık alan yağmur sularını rögar ve deşarj noktasına taşıyan sistemdir."),
  ],
  steel: [
    item("CEL-001", "Çelik konstrüksiyon imalatı", "kg", "Çelik", "steel", "Taşıyıcı çelik profillerin kesim, kaynak, montaj ve bağlantı imalatlarıdır."),
    item("CEL-002", "Galvaniz kutu profil karkas", "kg", "Çelik", "steel", "Hafif taşıyıcı veya kaplama altı karkas olarak kullanılan galvanizli profillerdir."),
    item("CEL-003", "Çelik yüzey koruyucu boya", "m²", "Boya", "steel", "Çeliği korozyona karşı koruyan astar ve son kat boya sistemidir."),
  ],
};

export function buildWizardBoq({ disciplines, basement, pool, projectType }) {
  const selected = new Set(disciplines);
  if (pool) selected.add("pool");
  const rows = [...selected].flatMap((discipline) => WIZARD_TEMPLATES[discipline] || []);
  return rows.filter((row) => {
    if (!basement && row.pozNo === "INS-002") return false;
    if (projectType === "factory" && row.pozNo === "MIM-006") return false;
    return true;
  });
}
