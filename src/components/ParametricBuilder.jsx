import { useEffect, useMemo, useState } from "react";
import { useProjects } from "../context/ProjectContext";
import { analyzeBoqRow, formatMoney } from "../utils/calculations";

const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
const n = (v) => Number(v) || 0;
const TEMPLATE_KEY = "asboq_parametric_wall_templates_v1";

const boardTypes = [
  "Standart Alçıpan 12,5 mm",
  "Suya Dayanıklı Alçıpan 12,5 mm",
  "Yangına Dayanıklı Alçıpan 12,5 mm",
  "Darbe Dayanımlı Alçıpan 12,5 mm",
  "Akustik Alçıpan 12,5 mm",
];


const systemPresets = [
  { id: "custom", label: "Özel sistem / kullanıcı reçetesi" },
  { id: "w111", label: "W111 tipi — tek karkas, tek kat levha", patch: { wallType:"Tek karkas", profilePreset:"g75", profileMaterial:"Galvaniz profil", studWidth:75, profileFaceWidth:50, studThickness:0.6, studSpacing:60, leftLayers:1, rightLayers:1, insulation:"Taş yünü", insulationThickness:50, insulationDensity:40, systemCode:"W111 tipi", fireRating:"Üretici föyünden doğrulanacak", acousticRating:"Üretici föyünden doğrulanacak" } },
  { id: "w112", label: "W112 tipi — tek karkas, çift kat levha", patch: { wallType:"Tek karkas", profilePreset:"g75", profileMaterial:"Galvaniz profil", studWidth:75, profileFaceWidth:50, studThickness:0.6, studSpacing:60, leftLayers:2, rightLayers:2, insulation:"Taş yünü", insulationThickness:50, insulationDensity:50, systemCode:"W112 tipi", fireRating:"Üretici föyünden doğrulanacak", acousticRating:"Üretici föyünden doğrulanacak" } },
  { id: "w115", label: "W115 tipi — çift karkas, çift kat levha", patch: { wallType:"Çift karkas", profileGap:20, profilePreset:"g75", profileMaterial:"Galvaniz profil", studWidth:75, profileFaceWidth:50, studThickness:0.6, studSpacing:60, leftLayers:2, rightLayers:2, insulation:"Taş yünü", insulationThickness:50, insulationDensity:50, systemCode:"W115 tipi", fireRating:"Üretici föyünden doğrulanacak", acousticRating:"Üretici föyünden doğrulanacak" } },
  { id: "impact", label: "Darbe dayanımlı — siyah profil, çift kat", patch: { wallType:"Tek karkas", profilePreset:"b6040", profileMaterial:"Siyah profil", studWidth:60, profileFaceWidth:40, studThickness:2, studSpacing:40, leftBoard:"Darbe Dayanımlı Alçıpan 12,5 mm", rightBoard:"Darbe Dayanımlı Alçıpan 12,5 mm", leftLayers:2, rightLayers:2, insulation:"Taş yünü", insulationThickness:50, insulationDensity:50, systemCode:"Özel darbe dayanımlı sistem", fireRating:"Proje şartnamesine göre", acousticRating:"Akustik hesapla doğrulanacak" } },
];

const profilePresets = [
  { id: "custom", label: "Özel ölçü / kullanıcı girişi" },
  { id: "g50", label: "Galvaniz CW/UW 50 mm", material: "Galvaniz profil", depth: 50, face: 50, thickness: 0.6 },
  { id: "g75", label: "Galvaniz CW/UW 75 mm", material: "Galvaniz profil", depth: 75, face: 50, thickness: 0.6 },
  { id: "g100", label: "Galvaniz CW/UW 100 mm", material: "Galvaniz profil", depth: 100, face: 50, thickness: 0.6 },
  { id: "b4040", label: "Siyah kutu profil 40×40×2 mm", material: "Siyah profil", depth: 40, face: 40, thickness: 2 },
  { id: "b5050", label: "Siyah kutu profil 50×50×2 mm", material: "Siyah profil", depth: 50, face: 50, thickness: 2 },
  { id: "b6040", label: "Siyah kutu profil 60×40×2 mm", material: "Siyah profil", depth: 60, face: 40, thickness: 2 },
  { id: "b8040", label: "Siyah kutu profil 80×40×2 mm", material: "Siyah profil", depth: 80, face: 40, thickness: 2 },
];

