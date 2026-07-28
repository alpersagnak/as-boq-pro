import { useCallback, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
} from "ag-grid-community";
import * as XLSX from "xlsx";
import { useProjects } from "../context/ProjectContext";
import { analyzeBoqRow, formatMoney, projectTotal } from "../utils/calculations";
import { DISCIPLINES, disciplineLabel } from "../data/disciplines";

ModuleRegistry.registerModules([AllCommunityModule]);

const createImportItem = (row, index) => {
  const normalized = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      String(key).trim().toLocaleLowerCase("tr-TR"),
      value,
    ])
  );

  const pick = (...keys) => {
    for (const key of keys) {
      if (normalized[key] !== undefined && normalized[key] !== "") return normalized[key];
    }
    return "";
  };

  return {
    pozNo: String(pick("poz", "poz no", "pozno", "kod") || `IMP-${index + 1}`),
    isKalemi: String(
      pick("iş kalemi", "is kalemi", "açıklama", "aciklama", "tanım", "tanim") ||
        "İsimsiz iş kalemi"
    ),
    birim: String(pick("birim", "unit") || "adet"),
    tur: String(pick("tür", "tur", "type") || "Excel"),
    kategori: String(pick("kategori", "category") || "Diğer"),
    quantity: Number(String(pick("miktar", "quantity") || 0).replace(",", ".")) || 0,
  };
};


const parseClipboardRows = (text) => {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim());

  if (!lines.length) return [];

  const cells = lines.map((line) => line.split("\t"));
  const first = cells[0].map((value) => value.trim().toLocaleLowerCase("tr-TR"));
  const knownHeaders = ["poz", "poz no", "pozno", "iş kalemi", "is kalemi", "açıklama", "aciklama", "birim", "kategori", "miktar"];
  const hasHeader = first.some((value) => knownHeaders.includes(value));

  if (hasHeader) {
    const headers = cells[0];
    return cells.slice(1).map((values, index) =>
      createImportItem(
        Object.fromEntries(headers.map((header, cellIndex) => [header, values[cellIndex] ?? ""])),
        index
      )
    );
  }

  return cells.map((values, index) => ({
    pozNo: String(values[0] || `PND-${index + 1}`),
    isKalemi: String(values[1] || "Yeni iş kalemi"),
    birim: String(values[2] || "adet"),
    tur: "Panodan",
    kategori: String(values[3] || "Diğer"),
    quantity: Number(String(values[4] || 0).replace(",", ".")) || 0,
  }));
};

