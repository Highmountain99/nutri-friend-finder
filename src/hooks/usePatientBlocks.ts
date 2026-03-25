import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
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

export interface MealRhythmItem {
  key: string;
  label: string;
  done: boolean;
}

export interface DayGridEntry {
  date: string;
  count: number;
  hasThreePlus: boolean;
}

export interface SymptomPatternEntry {
  timeLabel: string;
  count: number;
}

export interface WeeklyCheckinData {
  loggedDays: number;
  averageMealsPerDay: number;
  stability: "stabil" | "delvis" | "oregelbunden";
}

export interface ComputedBlockData {
  block: PatientBlock;
  computedLabel: string | null;
  computedItems: { key: string; label: string; done: boolean }[];
  computedValue: number | null;
  computedTotal: number | null;
  chartData: { date: string; value: number }[] | null;
  chartMeta: { label: string; unit: string } | null;
  source: "journal" | "dietitian" | "manual";
  // Rich data for system blocks
  mealRhythm?: MealRhythmItem[];
  regularityGrid?: DayGridEntry[];
  daysWithThreePlus?: number;
  mealStructure?: { label: string; avgMeals: number };
  weeklyCheckin?: WeeklyCheckinData;
  symptomPatterns?: SymptomPatternEntry[];
  nextAppointment?: { appointment_date: string; notes?: string | null } | null;
  milestones?: { id: string; title: string; is_completed: boolean }[];
  focusText?: string;
  renderAs?: string;
}

