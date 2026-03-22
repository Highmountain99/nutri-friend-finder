import type { AreaConfig } from "../types";

const g = (d: Record<string, any>) => {
  const status = d.status || "oklart";
  const isPregnant = status === "Gravid";
  const barriers = (d.barriers || []).join(", ") || "inga";
  const goals = (d.patient_goals || []).join(", ") || "inga";

  const statusDetail = isPregnant
    ? `Trimester: ${d.trimester || "—"}, första graviditet: ${d.first_pregnancy || "—"}. Viktutveckling: ${d.weight_dev || "—"}, illamående: ${d.nausea || "—"}, kräkningar: ${d.vomiting || "—"}, aptit: ${d.appetite || "—"}, sug/cravings: ${d.cravings || "—"}.`
    : `Tid sedan förlossning: ${d.postpartum_time || "—"}, ammar: ${d.breastfeeding || "—"}. Energi: ${d.pp_energy || "—"}, återhämtning: ${d.recovery || "—"}, hunger: ${d.pp_hunger || "—"}, sömnbrist: ${d.pp_sleep_dep || "—"}.`;

  return {
    anamnesis: `Patient ${isPregnant ? "gravid" : "postpartum"}. ${statusDetail} Symtom: trötthet ${d.fatigue || "—"}, yrsel ${d.dizziness || "—"}, förstoppning ${d.constipation || "—"}, halsbränna ${d.heartburn || "—"}, svullnad ${d.swelling || "—"}, blodsockersvängningar ${d.glucose_swings || "—"}, järnbrist ${d.iron_deficiency || "—"}. Måltidsstruktur: ${d.meal_structure || "—"}, protein: ${d.protein || "—"}, frukt/grönt: ${d.fruit_veg || "—"}, vätska: ${d.fluids || "—"}. Fysisk aktivitet: ${d.activity || "—"}, stress: ${d.stress || "—"}/10, socialt stöd: ${d.social_support || "—"}. Motivation: ${d.motivation || "—"}/10. Hinder: ${barriers}. Mål: ${goals}.`,

    assessment: isPregnant
      ? `Näringsintaget påverkas sannolikt av ${d.nausea === "Högt" ? "illamående" : "aptitförändringar"} och ${d.meal_structure === "Oregelbunden" ? "låg måltidsstruktur" : "nuvarande kostmönster"}. Fokus bör ligga på att säkerställa energi och näring.`
      : `Postpartumperioden präglas av ${d.pp_sleep_dep === "Hög" ? "uttalad sömnbrist" : "återhämtningsfas"}. Energi- och näringsintag behöver säkerställas${d.breastfeeding === "Ja" ? " med hänsyn till amning" : ""}.`,

    action: [
      d.meal_structure === "Oregelbunden" ? "Införa små, regelbundna måltider" : null,
      d.protein === "Lågt" ? "Säkerställa protein vid varje måltid" : null,
      d.fluids === "Lågt" ? "Öka vätskeintag" : null,
      isPregnant && d.nausea === "Högt" ? "Anpassa kost efter illamående (små portioner, undvik triggers)" : null,
      !isPregnant && d.pp_energy === "Låg" ? "Energirika, lättlagade måltider" : null,
      d.iron_deficiency === "Ja" ? "Järnrika livsmedel och absorptionsfrämjande kombination" : null,
    ].filter(Boolean).slice(0, 5).join("\n") || "Individanpassad åtgärdsplan behöver utarbetas.",

    next_steps: `Uppföljning om ${isPregnant ? "3–4" : "4–6"} veckor med fokus på energi och måltidsstruktur.`,
  };
};

