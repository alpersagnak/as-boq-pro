import { useMemo, useState } from "react";
import { useProjects } from "../context/ProjectContext";
import { formatMoney } from "../utils/calculations";
import { readPriceSources, scorePriceMatch, searchInternetPrices, writePriceSources } from "../lib/internetPriceService";

const allResources = (project) => (project?.boqRows || []).flatMap((row) => [
  ...(row.materials || []).map((resource) => ({ row, resource, resourceType: "material" })),
  ...(row.labors || []).map((resource) => ({ row, resource, resourceType: "labor" })),
  ...(row.equipments || []).map((resource) => ({ row, resource, resourceType: "equipment" })),
  ...(row.transports || []).map((resource) => ({ row, resource, resourceType: "transport" })),
]);

export default function InternetPriceCenter({ notify }) {
  const { activeProject, dispatch } = useProjects();
  const [sources, setSources] = useState(readPriceSources);
  const [selectedKey, setSelectedKey] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSources, setShowSources] = useState(false);

  const resources = useMemo(() => allResources(activeProject), [activeProject]);
  const selected = resources.find(({ row, resource }) => `${row.id}:${resource.id}` === selectedKey);

  const saveSources = (next) => { setSources(next); writePriceSources(next); };
  const updateSource = (id, patch) => saveSources(sources.map((source) => source.id === id ? { ...source, ...patch } : source));

  async function runSearch() {
    const text = query || selected?.resource?.name || "";
    if (!text) return notify?.("error", "Arama yapılamadı", "Bir analiz kaynağı seçin veya ürün adı yazın.");
    setLoading(true);
    const response = await searchInternetPrices(sources, text);
    const ranked = response.prices
      .map((item) => ({ ...item, matchScore: scorePriceMatch(selected?.resource || { name: text }, item) }))
      .sort((a, b) => b.matchScore - a.matchScore || a.price - b.price);
    setResults(ranked);
    setErrors(response.errors);
    setLoading(false);
  }

  function applyPrice(candidate) {
    if (!selected) return;
    dispatch({
      type: "UPDATE_RESOURCE", projectId: activeProject.id, rowId: selected.row.id,
      resourceType: selected.resourceType, resourceId: selected.resource.id,
      patch: {
        unitPrice: candidate.price,
        priceSource: `İnternet: ${candidate.sourceName}`,
        priceDate: candidate.date,
        priceMode: "internet",
        brand: candidate.brand || selected.resource.brand,
        model: candidate.model || selected.resource.model,
        productUrl: candidate.productUrl,
        currency: candidate.currency,
      },
    });
    notify?.("success", "Fiyat uygulandı", `${candidate.name} için ${candidate.price} ${candidate.currency} analize aktarıldı.`);
  }

  return <>
    <article className="internet-price-hero">
      <div><span className="eyebrow">A.S BOQ LIVE PRICE</span><h2>İnternetten Fiyat Çekme Merkezi</h2><p>Analizdeki kaynağı seçin, tanımladığınız JSON API veya bayi servislerinde arayın ve fiyatı tek tıkla analize aktarın.</p></div>
      <button type="button" onClick={() => setShowSources(!showSources)}>⚙ Fiyat Kaynakları</button>
    </article>

    {showSources && <article className="price-source-card">
      <div className="table-title"><div><h3>Kullanıcı Tanımlı İnternet Kaynakları</h3><span>API, bayi veya şirket fiyat servisi URL'si tanımlayın.</span></div><button type="button" className="primary" onClick={() => saveSources([...sources, { id: crypto.randomUUID(), name: "Yeni Kaynak", type: "json", url: "", enabled: true, queryParam: "q", itemsPath: "items", mapping: { name:"name", brand:"brand", model:"model", price:"price", unit:"unit", currency:"currency", date:"date", url:"url" } }])}>+ Kaynak Ekle</button></div>
      {sources.map((source) => <div className="price-source-row" key={source.id}>
        <input type="checkbox" checked={source.enabled} onChange={(e) => updateSource(source.id, { enabled: e.target.checked })}/>
        <input value={source.name} onChange={(e) => updateSource(source.id, { name: e.target.value })} placeholder="Kaynak adı"/>
        <input value={source.url} onChange={(e) => updateSource(source.id, { url: e.target.value })} placeholder="https://api.firma.com/products"/>
        <input value={source.itemsPath || ""} onChange={(e) => updateSource(source.id, { itemsPath: e.target.value })} placeholder="items"/>
        <button type="button" className="danger-outline" onClick={() => saveSources(sources.filter((x) => x.id !== source.id))}>Sil</button>
      </div>)}
      <p className="muted-text">Tarayıcıdan doğrudan erişim için servis CORS izni vermelidir. CORS vermeyen siteler için Supabase Edge Function veya sunucu proxy'si gerekir.</p>
    </article>}

    <article className="internet-search-card">
      <label>Analizdeki kaynak</label>
      <select value={selectedKey} onChange={(e) => { setSelectedKey(e.target.value); const found = resources.find(({row,resource}) => `${row.id}:${resource.id}` === e.target.value); if (found) setQuery(`${found.resource.brand || ""} ${found.resource.name}`.trim()); }}>
        <option value="">Kaynak seçin...</option>
        {resources.map(({row, resource, resourceType}) => <option key={`${row.id}:${resource.id}`} value={`${row.id}:${resource.id}`}>{row.pozNo} · {resource.name} · {resourceType}</option>)}
      </select>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Örn. Dalsan Premium 12.5 mm"/>
      <button type="button" className="primary" disabled={loading} onClick={runSearch}>{loading ? "Aranıyor..." : "🌐 İnternetten Fiyat Ara"}</button>
    </article>

    {errors.length > 0 && <article className="price-errors"><strong>Bazı kaynaklara ulaşılamadı:</strong> {errors.map((e) => `${e.source}: ${e.message}`).join(" · ")}</article>}

    <article className="resource-picker internet-results"><table><thead><tr><th>Ürün</th><th>Marka / Model</th><th>Birim</th><th>Fiyat</th><th>Kaynak</th><th>Tarih</th><th>Uyum</th><th>İşlem</th></tr></thead><tbody>
      {results.map((item) => <tr key={item.id}><td>{item.name}</td><td>{item.brand}<br/><small>{item.model}</small></td><td>{item.unit}</td><td><strong>{formatMoney(item.price, item.currency)}</strong></td><td>{item.sourceName}{item.productUrl && <><br/><a href={item.productUrl} target="_blank" rel="noreferrer">Ürünü aç</a></>}</td><td>{item.date}</td><td>%{Math.round(item.matchScore * 100)}</td><td><button type="button" className="small-primary" disabled={!selected} onClick={() => applyPrice(item)}>Analize Uygula</button></td></tr>)}
      {!results.length && <tr><td colSpan="8" className="empty-cell">Henüz internet fiyatı aranmadı.</td></tr>}
    </tbody></table></article>
  </>;
}
