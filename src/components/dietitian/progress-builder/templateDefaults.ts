// Default sections enabled per template
export const TEMPLATE_SECTION_DEFAULTS: Record<string, string[]> = {
  auto: [
    "metric_cards", "trend_chart", "weekly_overview",
    "treatment_plan", "milestones", "log_button", "macro_progress",
  ],
  weight_loss: [
    "metric_cards", "trend_chart", "weekly_overview",
    "treatment_plan", "milestones", "log_button",
  ],
  diabetes: [
    "metric_cards", "trend_chart", "weekly_overview",
    "treatment_plan", "milestones", "log_button",
  ],
  gut_health: [
    "metric_cards", "weekly_overview", "treatment_plan",
    "milestones", "log_button",
  ],
  heart_health: [
    "metric_cards", "trend_chart", "weekly_overview",
    "treatment_plan", "milestones", "log_button",
  ],
  womens_health: [
    "metric_cards", "trend_chart", "weekly_overview",
    "treatment_plan", "milestones", "log_button",
  ],
  eating_disorder: [
    "weekly_overview", "treatment_plan", "milestones",
  ],
  general_health: [
    "metric_cards", "trend_chart", "weekly_overview",
    "treatment_plan", "milestones", "log_button", "macro_progress",
  ],
};