const initialConfig = {
  templateName: "",
  systemPreset: "custom",
  systemCode: "Özel sistem",
  manufacturer: "Kullanıcı tanımlı",
  fireRating: "Belirtilmedi",
  acousticRating: "Belirtilmedi",
  acousticTarget: 50,
  acousticSealQuality: "İyi",
  acousticFlankingPenalty: 3,
  maxRecommendedHeight: 3.5,
  technicalNote: "Nihai teknik değerleri üretici sistem föyü ve proje şartnamesi ile doğrulayın.",
  wallType: "Tek karkas",
  profileGap: 20,
  profilePreset: "g75",
  profileMaterial: "Galvaniz profil",
  syncSecondProfile: true,
  secondProfilePreset: "g75",
  secondProfileMaterial: "Galvaniz profil",
  length: 10,
  height: 3,
  openings: [],
  studWidth: 75,
  profileFaceWidth: 50,
  studThickness: 0.6,
  secondStudWidth: 75,
  secondProfileFaceWidth: 50,
  secondStudThickness: 0.6,
  studSpacing: 60,
  leftBoard: "Darbe Dayanımlı Alçıpan 12,5 mm",
  leftLayers: 2,
  rightBoard: "Darbe Dayanımlı Alçıpan 12,5 mm",
  rightLayers: 2,
  insulation: "Taş yünü",
  insulationThickness: 50,
  insulationDensity: 50,
  wastePercent: 5,
  wasteBoard: 8,
  wasteProfile: 3,
  wasteInsulation: 5,
  wasteAccessory: 10,
  includeAcousticTape: true,
  includeJointMaterials: true,
  materialPrices: {
    stud: 78,
    track: 72,
    board: 285,
    insulation: 190,
    screw: 1.15,
    jointTape: 8,
    jointCompound: 28,
    acousticTape: 18,
    dowel: 4.5,
  },
  laborPrice: 420,
};

function resource(name, unit, consumption, unitPrice, wastePercent = 0, note = "") {
  return { id: uid(), resourcePoz: "PAR-AM", name, unit, category: "Parametrik Alçıpan", consumption, unitPrice, wastePercent, note };
}

function getWallMetrics(c) {
  const grossArea = Math.max(n(c.length), 0) * Math.max(n(c.height), 0);
  const openingArea = (c.openings || []).reduce((sum, item) => sum + Math.max(n(item.width), 0) * Math.max(n(item.height), 0) * Math.max(n(item.quantity), 0), 0);
  const netArea = Math.max(grossArea - openingArea, 0.01);
  const openingPerimeter = (c.openings || []).reduce((sum, item) => sum + 2 * (Math.max(n(item.width), 0) + Math.max(n(item.height), 0)) * Math.max(n(item.quantity), 0), 0);
  return { grossArea, openingArea, netArea, openingPerimeter };
}

function buildRecipe(c) {
  const spacing = Math.max(n(c.studSpacing), 1) / 100;
  const height = Math.max(n(c.height), 0.1);
  const frameMultiplier = c.wallType === "Çift karkas" ? 2 : 1;
  const boardLayers = n(c.leftLayers) + n(c.rightLayers);
  const metrics = getWallMetrics(c);
  const extraOpeningProfilePerM2 = metrics.openingPerimeter * frameMultiplier / metrics.netArea;
  const studPerM2 = (1 / spacing) * frameMultiplier + extraOpeningProfilePerM2;
  const trackPerM2 = (2 / height) * frameMultiplier;
  const insulationPerM2 = c.insulation === "Yok" ? 0 : frameMultiplier;
  const screwPerM2 = boardLayers * 16;
  const jointTapePerM2 = boardLayers * 0.85;
  const jointCompoundPerM2 = boardLayers * 0.32;
  const acousticTapePerM2 = c.includeAcousticTape ? trackPerM2 : 0;
  const dowelPerM2 = trackPerM2 * 1.7;

  const makeProfileNames = (material, depth, face, thickness, suffix = "") => {
    const isBlack = material === "Siyah profil";
    const section = `${n(depth)}x${n(face)}x${n(thickness)} mm`;
    return {
      vertical: isBlack ? `Siyah kutu profil ${section} dikme${suffix}` : `Galvaniz CW ${n(depth)}/${n(thickness)} mm dikme profil${suffix}`,
      horizontal: isBlack ? `Siyah kutu profil ${section} taban-tavan${suffix}` : `Galvaniz UW ${n(depth)}/${n(thickness)} mm taban-tavan profil${suffix}`,
    };
  };
  const p1 = makeProfileNames(c.profileMaterial, c.studWidth, c.profileFaceWidth, c.studThickness, c.wallType === "Çift karkas" ? " — 1. karkas" : "");
  const p2 = makeProfileNames(c.secondProfileMaterial, c.secondStudWidth, c.secondProfileFaceWidth, c.secondStudThickness, " — 2. karkas");
  const oneFrameStud = studPerM2 / frameMultiplier;
  const oneFrameTrack = trackPerM2 / frameMultiplier;

  const materials = [
    resource(p1.vertical, "m", oneFrameStud, n(c.materialPrices.stud), n(c.wasteProfile), `${c.studSpacing} cm aks; açıklık çevresi dahil`),
    resource(p1.horizontal, "m", oneFrameTrack, n(c.materialPrices.track), n(c.wasteProfile)),
    ...(c.wallType === "Çift karkas" ? [
      resource(p2.vertical, "m", oneFrameStud, n(c.materialPrices.stud), n(c.wasteProfile), `${c.studSpacing} cm aks; açıklık çevresi dahil`),
      resource(p2.horizontal, "m", oneFrameTrack, n(c.materialPrices.track), n(c.wasteProfile)),
    ] : []),
    resource(c.leftBoard, "m²", n(c.leftLayers), n(c.materialPrices.board), n(c.wasteBoard), `1. yüz ${c.leftLayers} kat`),
    resource(c.rightBoard, "m²", n(c.rightLayers), n(c.materialPrices.board), n(c.wasteBoard), `2. yüz ${c.rightLayers} kat`),
    ...(insulationPerM2 ? [resource(`${c.insulation} ${c.insulationThickness} mm ${c.insulationDensity} kg/m³`, "m²", insulationPerM2, n(c.materialPrices.insulation), n(c.wasteInsulation))] : []),
    resource("Alçıpan vidası", "adet", screwPerM2, n(c.materialPrices.screw), n(c.wasteAccessory)),
    resource("Profil sabitleme dübeli", "adet", dowelPerM2, n(c.materialPrices.dowel), n(c.wasteAccessory)),
    ...(c.includeJointMaterials ? [
      resource("Derz bandı", "m", jointTapePerM2, n(c.materialPrices.jointTape), n(c.wasteAccessory)),
      resource("Derz dolgu alçısı", "kg", jointCompoundPerM2, n(c.materialPrices.jointCompound), n(c.wasteAccessory)),
    ] : []),
    ...(c.includeAcousticTape ? [resource("Akustik yalıtım bandı", "m", acousticTapePerM2, n(c.materialPrices.acousticTape), n(c.wasteAccessory))] : []),
  ];

  const labors = [resource("Alçıpan bölme duvar montaj işçiliği", "m²", 1, n(c.laborPrice), 0, "Profil, levha, yalıtım ve derz uygulaması")];
  return { materials, labors, metrics };
}

