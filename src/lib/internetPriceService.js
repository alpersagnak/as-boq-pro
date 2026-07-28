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

const HISTORY_KEY = "asBoqPriceHistory";

export function readPriceHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch { return []; }
}

export function appendPriceHistory(entry) {
  const history = readPriceHistory();
  const next = [{ id: crypto.randomUUID(), savedAt: new Date().toISOString(), ...entry }, ...history].slice(0, 2000);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

export function parsePriceCsv(text, sourceName = "Excel / CSV") {
  const lines = String(text || "").split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const delimiter = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(delimiter).map((x) => normalize(x));
  const aliases = {
    name: ["urun", "urun adi", "malzeme", "name", "product"], brand: ["marka", "brand"],
    model: ["model", "seri"], price: ["fiyat", "birim fiyat", "price"], unit: ["birim", "unit"],
    currency: ["para birimi", "doviz", "currency"], date: ["tarih", "date"], url: ["url", "link"]
  };
  const indexOf = (key) => headers.findIndex((h) => aliases[key].includes(h));
  const idx = Object.fromEntries(Object.keys(aliases).map((key) => [key, indexOf(key)]));
  return lines.slice(1).map((line, i) => {
    const cols = line.split(delimiter).map((x) => x.trim().replace(/^"|"$/g, ""));
    const rawPrice = cols[idx.price] || "0";
    const price = Number(rawPrice.replace(/\./g, "").replace(",", ".").replace(/[^0-9.-]/g, "")) || 0;
    return {
      id: `csv-${Date.now()}-${i}`, sourceId: "csv", sourceName,
      name: cols[idx.name] || "Ürün", brand: cols[idx.brand] || "", model: cols[idx.model] || "",
      price, unit: cols[idx.unit] || "adet", currency: cols[idx.currency] || "TRY",
      date: cols[idx.date] || new Date().toISOString().slice(0, 10), productUrl: cols[idx.url] || "",
    };
  }).filter((x) => x.price > 0);
}

export async function fetchExchangeRates() {
  const response = await fetch("https://open.er-api.com/v6/latest/TRY");
  if (!response.ok) throw new Error(`Kur servisi HTTP ${response.status}`);
  const payload = await response.json();
  const rates = payload?.rates || {};
  return {
    TRY: 1,
    USD: rates.USD ? 1 / rates.USD : 0,
    EUR: rates.EUR ? 1 / rates.EUR : 0,
    GBP: rates.GBP ? 1 / rates.GBP : 0,
    updatedAt: payload.time_last_update_utc || new Date().toISOString(),
  };
}

export function convertToTry(price, currency, rates) {
  if (!price) return 0;
  if (!currency || currency === "TRY") return Number(price);
  return Number(price) * Number(rates?.[currency] || 0);
}
