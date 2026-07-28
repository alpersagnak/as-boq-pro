import { useEffect, useMemo, useState } from "react";
import {
  EQUIPMENT_LIBRARY,
  LABOR_LIBRARY,
  MATERIAL_LIBRARY,
  TRANSPORT_LIBRARY,
} from "../data/resourceLibrary";
import { useProjects } from "../context/ProjectContext";
import { getBrandOptions, getBrandRecord } from "../data/productBrandLibrary";
import { buildAutoAnalysis } from "../data/autoAnalysisTemplates";
import {
  analyzeBoqRow,
  equipmentContribution,
  formatMoney,
  laborContribution,
  materialContribution,
  normalizeText,
  transportContribution,
} from "../utils/calculations";

const SOURCE_MAP = {
  material: MATERIAL_LIBRARY,
  labor: LABOR_LIBRARY,
  equipment: EQUIPMENT_LIBRARY,
  transport: TRANSPORT_LIBRARY,
};

const TYPE_LABEL = {
  material: "Malzeme",
  labor: "İşçilik",
  equipment: "Ekipman",
  transport: "Nakliye",
};

export default function UnitPriceAnalysis({
  selectedRowId,
  onSelectRow,
  onNavigate,
}) {
  const { activeProject, activeDiscipline, dispatch } = useProjects();
  const [type, setType] = useState("material");
  const [search, setSearch] = useState("");
  const [copySourceId, setCopySourceId] = useState("");

  const disciplineRows = useMemo(() =>
    (activeProject?.boqRows || []).filter((item) => activeDiscipline === "all" || item.discipline === activeDiscipline),
    [activeProject, activeDiscipline]
  );

  useEffect(() => {
    if (!disciplineRows.some((item) => item.id === selectedRowId) && disciplineRows[0]) {
      onSelectRow(disciplineRows[0].id);
    }
  }, [selectedRowId, disciplineRows, onSelectRow]);

  const row = disciplineRows.find((item) => item.id === selectedRowId) || disciplineRows[0];

  const source = SOURCE_MAP[type];

  const filtered = useMemo(() => {
    const query = normalizeText(search);
    return source.filter(
      (item) =>
        !query ||
        normalizeText(
          `${item.pozNo} ${item.ad} ${item.kategori} ${(getBrandOptions(item).map((brand) => brand.brand).join(" "))}`
        ).includes(query)
    );
  }, [source, search]);

  if (!row) {
    return (
      <article className="placeholder">
        <h2>Analiz yapılacak BOQ kalemi bulunmuyor</h2>
        <button
          type="button"
          className="primary"
          onClick={() => onNavigate("library")}
        >
          Poz Kütüphanesine Git
        </button>
      </article>
    );
  }

  const analysis = analyzeBoqRow(row);
  const resourceCount =
    (row.materials?.length || 0) +
    (row.labors?.length || 0) +
    (row.equipments?.length || 0) +
    (row.transports?.length || 0);

  const addResource = (item) =>
    dispatch({
      type: "ADD_RESOURCE",
      projectId: activeProject.id,
      rowId: row.id,
      resourceType: type,
      item,
    });

  const updateSetting = (key, value) =>
    dispatch({
      type: "UPDATE_ANALYSIS_SETTINGS",
      projectId: activeProject.id,
      rowId: row.id,
      patch: { [key]: Number(value) || 0 },
    });

  return (
    <>
      <article className="analysis-header">
        <div>
          <label>Analiz yapılacak BOQ pozu</label>
          <select
            value={row.id}
            onChange={(event) => onSelectRow(event.target.value)}
          >
            {disciplineRows.map((item) => (
              <option key={item.id} value={item.id}>
                {item.pozNo} - {item.description}
              </option>
            ))}
          </select>
        </div>

        <div>
          <b>{row.pozNo}</b>
          <h2>{row.description}</h2>
          <p>Birim: {row.unit}</p>
        </div>

        <div className="analysis-price">
          <span>Hesaplanan Birim Fiyat</span>
          <strong>{formatMoney(analysis.total, activeProject.currency)}</strong>
        </div>
      </article>

      <article className="analysis-actions-card">
        <div>
          <strong>Analiz Durumu</strong>
          <span className={resourceCount ? "analysis-ready" : "analysis-empty"}>
            {resourceCount ? `${resourceCount} kaynak bağlı` : "Henüz kaynak eklenmedi"}
          </span>
        </div>
        <div className="analysis-copy-controls">
          <select
            value={copySourceId}
            onChange={(event) => setCopySourceId(event.target.value)}
          >
            <option value="">Başka pozdan analiz seç...</option>
            {disciplineRows
              .filter((item) => item.id !== row.id)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.pozNo} - {item.description}
                </option>
              ))}
          </select>
          <button type="button" className="primary" onClick={() => {
              const generated = buildAutoAnalysis(row);
              const count = Object.values(generated).reduce((n, arr) => n + arr.length, 0);
              if (!count) return window.alert("Bu iş kalemi için hazır analiz şablonu bulunamadı. Özel satır ekleyebilirsiniz.");
              if (resourceCount && !window.confirm("Mevcut analiz silinip otomatik analiz oluşturulsun mu?")) return;
              dispatch({ type: "APPLY_AUTO_ANALYSIS", projectId: activeProject.id, rowId: row.id, analysis: generated });
            }}>⚡ Analizi Otomatik Oluştur</button>
          <button
            type="button"
            disabled={!copySourceId}
            onClick={() => {
              dispatch({
                type: "COPY_ANALYSIS",
                projectId: activeProject.id,
                sourceRowId: copySourceId,
                targetRowId: row.id,
              });
              setCopySourceId("");
            }}
          >
            Analizi Kopyala
          </button>
          <button
            type="button"
            className="danger-outline"
            disabled={!resourceCount}
            onClick={() => {
              if (window.confirm("Bu poza ait tüm analiz kaynakları silinsin mi?")) {
                dispatch({
                  type: "CLEAR_ANALYSIS",
                  projectId: activeProject.id,
                  rowId: row.id,
                });
              }
            }}
          >
            Analizi Temizle
          </button>
        </div>
      </article>

      <div className="resource-toolbar analysis-tabs">
        {Object.entries(TYPE_LABEL).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={type === key ? "tab active" : "tab"}
            onClick={() => setType(key)}
          >
            {label} Ekle ({SOURCE_MAP[key].length})
          </button>
        ))}

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={`${TYPE_LABEL[type]} ara...`}
        />
        <button
          type="button"
          onClick={() =>
            dispatch({
              type: "ADD_CUSTOM_RESOURCE",
              projectId: activeProject.id,
              rowId: row.id,
              resourceType: type,
              payload: { name: `Yeni ${TYPE_LABEL[type]}` },
            })
          }
        >
          + Özel Satır
        </button>
      </div>

      <article className="resource-picker">
        <table>
          <thead>
            <tr>
              <th>Poz</th>
              <th>Kaynak</th>
              <th>Kategori</th>
              <th>Birim</th>
              {type === "material" && <th>Marka seçenekleri</th>}
              <th>Varsayılan BF</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 150).map((item, index) => (
              <tr key={`${type}-${item.pozNo}-${index}`}>
                <td className="code-cell">{item.pozNo}</td>
                <td>{item.ad}</td>
                <td>{item.kategori}</td>
                <td>{item.birim}</td>
                {type === "material" && (
                  <td>
                    <div className="brand-chip-row">
                      {getBrandOptions(item).slice(0, 3).map((option) => (
                        <span key={option.brand} className={option.approved ? "brand-chip approved" : "brand-chip"}>
                          {option.brand}
                        </span>
                      ))}
                      {!getBrandOptions(item).length && <span className="muted-text">Marka tanımsız</span>}
                    </div>
                  </td>
                )}
                <td>
                  {formatMoney(item.varsayilanBF, activeProject.currency)}
                </td>
                <td>
                  <button
                    type="button"
                    className="small-primary"
                    onClick={() => addResource(item)}
                  >
                    Analize Ekle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      <ResourceTable
        title="Malzeme Analizi"
        resourceType="material"
        rows={row.materials || []}
        rowId={row.id}
      />
      <ResourceTable
        title="İşçilik Analizi"
        resourceType="labor"
        rows={row.labors || []}
        rowId={row.id}
      />
      <ResourceTable
        title="Ekipman Analizi"
        resourceType="equipment"
        rows={row.equipments || []}
        rowId={row.id}
      />
      <ResourceTable
        title="Nakliye Analizi"
        resourceType="transport"
        rows={row.transports || []}
        rowId={row.id}
      />

      <article className="markup-card">
        <div className="table-title">
          <h3>Genel Gider ve Kâr</h3>
          <span>Doğrudan maliyet üzerine uygulanır</span>
        </div>

        <div className="markup-grid">
          <label>
            Şantiye Genel Gideri %
            <input
              type="number"
              min="0"
              step="0.01"
              value={row.analysisSettings?.siteOverheadPercent || 0}
              onChange={(event) =>
                updateSetting("siteOverheadPercent", event.target.value)
              }
            />
          </label>

          <label>
            Genel Gider %
            <input
              type="number"
              min="0"
              step="0.01"
              value={row.analysisSettings?.generalOverheadPercent || 0}
              onChange={(event) =>
                updateSetting("generalOverheadPercent", event.target.value)
              }
            />
          </label>

          <label>
            Kâr %
            <input
              type="number"
              min="0"
              step="0.01"
              value={row.analysisSettings?.profitPercent || 0}
              onChange={(event) =>
                updateSetting("profitPercent", event.target.value)
              }
            />
          </label>
        </div>
      </article>

      <section className="analysis-summary-grid">
        <SummaryCard
          label="Malzeme"
          value={analysis.material}
          currency={activeProject.currency}
        />
        <SummaryCard
          label="İşçilik"
          value={analysis.labor}
          currency={activeProject.currency}
        />
        <SummaryCard
          label="Ekipman"
          value={analysis.equipment}
          currency={activeProject.currency}
        />
        <SummaryCard
          label="Nakliye"
          value={analysis.transport}
          currency={activeProject.currency}
        />
        <SummaryCard
          label="Doğrudan Maliyet"
          value={analysis.directCost}
          currency={activeProject.currency}
        />
        <SummaryCard
          label="Şantiye Genel Gideri"
          value={analysis.siteOverhead}
          currency={activeProject.currency}
        />
        <SummaryCard
          label="Genel Gider"
          value={analysis.generalOverhead}
          currency={activeProject.currency}
        />
        <SummaryCard
          label="Kâr"
          value={analysis.profit}
          currency={activeProject.currency}
        />
        <SummaryCard
          label="Nihai Birim Fiyat"
          value={analysis.total}
          currency={activeProject.currency}
          highlight
        />
      </section>
    </>
  );
}

