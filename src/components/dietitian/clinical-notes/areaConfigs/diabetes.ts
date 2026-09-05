import type { LegacyAreaConfig } from "../types";

const g = (d: Record<string, any>) => {
  const type = d.diabetes_type || "oklart";
  const treatments = (d.treatments || []).join(", ") || "ej angivet";
  const barriers = (d.barriers || []).join(", ") || "inga";
  const goals = (d.patient_goals || []).join(", ") || "inga";
  const peaks = (d.sugar_peaks || []).join(", ") || "oklart";

  return {
    anamnesis: [
      `Diabetestyp: ${type} · Duration: ${d.duration || "oklart"}`,
      `Behandling: ${treatments} · Upplevd kontroll: ${d.control || "—"}/10`,
      `Mätvärden: HbA1c: ${d.hba1c || "—"} · Fastesocker: ${d.fasting_glucose || "—"} · Postprandiellt: ${d.postprandial || "—"}`,
      `Blodsockervariation: ${d.glucose_variation || "—"} · Hypoglykemier: ${d.hypoglycemia || "—"}`,
      `Antropometri: Vikt: ${d.weight || "—"} kg`,
      `Kost: Måltidsstruktur: ${d.meal_structure || "—"} · Kolhydrater: ${d.carb_intake || "—"} · Snabba KH: ${d.fast_carbs || "—"} · Fullkorn: ${d.whole_grain || "—"} · Protein: ${d.protein || "—"}`,
      `Blodsockertoppar: ${peaks}`,
      `Livsstil: Aktivitet: ${d.activity || "—"} · Stress: ${d.stress || "—"}/10`,
      `Motivation: ${d.motivation || "—"}/10 · Hinder: ${barriers}`,
      `Mål: ${goals}`,
    ].join("\n"),

    assessment: `${d.hba1c && Number(d.hba1c) > 52 ? "Otillfredsställande blodsockerkontroll" : "Blodsockerkontroll bedömd"} med sannolik påverkan av ${d.meal_structure === "Oregelbunden" ? "oregelbundet måltidsmönster" : ""}${d.fast_carbs === "Högt" ? " och högt intag av snabba kolhydrater" : ""}. ${d.hypoglycemia === "Ja" ? "Hypoglykemier förekommer — stabilitet behöver prioriteras." : ""}`,

    action: [
      d.meal_structure === "Oregelbunden" ? "Införa regelbundna måltider med jämn kolhydratfördelning" : null,
      d.fast_carbs === "Högt" ? "Minska snabba kolhydrater och öka andelen fullkorn" : null,
      d.protein === "Lågt" ? "Öka proteinintag vid huvudmåltider" : null,
      d.activity === "Låg" ? "Öka daglig fysisk aktivitet, t.ex. promenad efter måltid" : null,
      d.hypoglycemia === "Ja" ? "Plan för förebyggande av hypoglykemier" : null,
    ].filter(Boolean).slice(0, 5).join("\n") || "Individanpassad åtgärdsplan behöver utarbetas.",

    next_steps: `Uppföljning om 4 veckor med fokus på följsamhet och blodsockermönster.${d.hba1c && Number(d.hba1c) > 52 ? " Överväg kontroll av HbA1c vid nästa besök." : ""}`,
  };
};

