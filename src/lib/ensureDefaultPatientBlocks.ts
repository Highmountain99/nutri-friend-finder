import { supabase } from "@/integrations/supabase/client";
import { SYSTEM_BLOCK_TEMPLATES } from "@/lib/systemBlockTemplates";

/** Fixed default order of the coach-selectable blocks. */
export const DEFAULT_BLOCK_KEYS = SYSTEM_BLOCK_TEMPLATES.map((t) => t.key);

/**
 * Makes sure a client always has the standard progress plan assigned.
 * Only seeds when the client has NO patient_blocks rows at all — coaches can
 * remove blocks afterwards (soft delete) without them coming back.
 */
export async function ensureDefaultPatientBlocks(
  patientId: string | undefined,
  dietitianId: string | undefined
): Promise<boolean> {
  if (!patientId || !dietitianId) return false;

  const { data: existing, error: existingError } = await supabase
    .from("patient_blocks")
    .select("id")
    .eq("patient_id", patientId)
    .limit(1);
  if (existingError || (existing && existing.length > 0)) return false;

  const { data: templates } = await supabase
    .from("block_templates")
    .select("id, data_config")
    .eq("dietitian_id", dietitianId);

  const byKey = new Map<string, string>();
  for (const t of (templates || []) as any[]) {
    const key = t.data_config?.system_key;
    if (key && !byKey.has(key)) byKey.set(key, t.id);
  }

  const rows = DEFAULT_BLOCK_KEYS.map((key, idx) => {
    const templateId = byKey.get(key);
    if (!templateId) return null;
    return {
      patient_id: patientId,
      block_template_id: templateId,
      dietitian_id: dietitianId,
      sort_order: idx,
      is_active: true,
    };
  }).filter(Boolean) as any[];

  if (rows.length === 0) return false;

  const { error } = await supabase.from("patient_blocks").insert(rows);
  return !error;
}
