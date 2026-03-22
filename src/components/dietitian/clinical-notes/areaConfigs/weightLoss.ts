import type { AreaConfig } from "../types";

const g = (d: Record<string, any>) => {
  const goals = (d.patient_goals || []).join(", ") || "inga";
  const barriers = (d.barriers || []).join(", ") || "inga";
  const prevAttempts = (d.previous_attempts || []).join(", ") || "inga";

  return {
    anamnesis: `Patient söker för ${goals || "viktminskning"}. Mål: ${goals}. Tidsram: ${d.timeframe || "—"}. Tidigare försök: ${prevAttempts}. Vikt: ${d.weight || "—"} kg, längd: ${d.height || "—"} cm. Vikttrend: ${d.weight_trend || "—"}, förändring senaste året: ${d.weight_change_year || "—"}, upplevd svårighet: ${d.difficulty || "—"}. Måltidsstruktur: ${d.meal_structure || "—"}, portioner: ${d.portion_size || "—"}, snabba kolhydrater: ${d.fast_carbs || "—"}, protein: ${d.protein || "—"}, småätande: ${d.snacking || "—"}, kvällsätande: ${d.evening_eating || "—"}. Äter av hunger/vana: ${d.eating_trigger || "—"}, äter snabbt: ${d.eats_fast || "—"}, stressätande: ${d.stress_eating || "—"}, kontrollförlust: ${d.loss_of_control || "—"}. Fysisk aktivitet: ${d.activity || "—"}, sömn: ${d.sleep || "—"}, stress: ${d.stress || "—"}/10. Motivation: ${d.motivation || "—"}/10. Hinder: ${barriers}.`,

    assessment: `Energibalansen påverkas sannolikt av ${d.meal_structure === "Oregelbunden" ? "oregelbundet måltidsmönster" : ""}${d.snacking === "Högt" ? ", småätande" : ""}${d.activity === "Låg" ? " och låg fysisk aktivitet" : ""}.`.replace(/av ,/g, "av ").replace(/av  och/g, "av"),

    action: [
      d.meal_structure === "Oregelbunden" ? "Införa regelbundna måltider" : null,
      d.snacking === "Högt" ? "Minska småätande genom strukturerade mellanmål" : null,
      d.protein === "Lågt" ? "Öka proteinintag vid huvudmåltider" : null,
      d.portion_size === "Stora" ? "Portionskontroll med hjälp av tallriksmodellen" : null,
      d.activity === "Låg" ? "Öka daglig fysisk aktivitet" : null,
      d.evening_eating === "Ja" ? "Strategier för kvällsätande" : null,
    ].filter(Boolean).slice(0, 5).join("\n") || "Individanpassad åtgärdsplan behöver utarbetas.",

    next_steps: "Uppföljning om 4 veckor med fokus på följsamhet och beteendeförändringar.",
  };
};

export const weightLossConfig: AreaConfig = {
  id: "weight_loss",
  title: "Viktminskning",
  icon: "⚖️",
  description: "Hållbar viktnedgång, beteendeförändring",
  steps: [
    {
      title: "Bakgrund & mål",
      fields: [
        { type: "chips", key: "patient_goals", label: "Vad är målet?", options: ["Gå ner i vikt", "Få bättre vanor", "Minska småätande", "Få struktur", "Öka energi"], multi: true },
        { type: "dropdown", key: "timeframe", label: "Tidsram", options: ["Ingen specifik", "Kort sikt", "Lång sikt"] },
        { type: "chips", key: "previous_attempts", label: "Tidigare försök", options: ["Kaloriräkning", "Lågkolhydratkost", "Periodisk fasta", "Dietprogram", "Inget"], multi: true },
      ],
    },
    {
      title: "Antropometri",
      fields: [
        { type: "numeric", key: "weight", label: "Vikt", unit: "kg" },
        { type: "numeric", key: "height", label: "Längd", unit: "cm" },
        { type: "radio", key: "weight_trend", label: "Vikttrend", options: ["Stabil", "Upp", "Ner"] },
        { type: "radio", key: "weight_change_year", label: "Viktförändring senaste året", options: ["Upp", "Ner", "Stabil"] },
        { type: "radio", key: "difficulty", label: "Upplevd svårighet att gå ner", options: ["Låg", "Medel", "Hög"] },
      ],
    },
    {
      title: "Kostmönster",
      fields: [
        { type: "radio", key: "meal_structure", label: "Måltidsstruktur", options: ["Regelbunden", "Delvis", "Oregelbunden"] },
        { type: "radio", key: "portion_size", label: "Portionsstorlek", options: ["Små", "Normala", "Stora"] },
        { type: "radio", key: "fast_carbs", label: "Snabba kolhydrater", options: ["Högt", "Medel", "Lågt"] },
        { type: "radio", key: "protein", label: "Proteinintag", options: ["Lågt", "Medel", "Högt"] },
        { type: "radio", key: "fiber", label: "Fiber", options: ["Lågt", "Medel", "Högt"] },
        { type: "radio", key: "fat_quality", label: "Fettkvalitet", options: ["Smör", "Blandat", "Olja"] },
        { type: "radio", key: "snacking", label: "Småätande", options: ["Högt", "Medel", "Lågt"] },
        { type: "radio", key: "evening_eating", label: "Kvällsätande", options: ["Ja", "Nej", "Ibland"] },
      ],
    },
    {
      title: "Ätbeteende",
      fields: [
        { type: "radio", key: "eating_trigger", label: "Äter av hunger eller vana", options: ["Mest hunger", "Blandat", "Mest vana"] },
        { type: "radio", key: "eats_fast", label: "Äter snabbt", options: ["Ja", "Nej", "Ibland"] },
        { type: "radio", key: "stress_eating", label: "Äter vid stress/känslor", options: ["Ja", "Nej", "Ibland"] },
        { type: "radio", key: "loss_of_control", label: "Upplever kontrollförlust", options: ["Ja", "Nej", "Ibland"] },
      ],
    },
    {
      title: "Livsstil",
      fields: [
        { type: "radio", key: "activity", label: "Fysisk aktivitet", options: ["Låg", "Medel", "Hög"] },
        { type: "radio", key: "steps_day", label: "Steg/dag", options: ["Okänt", "<5000", "5–8000", "8000+"] },
        { type: "radio", key: "sleep", label: "Sömn", options: ["<6h", "6–7h", "7–8h", "8+"] },
        { type: "slider", key: "stress", label: "Stress", min: 1, max: 10 },
      ],
    },
    {
      title: "Hinder & motivation",
      fields: [
        { type: "slider", key: "motivation", label: "Motivation", min: 1, max: 10 },
        { type: "chips", key: "barriers", label: "Hinder", options: ["Tidsbrist", "Sötsug", "Stress", "Trötthet", "Sociala situationer", "Oregelbundna rutiner", "Brist på struktur"], multi: true },
      ],
    },
  ],
  generateJournalText: g,
};