export const pregnancyConfig: AreaConfig = {
  id: "pregnancy",
  title: "Graviditet & Postpartum",
  icon: "🤰",
  description: "Graviditet, postpartum, amning",
  steps: [
    {
      title: "Status",
      fields: [
        { type: "radio", key: "status", label: "Status", options: ["Gravid", "Postpartum"] },
        { type: "radio", key: "trimester", label: "Trimester", options: ["Trimester 1", "Trimester 2", "Trimester 3"], showIf: d => d.status === "Gravid" },
        { type: "radio", key: "first_pregnancy", label: "Första graviditet", options: ["Ja", "Nej"], showIf: d => d.status === "Gravid" },
        { type: "dropdown", key: "postpartum_time", label: "Tid sedan förlossning", options: ["<6 veckor", "6–12 veckor", "3–6 månader", "6–12 månader"], showIf: d => d.status === "Postpartum" },
        { type: "radio", key: "breastfeeding", label: "Ammar", options: ["Ja", "Nej", "Delvis"], showIf: d => d.status === "Postpartum" },
      ],
    },
    {
      title: "Status-specifik info",
      fields: [
        // Gravid
        { type: "radio", key: "weight_dev", label: "Viktutveckling (upplevd)", options: ["Låg", "Normal", "Hög", "Oklart"], showIf: d => d.status === "Gravid" },
        { type: "radio", key: "nausea", label: "Illamående", options: ["Lågt", "Medel", "Högt"], showIf: d => d.status === "Gravid" },
        { type: "radio", key: "vomiting", label: "Kräkningar", options: ["Ja", "Nej", "Ibland"], showIf: d => d.status === "Gravid" },
        { type: "radio", key: "appetite", label: "Aptit", options: ["Låg", "Normal", "Hög"], showIf: d => d.status === "Gravid" },
        { type: "radio", key: "cravings", label: "Sug/cravings", options: ["Lågt", "Medel", "Högt"], showIf: d => d.status === "Gravid" },
        // Postpartum
        { type: "radio", key: "pp_energy", label: "Energinivå", options: ["Låg", "Medel", "Hög"], showIf: d => d.status === "Postpartum" },
        { type: "radio", key: "recovery", label: "Återhämtning", options: ["Långsam", "Normal", "Snabb"], showIf: d => d.status === "Postpartum" },
        { type: "radio", key: "pp_hunger", label: "Hungerkänsla", options: ["Låg", "Medel", "Hög"], showIf: d => d.status === "Postpartum" },
        { type: "radio", key: "pp_sleep_dep", label: "Sömnbrist", options: ["Låg", "Medel", "Hög"], showIf: d => d.status === "Postpartum" },
      ],
    },
    {
      title: "Symptom",
      fields: [
        { type: "radio", key: "fatigue", label: "Trötthet", options: ["Låg", "Medel", "Hög"] },
        { type: "radio", key: "dizziness", label: "Yrsel", options: ["Ja", "Nej", "Ibland"] },
        { type: "radio", key: "constipation", label: "Förstoppning", options: ["Ja", "Nej", "Ibland"] },
        { type: "radio", key: "heartburn", label: "Halsbränna", options: ["Ja", "Nej", "Ibland"] },
        { type: "radio", key: "swelling", label: "Svullnad", options: ["Ja", "Nej", "Ibland"] },
        { type: "radio", key: "glucose_swings", label: "Blodsockersvängningar", options: ["Ja", "Nej", "Oklart"] },
        { type: "radio", key: "iron_deficiency", label: "Järnbrist (om känd)", options: ["Ja", "Nej", "Oklart"] },
      ],
    },
    {
      title: "Kostmönster",
      fields: [
        { type: "radio", key: "meal_structure", label: "Måltidsstruktur", options: ["Regelbunden", "Delvis", "Oregelbunden"] },
        { type: "radio", key: "appetite_now", label: "Aptit", options: ["Låg", "Normal", "Hög"] },
        { type: "radio", key: "protein", label: "Proteinintag", options: ["Lågt", "Medel", "Högt"] },
        { type: "radio", key: "carb_quality", label: "Kolhydratkvalitet", options: ["Låg", "Medel", "Hög"] },
        { type: "radio", key: "fat_quality", label: "Fettkvalitet", options: ["Smör", "Blandat", "Olja"] },
        { type: "radio", key: "fruit_veg", label: "Frukt & grönt", options: ["0–1", "2–3", "4–5", "5+"] },
        { type: "radio", key: "fluids", label: "Vätskeintag", options: ["Lågt", "Medel", "Högt"] },
        { type: "radio", key: "snacking", label: "Småätande", options: ["Lågt", "Medel", "Högt"] },
      ],
    },
    {
      title: "Livsstil",
      fields: [
        { type: "radio", key: "activity", label: "Fysisk aktivitet", options: ["Låg", "Medel", "Hög"] },
        { type: "radio", key: "sleep", label: "Sömn", options: ["<6h", "6–7h", "7–8h", "8+"] },
        { type: "slider", key: "stress", label: "Stress", min: 1, max: 10 },
        { type: "radio", key: "social_support", label: "Socialt stöd", options: ["Lågt", "Medel", "Högt"] },
      ],
    },
    {
      title: "Hinder & mål",
      fields: [
        { type: "slider", key: "motivation", label: "Motivation", min: 1, max: 10 },
        { type: "chips", key: "barriers", label: "Hinder", options: ["Trötthet", "Illamående", "Tidsbrist", "Sömnbrist", "Aptit", "Stress", "Småbarn"], multi: true },
        { type: "chips", key: "patient_goals", label: "Patientens mål", options: ["Äta tillräckligt", "Minska illamående", "Få struktur", "Säkerställa näring", "Få energi", "Stabilisera måltider", "Orka vardagen", "Återfå balans"], multi: true },
      ],
    },
  ],
  generateJournalText: g,
};
