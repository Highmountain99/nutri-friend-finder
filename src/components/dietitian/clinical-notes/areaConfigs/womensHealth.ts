import type { AreaConfig } from "../types";

const g = (d: Record<string, any>) => {
  const area = d.focus_area || "oklart";
  const diagnoses = (d.diagnoses || []).join(", ") || "inga";
  const barriers = (d.barriers || []).join(", ") || "inga";
  const goals = (d.patient_goals || []).join(", ") || "inga";

  const symptomDetails = area === "PCOS"
    ? `Oregelbunden mens: ${d.irregular_period || "—"}, acne: ${d.acne || "—"}, behåring: ${d.hirsutism || "—"}, viktproblematik: ${d.weight_issue || "—"}, sötsug: ${d.cravings || "—"}.`
    : area === "Fertilitet"
    ? `Försöker bli gravid: ${d.trying || "—"}, tid: ${d.trying_duration || "—"}, känd problematik: ${d.known_issue || "—"}, stress kring fertilitet: ${d.fertility_stress || "—"}/10.`
    : `Värmevallningar: ${d.hot_flashes || "—"}, sömnproblem: ${d.sleep_issues || "—"}, humörsvängningar: ${d.mood || "—"}, viktförändring: ${d.weight_change || "—"}, energi: ${d.energy || "—"}.`;

  return {
    anamnesis: `Patient med fokus på ${area}. Ålder: ${d.age || "—"}. Diagnoser: ${diagnoses}. ${symptomDetails} Mensregelbundenhet: ${d.period_regularity || "—"}, cykellängd: ${d.cycle_length || "—"}. Måltidsstruktur: ${d.meal_structure || "—"}, kolhydratkvalitet: ${d.carb_quality || "—"}, protein: ${d.protein || "—"}, sötsug: ${d.sweet_cravings || "—"}. Fysisk aktivitet: ${d.activity || "—"}, stress: ${d.stress || "—"}/10. Motivation: ${d.motivation || "—"}/10. Hinder: ${barriers}. Mål: ${goals}.`,

    assessment: area === "PCOS"
      ? `Symtombilden talar för metabol och hormonell obalans där koststruktur och blodsockerreglering sannolikt spelar en central roll.${d.cravings === "Högt" ? " Högt sötsug tyder på instabilt blodsocker." : ""}`
      : area === "Fertilitet"
      ? `Nutritionsstatus bör optimeras med fokus på näringstäthet och regelbundenhet.${Number(d.fertility_stress) >= 7 ? " Hög stress kan påverka fertilitet negativt." : ""}`
      : `Klimakteriebesvär med potentiell påverkan på energibalans och viktstabilitet. Kostanpassning kan bidra till symptomlindring.`,

    action: [
      d.meal_structure === "Oregelbunden" ? "Införa regelbundna måltider" : null,
      d.protein === "Lågt" ? "Öka proteinintag vid varje måltid" : null,
      d.carb_quality === "Låg kvalitet" ? "Byt till kolhydrater med lägre GI" : null,
      d.sweet_cravings === "Högt" ? "Strategier för att hantera sötsug" : null,
      d.activity === "Låg" ? "Öka daglig fysisk aktivitet" : null,
    ].filter(Boolean).slice(0, 5).join("\n") || "Individanpassad åtgärdsplan behöver utarbetas.",

    next_steps: `Uppföljning om 4–6 veckor med fokus på ${area === "PCOS" ? "blodsockerreglering och symtom" : area === "Fertilitet" ? "näringsstatus och energi" : "energibalans och symptomlindring"}.`,
  };
};

