import type { LegacyAreaConfig } from "../types";

const g = (d: Record<string, any>) => {
  const reasons = (d.referral_reasons || []).join(", ") || "ej specificerat";
  const barriers = (d.barriers || []).join(", ") || "inga";
  const goals = (d.patient_goals || []).join(", ") || "inga";

  const labSection = d.has_lab_values === "Ja"
    ? `LDL: ${d.ldl || "—"} · HDL: ${d.hdl || "—"} · Triglycerider: ${d.triglycerides || "—"}\nBlodtryck: ${d.bp_syst || "—"}/${d.bp_diast || "—"} · HbA1c: ${d.hba1c || "—"}`
    : "Inga labvärden tillgängliga";

  return {
    anamnesis: [
      `Remissorsak: ${reasons}`,
      `Labvärden: ${labSection}`,
      `Diagnoser: ${(d.diagnoses || []).join(", ") || "—"}`,
      `Mediciner: ${(d.medications || []).join(", ") || "—"}`,
      `Antropometri: Vikt ${d.weight || "—"} kg · Längd ${d.height || "—"} cm${d.waist ? ` · Midjemått ${d.waist} cm` : ""} · Vikttrend: ${d.weight_trend || "—"}`,
      `Kost: Fettkälla: ${d.fat_source || "—"} · Mejeri: ${d.dairy || "—"} · Frukt/grönt: ${d.fruit_veg || "—"} · Fiber: ${d.fiber || "—"} · Fisk: ${d.fish || "—"}`,
      `Processad mat: ${d.processed || "—"} · Salt: ${d.salt || "—"} · Alkohol: ${d.alcohol || "—"} · Måltidsstruktur: ${d.meal_structure || "—"}`,
      `Livsstil: Aktivitet: ${d.activity || "—"} · Rökning: ${d.smoking || "—"} · Sömn: ${d.sleep || "—"} · Stress: ${d.stress || "—"}/10`,
      `Motivation: ${d.motivation || "—"}/10 · Hinder: ${barriers}`,
      `Klientens mål: ${goals}`,
    ].join("\n"),

    assessment: `${(d.referral_reasons || []).includes("Hyperlipidemi") ? "Förhöjd kardiometabol risk" : "Kardiometabol riskbedömning genomförd"} med förbättringspotential inom ${d.fat_source === "Smör/Bregott" ? "fettkvalitet" : ""}${d.fiber === "Lågt" ? ", fiberintag" : ""}${(d.fish === "Aldrig" || d.fish === "1 gång/vecka") ? ", fiskintag" : ""}${d.activity === "Låg" ? ", fysisk aktivitet" : ""}.`.replace(/ ,/g, ",").replace(/inom ,/g, "inom "),

    action: [
      d.fat_source === "Smör/Bregott" ? "Byt smör mot olja/flytande margarin" : null,
      (d.fruit_veg === "0–1" || d.fruit_veg === "2–3") ? "Öka grönsaker till minst 3–5 portioner/dag" : null,
      (d.fish === "Aldrig" || d.fish === "1 gång/vecka") ? "Ät fisk minst 2 gånger/vecka" : null,
      d.fiber === "Lågt" ? "Öka fiberintag via fullkorn, baljväxter och grönsaker" : null,
      d.salt === "Högt" ? "Minska saltintag" : null,
      d.activity === "Låg" ? "Öka daglig fysisk aktivitet" : null,
    ].filter(Boolean).slice(0, 5).join("\n") || "Inga specifika åtgärder identifierade.",

    next_steps: `Uppföljning om 4–6 veckor med fokus på följsamhet.${d.has_lab_values === "Ja" ? " Överväg kontroll av lipidprofil vid nästa besök." : ""}`,
  };
};

export const heartHealthConfig: LegacyAreaConfig = {
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
        { type: "chips", key: "patient_goals", label: "Klientens mål", options: ["Sänka kolesterol", "Sänka blodtryck", "Gå ner i vikt", "Äta bättre", "Struktur"], multi: true },
      ],
    },
  ],
  generateJournalText: g,
};
