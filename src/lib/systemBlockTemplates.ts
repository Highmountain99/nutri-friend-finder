/**
 * System block templates available to coaches.
 * Deliberately kept to a small, curated set — only these four blocks
 * can be added to a client's "Din utveckling" view.
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
  {
    key: "weight_trend",
    title: "Viktutveckling",
    description: "Viktkurva med trend och tidsfilter",
    icon: "TrendingDown",
    block_type: "progress",
    category: "general",
    data_source: "health_tracking",
    data_config: { system_key: "weight_trend", health_metric: "weight", metric: "trend_chart" },
    display_config: { render_as: "weight_trend_card", width: "full" },
  },
  {
    key: "meals_week",
    title: "Måltider",
    description: "Antal måltider per dag senaste veckan",
    icon: "Activity",
    block_type: "progress",
    category: "general",
    data_source: "meal_log",
    data_config: { system_key: "meals_week", metric: "weekly_bars" },
    display_config: { render_as: "meals_week_card", width: "half" },
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
    display_config: { render_as: "logged_days_card", width: "half" },
  },
  {
    key: "waist_trend",
    title: "Midjemått",
    description: "Midjemått över tid med trend och tidsfilter",
    icon: "Ruler",
    block_type: "progress",
    category: "general",
    data_source: "health_tracking",
    data_config: { system_key: "waist_trend", health_metric: "waist", metric: "trend_chart" },
    display_config: { render_as: "waist_trend_card", width: "full" },
  },
];
