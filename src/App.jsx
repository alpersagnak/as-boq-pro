import { useCallback, useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./components/Dashboard";
import ProjectManager from "./components/ProjectManager";
import PozLibrary from "./components/PozLibrary";
import BOQTable from "./components/BOQTable";
import UnitPriceAnalysis from "./components/UnitPriceAnalysis";
import ProgressPayment from "./components/ProgressPayment";
import ParametricBuilder from "./components/ParametricBuilder";
import BackupTools from "./components/BackupTools";
import SyncStatus from "./components/SyncStatus";
import SmartBoqWizard from "./components/SmartBoqWizard";
import InternetPriceCenter from "./components/InternetPriceCenter";
import "./styles.css";

const titles = {
  dashboard: ["Kontrol Paneli", "Proje, BOQ ve analiz özetleri"],
  wizard: ["Akıllı BOQ Asistanı", "Basit proje bilgileriyle otomatik disiplin BOQ’su oluşturun"],
  projects: ["Projeler", "Çoklu proje yönetimi"],
  boq: ["BOQ Yönetimi", "Seçili disipline ait miktar ve analiz bazlı birim fiyatlar"],
  library: ["Poz Kütüphanesi", "Tekli veya toplu poz ekleme"],
  analysis: ["Birim Fiyat Analizi", "Malzeme ve işçilik sarfiyat analizi"],
  prices: ["Canlı İnternet Fiyatları", "API ve bayi kaynaklarından fiyat arama ve analize aktarma"],
  progress: ["Hakediş", "Dönemsel imalat, kesinti ve ödeme yönetimi"],
  parametric: ["Parametrik İmalat", "Profil kütüphanesi, canlı kesit ve akıllı reçete oluşturucu"],
  schedule: ["İş Programı", "Planlama modülü sıradaki geliştirme paketinde"],
  reports: ["Raporlar", "Raporlama modülü sıradaki geliştirme paketinde"],
};

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [selectedAnalysisRowId, setSelectedAnalysisRowId] = useState("");
  const [toast, setToast] = useState(null);

  const selectAnalysisRow = useCallback((rowId) => {
    setSelectedAnalysisRowId(rowId);
  }, []);

  const notify = useCallback((type, title, message) => {
    setToast({ id: Date.now(), type, title, message });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const [title, subtitle] = titles[page];

  return (
    <div className="app-shell">
      <Sidebar page={page} onNavigate={setPage} />

      <main className="main-content">
        <Topbar title={title} subtitle={subtitle} />
        <div className="cloud-toolbar"><SyncStatus /><BackupTools /></div>

        {page === "dashboard" && <Dashboard onNavigate={setPage} />}
        {page === "wizard" && <SmartBoqWizard onNavigate={setPage} notify={notify} />}
        {page === "projects" && <ProjectManager onNavigate={setPage} />}
        {page === "library" && (
          <PozLibrary onNavigate={setPage} notify={notify} />
        )}
        {page === "boq" && (
          <BOQTable
            onNavigate={setPage}
            onSelectAnalysis={selectAnalysisRow}
            notify={notify}
          />
        )}
        {page === "prices" && <InternetPriceCenter notify={notify} />}
        {page === "analysis" && (
          <UnitPriceAnalysis
            selectedRowId={selectedAnalysisRowId}
            onSelectRow={selectAnalysisRow}
            onNavigate={setPage}
          />
        )}
        {page === "progress" && <ProgressPayment notify={notify} />}
        {page === "parametric" && <ParametricBuilder notify={notify} onNavigate={setPage} />}
        {["schedule", "reports"].includes(page) && (
          <article className="placeholder">
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </article>
        )}
      </main>

      {toast && (
        <div className={`toast ${toast.type}`}>
          <div className="toast-icon">
            {toast.type === "success" ? "✓" : "!"}
          </div>
          <div>
            <strong>{toast.title}</strong>
            <p>{toast.message}</p>
          </div>
          <button type="button" onClick={() => setToast(null)}>×</button>
        </div>
      )}
    </div>
  );
}
