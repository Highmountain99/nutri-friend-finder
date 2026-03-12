export interface SectionDef {
  value: string;
  label: string;
  description: string;
}

// ─── Generic sections available across templates ─────────────

export const GENERIC_SECTIONS: SectionDef[] = [
  { value: "metric_cards", label: "Mätvärden", description: "Kort med nyckeltal" },
  { value: "trend_chart", label: "Trendgraf", description: "Visuell graf över utvecklingen" },
  { value: "weekly_overview", label: "Veckoöversikt", description: "Aktiva dagar och loggade måltider" },
  { value: "treatment_plan", label: "Behandlingsplan", description: "Mål och delmål från planen" },
  { value: "milestones", label: "Milstolpar", description: "Automatiska milstolpar" },
  { value: "log_button", label: "Loggningsknapp", description: "Snabbknapp för att logga" },
  { value: "macro_progress", label: "Makroöversikt", description: "Protein, kolhydrater, fett" },
];

// ─── Category-specific sections ──────────────────────────────

export const CATEGORY_SECTIONS: Record<string, SectionDef[]> = {
  weight_loss: [
    { value: "metric_cards", label: "Viktvärden", description: "Vikt, förändring, startvikt, kvar till mål" },
    { value: "trend_chart", label: "Vikttrendgraf", description: "Viktkurva med målvikt" },
    { value: "log_button", label: "Logga vikt", description: "Snabbknapp vikt" },
    { value: "weekly_overview", label: "Veckoöversikt", description: "Aktiva dagar & måltider" },
    { value: "treatment_plan", label: "Behandlingsplan", description: "Mål och delmål" },
    { value: "milestones", label: "Milstolpar", description: "Automatiska milstolpar" },
  ],
  diabetes: [
    { value: "blood_sugar_metrics", label: "Blodsockervärden", description: "Fastesocker & efter-mat med målstatus" },
    { value: "log_button", label: "Logga värden", description: "Faste, efter mat, HbA1c" },
    { value: "trend_chart", label: "Blodsockertrendgraf", description: "Blodsocker senaste 7 dagar" },
    { value: "time_in_range", label: "Tid i målintervall", description: "Andel mätningar 4-10 mmol/L" },
    { value: "carb_intake", label: "Kolhydratintag", description: "Kolhydratmål med progressbar" },
    { value: "diabetes_focus", label: "Fokusområden", description: "Dagliga mål för diabeteskontroll" },
    { value: "treatment_plan", label: "Behandlingsplan", description: "Mål och delmål" },
    { value: "milestones", label: "Milstolpar", description: "Automatiska milstolpar" },
  ],
  gut_health: [
    { value: "fodmap_phases", label: "FODMAP-faser", description: "Eliminering, Återintroduktion, Personalisering" },
    { value: "fodmap_triggers", label: "Identifierade triggers", description: "Triggergrupper med status" },
    { value: "symptom_free_days", label: "Symptomfria dagar", description: "Antal dagar utan symptom" },
    { value: "treatment_plan", label: "Behandlingsplan", description: "Mål och delmål" },
    { value: "milestones", label: "Milstolpar", description: "Automatiska milstolpar" },
    { value: "log_button", label: "Logga reaktion", description: "Logga symptom/reaktion" },
  ],
  heart_health: [
    { value: "cholesterol_bp", label: "Kolesterol & blodtryck", description: "Värden med målstatus" },
    { value: "log_button", label: "Logga värden", description: "Kolesterol, blodtryck" },
    { value: "mediterranean_score", label: "Medelhavspoäng", description: "Veckovis kostpoäng" },
    { value: "heart_healthy_choices", label: "Hjärtvänliga val", description: "Portionsmål per kategori" },
    { value: "trend_chart", label: "Kolesteroltrendgraf", description: "Kolesteroltrend 6 mån" },
    { value: "treatment_plan", label: "Behandlingsplan", description: "Mål och delmål" },
    { value: "heart_tip", label: "Hälsotips", description: "Tips för bättre hjärthälsa" },
  ],
  eating_disorder: [
    { value: "affirmation", label: "Dagens fokus", description: "Stödjande affirmation" },
    { value: "meal_rhythm", label: "Måltidsrytm idag", description: "Frukost, lunch, middag, mellanmål" },
    { value: "meal_regularity", label: "Regelbundenhet (30d)", description: "Heatmap över måltider" },
    { value: "treatment_plan", label: "Behandlingsplan", description: "Mål och delmål" },
    { value: "next_appointment", label: "Nästa samtal", description: "Kommande videosamtal" },
  ],
  womens_health: [
    { value: "womens_metrics", label: "Viktvärden", description: "Vikt & midjemått med mål" },
    { value: "log_button", label: "Logga vikt", description: "Vikt & midjemått" },
    { value: "trend_chart", label: "Vikttrendgraf", description: "Viktutveckling" },
    { value: "focus_areas", label: "Fokusområden", description: "Insulin, hormon, vikt" },
    { value: "weekly_overview", label: "Veckoöversikt", description: "Aktiva dagar & måltider" },
    { value: "treatment_plan", label: "Behandlingsplan", description: "Mål och delmål" },
    { value: "milestones", label: "Milstolpar", description: "Automatiska milstolpar" },
  ],
  general_health: [
    { value: "calorie_macro", label: "Kalorier & aktivitet", description: "Dagskalorier & aktiva dagar" },
    { value: "log_button", label: "Logga vikt", description: "Snabbknapp vikt" },
    { value: "macro_progress", label: "Makros idag", description: "Protein, kolhydrater, fett" },
    { value: "weekly_overview", label: "Veckoöversikt", description: "Aktiva dagar & måltider" },
    { value: "treatment_plan", label: "Behandlingsplan", description: "Mål och delmål" },
    { value: "milestones", label: "Milstolpar", description: "Automatiska milstolpar" },
  ],
};

// "auto" uses all generic sections
CATEGORY_SECTIONS["auto"] = GENERIC_SECTIONS;

// ─── Default enabled sections per template ───────────────────

export const TEMPLATE_SECTION_DEFAULTS: Record<string, string[]> = {};
for (const [key, sections] of Object.entries(CATEGORY_SECTIONS)) {
  TEMPLATE_SECTION_DEFAULTS[key] = sections.map(s => s.value);
}
