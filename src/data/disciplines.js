export const DISCIPLINES = [
  { id: "all", label: "Tüm Disiplinler" },
  { id: "construction", label: "İnşaat" },
  { id: "architectural", label: "Mimari" },
  { id: "mechanical", label: "Mekanik" },
  { id: "electrical", label: "Elektrik" },
  { id: "facade", label: "Cephe" },
  { id: "landscape", label: "Peyzaj" },
  { id: "pool", label: "Havuz" },
  { id: "low_current", label: "Zayıf Akım" },
  { id: "fire", label: "Yangın" },
  { id: "infrastructure", label: "Altyapı" },
  { id: "steel", label: "Çelik" },
];

export const disciplineLabel = (id) =>
  DISCIPLINES.find((item) => item.id === id)?.label || "İnşaat";

export function inferDiscipline(item = {}) {
  const text = `${item.discipline || ""} ${item.kategori || item.category || ""} ${item.tur || item.type || ""} ${item.isKalemi || item.description || ""}`
    .toLocaleLowerCase("tr-TR");
  if (/elektrik|kablo|pano|priz|aydınlat|topraklama|jeneratör|ups/.test(text)) return "electrical";
  if (/mekanik|boru|havalandır|vrf|chiller|fan coil|temiz su|pis su|sıhhi|doğalgaz/.test(text)) return "mechanical";
  if (/yangın|sprinkler|hidrant|alarm/.test(text)) return "fire";
  if (/zayıf akım|data|network|cctv|kamera|interkom/.test(text)) return "low_current";
  if (/cephe|giydirme|doğrama|alüminyum|kompozit/.test(text)) return "facade";
  if (/peyzaj|sulama|bitki|çim/.test(text)) return "landscape";
  if (/havuz|spa|sauna|hamam/.test(text)) return "pool";
  if (/altyapı|kanalizasyon|drenaj|yağmur suyu|yol/.test(text)) return "infrastructure";
  if (/çelik|kutu profil|çelik konstrüksiyon|metal/.test(text)) return "steel";
  if (/alçıpan|sıva|boya|seramik|kapı|pencere|zemin|tavan|yalıtım|mimari/.test(text)) return "architectural";
  return "construction";
}