export const diabetesConfig: LegacyAreaConfig = {
  id: "diabetes",
  title: "Diabetes / Blodsocker",
  icon: "🩸",
  description: "Typ 1, Typ 2, prediabetes, blodsockerhantering",
  steps: [
    {
      title: "Diagnos & status",
      fields: [
        { type: "radio", key: "diabetes_type", label: "Typ av diabetes", options: ["Typ 1", "Typ 2", "Prediabetes", "Oklart"] },
        { type: "dropdown", key: "duration", label: "Hur länge?", options: ["Nydiagnostiserad", "<1 år", "1–5 år", ">5 år"] },
        { type: "chips", key: "treatments", label: "Behandling", options: ["Kostbehandling", "Metformin", "Insulin", "GLP-1", "SGLT2", "Annat"], multi: true },
        { type: "slider", key: "control", label: "Upplevd kontroll", min: 1, max: 10 },
      ],
    },
    {
      title: "Mätvärden",
      fields: [
        { type: "numeric", key: "hba1c", label: "HbA1c", unit: "mmol/mol" },
        { type: "numeric", key: "fasting_glucose", label: "Fastesocker", unit: "mmol/L" },
        { type: "numeric", key: "postprandial", label: "Postprandiellt blodsocker", unit: "mmol/L" },
        { type: "radio", key: "glucose_variation", label: "Blodsockervariation", options: ["Stabil", "Måttlig variation", "Stor variation", "Oklart"] },
        { type: "radio", key: "hypoglycemia", label: "Hypoglykemier", options: ["Ja", "Nej", "Ibland"] },
        { type: "numeric", key: "weight", label: "Vikt", unit: "kg" },
        { type: "numeric", key: "height_cm", label: "Längd", unit: "cm" },
        { type: "numeric", key: "waist", label: "Midjemått", unit: "cm" },
      ],
    },
    {
      title: "Kostmönster",
      fields: [
        { type: "radio", key: "meal_structure", label: "Måltidsstruktur", options: ["Regelbunden", "Delvis", "Oregelbunden"] },
        { type: "radio", key: "carb_intake", label: "Kolhydratintag", options: ["Högt", "Medel", "Lågt", "Oklart"] },
        { type: "radio", key: "fast_carbs", label: "Snabba kolhydrater", options: ["Högt", "Medel", "Lågt"] },
        { type: "radio", key: "whole_grain", label: "Fullkorn", options: ["Högt", "Medel", "Lågt"] },
        { type: "radio", key: "protein", label: "Proteinintag", options: ["Lågt", "Medel", "Högt"] },
        { type: "radio", key: "fat_quality", label: "Fettkvalitet", options: ["Smör", "Blandat", "Olja"] },
        { type: "radio", key: "snacking", label: "Mellanmål", options: ["Ja regelbundet", "Ibland", "Nej"] },
        { type: "radio", key: "sweet_cravings", label: "Sötsug/småätande", options: ["Högt", "Medel", "Lågt"] },
      ],
    },
    {
      title: "Blodsockermönster",
      fields: [
        { type: "chips", key: "sugar_peaks", label: "När uppstår toppar?", options: ["Frukost", "Lunch", "Middag", "Kväll", "Mellanmål", "Oklart"], multi: true },
        { type: "radio", key: "food_connection", label: "Koppling till mat", options: ["Tydlig", "Möjlig", "Ingen", "Oklart"] },
        { type: "radio", key: "symptom_awareness", label: "Känner igen symtom", options: ["Ja", "Nej", "Delvis"] },
        { type: "radio", key: "monitors", label: "Följer blodsocker", options: ["Ja", "Nej", "Ibland"] },
      ],
    },
    {
      title: "Livsstil",
      fields: [
        { type: "radio", key: "activity", label: "Fysisk aktivitet", options: ["Låg", "Medel", "Hög"] },
        { type: "radio", key: "steps_day", label: "Steg/dag", options: ["Okänt", "<5000", "5–8000", "8000+"] },
        { type: "radio", key: "sleep", label: "Sömn", options: ["<6h", "6–7h", "7–8h", "8+"] },
        { type: "slider", key: "stress", label: "Stress", min: 1, max: 10 },
        { type: "dropdown", key: "alcohol", label: "Alkohol (standardglas/vecka)", options: ["Ingen", "1–3", "4–7", "8+"] },
      ],
    },
    {
      title: "Hinder & mål",
      fields: [
        { type: "slider", key: "motivation", label: "Motivation", min: 1, max: 10 },
        { type: "chips", key: "barriers", label: "Hinder", options: ["Tidsbrist", "Vanor", "Sötsug", "Stress", "Sociala situationer", "Kunskap", "Ekonomi"], multi: true },
        { type: "chips", key: "patient_goals", label: "Klientens mål", options: ["Sänka HbA1c", "Jämnare blodsocker", "Gå ner i vikt", "Mindre toppar", "Få struktur"], multi: true },
      ],
    },
  ],
  generateJournalText: g,
};