function getAcousticEstimate(c) {
  const layers = n(c.leftLayers) + n(c.rightLayers);
  const boardBonus = Math.max(layers - 2, 0) * 4.5;
  const boardTypeBonus = [c.leftBoard, c.rightBoard].reduce((sum, name) => sum + (name.includes("Akustik") ? 2.5 : name.includes("Darbe") ? 1.5 : 0), 0);
  const frameBonus = c.wallType === "Çift karkas" ? 9 : 0;
  const cavityGapBonus = c.wallType === "Çift karkas" ? Math.min(Math.max(n(c.profileGap), 0) / 20 * 1.5, 4.5) : 0;
  const effectiveDepth = c.wallType === "Çift karkas" ? (n(c.studWidth) + n(c.secondStudWidth)) / 2 : n(c.studWidth);
  const depthBonus = Math.min(Math.max((effectiveDepth - 50) / 25, 0) * 1.8, 5.5);
  const asymmetricFrameBonus = c.wallType === "Çift karkas" && Math.abs(n(c.studWidth) - n(c.secondStudWidth)) >= 20 ? 1 : 0;
  const insulationBonus = c.insulation === "Yok" ? 0 : Math.min(3 + n(c.insulationThickness) / 25 + n(c.insulationDensity) / 40, 8);
  const spacingBonus = n(c.studSpacing) <= 40 ? 1.5 : 0;
  const tapeBonus = c.includeAcousticTape ? 2 : 0;
  const sealPenalty = c.acousticSealQuality === "Zayıf" ? 7 : c.acousticSealQuality === "Orta" ? 3 : 0;
  const openingRatio = getWallMetrics(c).openingArea / Math.max(getWallMetrics(c).grossArea, 0.01);
  const openingPenalty = Math.min(openingRatio * 18, 8);
  const flankingPenalty = Math.max(n(c.acousticFlankingPenalty), 0);
  const base = 34;
  const estimatedRw = Math.max(25, Math.min(75, base + boardBonus + boardTypeBonus + frameBonus + cavityGapBonus + depthBonus + asymmetricFrameBonus + insulationBonus + spacingBonus + tapeBonus - sealPenalty - openingPenalty - flankingPenalty));
  const target = Math.max(n(c.acousticTarget), 0);
  const margin = estimatedRw - target;
  const className = estimatedRw >= 60 ? "Çok yüksek" : estimatedRw >= 55 ? "Yüksek" : estimatedRw >= 50 ? "İyi" : estimatedRw >= 45 ? "Orta" : "Temel";
  return { estimatedRw, target, margin, className, openingPenalty, sealPenalty, flankingPenalty };
}

