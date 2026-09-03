import type { AreaConfig } from "../types";

const g = (d: Record<string, any>) => {
  const reasons = (d.visit_reasons || []).join(", ") || "svår relation till mat";
  const diagnoses = (d.diagnosis_type || []).join(", ") || "ej specificerat";
  const compensatory = (d.compensatory || []).join(", ") || "inga";
  const barriers = (d.barriers || []).join(", ") || "inga";
  const goals = (d.patient_goals || []).join(", ") || "inga";

  return {
    anamnesis: [
      `Kontaktorsak: ${reasons}`,
      `Tidigare diagnos: ${d.previous_diagnosis || "oklart"} · Typ: ${diagnoses}`,
      `Ätbeteende: Måltidsstruktur: ${d.meal_structure || "—"} · Hoppar över måltider: ${d.skips_meals || "—"}`,
      `Hetsätning: ${d.binge || "—"} · Kontrollförlust: ${d.loss_of_control || "—"} · Restriktivt ätande: ${d.restrictive || "—"}`,
      `Kompensatoriska beteenden: ${compensatory}`,
      `Tankar kring mat: ${d.food_thoughts || "—"} · Rädsla för livsmedel: ${d.food_fear || "—"} · Kalorifokus: ${d.calorie_focus || "—"}`,
      `Kroppsbild: Missnöje: ${d.body_dissatisfaction || "—"} · Vägning: ${d.weighing || "—"} · Kontrollbehov: ${d.control_need || "—"}`,
      `Fysiska signaler: Hunger: ${d.hunger || "—"} · Mättnad: ${d.satiety || "—"} · Energi: ${d.energy || "—"}`,
      `Livsstil: Stress: ${d.stress || "—"}/10`,
      `Motivation: ${d.motivation || "—"}/10 · Hinder: ${barriers}`,
      `Mål: ${goals}`,
    ].join("\n"),

    assessment: `Ätbeteendet och tankemönstret talar för en problematisk relation till mat där ${d.meal_structure === "Oregelbunden" ? "struktur" : "trygghet"} i ätandet behöver prioriteras.${d.loss_of_control === "Ja" ? " Perioder av kontrollförlust förekommer." : ""}${Number(d.stress) >= 7 ? " Förhöjd stressnivå påverkar sannolikt ätbeteendet." : ""}`,

    action: [
      d.meal_structure === "Oregelbunden" || d.skips_meals === "Ja" ? "Införa regelbundna måltider" : null,
      d.restrictive === "Ja" ? "Arbeta med minskad restriktion" : null,
      d.hunger === "Svag" || d.hunger === "Saknas" ? "Stärka förmågan att uppfatta kroppens signaler" : null,
      d.food_fear === "Ja" ? "Gradvis exponering för undvikna livsmedel" : null,
      d.binge === "Ja" ? "Strategier för att förebygga hetsätning" : null,
    ].filter(Boolean).slice(0, 5).join("\n") || "Individanpassad åtgärdsplan behöver utarbetas.",

    next_steps: "Uppföljning med fokus på struktur, upplevelse och trygghet i ätandet.",
  };
};

