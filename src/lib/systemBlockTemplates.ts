/**
 * System block templates that map to all existing progress view elements.
 * These get auto-seeded into block_templates for each dietitian so they
 * can customize and assign them to patients.
 * 
 * Duplicates have been consolidated — each concept exists only once as a
 * category-agnostic "general" block.
 */

export interface SystemBlockDef {
  key: string;
  title: string;
  description: string;
  icon: string;
  block_type: string;
  category: string;
  data_source: string;
  data_config: Record<string, any>;
  display_config: Record<string, any>;
}

export const SYSTEM_BLOCK_TEMPLATES: SystemBlockDef[] = [
  // ── Cross-category blocks (one of each) ──
  {
    key: "meal_rhythm_today",
    title: "Måltidsrytm idag",
    description: "Visar vilka måltider som loggats idag",
    icon: "Calendar",
    block_type: "progress",
    category: "general",
    data_source: "meal_log",
    data_config: { system_key: "meal_rhythm_today", metric: "meal_rhythm" },
    display_config: { render_as: "meal_rhythm_card" },
  },
  {
    key: "meal_structure",
    title: "Måltidsstruktur",
    description: "Genomsnittlig måltidsstruktur senaste veckan",
    icon: "Activity",
    block_type: "progress",
    category: "general",
    data_source: "meal_log",
    data_config: { system_key: "meal_structure", metric: "structure_7d" },
    display_config: { render_as: "meal_structure_card" },
  },
  {
    key: "regularity_30d",
    title: "Regelbundenhet",
    description: "Antal dagar med 3+ måltider senaste 30 dagarna",
    icon: "Activity",
    block_type: "progress",
    category: "general",
    data_source: "meal_log",
    data_config: { system_key: "regularity_30d", metric: "regularity_30d", threshold: 3 },
    display_config: { render_as: "regularity_grid" },
  },
  {
    key: "logged_days",
    title: "Loggade dagar",
    description: "Antal loggade dagar denna vecka",
    icon: "Calendar",
    block_type: "progress",
    category: "general",
    data_source: "meal_log",
    data_config: { system_key: "logged_days", metric: "weekly_overview" },
    display_config: { render_as: "weekly_overview_card" },
  },
  {
    key: "behavior_goals",
    title: "Beteendemål",
    description: "Delmål för aktuell fas i behandlingsplanen",
    icon: "Target",
    block_type: "action",
    category: "general",
    data_source: "treatment_goals",
    data_config: { system_key: "behavior_goals", metric: "milestones" },
    display_config: { render_as: "behavior_goals_card" },
  },
  {
    key: "symptom_patterns",
    title: "Symptommönster",
    description: "Symptom grupperade efter tid på dygnet",
    icon: "AlertTriangle",
    block_type: "insight",
    category: "general",
    data_source: "symptom_log",
    data_config: { system_key: "symptom_patterns", metric: "pattern_by_time", period_days: 14 },
    display_config: { render_as: "symptom_pattern_card" },
  },
  {
    key: "next_appointment",
    title: "Nästa samtal",
    description: "Kommande videosamtal med dietisten",
    icon: "Calendar",
    block_type: "follow_up",
    category: "general",
    data_source: "appointments",
    data_config: { system_key: "next_appointment", metric: "next_appointment" },
    display_config: { render_as: "follow_up_card" },
  },
  {
    key: "daily_focus",
    title: "Dagens fokus",
    description: "Uppmuntrande fokustext baserad på behandlingsplanen",
    icon: "Heart",
    block_type: "insight",
    category: "general",
    data_source: "treatment_plan",
    data_config: { system_key: "daily_focus", metric: "plan_description" },
    display_config: { render_as: "focus_card" },
  },

  // ── Weight ──
  {
    key: "weight_trend",
    title: "Viktutveckling",
    description: "Viktkurva med trendindikator",
    icon: "TrendingDown",
    block_type: "progress",
    category: "weight_loss",
    data_source: "health_tracking",
    data_config: { system_key: "weight_trend", health_metric: "weight", metric: "trend_chart", period_days: 30 },
    display_config: { render_as: "trend_chart" },
  },

  // ── Diabetes ──
  {
    key: "db_trend",
    title: "Blodsockertrendgraf",
    description: "Blodsocker senaste 30 dagarna",
    icon: "TrendingUp",
    block_type: "progress",
    category: "diabetes",
    data_source: "health_tracking",
    data_config: { system_key: "db_trend", health_metric: "blood_sugar_fasting", metric: "trend_chart" },
    display_config: { render_as: "trend_chart" },
  },


  // ── Gut Health / IBS ──
  {
    key: "gh_symptom_free",
    title: "Symptomfria dagar",
    description: "Antal dagar utan symptom senaste 7 dagarna",
    icon: "Check",
    block_type: "progress",
    category: "gut_health",
    data_source: "symptom_log",
    data_config: { system_key: "gh_symptom_free", metric: "symptom_free_days", period_days: 7 },
    display_config: { render_as: "symptom_free_card" },
  },

  // ── Heart Health ──
  {
    key: "hh_bp_trend",
    title: "Blodtryckstrend",
    description: "Systoliskt blodtryck över tid",
    icon: "Heart",
    block_type: "progress",
    category: "heart_health",
    data_source: "health_tracking",
    data_config: { system_key: "hh_bp_trend", health_metric: "blood_pressure_systolic", metric: "trend_chart" },
    display_config: { render_as: "trend_chart" },
  },
  {
    key: "hh_waist_trend",
    title: "Midjemått trend",
    description: "Midjemått över tid",
    icon: "Ruler",
    block_type: "progress",
    category: "heart_health",
    data_source: "health_tracking",
    data_config: { system_key: "hh_waist_trend", health_metric: "waist", metric: "trend_chart" },
    display_config: { render_as: "trend_chart" },
  },
];