export const womensHealthConfig: AreaConfig = {
  id: "womens_health",
  title: "Kvinnohälsa",
  icon: "🌸",
  description: "PCOS, fertilitet, klimakteriet",
  steps: [
    {
      title: "Område & status",
      fields: [
        { type: "radio", key: "focus_area", label: "Fokusområde", options: ["PCOS", "Fertilitet", "Klimakteriet", "Oklart"] },
        { type: "numeric", key: "age", label: "Ålder", unit: "år" },
        { type: "chips", key: "diagnoses", label: "Diagnos (om finns)", options: ["PCOS", "Insulinresistens", "Endometrios", "Hypotyreos", "Ingen diagnos", "Oklart"], multi: true },
      ],
    },
    {
      title: "Symptom",
      fields: [
        // PCOS
        { type: "radio", key: "irregular_period", label: "Oregelbunden mens", options: ["Ja", "Nej", "Ibland"], showIf: d => d.focus_area === "PCOS" },
        { type: "radio", key: "acne", label: "Acne", options: ["Låg", "Medel", "Hög"], showIf: d => d.focus_area === "PCOS" },
        { type: "radio", key: "hirsutism", label: "Ökad behåring", options: ["Ja", "Nej"], showIf: d => d.focus_area === "PCOS" },
        { type: "radio", key: "weight_issue", label: "Viktuppgång/svårt att gå ner", options: ["Ja", "Nej"], showIf: d => d.focus_area === "PCOS" },
        { type: "radio", key: "cravings", label: "Sötsug/cravings", options: ["Lågt", "Medel", "Högt"], showIf: d => d.focus_area === "PCOS" },
        // Fertilitet
        { type: "radio", key: "trying", label: "Försöker bli gravid", options: ["Ja", "Nej"], showIf: d => d.focus_area === "Fertilitet" },
        { type: "dropdown", key: "trying_duration", label: "Tid försökt", options: ["<6 mån", "6–12 mån", ">12 mån"], showIf: d => d.focus_area === "Fertilitet" },
        { type: "radio", key: "known_issue", label: "Känd fertilitetsproblematik", options: ["Ja", "Nej", "Oklart"], showIf: d => d.focus_area === "Fertilitet" },
        { type: "slider", key: "fertility_stress", label: "Stress kring fertilitet", min: 1, max: 10, showIf: d => d.focus_area === "Fertilitet" },
        // Klimakteriet
        { type: "radio", key: "hot_flashes", label: "Värmevallningar", options: ["Låg", "Medel", "Hög"], showIf: d => d.focus_area === "Klimakteriet" },
        { type: "radio", key: "sleep_issues", label: "Sömnproblem", options: ["Låg", "Medel", "Hög"], showIf: d => d.focus_area === "Klimakteriet" },
        { type: "radio", key: "mood", label: "Humörsvängningar", options: ["Låg", "Medel", "Hög"], showIf: d => d.focus_area === "Klimakteriet" },
        { type: "radio", key: "weight_change", label: "Viktförändring", options: ["Upp", "Ned", "Stabil"], showIf: d => d.focus_area === "Klimakteriet" },
        { type: "radio", key: "energy", label: "Energinivå", options: ["Låg", "Medel", "Hög"], showIf: d => d.focus_area === "Klimakteriet" },
      ],
    },
    {
      title: "Menscykel",
      fields: [
        { type: "radio", key: "period_regularity", label: "Mensregelbundenhet", options: ["Regelbunden", "Oregelbunden", "Ingen mens"] },
        { type: "dropdown", key: "cycle_length", label: "Cykellängd", options: ["<21", "21–35", ">35", "Oklart"] },
        { type: "radio", key: "ovulation", label: "Ägglossning (om känt)", options: ["Ja", "Nej", "Oklart"] },
        { type: "chips", key: "contraceptive", label: "Preventivmedel", options: ["P-piller", "Spiral", "Inget", "Annat"], multi: true },
        { type: "radio", key: "pregnant_postpartum", label: "Graviditet/postpartum", options: ["Ja", "Nej"] },
      ],
    },
    {
      title: "Kostmönster",
      fields: [
        { type: "radio", key: "meal_structure", label: "Måltidsstruktur", options: ["Regelbunden", "Delvis", "Oregelbunden"] },
        { type: "radio", key: "carb_quality", label: "Kolhydratkvalitet", options: ["Låg kvalitet", "Blandat", "Hög kvalitet"] },
        { type: "radio", key: "fast_carbs", label: "Snabba kolhydrater", options: ["Högt", "Medel", "Lågt"] },
        { type: "radio", key: "protein", label: "Proteinintag", options: ["Lågt", "Medel", "Högt"] },
        { type: "radio", key: "fat_quality", label: "Fettkvalitet", options: ["Smör", "Blandat", "Olja"] },
        { type: "radio", key: "fiber", label: "Fiber", options: ["Lågt", "Medel", "Högt"] },
        { type: "radio", key: "sweet_cravings", label: "Sötsug/småätande", options: ["Högt", "Medel", "Lågt"] },
        { type: "dropdown", key: "caffeine", label: "Koffein", options: ["Ingen", "1–2", "3+"] },
        { type: "dropdown", key: "alcohol", label: "Alkohol", options: ["Ingen", "1–3", "4–7", "8+"] },
      ],
    },
    {
      title: "Livsstil",
      fields: [
        { type: "radio", key: "activity", label: "Fysisk aktivitet", options: ["Låg", "Medel", "Hög"] },
        { type: "radio", key: "sleep", label: "Sömn", options: ["<6h", "6–7h", "7–8h", "8+"] },
        { type: "slider", key: "stress", label: "Stress", min: 1, max: 10 },
        { type: "radio", key: "stress_symptom_link", label: "Relation stress-symptom", options: ["Tydlig", "Möjlig", "Ingen"] },
      ],
    },
    {
      title: "Hinder & mål",
      fields: [
        { type: "slider", key: "motivation", label: "Motivation", min: 1, max: 10 },
        { type: "chips", key: "barriers", label: "Hinder", options: ["Tidsbrist", "Sötsug", "Stress", "Oregelbundna vanor", "Brist på struktur", "Kunskap", "Energilöshet"], multi: true },
        { type: "chips", key: "patient_goals", label: "Patientens mål", options: ["Reglera blodsocker", "Gå ner i vikt", "Minska symptom", "Optimera fertilitet", "Stabil energi", "Förbättra cykel", "Stabil vikt", "Bättre energi"], multi: true },
      ],
    },
  ],
  generateJournalText: g,
};