export function usePatientBlocks(patientId: string | undefined) {
  const queryClient = useQueryClient();

  // Realtime subscription for instant updates when dietitian saves
  useEffect(() => {
    if (!patientId) return;
    const channel = supabase
      .channel(`patient-blocks-${patientId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "patient_blocks",
          filter: `patient_id=eq.${patientId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["patient-blocks", patientId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [patientId, queryClient]);

  return useQuery({
    queryKey: ["patient-blocks", patientId],
    queryFn: async () => {
      if (!patientId) return [];

      const { data: blocks, error } = await supabase
        .from("patient_blocks")
        .select("*, block_templates(*)")
        .eq("patient_id", patientId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      if (!blocks || blocks.length === 0) return [];

      const patientBlocks: PatientBlock[] = (blocks as any[]).map((b) => ({
        ...b,
        template: b.block_templates,
      }));

      const today = format(new Date(), "yyyy-MM-dd");
      const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
      const sevenDaysAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
      const fourteenDaysAgo = format(subDays(new Date(), 14), "yyyy-MM-dd");

      // Determine which data we need
      const sources = new Set(patientBlocks.map(b => b.template.data_source));
      const needsMeals = sources.has("meal_log") || sources.has("meal_times");
      const needsSymptoms = sources.has("symptom_log");
      const needsHealth = sources.has("health_tracking");
      const needsAppointments = sources.has("appointments");
      const needsTreatment = sources.has("treatment_goals") || sources.has("treatment_plan");

      // Fetch all needed data in parallel
      const [mealRes, symptomRes, healthRes, appointmentRes, planRes] = await Promise.all([
        needsMeals
          ? supabase.from("nutrition_entries").select("id, entry_date, meal_type, created_at").eq("user_id", patientId).gte("entry_date", thirtyDaysAgo)
          : Promise.resolve({ data: null }),
        needsSymptoms
          ? supabase.from("symptom_entries").select("id, entry_date, description, symptom_time, meal_id").eq("user_id", patientId).gte("entry_date", fourteenDaysAgo)
          : Promise.resolve({ data: null }),
        needsHealth
          ? supabase.from("health_tracking_entries").select("id, entry_date, metric_type, value, unit").eq("user_id", patientId).order("entry_date", { ascending: true })
          : Promise.resolve({ data: null }),
        needsAppointments
          ? supabase.from("appointments").select("id, appointment_date, notes").eq("user_id", patientId).eq("status", "booked").gt("appointment_date", new Date().toISOString()).order("appointment_date", { ascending: true }).limit(1)
          : Promise.resolve({ data: null }),
        needsTreatment
          ? supabase.from("treatment_plans").select("id, title, description").eq("patient_id", patientId).eq("status", "active").order("created_at", { ascending: false }).limit(1)
          : Promise.resolve({ data: null }),
      ]);

      const mealEntries = mealRes.data || [];
      const symptomEntries = symptomRes.data || [];
      const healthEntries = healthRes.data || [];
      const nextAppointment = (appointmentRes.data as any)?.[0] || null;
      const activePlan = (planRes.data as any)?.[0] || null;

      // Fetch milestones for current phase (in_progress goals only)
      let milestones: any[] = [];
      if (activePlan && needsTreatment) {
        const { data: goals } = await supabase
          .from("treatment_goals")
          .select("id")
          .eq("plan_id", activePlan.id)
          .eq("status", "in_progress");
        const goalIds = (goals || []).map((g: any) => g.id);
        if (goalIds.length > 0) {
          const { data: ms } = await supabase
            .from("treatment_milestones")
            .select("id, title, is_completed, completed_at, goal_id")
            .in("goal_id", goalIds)
            .order("sort_order");
          milestones = ms || [];
        }
      }

      // Precompute shared data
      const build30DayGrid = (): DayGridEntry[] => {
        const grid: DayGridEntry[] = [];
        for (let i = 29; i >= 0; i--) {
          const d = format(subDays(new Date(), i), "yyyy-MM-dd");
          const count = mealEntries.filter((e: any) => e.entry_date === d).length;
          grid.push({ date: d, count, hasThreePlus: count >= 3 });
        }
        return grid;
      };

      const getMealRhythm = (): MealRhythmItem[] => {
        const todayMeals = mealEntries.filter((m: any) => m.entry_date === today);
        const types = todayMeals.map((m: any) => (m.meal_type || "").toLowerCase());
        return [
          { key: "breakfast", label: "Frukost", done: types.some((t: string) => t.includes("frukost") || t === "breakfast") },
          { key: "lunch", label: "Lunch", done: types.some((t: string) => t.includes("lunch")) },
          { key: "dinner", label: "Middag", done: types.some((t: string) => t.includes("middag") || t === "dinner") },
          { key: "snack", label: "Mellanmål", done: types.some((t: string) => t.includes("mellanmål") || t === "snack") },
        ];
      };

      const getSymptomPatterns = (): SymptomPatternEntry[] => {
        if (symptomEntries.length === 0) return [];
        const buckets: Record<string, number> = {};
        for (const s of symptomEntries) {
          const hour = new Date((s as any).symptom_time).getHours();
          let label = "Morgon";
          if (hour >= 11 && hour < 14) label = "Lunch";
          else if (hour >= 14 && hour < 17) label = "Eftermiddag";
          else if (hour >= 17 && hour < 21) label = "Kväll";
          else if (hour >= 21) label = "Natt";
          buckets[label] = (buckets[label] || 0) + 1;
        }
        return Object.entries(buckets)
          .map(([timeLabel, count]) => ({ timeLabel, count }))
          .sort((a, b) => b.count - a.count);
      };

      let gridCache: DayGridEntry[] | null = null;
      const getGrid = () => { if (!gridCache) gridCache = build30DayGrid(); return gridCache; };

      // Compute each block
      const computed: ComputedBlockData[] = patientBlocks.map((block) => {
        const config = block.template.data_config || {};
        const displayConfig = block.template.display_config || {};
        const source = block.template.data_source;
        const renderAs = displayConfig.render_as || undefined;
        const base = {
          chartData: null as { date: string; value: number }[] | null,
          chartMeta: null as { label: string; unit: string } | null,
          renderAs,
        };

        // ── Treatment plan / Focus ──
        if (source === "treatment_plan") {
          return {
            block, ...base,
            computedLabel: activePlan?.description || null,
            computedItems: [],
            computedValue: null,
            computedTotal: null,
            source: "dietitian" as const,
            focusText: activePlan?.description || undefined,
          };
        }

        // ── Appointments ──
        if (source === "appointments") {
          return {
            block, ...base,
            computedLabel: nextAppointment ? `Nästa samtal bokat` : "Inget bokat samtal",
            computedItems: [],
            computedValue: null,
            computedTotal: null,
            source: "dietitian" as const,
            nextAppointment,
          };
        }

        // ── Treatment goals / milestones ──
        if (source === "treatment_goals") {
          const completedCount = milestones.filter((m: any) => m.is_completed).length;
          return {
            block, ...base,
            computedLabel: milestones.length > 0 ? `${completedCount}/${milestones.length} avklarade` : "Inga mål satta",
            computedItems: [],
            computedValue: completedCount,
            computedTotal: milestones.length || null,
            source: "dietitian" as const,
            milestones: milestones.map((m: any) => ({
              id: m.id,
              title: m.title,
              is_completed: m.is_completed,
            })),
          };
        }

        // ── None / custom text ──
        if (source === "none" || source === "custom_text") {
          return {
            block, ...base,
            computedLabel: block.manual_content || block.template.description || null,
            computedItems: [],
            computedValue: null,
            computedTotal: null,
            source: "dietitian" as const,
          };
        }

        // ── Meal log ──
        if (source === "meal_log" || source === "meal_times") {
          const metric = config.metric || "meal_rhythm";

          if (metric === "meal_rhythm") {
            const rhythm = getMealRhythm();
            return {
              block, ...base,
              computedLabel: null,
              computedItems: rhythm,
              computedValue: rhythm.filter(i => i.done).length,
              computedTotal: rhythm.length,
              source: "journal" as const,
              mealRhythm: rhythm,
            };
          }

          if (metric === "structure_7d" || metric === "weekly_checkin") {
            const grid = getGrid();
            const last7 = grid.slice(-7);
            const daysLogged = last7.filter(d => d.count > 0).length;
            const totalMeals = last7.reduce((sum, d) => sum + d.count, 0);
            const avg = daysLogged > 0 ? totalMeals / daysLogged : 0;

            if (metric === "structure_7d") {
              let label = "Oregelbunden";
              if (avg >= 3.5) label = "Regelbunden (3+ mål/dag)";
              else if (avg >= 2.5) label = "Delvis regelbunden";
              return {
                block, ...base,
                computedLabel: label,
                computedItems: [],
                computedValue: Math.round(avg * 10) / 10,
                computedTotal: null,
                source: "journal" as const,
                mealStructure: { label, avgMeals: Math.round(avg * 10) / 10 },
              };
            }

            // weekly_checkin
            let stability: WeeklyCheckinData["stability"] = "oregelbunden";
            if (daysLogged >= 6 && avg >= 3) stability = "stabil";
            else if (daysLogged >= 4) stability = "delvis";
            return {
              block, ...base,
              computedLabel: `${daysLogged}/7 dagar loggade`,
              computedItems: [],
              computedValue: daysLogged,
              computedTotal: 7,
              source: "journal" as const,
              weeklyCheckin: { loggedDays: daysLogged, averageMealsPerDay: Math.round(avg * 10) / 10, stability },
            };
          }

          if (metric === "regularity_30d") {
            const grid = getGrid();
            const daysWithThreePlus = grid.filter(d => d.hasThreePlus).length;
            return {
              block, ...base,
              computedLabel: `${daysWithThreePlus}/30 dagar med 3+ måltider`,
              computedItems: [],
              computedValue: daysWithThreePlus,
              computedTotal: 30,
              source: "journal" as const,
              regularityGrid: grid,
              daysWithThreePlus,
            };
          }

          if (metric === "weekly_overview") {
            const grid = getGrid();
            const last7 = grid.slice(-7);
            const daysLogged = last7.filter(d => d.count > 0).length;
            const totalMeals = last7.reduce((sum, d) => sum + d.count, 0);
            return {
              block, ...base,
              computedLabel: `${daysLogged} aktiva dagar, ${totalMeals} måltider`,
              computedItems: [],
              computedValue: daysLogged,
              computedTotal: 7,
              source: "journal" as const,
              weeklyCheckin: {
                loggedDays: daysLogged,
                averageMealsPerDay: daysLogged > 0 ? Math.round((totalMeals / daysLogged) * 10) / 10 : 0,
                stability: daysLogged >= 6 ? "stabil" : daysLogged >= 4 ? "delvis" : "oregelbunden",
              },
            };
          }

          // meals_per_day (legacy)
          if (metric === "meals_per_day") {
            const periodDays = config.period_days || 1;
            const cutoff = periodDays === 1 ? today : format(subDays(new Date(), periodDays), "yyyy-MM-dd");
            const relevant = mealEntries.filter((m: any) => m.entry_date >= cutoff);
            const count = relevant.length;
            const rules = config.rules || [];
            let label = config.empty_text || "Ingen data";
            for (const rule of rules) {
              if (rule.condition === "gte" && count >= rule.value) { label = rule.label; break; }
              if (rule.condition === "lt" && count < rule.value) { label = rule.label; break; }
            }
            return {
              block, ...base,
              computedLabel: label,
              computedItems: [],
              computedValue: count,
              computedTotal: null,
              source: "journal" as const,
            };
          }
        }

        // ── Symptom log ──
        if (source === "symptom_log") {
          const metric = config.metric || "symptom_count";

          if (metric === "pattern_by_time") {
            const patterns = getSymptomPatterns();
            return {
              block, ...base,
              computedLabel: patterns.length > 0 ? `${symptomEntries.length} symptom senaste 14 dagarna` : "Inga symptom loggade",
              computedItems: [],
              computedValue: symptomEntries.length,
              computedTotal: null,
              source: "journal" as const,
              symptomPatterns: patterns,
            };
          }

          if (metric === "symptom_free_days") {
            const periodDays = config.period_days || 7;
            const daysSet = new Set(symptomEntries.map((s: any) => s.entry_date));
            let freeDays = 0;
            for (let i = 0; i < periodDays; i++) {
              const d = format(subDays(new Date(), i), "yyyy-MM-dd");
              if (!daysSet.has(d)) freeDays++;
            }
            return {
              block, ...base,
              computedLabel: `${freeDays}/${periodDays} symptomfria dagar`,
              computedItems: [],
              computedValue: freeDays,
              computedTotal: periodDays,
              source: "journal" as const,
            };
          }

          // Default symptom count
          const recentSymptoms = symptomEntries.filter((s: any) => s.entry_date >= sevenDaysAgo);
          return {
            block, ...base,
            computedLabel: recentSymptoms.length === 0 ? "Inga symptom loggade" : `${recentSymptoms.length} symptom senaste 7 dagarna`,
            computedItems: [],
            computedValue: recentSymptoms.length,
            computedTotal: null,
            source: "journal" as const,
          };
        }

        // ── Health tracking ──
        if (source === "health_tracking") {
          const healthMetric = config.health_metric || "weight";
          const METRIC_META: Record<string, { label: string; unit: string }> = {
            weight: { label: "Vikt", unit: "kg" },
            waist: { label: "Midjemått", unit: "cm" },
            blood_pressure_systolic: { label: "Blodtryck (syst)", unit: "mmHg" },
            blood_pressure_diastolic: { label: "Blodtryck (diast)", unit: "mmHg" },
            bmi: { label: "BMI", unit: "" },
            blood_sugar_fasting: { label: "Fastesocker", unit: "mmol/L" },
            blood_sugar_postprandial: { label: "Blodsocker (efter mat)", unit: "mmol/L" },
          };
          const meta = METRIC_META[healthMetric] || { label: healthMetric, unit: "" };
          const filtered = healthEntries.filter((e: any) => e.metric_type === healthMetric);

          if (config.metric === "trend_chart") {
            const cd = filtered.map((e: any) => ({
              date: format(new Date(e.entry_date), "d MMM"),
              value: Number(e.value),
            }));
            const latest = cd.length > 0 ? cd[cd.length - 1].value : null;
            const first = cd.length > 0 ? cd[0].value : null;
            const diff = latest !== null && first !== null ? latest - first : null;
            return {
              block,
              computedLabel: diff !== null
                ? `${diff > 0 ? "+" : ""}${diff.toFixed(1)} ${meta.unit} sedan start`
                : "Ingen data ännu",
              computedItems: [],
              computedValue: latest,
              computedTotal: null,
              chartData: cd.length > 0 ? cd : null,
              chartMeta: meta,
              source: "journal" as const,
              renderAs,
            };
          }

          if (config.metric === "metric_cards") {
            const cd = filtered.map((e: any) => ({
              date: format(new Date(e.entry_date), "d MMM"),
              value: Number(e.value),
            }));
            const latest = filtered.length > 0 ? Number(filtered[filtered.length - 1].value) : null;
            const first = filtered.length > 0 ? Number(filtered[0].value) : null;
            const diff = latest !== null && first !== null ? latest - first : null;
            return {
              block, ...base,
              computedLabel: latest !== null ? `${meta.label}: ${latest} ${meta.unit}` : "Ingen data ännu",
              computedItems: [],
              computedValue: latest,
              computedTotal: null,
              chartData: cd.length > 0 ? cd : null,
              chartMeta: meta,
              source: "journal" as const,
            };
          }

          if (config.metric === "latest_value") {
            const latest = filtered.length > 0 ? Number(filtered[filtered.length - 1].value) : null;
            return {
              block, ...base,
              computedLabel: latest !== null ? `${meta.label}: ${latest} ${meta.unit}` : "Ingen data ännu",
              computedItems: [],
              computedValue: latest,
              computedTotal: null,
              chartMeta: meta,
              source: "journal" as const,
            };
          }
        }

        // Default fallback
        return {
          block, ...base,
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
