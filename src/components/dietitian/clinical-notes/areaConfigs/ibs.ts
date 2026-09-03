import type { AreaConfig } from "../types";

const g = (d: Record<string, any>) => {
  const reasons = (d.visit_reasons || []).join(", ") || "IBS/magbesvär";
  const subtype = d.ibs_subtype || "oklart";
  const symptoms = (d.symptoms || []).join(", ") || "ej specificerat";
  const triggers = (d.triggers || []).join(", ") || "inga identifierade";
  const barriers = (d.barriers || []).join(", ") || "inga";
  const goals = (d.patient_goals || []).join(", ") || "inga";
  const redFlags = (d.red_flags || []);

  return {
    anamnesis: [
      `Besöksorsak: ${reasons}`,
      `IBS-diagnos: ${d.ibs_diagnosis || "oklart"} · Subtyp: ${subtype}`,
      `Symtom: ${symptoms} · Frekvens: ${d.symptom_frequency || "—"}`,
      `Avföring: Frekvens: ${d.stool_frequency || "—"} · Konsistens: ${d.stool_consistency || "—"} · Bristol: ${d.bristol || "—"}`,
      `Symptom efter måltid: ${d.symptoms_after_meal || "—"}`,
      `Kost: Måltidsstruktur: ${d.meal_structure || "—"} · Fiber: ${d.fiber || "—"}`,
      `Triggers: ${triggers}`,
      `Tidigare kostförsök: ${(d.previous_attempts || []).join(", ") || "inga"}`,
      `Livsstil: Stress: ${d.stress || "—"}/10 · Sömn: ${d.sleep || "—"} · Aktivitet: ${d.activity || "—"}`,
      `Motivation: ${d.motivation || "—"}/10 · Hinder: ${barriers}`,
      `Mål: ${goals}`,
      ...(redFlags.length > 0 ? [`⚠ Red flags: ${redFlags.join(", ")}`] : []),
    ].join("\n"),

    assessment: `Symtombilden talar för ${subtype !== "oklart" ? `IBS-${subtype}` : "IBS"} med ${d.symptom_frequency === "Dagligen" ? "hög" : "måttlig"} symtombörda. ${d.meal_structure === "Oregelbunden" ? "Oregelbunden måltidsstruktur kan bidra till symtom." : ""} ${d.stress && Number(d.stress) >= 7 ? "Förhöjd stressnivå som sannolikt påverkar symtombilden." : ""}${redFlags.length > 0 ? " Medicinsk uppföljning bör övervägas pga red flags." : ""}`,

    action: [
      d.meal_structure === "Oregelbunden" ? "Införa regelbundna måltider (3 huvudmål + ev. mellanmål)" : null,
      triggers.length > 0 ? "Identifiera och dokumentera individuella triggers via matdagbok" : null,
      d.fiber === "Lågt" ? "Gradvis öka lösliga fibrer" : d.fiber === "Högt" ? "Utvärdera fibertyp och mängd" : null,
      Number(d.stress) >= 7 ? "Stresshantering som del av behandlingen" : null,
      d.activity === "Låg" ? "Öka daglig fysisk aktivitet" : null,
    ].filter(Boolean).slice(0, 5).join("\n") || "Individanpassad åtgärdsplan behöver utarbetas.",

    next_steps: `Uppföljning om ${d.symptom_frequency === "Dagligen" ? "2–3" : "4"} veckor.${redFlags.length > 0 ? " Remittera för medicinsk utredning vid behov." : ""} Fokus på symtomutveckling och följsamhet.`,
  };
};