export const eatingDisorderConfig: AreaConfig = {
  id: "eating_disorder",
  title: "Relation till mat",
  icon: "🤍",
  description: "Ätstörning, hetsätning, restriktivt ätande",
  steps: [
    {
      title: "Bakgrund",
      fields: [
        { type: "chips", key: "visit_reasons", label: "Vad gäller besöket?", options: ["Svår relation till mat", "Hetsätning", "Restriktivt ätande", "Viktoro", "Kontrollbeteenden", "Återhämtning", "Annat"], multi: true },
        { type: "radio", key: "previous_diagnosis", label: "Tidigare diagnos", options: ["Ja", "Nej", "Oklart"] },
        { type: "chips", key: "diagnosis_type", label: "Typ", options: ["Anorexi", "Bulimi", "Hetsätningsstörning", "OSFED", "Oklart"], multi: true, showIf: d => d.previous_diagnosis === "Ja" },
      ],
    },
    {
      title: "Ätbeteende",
      fields: [
        { type: "radio", key: "meal_structure", label: "Måltidsstruktur", options: ["Regelbunden", "Delvis", "Oregelbunden"] },
        { type: "radio", key: "skips_meals", label: "Hoppar över måltider", options: ["Ja", "Nej", "Ibland"] },
        { type: "radio", key: "binge", label: "Hetsätning", options: ["Ja", "Nej", "Ibland"] },
        { type: "radio", key: "loss_of_control", label: "Kontrollförlust vid ätande", options: ["Ja", "Nej", "Ibland"] },
        { type: "radio", key: "restrictive", label: "Restriktivt ätande", options: ["Ja", "Nej", "Ibland"] },
        { type: "chips", key: "compensatory", label: "Kompensatoriska beteenden", options: ["Träning", "Fasta", "Kräkning", "Annat", "Inget"], multi: true },
        { type: "radio", key: "snacking", label: "Småätande", options: ["Högt", "Medel", "Lågt"] },
      ],
    },
    {
      title: "Tankar & relation",
      fields: [
        { type: "radio", key: "food_thoughts", label: "Tankar kring mat", options: ["Lugna", "Något stressande", "Väldigt stressande"] },
        { type: "radio", key: "food_fear", label: "Rädsla för vissa livsmedel", options: ["Ja", "Nej", "Ibland"] },
        { type: "radio", key: "eat_freely", label: "Svårighet att äta fritt", options: ["Ja", "Nej", "Ibland"] },
        { type: "radio", key: "calorie_focus", label: "Tankar kring kalorier", options: ["Låga", "Medel", "Höga"] },
        { type: "radio", key: "emotional_eating", label: "Mat kopplad till känslor", options: ["Ja", "Nej", "Ibland"] },
      ],
    },
    {
      title: "Kroppsbild",
      fields: [
        { type: "radio", key: "body_dissatisfaction", label: "Missnöje med kropp", options: ["Lågt", "Medel", "Högt"] },
        { type: "radio", key: "appearance_focus", label: "Upptagenhet kring vikt/utseende", options: ["Låg", "Medel", "Hög"] },
        { type: "radio", key: "weighing", label: "Vägningsbeteende", options: ["Ofta", "Ibland", "Sällan", "Aldrig"] },
        { type: "radio", key: "control_need", label: "Kontrollbehov kring mat", options: ["Lågt", "Medel", "Högt"] },
      ],
    },
    {
      title: "Fysiska signaler",
      fields: [
        { type: "radio", key: "hunger", label: "Hungerkänsla", options: ["Tydlig", "Svag", "Saknas"] },
        { type: "radio", key: "satiety", label: "Mättnadskänsla", options: ["Tydlig", "Svag", "Svårtolkad"] },
        { type: "radio", key: "energy", label: "Energinivå", options: ["Låg", "Medel", "Hög"] },
        { type: "radio", key: "fatigue", label: "Trötthet", options: ["Ja", "Nej", "Ibland"] },
        { type: "radio", key: "dizziness", label: "Yrsel/svaghet", options: ["Ja", "Nej", "Ibland"] },
      ],
    },
    {
      title: "Livsstil",
      fields: [
        { type: "slider", key: "stress", label: "Stress", min: 1, max: 10 },
        { type: "radio", key: "sleep", label: "Sömn", options: ["<6h", "6–7h", "7–8h", "8+"] },
        { type: "radio", key: "activity", label: "Fysisk aktivitet", options: ["Låg", "Medel", "Hög"] },
        { type: "radio", key: "social_influence", label: "Social påverkan på ätande", options: ["Låg", "Medel", "Hög"] },
      ],
    },
    {
      title: "Hinder & mål",
      fields: [
        { type: "slider", key: "motivation", label: "Motivation", min: 1, max: 10 },
        { type: "chips", key: "barriers", label: "Hinder", options: ["Rädsla för viktuppgång", "Kontrollbehov", "Ångest kring mat", "Sociala situationer", "Stress", "Oregelbundna rutiner"], multi: true },
        { type: "chips", key: "patient_goals", label: "Klientens mål", options: ["Få struktur", "Mindre ångest kring mat", "Kunna äta mer fritt", "Regelbundet ätande", "Förbättrad relation till mat"], multi: true },
      ],
    },
  ],
  generateJournalText: g,
};