function getWarnings(c) {
  const warnings = [];
  const acoustic = getAcousticEstimate(c);
  if (c.wallType === "Çift karkas" && n(c.profileGap) < 0) warnings.push("Profiller arası boşluk negatif olamaz.");
  const totalBoardLayers = n(c.leftLayers) + n(c.rightLayers);
  if (n(c.height) > n(c.maxRecommendedHeight || 4)) warnings.push(`Girilen duvar yüksekliği (${n(c.height).toFixed(2)} m), teknik karttaki önerilen azami yüksekliği (${n(c.maxRecommendedHeight).toFixed(2)} m) aşıyor.`);
  if (n(c.height) > 4 && c.wallType === "Tek karkas" && n(c.studWidth) < 100) {
    warnings.push("4 m üzerindeki duvarlarda tek karkas ve 100 mm altı profil için statik/üretici sistem kontrolü önerilir.");
  }
  if (n(c.height) > 3.5 && n(c.studSpacing) > 40) {
    warnings.push("Yüksek duvarlarda 60 cm aks yerine 40 cm aks değerlendirilmelidir.");
  }
  if ((c.leftBoard.includes("Yangına") || c.rightBoard.includes("Yangına")) && c.insulation === "Yok") {
    warnings.push("Yangına dayanımlı levha seçildi ancak dolgu yok. Sistem şartnamesindeki yalıtım gereksinimini kontrol edin.");
  }
  const shallowFrame = c.wallType === "Çift karkas" ? Math.min(n(c.studWidth), n(c.secondStudWidth)) : n(c.studWidth);
  if (c.insulation !== "Yok" && n(c.insulationThickness) > shallowFrame) {
    warnings.push("Yalıtım kalınlığı karkaslardan en az birinin derinliğinden büyük. Sıkışma veya ayrı yalıtım katmanı kontrol edilmelidir.");
  }
  if (c.wallType === "Çift karkas" && (n(c.secondStudWidth) < 20 || n(c.secondProfileFaceWidth) < 20)) warnings.push("2. karkas profil ölçüleri çok düşük görünüyor.");
  if (c.profileMaterial === "Siyah profil" && n(c.studThickness) < 1.5) {
    warnings.push("Siyah kutu profil et kalınlığı düşük görünüyor; tedarik ve taşıma gereksinimini doğrulayın.");
  }
  if (totalBoardLayers < 2) warnings.push("Toplam levha katı düşük. Darbe, akustik ve yangın performansı için sistem gereksinimlerini kontrol edin.");
  if (acoustic.margin < 0) warnings.push(`Ön akustik tahmin hedefin ${Math.abs(acoustic.margin).toFixed(1)} dB altında. Katman, karkas ayrımı, yalıtım ve sızdırmazlık geliştirilmelidir.`);
  if (c.acousticSealQuality === "Zayıf") warnings.push("Zayıf çevre sızdırmazlığı akustik performansı ciddi biçimde düşürebilir. Akustik mastik ve kesintisiz bant önerilir.");
  return warnings;
}

function Layer({ label, size, kind }) {
  return <div className={`section-layer ${kind}`} style={{ flexGrow: Math.max(size, 10) }}><span>{label}</span><b>{size} mm</b></div>;
}

