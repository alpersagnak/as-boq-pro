export const BRAND_CATALOG = [
  { category: "Alçıpan ve Levha", keywords: ["alçıpan", "levha", "fireboard", "boardex", "aquapanel"], brands: [
    { brand: "Knauf", models: ["White", "Diamant", "Fireboard", "Aquapanel Outdoor"], info: "Alçı levha, çimento esaslı levha ve sistem bileşenleri üreticisi.", standard: "EN 520 / EN 12467", approved: true },
    { brand: "Dalsan", models: ["Beyaz", "Premium", "Darbe Dayanımlı", "Yangına Dayanıklı"], info: "İç mekân kuru yapı sistemleri ve alçı levha ürünleri sunar.", standard: "TS EN 520", approved: true },
    { brand: "Saint-Gobain Rigips", models: ["RB", "RF", "Habito"], info: "Alçı levha ve hafif bölme duvar sistemleri üreticisidir.", standard: "EN 520", approved: false },
  ]},
  { category: "Profil ve Metal", keywords: ["profil", "kutu", "galvaniz", "sac", "çelik", "demir", "donatı"], brands: [
    { brand: "Borusan", models: ["Yapısal Profil", "Kutu Profil", "Boru Profil"], info: "Yapısal çelik boru ve profil ürünleri üreticisidir.", standard: "EN 10219", approved: true },
    { brand: "Özkanlar", models: ["C Profil", "U Profil", "Omega Profil"], info: "Hafif çelik ve alçıpan profil çözümleri sunar.", standard: "EN 14195", approved: true },
    { brand: "Noksel", models: ["Çelik Boru", "Yapısal Profil"], info: "Çelik boru ve profil ürünleri üreticisidir.", standard: "EN 10219", approved: false },
  ]},
  { category: "Beton ve Çimento", keywords: ["beton", "çimento", "grobeton", "şap"], brands: [
    { brand: "Akçansa", models: ["CEM I 42.5 R", "CEM II 42.5", "Hazır Beton"], info: "Çimento ve hazır beton ürünleri sağlar.", standard: "TS EN 197-1 / TS EN 206", approved: true },
    { brand: "OYAK Çimento", models: ["CEM I", "CEM II", "Hazır Beton"], info: "Çimento ve beton çözümleri üreticisidir.", standard: "TS EN 197-1 / TS EN 206", approved: true },
    { brand: "Çimsa", models: ["Gri Çimento", "Beyaz Çimento", "Özel Ürünler"], info: "Gri ve beyaz çimento ile özel bağlayıcı ürünler sunar.", standard: "TS EN 197-1", approved: false },
  ]},
  { category: "Boya", keywords: ["boya", "astar", "vernik", "epoksi"], brands: [
    { brand: "Jotun", models: ["Fenomastic", "Jotashield", "Penguard"], info: "İç cephe, dış cephe ve koruyucu kaplama ürünleri sunar.", standard: "Ürün teknik föyüne göre", approved: true },
    { brand: "Filli Boya", models: ["Momento", "Caparol", "Dış Cephe"], info: "Dekoratif iç ve dış cephe boya sistemleri sunar.", standard: "TS 5808", approved: true },
    { brand: "DYO", models: ["Dinamik", "Teknotex", "Hidroten"], info: "Mimari ve endüstriyel boya ürünleri üreticisidir.", standard: "Ürün teknik föyüne göre", approved: false },
  ]},
  { category: "Seramik ve Yapıştırıcı", keywords: ["seramik", "granit", "fayans", "yapıştırıcı", "derz"], brands: [
    { brand: "Kale", models: ["Seramik", "Porselen", "Kalekim 1051", "Ultracolor"], info: "Seramik kaplama ve uygulama kimyasalları sunar.", standard: "EN 14411 / EN 12004", approved: true },
    { brand: "VitrA", models: ["Porselen Karo", "Duvar Karosu", "Karo Sistemleri"], info: "Seramik karo ve banyo ürünleri üreticisidir.", standard: "EN 14411", approved: true },
    { brand: "Bien", models: ["Porselen", "Duvar Karosu"], info: "Seramik kaplama ürünleri sunar.", standard: "EN 14411", approved: false },
  ]},
  { category: "Yalıtım", keywords: ["yalıtım", "izolasyon", "taş yünü", "cam yünü", "xps", "eps", "membran"], brands: [
    { brand: "İzocam", models: ["Taşyünü", "Camyünü", "Foamboard"], info: "Isı, ses ve yangın yalıtımı ürünleri sunar.", standard: "EN 13162 / EN 13164", approved: true },
    { brand: "ODE", models: ["Starflex", "R-Flex", "Membran"], info: "Isı ve su yalıtımı çözümleri üreticisidir.", standard: "İlgili EN standardı", approved: true },
    { brand: "Ravago", models: ["XPS", "EPS", "Membran"], info: "Polimer esaslı ısı ve su yalıtımı ürünleri sunar.", standard: "EN 13164", approved: false },
  ]},
  { category: "Elektrik", keywords: ["kablo", "pano", "priz", "anahtar", "sigorta", "şalter", "aydınlatma"], brands: [
    { brand: "Schneider Electric", models: ["Acti9", "Easy9", "Unica", "Asfora"], info: "Alçak gerilim dağıtım, otomasyon ve anahtarlama ürünleri sunar.", standard: "IEC ürün standardına göre", approved: true },
    { brand: "ABB", models: ["System pro M", "Tmax", "Zenit"], info: "Elektrifikasyon ve otomasyon ürünleri üreticisidir.", standard: "IEC ürün standardına göre", approved: true },
    { brand: "Legrand", models: ["DX3", "Valena", "Mosaic"], info: "Elektrik dağıtım ve bina sistemleri ürünleri sunar.", standard: "IEC ürün standardına göre", approved: false },
  ]},
  { category: "Mekanik", keywords: ["pompa", "vana", "boru", "vrf", "chiller", "fan coil", "kombi", "havalandırma"], brands: [
    { brand: "Grundfos", models: ["MAGNA", "TPE", "Hydro MPC"], info: "Pompa ve hidrofor sistemleri üreticisidir.", standard: "Ürün teknik föyüne göre", approved: true },
    { brand: "Wilo", models: ["Stratos", "Helix", "Comfort"], info: "Bina ve altyapı pompa sistemleri sunar.", standard: "Ürün teknik föyüne göre", approved: true },
    { brand: "Daikin", models: ["VRV", "Altherma", "Fan Coil"], info: "Isıtma, soğutma ve iklimlendirme sistemleri üreticisidir.", standard: "Eurovent / ürün teknik föyü", approved: false },
  ]},
  { category: "Sıhhi Tesisat", keywords: ["armatür", "lavabo", "klozet", "rezervuar", "batarya", "duş"], brands: [
    { brand: "VitrA", models: ["Sento", "Integra", "Origin"], info: "Seramik sağlık gereçleri ve banyo ürünleri sunar.", standard: "EN 997 / EN 14688", approved: true },
    { brand: "Grohe", models: ["Eurosmart", "Essence", "Rapid SL"], info: "Banyo, mutfak armatürleri ve gömme rezervuar sistemleri sunar.", standard: "EN ürün standardına göre", approved: true },
    { brand: "Hansgrohe", models: ["Talis", "Raindance", "Vernis"], info: "Banyo ve mutfak armatürleri ile duş sistemleri üreticisidir.", standard: "EN ürün standardına göre", approved: false },
  ]},
];

const normalize = (value = "") => value.toLocaleLowerCase("tr-TR");

export function getBrandOptions(material) {
  const text = normalize(`${material?.name || material?.ad || ""} ${material?.category || material?.kategori || ""}`);
  const group = BRAND_CATALOG.find((entry) => entry.keywords.some((keyword) => text.includes(normalize(keyword))));
  return group?.brands || [];
}

export function getBrandRecord(material, brandName) {
  return getBrandOptions(material).find((item) => item.brand === brandName) || null;
}
