import { useProjects } from "../context/ProjectContext";

const labels = {
  loading: "Bulut verisi yükleniyor",
  syncing: "Supabase'e kaydediliyor",
  synced: "Supabase veritabanı senkronize",
  offline: "Yerel kayıt modu",
  error: "Senkronizasyon hatası",
};

export default function SyncStatus() {
  const { syncStatus, syncError, lastSyncedAt } = useProjects();
  const title = syncError || (lastSyncedAt ? `Son kayıt: ${new Date(lastSyncedAt).toLocaleString("tr-TR")}` : "");

  return (
    <div className={`sync-status ${syncStatus}`} title={title}>
      <span className="sync-dot" />
      {labels[syncStatus] || labels.offline}
    </div>
  );
}
