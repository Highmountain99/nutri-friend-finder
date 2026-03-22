import type { AreaConfig } from "../types";

const g = (d: Record<string, any>) => {
  const reasons = (d.referral_reasons || []).join(", ") || "ej specificerat";
  const fat = d.fat_source || "ej angivet";
  const fiber = d.fiber || "ej angivet";
  const fish = d.fish || "ej angivet";
  const activity = d.activity || "ej angivet";
  const barriers = (d.barriers || []).join(", ") || "inga";
  const goals = (d.patient_goals || []).join(", ") || "inga";

  return {
    anamnesis: `Patient remitterad för ${reasons}. ${d.has_lab_values === "Ja" ? `Labvärden: LDL ${d.ldl || "—"}, HDL ${d.hdl || "—"}, Triglycerider ${d.triglycerides || "—"}, Blodtryck ${d.bp_syst || "—"}/${d.bp_diast || "—"}, HbA1c ${d.hba1c || "—"}.` : "Inga labvärden tillgängliga."} Diagnos: ${(d.diagnoses || []).join(", ") || "—"}. Mediciner: ${(d.medications || []).join(", ") || "—"}. Vikt ${d.weight || "—"} kg, längd ${d.height || "—"} cm${d.waist ? `, midjemått ${d.waist} cm` : ""}. Vikttrend: ${d.weight_trend || "—"}. Kostmönster: fettkälla ${fat}, mejeri ${d.dairy || "—"}, frukt/grönt ${d.fruit_veg || "—"}, fiber ${fiber}, fisk ${fish}, processad mat ${d.processed || "—"}, salt ${d.salt || "—"}, alkohol ${d.alcohol || "—"}, måltidsstruktur ${d.meal_structure || "—"}. Fysisk aktivitet: ${activity}. Rökning: ${d.smoking || "—"}. Sömn: ${d.sleep || "—"}. Stress: ${d.stress || "—"}/10. Motivation: ${d.motivation || "—"}/10. Hinder: ${barriers}. Patientens mål: ${goals}.`,

    assessment: `${(d.referral_reasons || []).includes("Hyperlipidemi") ? "Förhöjd kardiometabol risk" : "Kardiometabol riskbedömning genomförd"} med förbättringspotential inom ${fat === "Smör/Bregott" ? "fettkvalitet" : ""}${fiber === "Lågt" ? ", fiberintag" : ""}${fish === "Aldrig" || fish === "1 gång/vecka" ? ", fiskintag" : ""}${activity === "Låg" ? ", fysisk aktivitet" : ""}.`.replace(/ ,/g, ",").replace(/inom ,/g, "inom "),

    action: [
      fat === "Smör/Bregott" ? "Byt smör mot olja/flytande margarin" : null,
      (d.fruit_veg === "0–1" || d.fruit_veg === "2–3") ? "Öka grönsaker till minst 3–5 portioner/dag" : null,
      (fish === "Aldrig" || fish === "1 gång/vecka") ? "Ät fisk minst 2 gånger/vecka" : null,
      fiber === "Lågt" ? "Öka fiberintag via fullkorn, baljväxter och grönsaker" : null,
      d.salt === "Högt" ? "Minska saltintag" : null,
      activity === "Låg" ? "Öka daglig fysisk aktivitet" : null,
    ].filter(Boolean).slice(0, 5).join("\n") || "Inga specifika åtgärder identifierade.",

    next_steps: `Uppföljning om 4–6 veckor med fokus på följsamhet.${d.has_lab_values === "Ja" ? " Överväg kontroll av lipidprofil vid nästa besök." : ""}`,
  };
};