export default function ParametricBuilder({ notify, onNavigate }) {
  const { activeProject, dispatch } = useProjects();
  const [selectedRowId, setSelectedRowId] = useState("");
  const [config, setConfig] = useState(initialConfig);
  const [templates, setTemplates] = useState(() => {
    try { return JSON.parse(localStorage.getItem(TEMPLATE_KEY) || "[]"); } catch { return []; }
  });

  const rows = activeProject?.boqRows || [];
  const selectedRow = rows.find((r) => r.id === selectedRowId);
  const recipe = useMemo(() => buildRecipe(config), [config]);
  const warnings = useMemo(() => getWarnings(config), [config]);
  const acoustic = useMemo(() => getAcousticEstimate(config), [config]);
  const previewRow = useMemo(() => ({ materials: recipe.materials, labors: recipe.labors, equipments: [], transports: [], analysisSettings: selectedRow?.analysisSettings || {} }), [recipe, selectedRow]);
  const analysis = analyzeBoqRow(previewRow);
  const metrics = recipe.metrics;
  const profileGap = config.wallType === "Çift karkas" ? Math.max(n(config.profileGap), 0) : 0;
  const frameThickness = config.wallType === "Çift karkas" ? n(config.studWidth) + n(config.secondStudWidth) : n(config.studWidth);
  const finishedThickness = frameThickness + profileGap + (n(config.leftLayers) + n(config.rightLayers)) * 12.5;

  useEffect(() => { localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates)); }, [templates]);

  const set = (key, value) => setConfig((old) => ({ ...old, [key]: value }));
  const setPrice = (key, value) => setConfig((old) => ({ ...old, materialPrices: { ...old.materialPrices, [key]: value } }));

  function selectSystemPreset(id) {
    const preset = systemPresets.find((item) => item.id === id);
    setConfig((old) => preset?.patch ? { ...old, ...preset.patch, systemPreset:id } : { ...old, systemPreset:id });
  }

  function selectPreset(id) {
    const preset = profilePresets.find((item) => item.id === id);
    setConfig((old) => preset?.material ? { ...old, profilePreset: id, profileMaterial: preset.material, studWidth: preset.depth, profileFaceWidth: preset.face, studThickness: preset.thickness, ...(old.syncSecondProfile ? { secondProfilePreset:id, secondProfileMaterial:preset.material, secondStudWidth:preset.depth, secondProfileFaceWidth:preset.face, secondStudThickness:preset.thickness } : {}) } : { ...old, profilePreset: id });
  }

  function selectSecondPreset(id) {
    const preset = profilePresets.find((item) => item.id === id);
    setConfig((old) => preset?.material ? { ...old, secondProfilePreset:id, secondProfileMaterial:preset.material, secondStudWidth:preset.depth, secondProfileFaceWidth:preset.face, secondStudThickness:preset.thickness } : { ...old, secondProfilePreset:id });
  }

  function setSecondSync(checked) {
    setConfig((old) => checked ? { ...old, syncSecondProfile:true, secondProfilePreset:old.profilePreset, secondProfileMaterial:old.profileMaterial, secondStudWidth:old.studWidth, secondProfileFaceWidth:old.profileFaceWidth, secondStudThickness:old.studThickness } : { ...old, syncSecondProfile:false });
  }

  function saveTemplate() {
    const name = config.templateName.trim();
    if (!name) return notify?.("error", "Şablon adı gerekli", "Kaydetmeden önce şablona bir ad verin.");
    const item = { id: uid(), name, config: { ...config, templateName: name } };
    setTemplates((old) => [item, ...old.filter((x) => x.name.toLocaleLowerCase("tr") !== name.toLocaleLowerCase("tr"))].slice(0, 30));
    notify?.("success", "Şablon kaydedildi", `${name} daha sonra yeniden kullanılabilir.`);
  }

  function addOpening() {
    setConfig((old) => ({ ...old, openings: [...(old.openings || []), { id: uid(), type: "Kapı", width: 0.9, height: 2.1, quantity: 1 }] }));
  }

  function updateOpening(id, key, value) {
    setConfig((old) => ({ ...old, openings: (old.openings || []).map((item) => item.id === id ? { ...item, [key]: value } : item) }));
  }

  function removeOpening(id) {
    setConfig((old) => ({ ...old, openings: (old.openings || []).filter((item) => item.id !== id) }));
  }

  function applyRecipe() {
    if (!selectedRow) return notify?.("error", "Poz seçilmedi", "Reçetenin uygulanacağı BOQ satırını seçin.");
    dispatch({
      type: "UPDATE_BOQ_ROW",
      projectId: activeProject.id,
      rowId: selectedRow.id,
      patch: { materials: recipe.materials, labors: recipe.labors, equipments: [], transports: [], parametricConfig: { type: "drywall_partition", ...config } },
    });
    notify?.("success", "Reçete uygulandı", `${selectedRow.pozNo} pozunun malzeme ve işçilik analizi oluşturuldu.`);
  }

  return <section className="parametric-page">
    <div className="builder-hero">
      <div><small>PARAMETRİK İMALAT MOTORU</small><h2>Alçıpan Bölme Duvar Oluşturucu</h2><p>Profil, katman, yalıtım ve fiyatları seçin; reçete ile canlı kesit otomatik oluşsun.</p></div>
      <button className="primary" onClick={applyRecipe}>Reçeteyi BOQ Pozuna Uygula</button>
    </div>

    <div className="builder-grid">
      <article className="card builder-form">
        <h3>1. Uygulanacak BOQ Pozu</h3>
        <select value={selectedRowId} onChange={(e)=>setSelectedRowId(e.target.value)}><option value="">Poz seçin...</option>{rows.map((row)=><option key={row.id} value={row.id}>{row.pozNo} — {row.description}</option>)}</select>
        {!rows.length && <button className="link-button" onClick={()=>onNavigate?.("boq")}>Önce BOQ satırı ekle</button>}

        <h3>2. Hazır Sistem / Reçete Başlangıcı</h3>
        <div className="builder-fields">
          <label>Hazır sistem seçimi<select value={config.systemPreset} onChange={(e)=>selectSystemPreset(e.target.value)}>{systemPresets.map((x)=><option value={x.id} key={x.id}>{x.label}</option>)}</select></label>
          <label>Sistem kodu / adı<input value={config.systemCode} onChange={(e)=>set("systemCode",e.target.value)}/></label>
          <label>Üretici / marka<input value={config.manufacturer} onChange={(e)=>set("manufacturer",e.target.value)}/></label>
        </div>

        <h3>3. Duvar Ölçüsü ve Açıklıklar</h3>
        <div className="builder-fields">
          <label>Duvar uzunluğu (m)<input type="number" min="0.1" step="0.1" value={config.length} onChange={(e)=>set("length",e.target.value)}/></label>
          <label>Duvar yüksekliği (m)<input type="number" min="0.1" step="0.1" value={config.height} onChange={(e)=>set("height",e.target.value)}/></label>
        </div>
        <div className="opening-box">
          <div className="opening-head"><div><b>Kapı / Pencere Boşlukları</b><small>Ölçüler metre olarak girilir.</small></div><button type="button" onClick={addOpening}>+ Açıklık Ekle</button></div>
          {(config.openings || []).length === 0 ? <p className="empty-opening">Henüz açıklık eklenmedi.</p> : <div className="opening-list">{config.openings.map((item)=><div className="opening-row" key={item.id}>
            <select value={item.type} onChange={(e)=>updateOpening(item.id,"type",e.target.value)}><option>Kapı</option><option>Pencere</option><option>Diğer</option></select>
            <input type="number" min="0" step="0.01" value={item.width} onChange={(e)=>updateOpening(item.id,"width",e.target.value)} placeholder="Genişlik"/>
            <input type="number" min="0" step="0.01" value={item.height} onChange={(e)=>updateOpening(item.id,"height",e.target.value)} placeholder="Yükseklik"/>
            <input type="number" min="1" step="1" value={item.quantity} onChange={(e)=>updateOpening(item.id,"quantity",e.target.value)} placeholder="Adet"/>
            <button type="button" className="danger-link" onClick={()=>removeOpening(item.id)}>Sil</button>
          </div>)}</div>}
        </div>

        <h3>4. Karkas Sistemi ve Profil Kütüphanesi</h3>
        <div className="builder-fields">
          <label>Hazır profil seçimi<select value={config.profilePreset} onChange={(e)=>selectPreset(e.target.value)}>{profilePresets.map((x)=><option value={x.id} key={x.id}>{x.label}</option>)}</select></label>
          <label>Duvar tipi<select value={config.wallType} onChange={(e)=>set("wallType",e.target.value)}><option>Tek karkas</option><option>Çift karkas</option></select></label>
          <label>Profil malzemesi<select value={config.profileMaterial} onChange={(e)=>set("profileMaterial",e.target.value)}><option>Galvaniz profil</option><option>Siyah profil</option></select></label>
          <label>Karkas / duvar derinliği (mm)<input type="number" min="20" step="1" value={config.studWidth} onChange={(e)=>{set("studWidth",e.target.value);set("profilePreset","custom");}}/></label>
          {config.wallType === "Çift karkas" && <label>İki profil arası boşluk (mm)<input type="number" min="0" step="1" value={config.profileGap} onChange={(e)=>set("profileGap",e.target.value)}/><small>Örn. 40 mm profil + 20 mm boşluk + 60 mm profil</small></label>}
          <label>Profil yüz genişliği (mm)<input type="number" min="20" step="1" value={config.profileFaceWidth} onChange={(e)=>{set("profileFaceWidth",e.target.value);set("profilePreset","custom");}}/></label>
          <label>Profil et kalınlığı (mm)<input type="number" min="0.3" step="0.1" value={config.studThickness} onChange={(e)=>{set("studThickness",e.target.value);set("profilePreset","custom");}}/></label>
          <label>Profil aks aralığı<select value={config.studSpacing} onChange={(e)=>set("studSpacing",e.target.value)}><option value="40">40 cm</option><option value="60">60 cm</option></select></label>
        </div>
        {config.wallType === "Çift karkas" && <div className="second-frame-box">
          <div className="opening-head"><div><b>2. Karkas Profil Ayarları</b><small>İkinci profil sırası birinciden farklı ölçü ve malzemede olabilir.</small></div><label className="check-label"><input type="checkbox" checked={config.syncSecondProfile} onChange={(e)=>setSecondSync(e.target.checked)}/> 1. karkas ile aynı tut</label></div>
          <div className="builder-fields">
            <label>2. profil seçimi<select disabled={config.syncSecondProfile} value={config.secondProfilePreset} onChange={(e)=>selectSecondPreset(e.target.value)}>{profilePresets.map((x)=><option value={x.id} key={x.id}>{x.label}</option>)}</select></label>
            <label>2. profil malzemesi<select disabled={config.syncSecondProfile} value={config.secondProfileMaterial} onChange={(e)=>set("secondProfileMaterial",e.target.value)}><option>Galvaniz profil</option><option>Siyah profil</option></select></label>
            <label>2. karkas derinliği (mm)<input disabled={config.syncSecondProfile} type="number" min="20" step="1" value={config.secondStudWidth} onChange={(e)=>{set("secondStudWidth",e.target.value);set("secondProfilePreset","custom");}}/></label>
            <label>2. profil yüzü (mm)<input disabled={config.syncSecondProfile} type="number" min="20" step="1" value={config.secondProfileFaceWidth} onChange={(e)=>{set("secondProfileFaceWidth",e.target.value);set("secondProfilePreset","custom");}}/></label>
            <label>2. profil et kalınlığı (mm)<input disabled={config.syncSecondProfile} type="number" min="0.3" step="0.1" value={config.secondStudThickness} onChange={(e)=>{set("secondStudThickness",e.target.value);set("secondProfilePreset","custom");}}/></label>
          </div>
          <p className="frame-equation">Kesit: {n(config.studWidth)} mm + {profileGap} mm boşluk + {n(config.secondStudWidth)} mm = <b>{(n(config.studWidth)+profileGap+n(config.secondStudWidth)).toFixed(1)} mm karkas bölgesi</b></p>
        </div>}

        <h3>5. Levha Katmanları</h3>
        <div className="builder-fields">
          <label>1. yüz levha<select value={config.leftBoard} onChange={(e)=>set("leftBoard",e.target.value)}>{boardTypes.map(x=><option key={x}>{x}</option>)}</select></label>
          <label>1. yüz kat adedi<select value={config.leftLayers} onChange={(e)=>set("leftLayers",e.target.value)}><option value="1">1 kat</option><option value="2">2 kat</option><option value="3">3 kat</option></select></label>
          <label>2. yüz levha<select value={config.rightBoard} onChange={(e)=>set("rightBoard",e.target.value)}>{boardTypes.map(x=><option key={x}>{x}</option>)}</select></label>
          <label>2. yüz kat adedi<select value={config.rightLayers} onChange={(e)=>set("rightLayers",e.target.value)}><option value="1">1 kat</option><option value="2">2 kat</option><option value="3">3 kat</option></select></label>
        </div>

        <h3>6. Yalıtım ve Aksesuarlar</h3>
        <div className="builder-fields">
          <label>Yalıtım<select value={config.insulation} onChange={(e)=>set("insulation",e.target.value)}><option>Taş yünü</option><option>Cam yünü</option><option>Süngerpan</option><option>Yok</option></select></label>
          <label>Kalınlık (mm)<input type="number" value={config.insulationThickness} onChange={(e)=>set("insulationThickness",e.target.value)}/></label>
          <label>Yoğunluk (kg/m³)<input type="number" value={config.insulationDensity} onChange={(e)=>set("insulationDensity",e.target.value)}/></label>
          <label className="check-label"><input type="checkbox" checked={config.includeAcousticTape} onChange={(e)=>set("includeAcousticTape",e.target.checked)}/> Akustik bant ekle</label>
          <label className="check-label"><input type="checkbox" checked={config.includeJointMaterials} onChange={(e)=>set("includeJointMaterials",e.target.checked)}/> Derz malzemeleri ekle</label>
        </div>

        <h3>7. Malzeme Bazlı Fire Oranları</h3>
        <div className="builder-fields">
          <label>Levha firesi (%)<input type="number" min="0" value={config.wasteBoard} onChange={(e)=>set("wasteBoard",e.target.value)}/></label>
          <label>Profil firesi (%)<input type="number" min="0" value={config.wasteProfile} onChange={(e)=>set("wasteProfile",e.target.value)}/></label>
          <label>Yalıtım firesi (%)<input type="number" min="0" value={config.wasteInsulation} onChange={(e)=>set("wasteInsulation",e.target.value)}/></label>
          <label>Aksesuar firesi (%)<input type="number" min="0" value={config.wasteAccessory} onChange={(e)=>set("wasteAccessory",e.target.value)}/></label>
        </div>

        <h3>8. Teknik Veri Kartı</h3>
        <div className="builder-fields">
          <label>Yangın dayanımı<input value={config.fireRating} onChange={(e)=>set("fireRating",e.target.value)}/></label>
          <label>Üretici ses yalıtımı / Rw<input value={config.acousticRating} onChange={(e)=>set("acousticRating",e.target.value)}/></label>
          <label>Hedef Rw (dB)<input type="number" min="25" max="75" step="1" value={config.acousticTarget} onChange={(e)=>set("acousticTarget",e.target.value)}/></label>
          <label>Çevre sızdırmazlığı<select value={config.acousticSealQuality} onChange={(e)=>set("acousticSealQuality",e.target.value)}><option>İyi</option><option>Orta</option><option>Zayıf</option></select></label>
          <label>Yan iletim / birleşim cezası (dB)<input type="number" min="0" max="15" step="0.5" value={config.acousticFlankingPenalty} onChange={(e)=>set("acousticFlankingPenalty",e.target.value)}/></label>
          <label>Önerilen azami yükseklik (m)<input type="number" step="0.1" value={config.maxRecommendedHeight} onChange={(e)=>set("maxRecommendedHeight",e.target.value)}/></label>
          <label className="wide-field">Teknik not<textarea rows="3" value={config.technicalNote} onChange={(e)=>set("technicalNote",e.target.value)}/></label>
        </div>

        <div className="template-box"><h3>9. Duvar Reçetesini Şablon Olarak Kaydet</h3><div className="template-row"><input placeholder="Örn. BD-01 Çift karkas darbe dayanımlı" value={config.templateName} onChange={(e)=>set("templateName",e.target.value)}/><button type="button" onClick={saveTemplate}>Şablonu Kaydet</button></div>{templates.length>0&&<div className="template-chips">{templates.map((item)=><button type="button" key={item.id} onClick={()=>setConfig(item.config)}>{item.name}</button>)}</div>}</div>

        <details className="price-details"><summary>Malzeme birim fiyatlarını düzenle</summary><div className="builder-fields price-grid">
          {Object.entries({stud:`${config.profileMaterial === "Siyah profil" ? "Siyah dikme profil" : "CW profil"} ₺/m`,track:`${config.profileMaterial === "Siyah profil" ? "Siyah taban-tavan profil" : "UW profil"} ₺/m`,board:"Levha ₺/m²",insulation:"Yalıtım ₺/m²",screw:"Vida ₺/adet",dowel:"Dübel ₺/adet",jointTape:"Derz bandı ₺/m",jointCompound:"Derz dolgu ₺/kg",acousticTape:"Akustik bant ₺/m"}).map(([key,label])=><label key={key}>{label}<input type="number" step="0.01" value={config.materialPrices[key]} onChange={(e)=>setPrice(key,e.target.value)}/></label>)}
          <label>İşçilik ₺/m²<input type="number" step="0.01" value={config.laborPrice} onChange={(e)=>set("laborPrice",e.target.value)}/></label>
        </div></details>
      </article>

      <aside className="builder-preview">
        <div className="kpi-grid three"><div className="kpi"><span>Malzeme</span><strong>{formatMoney(analysis.material, activeProject?.currency)}</strong></div><div className="kpi"><span>İşçilik</span><strong>{formatMoney(analysis.labor, activeProject?.currency)}</strong></div><div className="kpi highlight-kpi"><span>Birim Fiyat</span><strong>{formatMoney(analysis.total, activeProject?.currency)}</strong></div></div>

        <article className="card metric-card"><h3>Duvar Metraj Özeti</h3><div className="metric-grid"><div><span>Brüt Alan</span><b>{metrics.grossArea.toFixed(2)} m²</b></div><div><span>Açıklıklar</span><b>{metrics.openingArea.toFixed(2)} m²</b></div><div><span>Net Duvar</span><b>{metrics.netArea.toFixed(2)} m²</b></div><div><span>Açıklık Çevresi</span><b>{metrics.openingPerimeter.toFixed(2)} m</b></div></div></article>

        <article className="card technical-card"><div className="section-head"><div><h3>Teknik Sistem Kartı</h3><p>{config.systemCode}</p></div><span>{config.manufacturer}</span></div><div className="technical-grid"><div><span>Bitmiş Kalınlık</span><b>{finishedThickness.toFixed(1)} mm</b></div><div><span>Yangın Dayanımı</span><b>{config.fireRating}</b></div><div><span>Ses Yalıtımı</span><b>{config.acousticRating}</b><small>Ön tahmin: {acoustic.estimatedRw.toFixed(1)} dB</small></div><div><span>Önerilen Azami Yükseklik</span><b>{n(config.maxRecommendedHeight).toFixed(1)} m</b></div></div><p className="technical-note">{config.technicalNote}</p></article>

        <article className="card acoustic-card"><div className="section-head"><div><h3>Ön Akustik Hesap</h3><p>Katman ve birleşim girdilerine göre yaklaşık Rw tahmini</p></div><span>{acoustic.className}</span></div><div className="acoustic-score"><div><span>Tahmini Rw</span><strong>{acoustic.estimatedRw.toFixed(1)} dB</strong></div><div><span>Hedef</span><strong>{acoustic.target.toFixed(0)} dB</strong></div><div className={acoustic.margin>=0?"acoustic-pass":"acoustic-fail"}><span>Hedef farkı</span><strong>{acoustic.margin>=0?"+":""}{acoustic.margin.toFixed(1)} dB</strong></div></div><div className="acoustic-bar"><i style={{width:`${Math.min(Math.max((acoustic.estimatedRw-25)/50*100,0),100)}%`}}></i></div><div className="acoustic-factors"><span>Açıklık etkisi: -{acoustic.openingPenalty.toFixed(1)} dB</span><span>Sızdırmazlık: -{acoustic.sealPenalty.toFixed(1)} dB</span><span>Yan iletim: -{acoustic.flankingPenalty.toFixed(1)} dB</span></div><p className="acoustic-disclaimer">Bu sonuç tasarım ön değerlendirmesidir; laboratuvar testi, üretici sistem föyü veya TS EN ISO 717-1 kapsamında sertifikalı Rw değeri yerine geçmez.</p></article>

        <article className="card section-card"><div className="section-head"><div><h3>Canlı Duvar Kesiti</h3><p>Yaklaşık bitmiş kalınlık: <b>{finishedThickness.toFixed(1)} mm</b></p></div><span>{config.wallType}</span></div><div className="wall-section">
          {Array.from({length:n(config.leftLayers)}).map((_,i)=><Layer key={`l-${i}`} label={`1. yüz levha ${i+1}`} size={12.5} kind="board"/>)}
          <Layer label={config.profileMaterial === "Siyah profil" ? `Kutu profil ${n(config.studWidth)}×${n(config.profileFaceWidth)}` : `CW/UW ${n(config.studWidth)}`} size={n(config.studWidth)} kind="frame"/>
          {config.insulation!=="Yok"&&<Layer label={`${config.insulation} ${n(config.insulationThickness)} mm`} size={Math.min(n(config.insulationThickness),n(config.studWidth))} kind="insulation"/>}
          {config.wallType==="Çift karkas"&&<Layer label={`Profiller arası boşluk ${profileGap} mm`} size={Math.max(profileGap, 4)} kind="gap"/>}
          {config.wallType==="Çift karkas"&&<Layer label={`2. karkas ${n(config.secondStudWidth)} mm`} size={n(config.secondStudWidth)} kind="frame"/>}
          {Array.from({length:n(config.rightLayers)}).map((_,i)=><Layer key={`r-${i}`} label={`2. yüz levha ${i+1}`} size={12.5} kind="board"/>)}
        </div></article>

        {warnings.length>0&&<article className="smart-warnings"><h3>Akıllı Sistem Kontrolü</h3>{warnings.map((w,i)=><p key={i}>⚠ {w}</p>)}</article>}

        <article className="card recipe-card"><h3>1 m² için otomatik reçete</h3><table><thead><tr><th>Malzeme</th><th>Birim</th><th>1 m² Sarfiyat</th><th>Toplam</th><th>Tutar</th></tr></thead><tbody>{recipe.materials.map((item)=><tr key={item.id}><td>{item.name}<small>{item.note}</small></td><td>{item.unit}</td><td>{n(item.consumption).toFixed(3)}</td><td>{(n(item.consumption)*metrics.netArea*(1+n(item.wastePercent)/100)).toFixed(2)}</td><td>{formatMoney(n(item.consumption)*n(item.unitPrice)*(1+n(item.wastePercent)/100), activeProject?.currency)}</td></tr>)}</tbody></table></article>
        <div className="builder-note"><b>Hesap mantığı:</b> Duvar uzunluğu, yüksekliği, kapı-pencere boşlukları, profil tipi, aks aralığı, çift karkasta iki profilin bağımsız ölçüleri ve profiller arası boşluk, karkas sayısı, levha katları, yalıtım ve malzeme bazlı fire oranları reçeteyi otomatik değiştirir. Teknik uyarılar ön kontrol amaçlıdır; nihai seçim üretici sistem föyü, statik gereksinim ve proje şartnamesine göre doğrulanmalıdır.</div>
      </aside>
    </div>
  </section>;
}
