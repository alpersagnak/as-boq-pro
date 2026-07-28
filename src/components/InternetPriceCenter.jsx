import { useMemo, useRef, useState } from "react";
import { useProjects } from "../context/ProjectContext";
import { formatMoney } from "../utils/calculations";
import {
  appendPriceHistory, convertToTry, fetchExchangeRates, parsePriceCsv,
  readPriceHistory, readPriceSources, scorePriceMatch, searchInternetPrices, writePriceSources
} from "../lib/internetPriceService";

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
  const [history, setHistory] = useState(readPriceHistory);
  const [rates, setRates] = useState({ TRY: 1 });
  const [manual, setManual] = useState({ name:"", brand:"", model:"", price:"", unit:"adet", currency:"TRY", sourceName:"Kullanıcı Teklifi" });
  const fileRef = useRef(null);

  const resources = useMemo(() => allResources(activeProject), [activeProject]);
  const selected = resources.find(({ row, resource }) => `${row.id}:${resource.id}` === selectedKey);
  const saveSources = (next) => { setSources(next); writePriceSources(next); };
  const updateSource = (id, patch) => saveSources(sources.map((source) => source.id === id ? { ...source, ...patch } : source));
  const rankedResults = useMemo(() => results.map((item) => ({ ...item, tryPrice: convertToTry(item.price, item.currency, rates) })), [results, rates]);

  async function runSearch() {
    const text = query || selected?.resource?.name || "";
    if (!text) return notify?.("error", "Arama yapılamadı", "Bir analiz kaynağı seçin veya ürün adı yazın.");
    setLoading(true);
    const response = await searchInternetPrices(sources, text);
    const ranked = response.prices.map((item) => ({ ...item, matchScore: scorePriceMatch(selected?.resource || { name: text }, item) })).sort((a,b)=>b.matchScore-a.matchScore||a.price-b.price);
    setResults(ranked); setErrors(response.errors); setLoading(false);
  }

  async function updateRates() {
    try { const next = await fetchExchangeRates(); setRates(next); notify?.("success","Kurlar güncellendi",`USD, EUR ve GBP kurları alındı.`); }
    catch (e) { notify?.("error","Kur alınamadı",e.message); }
  }

  function applyPrice(candidate) {
    if (!selected) return notify?.("error","Kaynak seçilmedi","Önce analizdeki malzeme veya işçilik satırını seçin.");
    const tryPrice = convertToTry(candidate.price, candidate.currency, rates) || candidate.price;
    dispatch({ type:"UPDATE_RESOURCE", projectId:activeProject.id, rowId:selected.row.id, resourceType:selected.resourceType, resourceId:selected.resource.id,
      patch:{ unitPrice:tryPrice, priceSource:`${candidate.sourceName}`, priceDate:candidate.date, priceMode:candidate.sourceId === "manual" ? "user" : "internet", brand:candidate.brand||selected.resource.brand, model:candidate.model||selected.resource.model, productUrl:candidate.productUrl, currency:"TRY", originalPrice:candidate.price, originalCurrency:candidate.currency } });
    setHistory(appendPriceHistory({ resourceName:selected.resource.name, pozNo:selected.row.pozNo, ...candidate, appliedTryPrice:tryPrice }));
    notify?.("success","Fiyat uygulandı",`${candidate.name} fiyatı ${formatMoney(tryPrice,"TRY")} olarak analize aktarıldı.`);
  }

  function addManual() {
    const price = Number(String(manual.price).replace(",","."));
    if (!manual.name || !price) return notify?.("error","Eksik bilgi","Ürün adı ve fiyat girin.");
    const item = { ...manual, price, id:`manual-${Date.now()}`, sourceId:"manual", date:new Date().toISOString().slice(0,10), productUrl:"", matchScore:scorePriceMatch(selected?.resource||{name:query},manual) };
    setResults((x)=>[item,...x]); setManual({...manual,name:"",brand:"",model:"",price:""});
  }

  async function importCsv(event) {
    const file = event.target.files?.[0]; if (!file) return;
    const rows = parsePriceCsv(await file.text(), file.name);
    setResults((x)=>[...rows.map((r)=>({...r,matchScore:scorePriceMatch(selected?.resource||{name:query},r)})),...x]);
    notify?.("success","Fiyat listesi yüklendi",`${rows.length} fiyat satırı içe aktarıldı.`); event.target.value="";
  }

  return <>
    <article className="internet-price-hero"><div><span className="eyebrow">A.S BOQ PRICE HUB v13</span><h2>Canlı Fiyat, Teklif ve Kur Merkezi</h2><p>İnternet API’leri, bayi teklifleri ve Excel/CSV fiyat listelerini tek ekranda karşılaştırıp analize aktarın.</p></div><div className="price-hero-actions"><button onClick={updateRates}>💱 Kurları Güncelle</button><button onClick={()=>setShowSources(!showSources)}>⚙ Fiyat Kaynakları</button></div></article>

    <article className="price-kpi-grid"><div><span>Sonuç</span><strong>{results.length}</strong></div><div><span>Fiyat geçmişi</span><strong>{history.length}</strong></div><div><span>USD / TRY</span><strong>{rates.USD ? rates.USD.toFixed(2) : "—"}</strong></div><div><span>EUR / TRY</span><strong>{rates.EUR ? rates.EUR.toFixed(2) : "—"}</strong></div></article>

    {showSources && <article className="price-source-card"><div className="table-title"><div><h3>Kullanıcı Tanımlı İnternet Kaynakları</h3><span>JSON API, bayi veya şirket fiyat servisi URL’si tanımlayın.</span></div><button className="primary" onClick={()=>saveSources([...sources,{id:crypto.randomUUID(),name:"Yeni Kaynak",type:"json",url:"",enabled:true,queryParam:"q",itemsPath:"items",mapping:{name:"name",brand:"brand",model:"model",price:"price",unit:"unit",currency:"currency",date:"date",url:"url"}}])}>+ Kaynak Ekle</button></div>{sources.map(source=><div className="price-source-row" key={source.id}><input type="checkbox" checked={source.enabled} onChange={e=>updateSource(source.id,{enabled:e.target.checked})}/><input value={source.name} onChange={e=>updateSource(source.id,{name:e.target.value})}/><input value={source.url} onChange={e=>updateSource(source.id,{url:e.target.value})} placeholder="https://api.firma.com/products"/><input value={source.itemsPath||""} onChange={e=>updateSource(source.id,{itemsPath:e.target.value})} placeholder="items"/><button className="danger-outline" onClick={()=>saveSources(sources.filter(x=>x.id!==source.id))}>Sil</button></div>)}<p className="muted-text">CORS izni vermeyen kaynaklar için Supabase Edge Function / sunucu proxy’si gerekir.</p></article>}

    <article className="internet-search-card"><label>Analizdeki kaynak</label><select value={selectedKey} onChange={e=>{setSelectedKey(e.target.value);const f=resources.find(({row,resource})=>`${row.id}:${resource.id}`===e.target.value);if(f)setQuery(`${f.resource.brand||""} ${f.resource.name}`.trim())}}><option value="">Kaynak seçin...</option>{resources.map(({row,resource,resourceType})=><option key={`${row.id}:${resource.id}`} value={`${row.id}:${resource.id}`}>{row.pozNo} · {resource.name} · {resourceType}</option>)}</select><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Örn. Dalsan Premium 12.5 mm"/><button className="primary" disabled={loading} onClick={runSearch}>{loading?"Aranıyor...":"🌐 İnternetten Fiyat Ara"}</button></article>

    <article className="manual-price-card"><div><h3>Kullanıcı Teklifi / Manuel Fiyat</h3><p>Tedarikçiden aldığınız fiyatı ekleyin veya Excel/CSV listesini yükleyin.</p></div><div className="manual-price-grid"><input placeholder="Ürün adı" value={manual.name} onChange={e=>setManual({...manual,name:e.target.value})}/><input placeholder="Marka" value={manual.brand} onChange={e=>setManual({...manual,brand:e.target.value})}/><input placeholder="Model" value={manual.model} onChange={e=>setManual({...manual,model:e.target.value})}/><input placeholder="Fiyat" value={manual.price} onChange={e=>setManual({...manual,price:e.target.value})}/><select value={manual.currency} onChange={e=>setManual({...manual,currency:e.target.value})}><option>TRY</option><option>USD</option><option>EUR</option><option>GBP</option></select><input placeholder="Tedarikçi / kaynak" value={manual.sourceName} onChange={e=>setManual({...manual,sourceName:e.target.value})}/><button className="primary" onClick={addManual}>+ Fiyat Ekle</button><button onClick={()=>fileRef.current?.click()}>📄 CSV Yükle</button><input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={importCsv}/></div></article>

    {errors.length>0&&<article className="price-errors"><strong>Bazı kaynaklara ulaşılamadı:</strong> {errors.map(e=>`${e.source}: ${e.message}`).join(" · ")}</article>}
    <article className="resource-picker internet-results"><table><thead><tr><th>Ürün</th><th>Marka / Model</th><th>Birim</th><th>Orijinal Fiyat</th><th>TL Karşılığı</th><th>Kaynak</th><th>Uyum</th><th>İşlem</th></tr></thead><tbody>{rankedResults.map(item=><tr key={item.id}><td>{item.name}</td><td>{item.brand}<br/><small>{item.model}</small></td><td>{item.unit}</td><td><strong>{formatMoney(item.price,item.currency)}</strong></td><td><strong>{item.tryPrice?formatMoney(item.tryPrice,"TRY"):"Kur gerekli"}</strong></td><td>{item.sourceName}<br/><small>{item.date}</small></td><td>%{Math.round((item.matchScore||0)*100)}</td><td><button className="small-primary" onClick={()=>applyPrice(item)}>Analize Uygula</button></td></tr>)}{!results.length&&<tr><td colSpan="8" className="empty-cell">İnternet araması yapın, manuel fiyat ekleyin veya CSV yükleyin.</td></tr>}</tbody></table></article>

    <article className="price-history-card"><div className="table-title"><div><h3>Uygulanan Fiyat Geçmişi</h3><span>Son uygulanan internet ve kullanıcı fiyatları.</span></div></div><table><thead><tr><th>Poz</th><th>Kaynak</th><th>Ürün</th><th>Uygulanan TL</th><th>Tarih</th></tr></thead><tbody>{history.slice(0,20).map(h=><tr key={h.id}><td>{h.pozNo}</td><td>{h.sourceName}</td><td>{h.resourceName}</td><td>{formatMoney(h.appliedTryPrice||h.price,"TRY")}</td><td>{new Date(h.savedAt).toLocaleString("tr-TR")}</td></tr>)}{!history.length&&<tr><td colSpan="5" className="empty-cell">Henüz fiyat uygulanmadı.</td></tr>}</tbody></table></article>
  </>;
}
