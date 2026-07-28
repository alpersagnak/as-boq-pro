import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { readRelationalState, writeRelationalState } from "../lib/relationalState";
import { readCloudState } from "../lib/cloudState";
import { inferDiscipline } from "../data/disciplines";

const KEY = "asBoqProV60State";
const id = () =>
  globalThis.crypto?.randomUUID?.() ||
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const defaultProject = () => ({
  id: id(),
  name: "Kaplankaya Villa 1201",
  code: "PRJ-001",
  client: "",
  currency: "TRY",
  boqRows: [],
  progressPayments: [],
});

function migrateProject(project) {
  return {
    ...project,
    boqRows: (project.boqRows || project.rows || []).map((row) => ({
      ...row,
      labors: row.labors || [],
      equipments: row.equipments || [],
      transports: row.transports || [],
      discipline: row.discipline || inferDiscipline(row),
      materials: (row.materials || []).map((item) => ({ brand: "", model: "", brandInfo: "", standard: "", approvedBrand: false, ...item })),
      analysisSettings: {
        siteOverheadPercent: 0,
        generalOverheadPercent: 0,
        profitPercent: 0,
        ...(row.analysisSettings || {}),
      },
    })),
    progressPayments: project.progressPayments || [],
  };
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved?.projects?.length) {
      return {
        ...saved,
        projects: saved.projects.map(migrateProject),
      };
    }

    const v50 = JSON.parse(localStorage.getItem("asBoqProV50State"));
    if (v50?.projects?.length) {
      return { ...v50, projects: v50.projects.map(migrateProject) };
    }

    const v42 = JSON.parse(localStorage.getItem("asBoqProV42State"));
    if (v42?.projects?.length) {
      return { ...v42, projects: v42.projects.map(migrateProject) };
    }

    const v41 = JSON.parse(localStorage.getItem("asBoqProV41State"));
    if (v41?.projects?.length) {
      return {
        ...v41,
        projects: v41.projects.map(migrateProject),
      };
    }

    const old = JSON.parse(localStorage.getItem("asBoqProV4State"));
    if (old?.projects?.length) {
      return {
        ...old,
        projects: old.projects.map(migrateProject),
      };
    }
  } catch {
    // Invalid local cache is ignored.
  }

  return { projects: [defaultProject()], activeProjectId: null, activeDiscipline: "construction" };
}

