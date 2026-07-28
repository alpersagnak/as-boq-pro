import { useMemo, useState } from "react";
import { useProjects } from "../context/ProjectContext";
import { DISCIPLINES, disciplineLabel } from "../data/disciplines";
import { PROJECT_TYPES, buildWizardBoq } from "../data/boqWizardTemplates";

const selectableDisciplines = DISCIPLINES.filter((item) => item.id !== "all");

export default function SmartBoqWizard({ onNavigate, notify }) {
  const { activeProject, dispatch } = useProjects();
  const [step, setStep] = useState(1);
  const [projectType, setProjectType] = useState("villa");
  const [grossArea, setGrossArea] = useState(350);
  const [floors, setFloors] = useState(2);
  const [basement, setBasement] = useState(false);
  const [pool, setPool] = useState(false);
  const [disciplines, setDisciplines] = useState(["construction"]);
  const [preview, setPreview] = useState([]);
  const [openInfo, setOpenInfo] = useState(null);

  const grouped = useMemo(() => {
    const map = {};
    preview.forEach((row) => {
      (map[row.discipline] ||= []).push(row);
    });
    return map;
  }, [preview]);

  const toggleDiscipline = (id) => {
    setDisciplines((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const generatePreview = () => {
    if (!disciplines.length && !pool) {
      notify?.("error", "Disiplin seçilmedi", "En az bir disiplin seçmelisiniz.");
      return;
    }
    setPreview(buildWizardBoq({ disciplines, basement, pool, projectType }));
    setStep(3);
  };

  const addToProject = () => {
    if (!activeProject || !preview.length) return;
    const existing = new Set((activeProject.boqRows || []).map((row) => row.pozNo));
    const newItems = preview.filter((row) => !existing.has(row.pozNo));
    dispatch({ type: "ADD_BOQ_ROWS", projectId: activeProject.id, items: newItems });
    notify?.("success", "Akıllı BOQ oluşturuldu", `${newItems.length} iş kalemi projeye eklendi.`);
    onNavigate("boq");
  };

  return (
    <section className="wizard-page">
      <div className="wizard-hero">
        <div>
          <span className="wizard-kicker">A.S BOQ AKILLI ASİSTAN</span>
          <h2>İnşaat bilmeden başlangıç BOQ'su oluşturun</h2>
          <p>Basit soruları cevaplayın; sistem disiplinlere ayrılmış iş kalemlerini ve kısa teknik açıklamalarını hazırlasın.</p>
        </div>
        <div className="wizard-steps"><b className={step >= 1 ? "active" : ""}>1</b><span/><b className={step >= 2 ? "active" : ""}>2</b><span/><b className={step >= 3 ? "active" : ""}>3</b></div>
      </div>

      {step === 1 && (
        <article className="wizard-panel">
          <h3>Projenizi tanımlayın</h3>
          <div className="wizard-form-grid">
            <label><span>Proje türü</span><select value={projectType} onChange={(e) => setProjectType(e.target.value)}>{PROJECT_TYPES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
            <label><span>Yaklaşık kapalı alan (m²)</span><input type="number" min="1" value={grossArea} onChange={(e) => setGrossArea(Number(e.target.value) || 0)} /></label>
            <label><span>Kat sayısı</span><input type="number" min="1" value={floors} onChange={(e) => setFloors(Number(e.target.value) || 1)} /></label>
            <label className="wizard-check"><input type="checkbox" checked={basement} onChange={(e) => setBasement(e.target.checked)} /><span>Bodrum kat var</span></label>
            <label className="wizard-check"><input type="checkbox" checked={pool} onChange={(e) => setPool(e.target.checked)} /><span>Havuz var</span></label>
          </div>
          <div className="wizard-actions"><button className="primary-button" onClick={() => setStep(2)}>Devam Et</button></div>
        </article>
      )}

      {step === 2 && (
        <article className="wizard-panel">
          <h3>BOQ oluşturulacak disiplinleri seçin</h3>
          <p className="muted">Bir ekip yalnızca kendi disiplinini seçebilir. Proje yöneticisi birden fazla disiplin seçebilir.</p>
          <div className="discipline-card-grid">
            {selectableDisciplines.map((item) => (
              <button key={item.id} type="button" className={disciplines.includes(item.id) ? "discipline-card selected" : "discipline-card"} onClick={() => toggleDiscipline(item.id)}>
                <span className="discipline-check">{disciplines.includes(item.id) ? "✓" : "+"}</span>
                <strong>{item.label}</strong>
                <small>{item.id === "construction" ? "Kazı, betonarme, kalıp, donatı" : item.id === "architectural" ? "Duvar, sıva, boya, kaplama" : item.id === "mechanical" ? "Su, atık su, HVAC, havalandırma" : item.id === "electrical" ? "Pano, kablo, aydınlatma, priz" : "Disipline özel başlangıç pozları"}</small>
              </button>
            ))}
          </div>
          <div className="wizard-actions"><button className="secondary-button" onClick={() => setStep(1)}>Geri</button><button className="primary-button" onClick={generatePreview}>BOQ'yu Hazırla</button></div>
        </article>
      )}

      {step === 3 && (
        <article className="wizard-panel">
          <div className="wizard-summary">
            <div><span>Proje</span><strong>{PROJECT_TYPES.find((item) => item.id === projectType)?.label}</strong></div>
            <div><span>Alan</span><strong>{grossArea} m²</strong></div>
            <div><span>Kat</span><strong>{floors}</strong></div>
            <div><span>BOQ kalemi</span><strong>{preview.length}</strong></div>
          </div>
          <h3>Önerilen başlangıç BOQ'su</h3>
          <p className="muted">Bilgi düğmesine basarak ürün veya imalatın ne olduğunu görebilirsiniz. Miktarlar proje çizimleri üzerinden ayrıca girilmelidir.</p>
          <div className="wizard-preview-groups">
            {Object.entries(grouped).map(([discipline, rows]) => (
              <section key={discipline} className="wizard-preview-group">
                <header><h4>{disciplineLabel(discipline)}</h4><span>{rows.length} kalem</span></header>
                {rows.map((row) => (
                  <div className="wizard-row" key={row.pozNo}>
                    <code>{row.pozNo}</code><div><strong>{row.isKalemi}</strong><small>{row.kategori} • {row.birim}</small></div>
                    <button type="button" className="info-button" onClick={() => setOpenInfo(row)} title="Kısa bilgi">i</button>
                  </div>
                ))}
              </section>
            ))}
          </div>
          <div className="wizard-note"><strong>Önemli:</strong> Bu liste bir başlangıç taslağıdır. Statik, mimari ve tesisat projelerine göre kontrol edilmelidir.</div>
          <div className="wizard-actions"><button className="secondary-button" onClick={() => setStep(2)}>Disiplinleri Değiştir</button><button className="primary-button" onClick={addToProject}>Projeye Ekle ve BOQ'yu Aç</button></div>
        </article>
      )}

      {openInfo && <div className="modal-backdrop" onClick={() => setOpenInfo(null)}><article className="product-info-modal" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setOpenInfo(null)}>×</button><span>{disciplineLabel(openInfo.discipline)} / {openInfo.kategori}</span><h3>{openInfo.isKalemi}</h3><p>{openInfo.info}</p>{openInfo.typical && <div><strong>Tipik uygulama</strong><p>{openInfo.typical}</p></div>}<dl><div><dt>Poz</dt><dd>{openInfo.pozNo}</dd></div><div><dt>Birim</dt><dd>{openInfo.birim}</dd></div></dl></article></div>}
    </section>
  );
}