export const ibsConfig: AreaConfig = {
  id: "ibs",
  title: "IBS / Magbesvär",
  icon: "🫄",
  description: "IBS, funktionella magbesvär, FODMAP",
  steps: [
    {
      title: "Besvär & remiss",
      fields: [
        { type: "chips", key: "visit_reasons", label: "Vad gäller besöket?", options: ["IBS", "Uppblåsthet", "Magsmärtor", "Avföringsbesvär", "Utredning", "Annat"], multi: true },
        { type: "radio", key: "ibs_diagnosis", label: "IBS-diagnos", options: ["Ja", "Nej", "Oklart"] },
        { type: "radio", key: "ibs_subtype", label: "IBS-subtyp", options: ["IBS-C", "IBS-D", "IBS-M", "Oklart"] },
      ],
    },
    {
      title: "Symptomprofil",
      fields: [
        { type: "chips", key: "symptoms", label: "Symtom", options: ["Buksmärta", "Uppblåsthet", "Gas", "Trängningar", "Ofullständig tömning", "Illamående"], multi: true },
        { type: "radio", key: "symptom_frequency", label: "Symtomfrekvens", options: ["Dagligen", "Flera ggr/vecka", "Varje vecka", "Ibland"] },
        { type: "radio", key: "symptoms_after_meal", label: "Symptom efter måltid", options: ["Ja", "Ibland", "Nej"] },
      ],
    },
    {
      title: "Avföring & Bristol",
      fields: [
        { type: "radio", key: "stool_frequency", label: "Avföringsfrekvens", options: ["<3/vecka", "3–7/vecka", ">1/dag", "Varierar"] },
        { type: "radio", key: "stool_consistency", label: "Konsistens", options: ["Hård", "Normal", "Lös", "Varierar"] },
        { type: "radio", key: "bristol", label: "Bristolskala (typ)", options: ["1–2", "3–4", "5–6", "7", "Varierar"] },
        { type: "radio", key: "pattern", label: "Mönster", options: ["Förstoppning", "Diarré", "Växlande"] },
      ],
    },
    {
      title: "Kost & triggers",
      fields: [
        { type: "radio", key: "meal_structure", label: "Måltidsstruktur", options: ["Regelbunden", "Delvis", "Oregelbunden"] },
        { type: "radio", key: "fiber", label: "Fiberintag", options: ["Lågt", "Medel", "Högt", "Oklart"] },
        { type: "chips", key: "triggers", label: "Vanliga triggers", options: ["Lök", "Vitlök", "Baljväxter", "Mejeri", "Kaffe", "Alkohol", "Fet mat", "Stora måltider", "Lightprodukter"], multi: true },
        { type: "chips", key: "previous_attempts", label: "Tidigare kostförsök", options: ["Low FODMAP", "Glutenfritt", "Mjölkfritt", "Elimineringsdiet", "Inget"], multi: true },
      ],
    },
    {
      title: "Livsstil & stress",
      fields: [
        { type: "slider", key: "stress", label: "Stress", min: 1, max: 10 },
        { type: "radio", key: "sleep", label: "Sömn", options: ["<6h", "6–7h", "7–8h", "8+"] },
        { type: "radio", key: "activity", label: "Fysisk aktivitet", options: ["Låg", "Medel", "Hög"] },
      ],
    },
    {
      title: "Red flags",
      fields: [
        { type: "chips", key: "red_flags", label: "Red flags (markera om förekommer)", options: ["Viktnedgång", "Blod i avföring", "Nattliga symtom", "Feber", "Ärftlighet för tarmsjukdom"], multi: true },
      ],
    },
    {
      title: "Hinder & mål",
      fields: [
        { type: "slider", key: "motivation", label: "Motivation", min: 1, max: 10 },
        { type: "chips", key: "barriers", label: "Hinder", options: ["Tidsbrist", "Stress", "Kunskap", "Social påverkan", "Rädsla att äta"], multi: true },
        { type: "chips", key: "patient_goals", label: "Klientens mål", options: ["Minska symtom", "Hitta triggers", "Äta mer varierat", "Få struktur", "Minska ångest kring mat"], multi: true },
      ],
    },
  ],
  generateJournalText: g,
};