function createBoqRow(item) {
  return {
    id: id(),
    pozNo: item.pozNo,
    description: item.isKalemi,
    unit: item.birim,
    type: item.tur,
    category: item.kategori,
    discipline: item.discipline || inferDiscipline(item),
    quantity: 0,
    materials: [],
    labors: [],
    equipments: [],
    transports: [],
    analysisSettings: {
      siteOverheadPercent: 0,
      generalOverheadPercent: 0,
      profitPercent: 0,
    },
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "SET_ACTIVE_PROJECT":
      return { ...state, activeProjectId: action.projectId };

    case "SET_ACTIVE_DISCIPLINE":
      return { ...state, activeDiscipline: action.disciplineId };

    case "ADD_PROJECT": {
      const project = {
        id: id(),
        ...action.payload,
        boqRows: [],
        progressPayments: [],
      };
      return {
        ...state,
        projects: [...state.projects, project],
        activeProjectId: project.id,
      };
    }

    case "UPDATE_PROJECT":
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.projectId
            ? { ...project, ...action.patch }
            : project
        ),
      };

    case "ADD_BOQ_ROW":
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.projectId
            ? { ...project, boqRows: [...project.boqRows, createBoqRow(action.item)] }
            : project
        ),
      };

    case "ADD_BOQ_ROWS":
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.projectId
            ? {
                ...project,
                boqRows: [
                  ...project.boqRows,
                  ...action.items.map(createBoqRow),
                ],
              }
            : project
        ),
      };

    case "UPDATE_BOQ_ROW":
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.projectId
            ? {
                ...project,
                boqRows: project.boqRows.map((row) =>
                  row.id === action.rowId ? { ...row, ...action.patch } : row
                ),
              }
            : project
        ),
      };

    case "DELETE_BOQ_ROW":
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.projectId
            ? {
                ...project,
                boqRows: project.boqRows.filter((row) => row.id !== action.rowId),
              }
            : project
        ),
      };


    case "DELETE_BOQ_ROWS":
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.projectId
            ? {
                ...project,
                boqRows: project.boqRows.filter(
                  (row) => !action.rowIds.includes(row.id)
                ),
              }
            : project
        ),
      };

    case "DUPLICATE_BOQ_ROWS":
      return {
        ...state,
        projects: state.projects.map((project) => {
          if (project.id !== action.projectId) return project;

          const duplicates = project.boqRows
            .filter((row) => action.rowIds.includes(row.id))
            .map((row) => ({
              ...row,
              id: id(),
              pozNo: `${row.pozNo}-KOPYA`,
              materials: (row.materials || []).map((item) => ({ ...item, id: id() })),
              labors: (row.labors || []).map((item) => ({ ...item, id: id() })),
              equipments: (row.equipments || []).map((item) => ({ ...item, id: id() })),
              transports: (row.transports || []).map((item) => ({ ...item, id: id() })),
            }));

          return {
            ...project,
            boqRows: [...project.boqRows, ...duplicates],
          };
        }),
      };

    case "IMPORT_BOQ_ROWS":
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.projectId
            ? {
                ...project,
                boqRows: [
                  ...project.boqRows,
                  ...action.items.map((item) => ({
                    ...createBoqRow(item),
                    quantity: Number(item.quantity) || 0,
                  })),
                ],
              }
            : project
        ),
      };

    case "ADD_RESOURCE": {
      const keyMap = {
        material: "materials",
        labor: "labors",
        equipment: "equipments",
        transport: "transports",
      };
      const key = keyMap[action.resourceType];
      const resource = {
        id: id(),
        resourcePoz: action.item.pozNo,
        name: action.item.ad,
        unit: action.item.birim,
        category: action.item.kategori,
        consumption: 0,
        unitPrice: Number(action.item.varsayilanBF) || 0,
        priceSource: action.item.kaynak || "Kütüphane",
        priceDate: action.item.fiyatTarihi || "",
        priceMode: "automatic",
        wastePercent: 0,
        note: "",
        brand: action.item.marka && action.item.marka !== "Piyasa ortalaması" ? action.item.marka : "",
        model: "",
        brandInfo: "",
        standard: "",
        approvedBrand: false,
      };

      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.projectId
            ? {
                ...project,
                boqRows: project.boqRows.map((row) =>
                  row.id === action.rowId
                    ? { ...row, [key]: [...(row[key] || []), resource] }
                    : row
                ),
              }
            : project
        ),
      };
    }


    case "APPLY_AUTO_ANALYSIS": {
      const make = (entry, type) => ({
        id: id(),
        resourcePoz: entry.item.pozNo,
        name: entry.item.ad,
        unit: entry.item.birim,
        category: entry.item.kategori,
        consumption: Number(entry.consumption) || 0,
        unitPrice: Number(entry.item.varsayilanBF) || 0,
        priceSource: entry.item.kaynak || "Kütüphane",
        priceDate: entry.item.fiyatTarihi || "",
        priceMode: "automatic",
        wastePercent: type === "material" ? (Number(entry.wastePercent) || 0) : 0,
        note: entry.item.not || "Otomatik analiz",
        brand: entry.item.marka && entry.item.marka !== "Piyasa ortalaması" ? entry.item.marka : "",
        model: "", brandInfo: "", standard: "", approvedBrand: false,
      });
      return { ...state, projects: state.projects.map(project => project.id !== action.projectId ? project : ({
        ...project, boqRows: project.boqRows.map(row => row.id !== action.rowId ? row : ({
          ...row,
          materials: action.analysis.materials.map(x => make(x, "material")),
          labors: action.analysis.labors.map(x => make(x, "labor")),
          equipments: action.analysis.equipments.map(x => make(x, "equipment")),
          transports: action.analysis.transports.map(x => make(x, "transport")),
        }))
      })) };
    }

    case "UPDATE_RESOURCE": {
      const keyMap = {
        material: "materials",
        labor: "labors",
        equipment: "equipments",
        transport: "transports",
      };
      const key = keyMap[action.resourceType];
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.projectId
            ? {
                ...project,
                boqRows: project.boqRows.map((row) =>
                  row.id === action.rowId
                    ? {
                        ...row,
                        [key]: (row[key] || []).map((resource) =>
                          resource.id === action.resourceId
                            ? { ...resource, ...action.patch }
                            : resource
                        ),
                      }
                    : row
                ),
              }
            : project
        ),
      };
    }

    case "DELETE_RESOURCE": {
      const keyMap = {
        material: "materials",
        labor: "labors",
        equipment: "equipments",
        transport: "transports",
      };
      const key = keyMap[action.resourceType];
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.projectId
            ? {
                ...project,
                boqRows: project.boqRows.map((row) =>
                  row.id === action.rowId
                    ? {
                        ...row,
                        [key]: (row[key] || []).filter(
                          (resource) => resource.id !== action.resourceId
                        ),
                      }
                    : row
                ),
              }
            : project
        ),
      };
    }

    case "ADD_CUSTOM_RESOURCE": {
      const keyMap = {
        material: "materials",
        labor: "labors",
        equipment: "equipments",
        transport: "transports",
      };
      const key = keyMap[action.resourceType];
      const resource = {
        id: id(),
        resourcePoz: action.payload?.resourcePoz || "OZEL",
        name: action.payload?.name || "Yeni kaynak",
        unit: action.payload?.unit || "adet",
        category: "Özel",
        consumption: Number(action.payload?.consumption) || 0,
        unitPrice: Number(action.payload?.unitPrice) || 0,
        priceSource: action.payload?.priceSource || "Kullanıcı",
        priceDate: action.payload?.priceDate || new Date().toISOString().slice(0,10),
        priceMode: "user",
        wastePercent: Number(action.payload?.wastePercent) || 0,
        note: action.payload?.note || "",
        brand: action.payload?.brand || "",
        model: action.payload?.model || "",
        brandInfo: action.payload?.brandInfo || "",
        standard: action.payload?.standard || "",
        approvedBrand: Boolean(action.payload?.approvedBrand),
      };
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.projectId
            ? {
                ...project,
                boqRows: project.boqRows.map((row) =>
                  row.id === action.rowId
                    ? { ...row, [key]: [...(row[key] || []), resource] }
                    : row
                ),
              }
            : project
        ),
      };
    }

    case "COPY_ANALYSIS": {
      const project = state.projects.find((item) => item.id === action.projectId);
      const source = project?.boqRows?.find((item) => item.id === action.sourceRowId);
      if (!source) return state;
      const cloneResources = (items = []) =>
        items.map((item) => ({ ...item, id: id() }));
      return {
        ...state,
        projects: state.projects.map((item) =>
          item.id === action.projectId
            ? {
                ...item,
                boqRows: item.boqRows.map((row) =>
                  row.id === action.targetRowId
                    ? {
                        ...row,
                        materials: cloneResources(source.materials),
                        labors: cloneResources(source.labors),
                        equipments: cloneResources(source.equipments),
                        transports: cloneResources(source.transports),
                        analysisSettings: { ...(source.analysisSettings || {}) },
                      }
                    : row
                ),
              }
            : item
        ),
      };
    }

    case "CLEAR_ANALYSIS":
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.projectId
            ? {
                ...project,
                boqRows: project.boqRows.map((row) =>
                  row.id === action.rowId
                    ? {
                        ...row,
                        materials: [],
                        labors: [],
                        equipments: [],
                        transports: [],
                        analysisSettings: {
                          siteOverheadPercent: 0,
                          generalOverheadPercent: 0,
                          profitPercent: 0,
                        },
                      }
                    : row
                ),
              }
            : project
        ),
      };

    case "UPDATE_ANALYSIS_SETTINGS":
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.projectId
            ? {
                ...project,
                boqRows: project.boqRows.map((row) =>
                  row.id === action.rowId
                    ? {
                        ...row,
                        analysisSettings: {
                          ...(row.analysisSettings || {}),
                          ...action.patch,
                        },
                      }
                    : row
                ),
              }
            : project
        ),
      };

    case "ADD_PROGRESS_PAYMENT": {
      const certificate = {
        id: id(),
        number: action.payload.number,
        title: action.payload.title,
        date: action.payload.date,
        period: action.payload.period || "",
        contractor: action.payload.contractor || "",
        employer: action.payload.employer || "",
        contractNo: action.payload.contractNo || "",
        retentionPercent: Number(action.payload.retentionPercent) || 0,
        withholdingPercent: Number(action.payload.withholdingPercent) || 0,
        advanceDeduction: Number(action.payload.advanceDeduction) || 0,
        otherDeduction: Number(action.payload.otherDeduction) || 0,
        vatPercent: Number(action.payload.vatPercent) || 0,
        notes: action.payload.notes || "",
        quantities: {},
        createdAt: new Date().toISOString(),
      };

      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.projectId
            ? {
                ...project,
                progressPayments: [
                  ...(project.progressPayments || []),
                  certificate,
                ],
              }
            : project
        ),
      };
    }

    case "UPDATE_PROGRESS_PAYMENT":
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.projectId
            ? {
                ...project,
                progressPayments: (project.progressPayments || []).map((item) =>
                  item.id === action.paymentId
                    ? { ...item, ...action.patch }
                    : item
                ),
              }
            : project
        ),
      };

    case "UPDATE_PROGRESS_QUANTITY":
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.projectId
            ? {
                ...project,
                progressPayments: (project.progressPayments || []).map((item) =>
                  item.id === action.paymentId
                    ? {
                        ...item,
                        quantities: {
                          ...(item.quantities || {}),
                          [action.rowId]: Number(action.quantity) || 0,
                        },
                      }
                    : item
                ),
              }
            : project
        ),
      };

    case "DELETE_PROGRESS_PAYMENT":
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.projectId
            ? {
                ...project,
                progressPayments: (project.progressPayments || []).filter(
                  (item) => item.id !== action.paymentId
                ),
              }
            : project
        ),
      };

    case "RESTORE_STATE":
      return {
        ...action.payload,
        projects: action.payload.projects.map(migrateProject),
      };

    default:
      return state;
  }
}

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  const [syncStatus, setSyncStatus] = useState("loading");
  const [syncError, setSyncError] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const cloudReadyRef = useRef(false);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function hydrateFromCloud() {
      try {
        let result = await readRelationalState();

        // v7 tek-parça bulut kaydı varsa yeni ilişkisel tablolara otomatik aktar.
        if (result.configured && !result.data) {
          const legacy = await readCloudState();
          if (legacy.data?.projects?.length) {
            await writeRelationalState(legacy.data);
            result = await readRelationalState();
          }
        }
        if (cancelled) return;

        if (!result.configured) {
          cloudReadyRef.current = false;
          setSyncStatus("offline");
          return;
        }

        if (result.data?.projects?.length) {
          dispatch({ type: "RESTORE_STATE", payload: result.data });
          setLastSyncedAt(result.updatedAt || new Date().toISOString());
        } else {
          await writeRelationalState(state);
          setLastSyncedAt(new Date().toISOString());
        }

        cloudReadyRef.current = true;
        setSyncStatus("synced");
      } catch (error) {
        cloudReadyRef.current = false;
        setSyncError(error?.message || "Supabase bağlantısı kurulamadı");
        setSyncStatus("error");
      }
    }

    hydrateFromCloud();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));

    if (!cloudReadyRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    setSyncStatus("syncing");
    saveTimerRef.current = setTimeout(async () => {
      try {
        await writeRelationalState(state);
        setSyncError("");
        setLastSyncedAt(new Date().toISOString());
        setSyncStatus("synced");
      } catch (error) {
        setSyncError(error?.message || "Buluta kayıt yapılamadı");
        setSyncStatus("error");
      }
    }, 700);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state]);

  useEffect(() => {
    if (!state.activeProjectId && state.projects[0]) {
      dispatch({
        type: "SET_ACTIVE_PROJECT",
        projectId: state.projects[0].id,
      });
    }
  }, [state.activeProjectId, state.projects]);

  const activeProject = useMemo(
    () =>
      state.projects.find(
        (project) => project.id === state.activeProjectId
      ) || state.projects[0],
    [state.projects, state.activeProjectId]
  );

  const value = useMemo(
    () => ({
      state,
      activeProject,
      activeDiscipline: state.activeDiscipline || "construction",
      dispatch,
      syncStatus,
      syncError,
      lastSyncedAt,
    }),
    [state, activeProject, syncStatus, syncError, lastSyncedAt]
  );

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("ProjectProvider gerekli");
  return context;
}
