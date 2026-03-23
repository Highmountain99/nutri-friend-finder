import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";

export interface PatientBlock {
  id: string;
  patient_id: string;
  block_template_id: string;
  dietitian_id: string;
  sort_order: number;
  is_active: boolean;
  override_title: string | null;
  manual_content: string | null;
  created_at: string;
  template: {
    id: string;
    title: string;
    description: string;
    icon: string;
    block_type: string;
    category: string;
    data_source: string;
    data_config: Record<string, any>;
    display_config: Record<string, any>;
  };
}

export interface ComputedBlockData {
  block: PatientBlock;
  computedLabel: string | null;
  computedItems: { key: string; label: string; done: boolean }[];
  computedValue: number | null;
  computedTotal: number | null;
  source: "journal" | "dietitian" | "manual";
}

export function usePatientBlocks(patientId: string | undefined) {
  return useQuery({
    queryKey: ["patient-blocks", patientId],
    queryFn: async () => {
      if (!patientId) return [];

      // Fetch patient blocks with template
      const { data: blocks, error } = await supabase
        .from("patient_blocks" as any)
        .select("*, block_templates(*)")
        .eq("patient_id", patientId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      if (!blocks || blocks.length === 0) return [];

      // Map to typed structure
      const patientBlocks: PatientBlock[] = (blocks as any[]).map((b) => ({
        ...b,
        template: b.block_templates,
      }));

      // Fetch data needed for computation
      const today = format(new Date(), "yyyy-MM-dd");
      const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
      const sevenDaysAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");

      const needsMealData = patientBlocks.some(
        (b) => b.template.data_source === "meal_log" || b.template.data_source === "meal_times"
      );
      const needsSymptomData = patientBlocks.some(
        (b) => b.template.data_source === "symptom_log"
      );

      let mealEntries: any[] = [];
      let symptomEntries: any[] = [];

      if (needsMealData) {
        const { data } = await supabase
          .from("nutrition_entries")
          .select("id, entry_date, meal_type, created_at")
          .eq("user_id", patientId)
          .gte("entry_date", thirtyDaysAgo);
        mealEntries = data || [];
      }

      if (needsSymptomData) {
        const { data } = await supabase
          .from("symptom_entries")
          .select("id, entry_date, description, symptom_time, meal_id")
          .eq("user_id", patientId)
          .gte("entry_date", thirtyDaysAgo);
        symptomEntries = data || [];
      }

      // Compute block data
      const computed: ComputedBlockData[] = patientBlocks.map((block) => {
        const config = block.template.data_config || {};
        const source = block.template.data_source;

        if (source === "none" || source === "custom_text") {
          return {
            block,
            computedLabel: block.manual_content || block.template.description || null,
            computedItems: [],
            computedValue: null,
            computedTotal: null,
            source: "dietitian" as const,
          };
        }

        if (source === "meal_log" || source === "meal_times") {
          const metric = config.metric || "meal_rhythm";
          const periodDays = config.period_days || 1;

          if (metric === "meal_rhythm") {
            const todayMeals = mealEntries.filter((m) => m.entry_date === today);
            const types = todayMeals.map((m) => (m.meal_type || "").toLowerCase());
            const items = [
              { key: "breakfast", label: "Frukost", done: types.some((t: string) => t.includes("frukost") || t === "breakfast") },
              { key: "lunch", label: "Lunch", done: types.some((t: string) => t.includes("lunch")) },
              { key: "dinner", label: "Middag", done: types.some((t: string) => t.includes("middag") || t === "dinner") },
              { key: "snack", label: "Mellanmål", done: types.some((t: string) => t.includes("mellanmål") || t === "snack") },
            ];
            return {
              block,
              computedLabel: null,
              computedItems: items,
              computedValue: items.filter((i) => i.done).length,
              computedTotal: items.length,
              source: "journal" as const,
            };
          }

          if (metric === "meals_per_day") {
            const cutoff = periodDays === 1 ? today : format(subDays(new Date(), periodDays), "yyyy-MM-dd");
            const relevant = mealEntries.filter((m) => m.entry_date >= cutoff);
            const count = relevant.length;
            const rules = config.rules || [];
            let label = config.empty_text || "Ingen data";
            for (const rule of rules) {
              if (rule.condition === "gte" && count >= rule.value) { label = rule.label; break; }
              if (rule.condition === "lt" && count < rule.value) { label = rule.label; break; }
            }
            return {
              block,
              computedLabel: label,
              computedItems: [],
              computedValue: count,
              computedTotal: null,
              source: "journal" as const,
            };
          }

          if (metric === "regularity_30d") {
            const dayMap: Record<string, number> = {};
            mealEntries.forEach((m) => {
              dayMap[m.entry_date] = (dayMap[m.entry_date] || 0) + 1;
            });
            const threshold = config.threshold || 3;
            const daysWithEnough = Object.values(dayMap).filter((c) => c >= threshold).length;
            const totalDays = 30;
            return {
              block,
              computedLabel: `${daysWithEnough}/${totalDays} dagar med ${threshold}+ måltider`,
              computedItems: [],
              computedValue: daysWithEnough,
              computedTotal: totalDays,
              source: "journal" as const,
            };
          }
        }

        if (source === "symptom_log") {
          const recentSymptoms = symptomEntries.filter((s) => s.entry_date >= sevenDaysAgo);
          const count = recentSymptoms.length;
          return {
            block,
            computedLabel: count === 0 ? "Inga symptom loggade" : `${count} symptom senaste 7 dagarna`,
            computedItems: [],
            computedValue: count,
            computedTotal: null,
            source: "journal" as const,
          };
        }

        // Default fallback
        return {
          block,
          computedLabel: block.manual_content || block.template.description || null,
          computedItems: [],
          computedValue: null,
          computedTotal: null,
          source: "dietitian" as const,
        };
      });

      return computed;
    },
    enabled: !!patientId,
  });
}
