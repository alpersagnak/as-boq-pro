const normalize = (value = "") => String(value).toLocaleLowerCase("tr-TR").replace(/[^a-z0-9çğıöşü]+/g, " ").trim();

export const DEFAULT_PRICE_SOURCES = [
  {
    id: "custom-json",
    name: "Kullanıcı JSON API",
    type: "json",
    url: "",
    enabled: true,
    mapping: { name: "name", brand: "brand", model: "model", price: "price", unit: "unit", currency: "currency", date: "date", url: "url" },
  },
];

export function readPriceSources() {
  try {
    const saved = JSON.parse(localStorage.getItem("asBoqInternetPriceSources"));
    return Array.isArray(saved) && saved.length ? saved : DEFAULT_PRICE_SOURCES;
  } catch {
    return DEFAULT_PRICE_SOURCES;
  }
}

export function writePriceSources(sources) {
  localStorage.setItem("asBoqInternetPriceSources", JSON.stringify(sources));
}

function pick(obj, path) {
  return String(path || "").split(".").filter(Boolean).reduce((value, key) => value?.[key], obj);
}

export async function fetchSourcePrices(source, query) {
  if (!source?.url) throw new Error("Kaynak URL'si tanımlı değil.");
  const endpoint = new URL(source.url);
  if (query) endpoint.searchParams.set(source.queryParam || "q", query);
  const response = await fetch(endpoint.toString(), { headers: source.headers || {} });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const payload = await response.json();
  const rows = Array.isArray(payload) ? payload : (pick(payload, source.itemsPath || "items") || payload.results || payload.data || []);
  if (!Array.isArray(rows)) throw new Error("API cevabında ürün listesi bulunamadı.");
  const m = source.mapping || {};
  return rows.map((item, index) => ({
    id: `${source.id}-${index}`,
    sourceId: source.id,
    sourceName: source.name,
    name: pick(item, m.name || "name") || "Ürün",
    brand: pick(item, m.brand || "brand") || "",
    model: pick(item, m.model || "model") || "",
    price: Number(pick(item, m.price || "price")) || 0,
    unit: pick(item, m.unit || "unit") || "adet",
    currency: pick(item, m.currency || "currency") || "TRY",
    date: pick(item, m.date || "date") || new Date().toISOString().slice(0, 10),
    productUrl: pick(item, m.url || "url") || "",
    raw: item,
  })).filter((item) => item.price > 0);
}

export function scorePriceMatch(resource, candidate) {
  const wanted = normalize(`${resource?.name || ""} ${resource?.brand || ""} ${resource?.model || ""}`);
  const offered = normalize(`${candidate?.name || ""} ${candidate?.brand || ""} ${candidate?.model || ""}`);
  if (!wanted || !offered) return 0;
  const tokens = wanted.split(" ").filter((x) => x.length > 2);
  return tokens.reduce((score, token) => score + (offered.includes(token) ? 1 : 0), 0) / Math.max(tokens.length, 1);
}

export async function searchInternetPrices(sources, query) {
  const enabled = sources.filter((source) => source.enabled && source.url);
  const settled = await Promise.allSettled(enabled.map((source) => fetchSourcePrices(source, query)));
  const prices = settled.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  const errors = settled.flatMap((result, index) => result.status === "rejected" ? [{ source: enabled[index]?.name, message: result.reason?.message || "Bağlantı hatası" }] : []);
  return { prices, errors };
}