export const heartHealthConfig: AreaConfig = {
  id: "heart_health",
  title: "Hjärthälsa",
  icon: "❤️",
  description: "Hyperlipidemi, hypertoni, kardiovaskulär prevention",
  steps: [
    {
      title: "Remiss",
      fields: [
        { type: "chips", key: "referral_reasons", label: "Vad gäller besöket?", options: ["Hyperlipidemi", "Hypertoni", "Diabetes", "Sekundärprevention", "Annat"], multi: true },
        { type: "radio", key: "has_lab_values", label: "Finns labvärden?", options: ["Ja", "Delvis", "Nej"] },
        { type: "numeric", key: "ldl", label: "LDL", unit: "mmol/L", showIf: d => ["Ja", "Delvis"].includes(d.has_lab_values) },
        { type: "numeric", key: "hdl", label: "HDL", unit: "mmol/L", showIf: d => ["Ja", "Delvis"].includes(d.has_lab_values) },
        { type: "numeric", key: "triglycerides", label: "Triglycerider", unit: "mmol/L", showIf: d => ["Ja", "Delvis"].includes(d.has_lab_values) },
        { type: "numeric", key: "bp_syst", label: "Blodtryck systoliskt", unit: "mmHg", showIf: d => ["Ja", "Delvis"].includes(d.has_lab_values) },
        { type: "numeric", key: "bp_diast", label: "Blodtryck diastoliskt", unit: "mmHg", showIf: d => ["Ja", "Delvis"].includes(d.has_lab_values) },
        { type: "numeric", key: "hba1c", label: "HbA1c", unit: "mmol/mol", showIf: d => ["Ja", "Delvis"].includes(d.has_lab_values) },
      ],
    },
    {
      title: "Medicinskt",
      fields: [
        { type: "chips", key: "diagnoses", label: "Diagnoser", options: ["Hyperlipidemi", "Hypertoni", "CVD", "Diabetes", "Övervikt"], multi: true },
        { type: "chips", key: "medications", label: "Läkemedel", options: ["Statin", "Blodtryck", "Diabetes", "Antikoagulantia", "Vet ej"], multi: true },
        { type: "numeric", key: "weight", label: "Vikt", unit: "kg" },
        { type: "numeric", key: "height", label: "Längd", unit: "cm" },
        { type: "numeric", key: "waist", label: "Midjemått", unit: "cm" },
        { type: "radio", key: "weight_trend", label: "Vikttrend", options: ["Stabil", "Upp", "Ner"] },
      ],
    },
    {
      title: "Kost",
      fields: [
        { type: "radio", key: "fat_source", label: "Fettkälla", options: ["Smör/Bregott", "Blandat", "Olivolja/rapsolja", "Vet ej"] },
        { type: "radio", key: "dairy", label: "Mejeri", options: ["Högfettsprodukter", "Blandat", "Magra alternativ"] },
        { type: "radio", key: "fruit_veg", label: "Frukt & grönt", options: ["0–1", "2–3", "4–5", "5+"] },
        { type: "radio", key: "fiber", label: "Fiber", options: ["Lågt", "Medel", "Högt", "Oklart"] },
        { type: "radio", key: "fish", label: "Fisk", options: ["Aldrig", "1 gång/vecka", "2 gånger/vecka", "3+"] },
        { type: "radio", key: "processed", label: "Processad mat", options: ["Högt", "Medel", "Lågt"] },
        { type: "radio", key: "salt", label: "Salt", options: ["Högt", "Medel", "Lågt", "Oklart"] },
        { type: "dropdown", key: "alcohol", label: "Alkohol (standardglas/vecka)", options: ["Ingen", "1–3", "4–7", "8+"] },
        { type: "radio", key: "meal_structure", label: "Måltidsstruktur", options: ["Regelbunden", "Delvis", "Oregelbunden"] },
      ],
    },
    {
      title: "Livsstil",
      fields: [
        { type: "radio", key: "activity", label: "Fysisk aktivitet", options: ["Låg", "Medel", "Hög"] },
        { type: "radio", key: "steps_day", label: "Steg/dag", options: ["Okänt", "<5000", "5000–8000", "8000+"] },
        { type: "radio", key: "smoking", label: "Rökning", options: ["Ja", "Nej", "Tidigare"] },
        { type: "radio", key: "sleep", label: "Sömn", options: ["<6h", "6–7h", "7–8h", "8+"] },
        { type: "slider", key: "stress", label: "Stress", min: 1, max: 10 },
      ],
    },
    {
      title: "Hinder & mål",
      fields: [
        { type: "slider", key: "motivation", label: "Motivation", min: 1, max: 10 },
        { type: "chips", key: "barriers", label: "Hinder", options: ["Tidsbrist", "Familj", "Vanor", "Ekonomi", "Matlagningsvana", "Sötsug", "Socialt"], multi: true },
        { type: "chips", key: "patient_goals", label: "Patientens mål", options: ["Sänka kolesterol", "Sänka blodtryck", "Gå ner i vikt", "Äta bättre", "Struktur"], multi: true },
      ],
    },
  ],
  generateJournalText: g,
};
