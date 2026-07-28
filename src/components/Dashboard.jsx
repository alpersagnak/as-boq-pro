import { MATERIAL_LIBRARY, LABOR_LIBRARY } from "../data/resourceLibrary";
import { POZ_LIBRARY } from "../data/pozLibrary";
import { useProjects } from "../context/ProjectContext";
import { formatMoney, projectTotal } from "../utils/calculations";
import { disciplineLabel } from "../data/disciplines";

const K = ({ l, v }) => <article className="kpi"><span>{l}</span><strong>{v}</strong></article>;

export default function Dashboard({ onNavigate }) {
  const { state, activeProject, activeDiscipline } = useProjects();
  const rows = (activeProject?.boqRows || []).filter(
    (row) => activeDiscipline === "all" || row.discipline === activeDiscipline
  );
  const scopedProject = { ...activeProject, boqRows: rows };
  const analyzed = rows.filter(
    (row) => (row.materials?.length || 0) + (row.labors?.length || 0) > 0
  ).length;

  return <>
    <div className="discipline-banner"><strong>{disciplineLabel(activeDiscipline)}</strong><span> ekibi için proje özeti</span></div>
    <section className="kpi-grid four">
      <K l="Proje" v={state.projects.length}/><K l="Poz Kütüphanesi" v={POZ_LIBRARY.length}/>
      <K l="Malzeme" v={MATERIAL_LIBRARY.length}/><K l="İşçilik" v={LABOR_LIBRARY.length}/>
    </section>
    <section className="kpi-grid four">
      <K l="Aktif BOQ Pozu" v={rows.length}/><K l="Analizli Poz" v={analyzed}/>
      <K l="Hakediş" v={activeProject?.progressPayments?.length || 0}/>
      <K l="Disiplin Toplamı" v={formatMoney(projectTotal(scopedProject), activeProject?.currency)}/>
    </section>
    <section className="two-column">
      <article className="card"><h3>Hızlı İşlemler</h3>
        <button type="button" className="quick-button" onClick={() => onNavigate("library")}>Seçili Disiplin İçin BOQ Oluştur</button>
        <button type="button" className="quick-button" onClick={() => onNavigate("analysis")}>Birim Fiyat Analizine Git</button>
        <button type="button" className="quick-button" onClick={() => onNavigate("boq")}>BOQ Tablosunu Aç</button>
      </article>
      <article className="card"><h3>Aktif Proje</h3><strong className="project-name">{activeProject?.name}</strong>
        <p>{activeProject?.code}</p><p>{activeProject?.client || "İşveren bilgisi girilmedi"}</p>
      </article>
    </section>
  </>;
}