function SummaryCard({ label, value, currency, highlight = false }) {
  return (
    <article className={highlight ? "kpi highlight-kpi" : "kpi"}>
      <span>{label}</span>
      <strong>{formatMoney(value, currency)}</strong>
    </article>
  );
}

function ResourceTable({ title, resourceType, rows, rowId }) {
  const { activeProject, activeDiscipline, dispatch } = useProjects();
  const material = resourceType === "material";

  const contribution = {
    material: materialContribution,
    labor: laborContribution,
    equipment: equipmentContribution,
    transport: transportContribution,
  }[resourceType];

  const update = (resourceId, patch) =>
    dispatch({
      type: "UPDATE_RESOURCE",
      projectId: activeProject.id,
      rowId,
      resourceType,
      resourceId,
      patch,
    });

  return (
    <article className="table-card analysis-table">
      <div className="table-title">
        <h3>{title}</h3>
        <span>{rows.length} kayıt</span>
      </div>

      <table>
        <thead>
          <tr>
            <th>Poz</th>
            <th>Kaynak</th>
            {material && <th>Marka</th>}
            {material && <th>Ürün / Model</th>}
            <th>Birim</th>
            <th>Sarfiyat</th>
            <th>Birim Fiyat</th>
            <th>Fiyat Kaynağı</th>
            {material && <th>Fire %</th>}
            <th>BF Katkısı</th>
            <th>Açıklama</th>
            <th>İşlem</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((item) => (
            <tr key={item.id}>
              <td className="code-cell">{item.resourcePoz}</td>
              <td>
                <div className="material-name-cell">
                  <span>{item.name}</span>
                  {material && item.brandInfo && (
                    <button
                      type="button"
                      className="info-button"
                      title={`${item.brandInfo}${item.standard ? ` • Standart: ${item.standard}` : ""}`}
                      onClick={() => window.alert(`${item.brand || "Marka"}\n\n${item.brandInfo}${item.standard ? `\n\nStandart: ${item.standard}` : ""}`)}
                    >
                      i
                    </button>
                  )}
                </div>
              </td>
              {material && (
                <td>
                  <select
                    value={item.brand || ""}
                    className={item.approvedBrand ? "brand-select approved" : "brand-select"}
                    onChange={(event) => {
                      const record = getBrandRecord(item, event.target.value);
                      update(item.id, {
                        brand: event.target.value,
                        model: "",
                        brandInfo: record?.info || "",
                        standard: record?.standard || "",
                        approvedBrand: Boolean(record?.approved),
                      });
                    }}
                  >
                    <option value="">Marka seç...</option>
                    {getBrandOptions(item).map((option) => (
                      <option key={option.brand} value={option.brand}>
                        {option.approved ? "✓ " : ""}{option.brand}
                      </option>
                    ))}
                    {item.brand && !getBrandOptions(item).some((option) => option.brand === item.brand) && (
                      <option value={item.brand}>{item.brand}</option>
                    )}
                  </select>
                  {item.brand && (
                    <span className={item.approvedBrand ? "brand-status approved" : "brand-status"}>
                      {item.approvedBrand ? "Onaylı marka" : "Alternatif marka"}
                    </span>
                  )}
                </td>
              )}
              {material && (
                <td>
                  <select
                    value={item.model || ""}
                    disabled={!item.brand}
                    onChange={(event) => update(item.id, { model: event.target.value })}
                  >
                    <option value="">Ürün / model seç...</option>
                    {(getBrandRecord(item, item.brand)?.models || []).map((model) => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                    {item.model && !(getBrandRecord(item, item.brand)?.models || []).includes(item.model) && (
                      <option value={item.model}>{item.model}</option>
                    )}
                  </select>
                </td>
              )}
              <td>{item.unit}</td>
              <td>
                <input
                  type="number"
                  min="0"
                  step="0.0001"
                  value={item.consumption}
                  onChange={(event) =>
                    update(item.id, {
                      consumption: Number(event.target.value) || 0,
                    })
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(event) =>
                    update(item.id, {
                      unitPrice: Number(event.target.value) || 0,
                      priceMode: "user",
                      priceSource: "Kullanıcı tanımlı",
                      priceDate: new Date().toISOString().slice(0,10),
                    })
                  }
                />
              </td>
              <td>
                <select value={item.priceMode || "automatic"} onChange={(event) => update(item.id, { priceMode: event.target.value, priceSource: event.target.value === "user" ? "Kullanıcı tanımlı" : (item.priceSource || "Kütüphane") })}>
                  <option value="automatic">Otomatik</option>
                  <option value="user">Kullanıcı tanımlı</option>
                </select>
                <small className="price-source-note">{item.priceSource || "Kütüphane"}{item.priceDate ? ` • ${item.priceDate}` : ""}</small>
              </td>
              {material && (
                <td>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.wastePercent}
                    onChange={(event) =>
                      update(item.id, {
                        wastePercent: Number(event.target.value) || 0,
                      })
                    }
                  />
                </td>
              )}
              <td>
                <strong>
                  {formatMoney(
                    contribution(item),
                    activeProject.currency
                  )}
                </strong>
              </td>
              <td>
                <input
                  value={item.note}
                  onChange={(event) =>
                    update(item.id, { note: event.target.value })
                  }
                />
              </td>
              <td>
                <button
                  type="button"
                  className="delete-button"
                  onClick={() =>
                    dispatch({
                      type: "DELETE_RESOURCE",
                      projectId: activeProject.id,
                      rowId,
                      resourceType,
                      resourceId: item.id,
                    })
                  }
                >
                  Sil
                </button>
              </td>
            </tr>
          ))}

          {!rows.length && (
            <tr>
              <td
                colSpan={material ? 12 : 9}
                className="empty-state"
              >
                Henüz kaynak eklenmedi.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </article>
  );
}
