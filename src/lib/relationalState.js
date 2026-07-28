import { isSupabaseConfigured, supabase } from "./supabase";

const APP_KEY = "as-boq-pro-main";

const byOrder = (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0);

export async function readRelationalState() {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, configured: false };
  }

  const [projectsResult, boqResult, paymentsResult, prefsResult] = await Promise.all([
    supabase.from("asboq_projects").select("*").eq("app_key", APP_KEY).order("sort_order"),
    supabase.from("asboq_boq_items").select("*").eq("app_key", APP_KEY).order("sort_order"),
    supabase.from("asboq_progress_payments").select("*").eq("app_key", APP_KEY).order("sort_order"),
    supabase.from("asboq_preferences").select("active_project_id, updated_at").eq("app_key", APP_KEY).maybeSingle(),
  ]);

  const error = projectsResult.error || boqResult.error || paymentsResult.error || prefsResult.error;
  if (error) throw error;

  const projectRows = projectsResult.data || [];
  if (!projectRows.length) {
    return { data: null, configured: true, updatedAt: prefsResult.data?.updated_at || null };
  }

  const boqRows = (boqResult.data || []).sort(byOrder);
  const paymentRows = (paymentsResult.data || []).sort(byOrder);

  const projects = projectRows.sort(byOrder).map((project) => ({
    id: project.id,
    name: project.name,
    code: project.code,
    client: project.client || "",
    currency: project.currency || "TRY",
    boqRows: boqRows
      .filter((row) => row.project_id === project.id)
      .map((row) => ({
        id: row.id,
        pozNo: row.poz_no,
        description: row.description,
        unit: row.unit,
        type: row.item_type,
        category: row.category,
        quantity: Number(row.quantity) || 0,
        materials: row.materials || [],
        labors: row.labors || [],
        equipments: row.equipments || [],
        transports: row.transports || [],
        analysisSettings: row.analysis_settings || {},
      })),
    progressPayments: paymentRows
      .filter((payment) => payment.project_id === project.id)
      .map((payment) => ({
        id: payment.id,
        number: payment.number,
        title: payment.title,
        date: payment.payment_date,
        retentionPercent: Number(payment.retention_percent) || 0,
        advanceDeduction: Number(payment.advance_deduction) || 0,
        otherDeduction: Number(payment.other_deduction) || 0,
        vatPercent: Number(payment.vat_percent) || 0,
        notes: payment.notes || "",
        quantities: payment.quantities || {},
        createdAt: payment.created_at,
      })),
  }));

  return {
    configured: true,
    updatedAt: prefsResult.data?.updated_at || null,
    data: {
      projects,
      activeProjectId: prefsResult.data?.active_project_id || projects[0]?.id || null,
    },
  };
}

async function removeStaleRows(table, currentIds) {
  let query = supabase.from(table).delete().eq("app_key", APP_KEY);
  if (currentIds.length) query = query.not("id", "in", `(${currentIds.join(",")})`);
  const { error } = await query;
  if (error) throw error;
}

export async function writeRelationalState(state) {
  if (!isSupabaseConfigured || !supabase) {
    return { configured: false };
  }

  const now = new Date().toISOString();
  const projects = state.projects || [];
  const projectRows = projects.map((project, index) => ({
    id: project.id,
    app_key: APP_KEY,
    name: project.name,
    code: project.code,
    client: project.client || "",
    currency: project.currency || "TRY",
    sort_order: index,
    updated_at: now,
  }));

  const boqRows = projects.flatMap((project) =>
    (project.boqRows || []).map((row, index) => ({
      id: row.id,
      app_key: APP_KEY,
      project_id: project.id,
      poz_no: row.pozNo || "",
      description: row.description || "",
      unit: row.unit || "",
      item_type: row.type || "",
      category: row.category || "",
      quantity: Number(row.quantity) || 0,
      materials: row.materials || [],
      labors: row.labors || [],
      equipments: row.equipments || [],
      transports: row.transports || [],
      analysis_settings: row.analysisSettings || {},
      sort_order: index,
      updated_at: now,
    }))
  );

  const paymentRows = projects.flatMap((project) =>
    (project.progressPayments || []).map((payment, index) => ({
      id: payment.id,
      app_key: APP_KEY,
      project_id: project.id,
      number: payment.number || "",
      title: payment.title || "",
      payment_date: payment.date || null,
      retention_percent: Number(payment.retentionPercent) || 0,
      advance_deduction: Number(payment.advanceDeduction) || 0,
      other_deduction: Number(payment.otherDeduction) || 0,
      vat_percent: Number(payment.vatPercent) || 0,
      notes: payment.notes || "",
      quantities: payment.quantities || {},
      sort_order: index,
      created_at: payment.createdAt || now,
      updated_at: now,
    }))
  );

  if (projectRows.length) {
    const { error } = await supabase.from("asboq_projects").upsert(projectRows, { onConflict: "id" });
    if (error) throw error;
  }
  if (boqRows.length) {
    const { error } = await supabase.from("asboq_boq_items").upsert(boqRows, { onConflict: "id" });
    if (error) throw error;
  }
  if (paymentRows.length) {
    const { error } = await supabase.from("asboq_progress_payments").upsert(paymentRows, { onConflict: "id" });
    if (error) throw error;
  }

  await removeStaleRows("asboq_progress_payments", paymentRows.map((row) => row.id));
  await removeStaleRows("asboq_boq_items", boqRows.map((row) => row.id));
  await removeStaleRows("asboq_projects", projectRows.map((row) => row.id));

  const { error: prefError } = await supabase.from("asboq_preferences").upsert(
    {
      app_key: APP_KEY,
      active_project_id: state.activeProjectId || projects[0]?.id || null,
      updated_at: now,
    },
    { onConflict: "app_key" }
  );
  if (prefError) throw prefError;

  return { configured: true, updatedAt: now };
}