export default function BOQTable({ onNavigate, onSelectAnalysis, notify }) {
  const { activeProject, activeDiscipline, dispatch } = useProjects();
  const gridRef = useRef(null);
  const fileRef = useRef(null);
  const [quickFilter, setQuickFilter] = useState("");
  const [selectedCount, setSelectedCount] = useState(0);
  const [selectedTotal, setSelectedTotal] = useState(0);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [bulkDiscipline, setBulkDiscipline] = useState("");
  const [bulkCategory, setBulkCategory] = useState("");

  const rowData = useMemo(
    () =>
      (activeProject?.boqRows || [])
        .filter((row) => activeDiscipline === "all" || row.discipline === activeDiscipline)
        .map((row, index) => {
        const analysis = analyzeBoqRow(row);
        return {
          ...row,
          rowNumber: index + 1,
          materialPrice: analysis.material,
          laborPrice: analysis.labor,
          totalPrice: analysis.total,
          amount: (Number(row.quantity) || 0) * analysis.total,
        };
      }),
    [activeProject, activeDiscipline]
  );

  const currencyFormatter = useCallback(
    ({ value }) => formatMoney(value, activeProject?.currency || "TRY"),
    [activeProject?.currency]
  );

  const columnDefs = useMemo(
    () => [
      {
        headerName: "Sıra",
        field: "rowNumber",
        width: 82,
        pinned: "left",
        editable: false,
        sortable: false,
        filter: false,
        checkboxSelection: true,
        headerCheckboxSelection: true,
      },
      { headerName: "Poz No", field: "pozNo", width: 145, pinned: "left" },
      { headerName: "İş Kalemi", field: "description", minWidth: 330, flex: 1 },
      { headerName: "Birim", field: "unit", width: 100 },
      { headerName: "Disiplin", field: "discipline", width: 140, valueFormatter: ({ value }) => disciplineLabel(value), cellEditor: "agSelectCellEditor", cellEditorParams: { values: DISCIPLINES.filter((d) => d.id !== "all").map((d) => d.id) } },
      { headerName: "Kategori", field: "category", width: 150 },
      {
        headerName: "Miktar",
        field: "quantity",
        width: 125,
        type: "numericColumn",
        valueParser: ({ newValue }) => Number(String(newValue).replace(",", ".")) || 0,
      },
      {
        headerName: "Malzeme BF",
        field: "materialPrice",
        width: 150,
        editable: false,
        valueFormatter: currencyFormatter,
      },
      {
        headerName: "İşçilik BF",
        field: "laborPrice",
        width: 150,
        editable: false,
        valueFormatter: currencyFormatter,
      },
      {
        headerName: "Toplam BF",
        field: "totalPrice",
        width: 150,
        editable: false,
        valueFormatter: currencyFormatter,
      },
      {
        headerName: "Tutar",
        field: "amount",
        width: 165,
        pinned: "right",
        editable: false,
        valueFormatter: currencyFormatter,
        cellStyle: { fontWeight: 800 },
      },
      {
        headerName: "Durum",
        width: 115,
        editable: false,
        valueGetter: ({ data }) => data.totalPrice > 0 ? "Analizli" : "Eksik",
        cellRenderer: ({ value }) => (
          <span className={`analysis-status ${value === "Analizli" ? "ready" : "missing"}`}>{value}</span>
        ),
      },
      {
        headerName: "Analiz",
        width: 105,
        pinned: "right",
        editable: false,
        sortable: false,
        filter: false,
        cellRenderer: ({ data }) => (
          <button
            type="button"
            className="grid-action-button"
            onClick={() => {
              onSelectAnalysis(data.id);
              onNavigate("analysis");
            }}
          >
            Aç
          </button>
        ),
      },
    ],
    [currencyFormatter, onNavigate, onSelectAnalysis]
  );

  const defaultColDef = useMemo(
    () => ({
      editable: true,
      sortable: true,
      filter: true,
      resizable: true,
      minWidth: 90,
      suppressHeaderMenuButton: false,
    }),
    []
  );

  const gridTheme = useMemo(
    () =>
      themeQuartz.withParams({
        accentColor: "#108b80",
        borderRadius: 8,
        headerBackgroundColor: "#eef5f5",
        headerTextColor: "#294853",
        oddRowBackgroundColor: "#fbfdfd",
        rowHoverColor: "#e8f6f4",
        selectedRowBackgroundColor: "#d9f1ed",
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: 13,
      }),
    []
  );

  const updateCell = useCallback(
    ({ data, colDef, newValue }) => {
      if (!data?.id || !colDef.field) return;
      const fieldMap = {
        pozNo: "pozNo",
        description: "description",
        unit: "unit",
        category: "category",
        discipline: "discipline",
        quantity: "quantity",
      };
      const target = fieldMap[colDef.field];
      if (!target) return;
      dispatch({
        type: "UPDATE_BOQ_ROW",
        projectId: activeProject.id,
        rowId: data.id,
        patch: { [target]: target === "quantity" ? Number(newValue) || 0 : newValue },
      });
    },
    [activeProject?.id, dispatch]
  );

  const addBlankRow = () => {
    dispatch({
      type: "ADD_BOQ_ROW",
      projectId: activeProject.id,
      item: {
        pozNo: `AS-${String((activeProject.boqRows?.length || 0) + 1).padStart(4, "0")}`,
        isKalemi: "Yeni iş kalemi",
        birim: "adet",
        tur: "Manuel",
        kategori: "Diğer",
        discipline: activeDiscipline === "all" ? "construction" : activeDiscipline,
      },
    });
  };

  const selectedIds = () =>
    gridRef.current?.api?.getSelectedRows().map((row) => row.id) || [];

  const deleteSelected = () => {
    const ids = selectedIds();
    if (!ids.length) return;
    if (!window.confirm(`${ids.length} satır silinsin mi?`)) return;
    dispatch({ type: "DELETE_BOQ_ROWS", projectId: activeProject.id, rowIds: ids });
    setSelectedCount(0);
  };

  const duplicateSelected = () => {
    const ids = selectedIds();
    if (!ids.length) return;
    dispatch({ type: "DUPLICATE_BOQ_ROWS", projectId: activeProject.id, rowIds: ids });
    gridRef.current?.api?.deselectAll();
  };

  const applyBulkUpdate = () => {
    const ids = selectedIds();
    if (!ids.length) return;
    const patch = {};
    if (bulkDiscipline) patch.discipline = bulkDiscipline;
    if (bulkCategory.trim()) patch.category = bulkCategory.trim();
    if (!Object.keys(patch).length) {
      notify?.("warning", "Toplu düzenleme seçilmedi", "Disiplin veya kategori girin.");
      return;
    }
    dispatch({ type: "BULK_UPDATE_BOQ_ROWS", projectId: activeProject.id, rowIds: ids, patch });
    notify?.("success", "Toplu güncelleme tamamlandı", `${ids.length} BOQ satırı güncellendi.`);
  };

  const copySelected = async () => {
    const rows = gridRef.current?.api?.getSelectedRows() || [];
    if (!rows.length) return;
    const header = ["Poz No", "İş Kalemi", "Birim", "Disiplin", "Kategori", "Miktar", "Birim Fiyat", "Tutar"];
    const body = rows.map((row) => [row.pozNo, row.description, row.unit, disciplineLabel(row.discipline), row.category, row.quantity, row.totalPrice, row.amount]);
    const text = [header, ...body].map((cells) => cells.join("\t")).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      notify?.("success", "Seçim panoya kopyalandı", `${rows.length} satır Excel biçiminde kopyalandı.`);
    } catch {
      notify?.("error", "Kopyalama başarısız", "Tarayıcı pano iznini kontrol edin.");
    }
  };

  const processExcelFile = async (file) => {
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(extension)) {
      notify?.("error", "Dosya türü desteklenmiyor", "XLSX, XLS veya CSV dosyası seçin.");
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
      const items = rawRows.map(createImportItem);

      if (!items.length) throw new Error("Excel dosyasında aktarılabilir satır bulunamadı.");

      dispatch({
        type: "IMPORT_BOQ_ROWS",
        projectId: activeProject.id,
        items,
      });

      notify?.("success", "Excel aktarımı tamamlandı", `${items.length} BOQ satırı eklendi.`);
    } catch (error) {
      notify?.("error", "Excel aktarılamadı", error.message || "Dosyayı kontrol edin.");
    }
  };

  const importExcel = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    await processExcelFile(file);
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    setIsDraggingFile(false);
    await processExcelFile(event.dataTransfer.files?.[0]);
  };

  const exportCsv = () => {
    gridRef.current?.api?.exportDataAsCsv({
      fileName: `${activeProject.name}-BOQ.csv`,
      columnKeys: ["rowNumber", "pozNo", "description", "unit", "category", "quantity", "materialPrice", "laborPrice", "totalPrice", "amount"],
    });
  };

  const exportExcel = () => {
    const exportRows = rowData.map((row) => ({
      "Sıra": row.rowNumber,
      "Poz No": row.pozNo,
      "İş Kalemi": row.description,
      "Birim": row.unit,
      "Kategori": row.category,
      "Miktar": row.quantity,
      "Malzeme Birim Fiyat": row.materialPrice,
      "İşçilik Birim Fiyat": row.laborPrice,
      "Toplam Birim Fiyat": row.totalPrice,
      "Tutar": row.amount,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 18 },
      { wch: 48 },
      { wch: 10 },
      { wch: 20 },
      { wch: 14 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "BOQ");
    XLSX.writeFile(workbook, `${activeProject.name}-BOQ.xlsx`);
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const items = parseClipboardRows(text);
      if (!items.length) {
        notify?.("error", "Pano boş", "Excel'den kopyalanmış BOQ satırı bulunamadı.");
        return;
      }
      dispatch({ type: "IMPORT_BOQ_ROWS", projectId: activeProject.id, items });
      notify?.("success", "Panodan aktarıldı", `${items.length} BOQ satırı eklendi.`);
    } catch (error) {
      notify?.("error", "Pano okunamadı", "Tarayıcı pano iznini açın veya Excel içe aktarmayı kullanın.");
    }
  };

  const undoGridEdit = () => {
    gridRef.current?.api?.undoCellEditing();
  };

  const redoGridEdit = () => {
    gridRef.current?.api?.redoCellEditing();
  };

  const resetGridView = () => {
    setQuickFilter("");
    gridRef.current?.api?.setFilterModel(null);
    gridRef.current?.api?.applyColumnState({
      defaultState: { sort: null },
    });
    gridRef.current?.api?.sizeColumnsToFit();
    notify?.("success", "Tablo görünümü sıfırlandı", "Filtreler ve sıralamalar temizlendi.");
  };

  const updateSelectionSummary = ({ api }) => {
    const selectedRows = api.getSelectedRows();
    setSelectedCount(selectedRows.length);
    setSelectedTotal(
      selectedRows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
    );
  };

  return (
    <section className="ag-boq-page">
      <div className="toolbar ag-grid-toolbar">
        <button className="primary" type="button" onClick={() => onNavigate("library")}>
          + Kütüphaneden Poz Ekle
        </button>
        <button className="secondary" type="button" onClick={addBlankRow}>
          + Boş Satır
        </button>
        <button className="secondary" type="button" onClick={() => fileRef.current?.click()}>
          Excel İçe Aktar
        </button>
        <button className="secondary" type="button" onClick={exportExcel}>
          Excel Dışa Aktar
        </button>
        <button className="secondary" type="button" onClick={exportCsv}>
          CSV Dışa Aktar
        </button>
        <button className="secondary" type="button" onClick={pasteFromClipboard}>
          Panodan Yapıştır
        </button>
        <button className="secondary compact-action" type="button" onClick={undoGridEdit} title="Son hücre düzenlemesini geri al">
          ↶ Geri Al
        </button>
        <button className="secondary compact-action" type="button" onClick={redoGridEdit} title="Geri alınan düzenlemeyi yinele">
          ↷ İleri Al
        </button>
        <button className="secondary" type="button" onClick={resetGridView}>
          Görünümü Sıfırla
        </button>
        <input
          ref={fileRef}
          className="hidden-file-input"
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={importExcel}
        />
        <input
          className="search-input ag-search"
          value={quickFilter}
          onChange={(event) => setQuickFilter(event.target.value)}
          placeholder="Tüm BOQ içinde ara..."
        />
      </div>

      <div className="selection-bar ag-selection-bar v14-selection-bar">
        <strong>{selectedCount} satır seçildi</strong>
        <span>Seçili toplam: <b>{formatMoney(selectedTotal, activeProject.currency)}</b></span>
        <select value={bulkDiscipline} onChange={(e) => setBulkDiscipline(e.target.value)} disabled={!selectedCount}>
          <option value="">Disiplin seç</option>
          {DISCIPLINES.filter((item) => item.id !== "all").map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
        <input value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)} placeholder="Toplu kategori" disabled={!selectedCount} />
        <button className="secondary" type="button" disabled={!selectedCount} onClick={applyBulkUpdate}>Uygula</button>
        <button className="secondary" type="button" disabled={!selectedCount} onClick={copySelected}>Kopyala</button>
        <button className="secondary" type="button" disabled={!selectedCount} onClick={duplicateSelected}>Çoğalt</button>
        <button className="delete-button" type="button" disabled={!selectedCount} onClick={deleteSelected}>Sil</button>
      </div>

      <div
        className={`excel-drop-zone ${isDraggingFile ? "dragging" : ""}`}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDraggingFile(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsDraggingFile(false);
          }
        }}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") fileRef.current?.click();
        }}
      >
        <strong>Excel dosyasını buraya sürükleyin</strong>
        <span>veya tıklayarak XLSX, XLS ya da CSV seçin</span>
      </div>

      <div className="ag-grid-shell">
        <AgGridReact
          ref={gridRef}
          theme={gridTheme}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          getRowId={({ data }) => data.id}
          rowSelection={{ mode: "multiRow", selectAll: "filtered" }}
          quickFilterText={quickFilter}
          pagination
          paginationPageSize={50}
          paginationPageSizeSelector={[25, 50, 100, 250]}
          undoRedoCellEditing
          undoRedoCellEditingLimit={30}
          stopEditingWhenCellsLoseFocus
          onCellValueChanged={updateCell}
          onSelectionChanged={updateSelectionSummary}
          overlayNoRowsTemplate='<span class="ag-empty-message">Henüz BOQ kalemi eklenmedi.</span>'
        />
      </div>

      <div className="boq-health-strip">
        <div><span>Görünen Poz</span><strong>{rowData.length}</strong></div>
        <div><span>Analizi Tamamlanan</span><strong>{rowData.filter((row) => row.totalPrice > 0).length}</strong></div>
        <div><span>Eksik Analiz</span><strong>{rowData.filter((row) => row.totalPrice <= 0).length}</strong></div>
        <div><span>Analiz Tamamlama</span><strong>{rowData.length ? `${Math.round((rowData.filter((row) => row.totalPrice > 0).length / rowData.length) * 100)}%` : "0%"}</strong></div>
      </div>

      <div className="boq-total-strip">
        <span>GENEL TOPLAM</span>
        <strong>{formatMoney(projectTotal(activeProject), activeProject.currency)}</strong>
      </div>

      <article className="excel-import-help">
        <strong>Excel sütun başlıkları:</strong>
        <span>Poz No / Poz, İş Kalemi / Açıklama, Birim, Kategori ve Miktar.</span>
        <span><b>Hızlı giriş:</b> Excel'de satırları kopyalayın ve “Panodan Yapıştır” düğmesini kullanın.</span>
      </article>
    </section>
  );
}
