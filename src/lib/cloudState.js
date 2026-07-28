import { isSupabaseConfigured, supabase } from "./supabase";

const APP_KEY = "as-boq-pro-main";

export async function readCloudState() {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, configured: false };
  }

  const { data, error } = await supabase
    .from("asboq_app_state")
    .select("payload, updated_at")
    .eq("app_key", APP_KEY)
    .maybeSingle();

  if (error) throw error;
  return { data: data?.payload || null, updatedAt: data?.updated_at || null, configured: true };
}

export async function writeCloudState(payload) {
  if (!isSupabaseConfigured || !supabase) {
    return { configured: false };
  }

  const { error } = await supabase.from("asboq_app_state").upsert(
    {
      app_key: APP_KEY,
      payload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "app_key" }
  );

  if (error) throw error;
  return { configured: true };
}
