import { Scale, Dumbbell, Activity, Trophy, Apple, Footprints, PersonStanding, BatteryCharging, Target } from "lucide-react";
import type { AreaConfig, FieldConfig, JournalText, StepConfig } from "../types";

/** Titles of all PT goal areas — used for the "Kompletterande mål" multi-select. */
export const ptAreaTitles: Record<string, string> = {
  weight_management: "Viktminskning & kroppssammansättning",
  strength_muscle: "Styrka & muskeluppbyggnad",
  endurance: "Kondition & uthållighet",
  event_performance: "Lopp & prestationsmål",
  sports_nutrition: "Kost för träning & prestation",
  habit_building: "Komma igång & skapa vanor",
  mobility_function: "Rörlighet & fysisk funktion",
  energy_recovery: "Energi & återhämtning",
  other: "Annat mål",
};

const secondaryGoalsField = (selfId: string): FieldConfig => ({
  type: "chips",
  key: "secondary_goal_areas",
  label: "Kompletterande mål (valfritt)",
  multi: true,
  options: Object.entries(ptAreaTitles)
    .filter(([id]) => id !== selfId)
    .map(([, title]) => title),
});

const val = (v: any): string => {
  if (v === undefined || v === null) return "";
  if (Array.isArray(v)) return v.filter(Boolean).join(", ");
  return String(v).trim();
};

interface JournalGroups {
  anamnesis: [string, string][];
  assessment: [string, string][];
  action: [string, string][];
  next_steps: [string, string][];
}

const buildText = (data: Record<string, any>, pairs: [string, string][]): string =>
  pairs
    .map(([label, key]) => [label, val(data[key])] as const)
    .filter(([, v]) => v !== "")
    .map(([label, v]) => `${label}: ${v}`)
    .join("\n");

const makeGenerator = (groups: JournalGroups) => (data: Record<string, any>): JournalText => ({
  anamnesis: buildText(data, groups.anamnesis),
  assessment: buildText(data, groups.assessment),
  action: buildText(data, groups.action),
  next_steps: buildText(data, groups.next_steps),
});

interface AreaSpec {
  id: string;
  icon: AreaConfig["icon"];
  description: string;
  steps: StepConfig[];
  groups: JournalGroups;
}

const makeArea = (spec: AreaSpec): AreaConfig => ({
  id: spec.id,
  title: ptAreaTitles[spec.id],
  icon: spec.icon,
  description: spec.description,
  steps: [
    ...spec.steps,
    {
      title: "Kompletterande mål & överenskommelse",
      fields: [
        secondaryGoalsField(spec.id),
        { type: "textarea", key: "first_commitment", label: "Första konkreta åtagandet", placeholder: "Vad ska klienten göra till nästa gång?" },
      ],
    },
  ],
  generateJournalText: makeGenerator({
    ...spec.groups,
    anamnesis: [...spec.groups.anamnesis, ["Kompletterande mål", "secondary_goal_areas"]],
    next_steps: [["Åtagande till nästa gång", "first_commitment"], ...spec.groups.next_steps],
  }),
});

const motivation: FieldConfig = { type: "slider", key: "motivation", label: "Motivation (1–10)", min: 1, max: 10 };
const timeframe: FieldConfig = { type: "dropdown", key: "timeframe", label: "Tidsperspektiv", options: ["4 veckor", "3 månader", "6 månader", "12 månader", "Löpande utan slutdatum"] };
const desiredOutcome: FieldConfig = { type: "textarea", key: "desired_outcome", label: "Önskat resultat" };
const barriers: FieldConfig = { type: "textarea", key: "barriers", label: "Huvudsakliga hinder" };

export const weightManagementConfig = makeArea({
  id: "weight_management",
  icon: Scale,
  description: "Minska fettmassa, förändra vikt eller behålla resultat",
  steps: [
    {
      title: "Mål",
      fields: [
        { type: "textarea", key: "primary_goal", label: "Vad vill klienten förändra?", required: true },
        { type: "radio", key: "primary_focus", label: "Primärt fokus", options: ["Fettminskning", "Viktminskning", "Viktstabilitet", "Förändrad kroppssammansättning"] },
        desiredOutcome,
        timeframe,
      ],
    },
    {
      title: "Nuläge & bakgrund",
      fields: [
        { type: "dropdown", key: "training_frequency", label: "Nuvarande träningsfrekvens", options: ["Ingen träning", "1 pass/vecka", "2–3 pass/vecka", "4–5 pass/vecka", "6+ pass/vecka"] },
        { type: "textarea", key: "previous_attempts", label: "Tidigare försök" },
        { type: "textarea", key: "what_worked", label: "Vad har fungerat tidigare?" },
        barriers,
        motivation,
      ],
    },
  ],
  groups: {
    anamnesis: [["Mål", "primary_goal"], ["Primärt fokus", "primary_focus"], ["Önskat resultat", "desired_outcome"], ["Tidsperspektiv", "timeframe"], ["Träningsfrekvens", "training_frequency"], ["Tidigare försök", "previous_attempts"]],
    assessment: [["Fungerat tidigare", "what_worked"], ["Hinder", "barriers"], ["Motivation (1–10)", "motivation"]],
    action: [["Träningsfokus", "primary_focus"], ["Planerat upplägg utifrån", "training_frequency"]],
    next_steps: [],
  },
});

export const strengthMuscleConfig = makeArea({
  id: "strength_muscle",
  icon: Dumbbell,
  description: "Bli starkare, bygga muskler och utvecklas på gymmet",
  steps: [
    {
      title: "Mål",
      fields: [
        { type: "radio", key: "primary_goal", label: "Primärt mål", options: ["Bygga muskler", "Bli starkare", "Lära sig styrketräning", "Förbättra en specifik övning"], required: true },
        { type: "text", key: "priority_areas", label: "Prioriterade muskelgrupper eller övningar" },
        desiredOutcome,
        timeframe,
      ],
    },
    {
      title: "Träningsnuläge",
      fields: [
        { type: "dropdown", key: "experience", label: "Träningsvana", options: ["Nybörjare", "Viss vana", "Van", "Mycket van"] },
        { type: "textarea", key: "current_program", label: "Nuvarande program" },
        { type: "numeric", key: "sessions_per_week", label: "Antal möjliga pass per vecka", unit: "pass" },
        { type: "chips", key: "equipment", label: "Tillgänglig utrustning", multi: true, options: ["Gym", "Hemmagym", "Fria vikter", "Maskiner", "Gummiband", "Endast kroppsvikt"] },
        { type: "slider", key: "recovery", label: "Upplevd återhämtning (1–10)", min: 1, max: 10 },
        { type: "radio", key: "nutrition_focus", label: "Är kost eller protein ett kompletterande fokus?", options: ["Ja", "Nej", "Osäkert"] },
        barriers,
        motivation,
      ],
    },
  ],
  groups: {
    anamnesis: [["Mål", "primary_goal"], ["Prioriterat", "priority_areas"], ["Önskat resultat", "desired_outcome"], ["Tidsperspektiv", "timeframe"], ["Träningsvana", "experience"], ["Nuvarande program", "current_program"], ["Möjliga pass/vecka", "sessions_per_week"], ["Utrustning", "equipment"]],
    assessment: [["Upplevd återhämtning", "recovery"], ["Hinder", "barriers"], ["Motivation (1–10)", "motivation"]],
    action: [["Träningsfokus", "primary_goal"], ["Prioriterade övningar", "priority_areas"], ["Koststöd", "nutrition_focus"]],
    next_steps: [],
  },
});

export const enduranceConfig = makeArea({
  id: "endurance",
  icon: Activity,
  description: "Förbättra kondition, arbetskapacitet och uthållighet",
  steps: [
    {
      title: "Mål",
      fields: [
        { type: "textarea", key: "primary_goal", label: "Önskad förbättring", required: true },
        { type: "chips", key: "activity", label: "Aktivitet", multi: true, options: ["Löpning", "Cykling", "Simning", "Skidåkning", "Rodd", "Promenader", "Annat"] },
        desiredOutcome,
        timeframe,
      ],
    },
    {
      title: "Nuläge",
      fields: [
        { type: "dropdown", key: "current_level", label: "Nuvarande nivå", options: ["Nybörjare", "Viss vana", "Van", "Mycket van"] },
        { type: "numeric", key: "training_frequency", label: "Nuvarande träningsfrekvens", unit: "pass/vecka" },
        { type: "text", key: "weekly_volume", label: "Ungefärlig veckovolym" },
        { type: "text", key: "longest_session", label: "Längsta nuvarande pass" },
        { type: "chips", key: "available_days", label: "Tillgängliga träningsdagar", multi: true, options: ["Mån", "Tis", "Ons", "Tors", "Fre", "Lör", "Sön"] },
        { type: "slider", key: "perceived_exertion", label: "Upplevd ansträngning (1–10)", min: 1, max: 10 },
        barriers,
        motivation,
      ],
    },
  ],
  groups: {
    anamnesis: [["Mål", "primary_goal"], ["Aktivitet", "activity"], ["Önskat resultat", "desired_outcome"], ["Tidsperspektiv", "timeframe"], ["Nivå", "current_level"], ["Frekvens", "training_frequency"], ["Veckovolym", "weekly_volume"], ["Längsta pass", "longest_session"]],
    assessment: [["Upplevd ansträngning", "perceived_exertion"], ["Hinder", "barriers"], ["Motivation (1–10)", "motivation"]],
    action: [["Träningsdagar", "available_days"], ["Fokus", "activity"]],
    next_steps: [],
  },
});

export const eventPerformanceConfig = makeArea({
  id: "event_performance",
  icon: Trophy,
  description: "Träna inför lopp, cykling, tävling eller personbästa",
  steps: [
    {
      title: "Målet",
      fields: [
        { type: "text", key: "primary_goal", label: "Namn på loppet, tävlingen eller målet", required: true },
        { type: "text", key: "activity", label: "Typ av aktivitet eller idrott" },
        { type: "date", key: "event_date", label: "Datum för målet" },
        { type: "radio", key: "target", label: "Målsättning", options: ["Genomföra", "Viss tid", "Viss distans", "Personbästa", "Annat"] },
      ],
    },
    {
      title: "Nuläge & förutsättningar",
      fields: [
        { type: "dropdown", key: "current_level", label: "Nuvarande träningsnivå", options: ["Nybörjare", "Viss vana", "Van", "Mycket van"] },
        { type: "text", key: "weekly_volume", label: "Nuvarande veckovolym" },
        { type: "text", key: "longest_session", label: "Längsta genomförda pass" },
        { type: "textarea", key: "experience", label: "Tidigare erfarenhet" },
        { type: "numeric", key: "available_days", label: "Antal möjliga träningsdagar", unit: "dagar/vecka" },
        { type: "radio", key: "strength_need", label: "Behov av styrketräning", options: ["Ja", "Nej", "Osäkert"] },
        { type: "radio", key: "nutrition_need", label: "Behov av koststöd", options: ["Ja", "Nej", "Osäkert"] },
        barriers,
      ],
    },
  ],
  groups: {
    anamnesis: [["Mål", "primary_goal"], ["Aktivitet", "activity"], ["Datum", "event_date"], ["Målsättning", "target"], ["Nivå", "current_level"], ["Veckovolym", "weekly_volume"], ["Längsta pass", "longest_session"], ["Erfarenhet", "experience"]],
    assessment: [["Hinder", "barriers"], ["Träningsdagar/vecka", "available_days"]],
    action: [["Styrketräning", "strength_need"], ["Koststöd", "nutrition_need"], ["Upplägg mot", "target"]],
    next_steps: [],
  },
});

export const sportsNutritionConfig = makeArea({
  id: "sports_nutrition",
  icon: Apple,
  description: "Protein, energi, måltidstiming, vätska och återhämtning",
  steps: [
    {
      title: "Mål",
      fields: [
        { type: "textarea", key: "primary_goal", label: "Primärt kostmål", required: true },
        { type: "chips", key: "focus", label: "Fokus", multi: true, options: ["Protein", "Total energi", "Mat före träning", "Mat efter träning", "Energi under längre pass", "Vätska", "Återhämtning"] },
        desiredOutcome,
        timeframe,
      ],
    },
    {
      title: "Träning & nuläge",
      fields: [
        { type: "text", key: "training_type", label: "Träningsform" },
        { type: "text", key: "training_load", label: "Träningsfrekvens och träningsmängd" },
        { type: "slider", key: "energy_during_training", label: "Upplevd energinivå under träning (1–10)", min: 1, max: 10 },
        { type: "textarea", key: "meal_structure", label: "Nuvarande måltidsstruktur" },
        { type: "slider", key: "protein_confidence", label: "Upplevd säkerhet kring proteinintag (1–10)", min: 1, max: 10 },
        { type: "textarea", key: "session_issues", label: "Problem före, under eller efter pass" },
        { type: "textarea", key: "food_preferences", label: "Matpreferenser" },
        { type: "textarea", key: "barriers", label: "Praktiska hinder" },
        { type: "text", key: "training_goal", label: "Kompletterande träningsmål" },
      ],
    },
  ],
  groups: {
    anamnesis: [["Kostmål", "primary_goal"], ["Fokus", "focus"], ["Önskat resultat", "desired_outcome"], ["Tidsperspektiv", "timeframe"], ["Träningsform", "training_type"], ["Träningsmängd", "training_load"], ["Måltidsstruktur", "meal_structure"], ["Matpreferenser", "food_preferences"]],
    assessment: [["Energi under träning", "energy_during_training"], ["Säkerhet kring protein", "protein_confidence"], ["Problem kring pass", "session_issues"], ["Hinder", "barriers"]],
    action: [["Kostfokus", "focus"], ["Kopplat träningsmål", "training_goal"]],
    next_steps: [],
  },
});

export const habitBuildingConfig = makeArea({
  id: "habit_building",
  icon: Footprints,
  description: "Börja träna, hitta kontinuitet eller komma tillbaka efter uppehåll",
  steps: [
    {
      title: "Mål & utgångsläge",
      fields: [
        { type: "textarea", key: "primary_goal", label: "Vad vill klienten uppnå?", required: true },
        { type: "radio", key: "starting_point", label: "Utgångsläge", options: ["Nybörjare", "Tillbaka efter uppehåll"] },
        { type: "dropdown", key: "activity_level", label: "Nuvarande aktivitetsnivå", options: ["Låg", "Måttlig", "Hög"] },
        desiredOutcome,
        timeframe,
      ],
    },
    {
      title: "Vardag & förutsättningar",
      fields: [
        { type: "chips", key: "preferred_training", label: "Föredragna träningsformer", multi: true, options: ["Styrketräning", "Promenader", "Löpning", "Cykling", "Gruppträning", "Simning", "Hemmaträning", "Annat"] },
        { type: "numeric", key: "realistic_sessions", label: "Realistiska pass per vecka", unit: "pass" },
        { type: "text", key: "available_times", label: "Tillgängliga dagar och tider" },
        { type: "chips", key: "environment", label: "Träningsmiljö", multi: true, options: ["Gym", "Hemma", "Utomhus", "Arbetsplats"] },
        barriers,
        motivation,
        { type: "slider", key: "confidence", label: "Tilltro till planen (1–10)", min: 1, max: 10 },
        { type: "textarea", key: "support_wanted", label: "Vilket stöd klienten önskar" },
        { type: "text", key: "minimum_weekly_goal", label: "Minsta realistiska veckomål" },
      ],
    },
  ],
  groups: {
    anamnesis: [["Mål", "primary_goal"], ["Utgångsläge", "starting_point"], ["Aktivitetsnivå", "activity_level"], ["Önskat resultat", "desired_outcome"], ["Tidsperspektiv", "timeframe"], ["Föredragen träning", "preferred_training"], ["Tider", "available_times"], ["Miljö", "environment"]],
    assessment: [["Hinder", "barriers"], ["Motivation (1–10)", "motivation"], ["Tilltro till planen (1–10)", "confidence"]],
    action: [["Pass per vecka", "realistic_sessions"], ["Minsta veckomål", "minimum_weekly_goal"], ["Önskat stöd", "support_wanted"]],
    next_steps: [],
  },
});

export const mobilityFunctionConfig = makeArea({
  id: "mobility_function",
  icon: PersonStanding,
  description: "Förbättra rörlighet, balans, stabilitet och vardagsstyrka",
  steps: [
    {
      title: "Mål",
      fields: [
        { type: "textarea", key: "primary_goal", label: "Önskad funktion eller rörelse", required: true },
        { type: "chips", key: "focus", label: "Fokus", multi: true, options: ["Rörlighet", "Balans", "Stabilitet", "Vardagsstyrka"] },
        { type: "chips", key: "body_areas", label: "Kroppsområden som är relevanta", multi: true, options: ["Nacke", "Axlar", "Rygg", "Höft", "Knä", "Fotled", "Bål"] },
        { type: "textarea", key: "situations", label: "Situationer där begränsningen märks" },
        timeframe,
      ],
    },
    {
      title: "Bakgrund",
      fields: [
        { type: "textarea", key: "previous_training", label: "Tidigare träning inom området" },
        { type: "radio", key: "pain", label: "Smärta eller obehag", options: ["Nej", "Ibland", "Återkommande"] },
        { type: "radio", key: "clearance", label: "Medicinskt eller fysioterapeutiskt klartecken", options: ["Ja", "Nej", "Ej aktuellt", "Osäkert"] },
        { type: "textarea", key: "desired_outcome", label: "Vad klienten vill kunna göra" },
        barriers,
        motivation,
      ],
    },
  ],
  groups: {
    anamnesis: [["Mål", "primary_goal"], ["Fokus", "focus"], ["Kroppsområden", "body_areas"], ["Situationer", "situations"], ["Tidsperspektiv", "timeframe"], ["Tidigare träning", "previous_training"], ["Önskat resultat", "desired_outcome"]],
    assessment: [["Smärta/obehag", "pain"], ["Klartecken", "clearance"], ["Hinder", "barriers"], ["Motivation (1–10)", "motivation"]],
    action: [["Träningsfokus", "focus"], ["Berörda områden", "body_areas"]],
    next_steps: [],
  },
});

export const energyRecoveryConfig = makeArea({
  id: "energy_recovery",
  icon: BatteryCharging,
  description: "Anpassa träningen efter sömn, stress, trötthet och återhämtning",
  steps: [
    {
      title: "Mål & nuläge",
      fields: [
        { type: "textarea", key: "primary_goal", label: "Vilken anpassning klienten önskar", required: true },
        { type: "text", key: "sleep_amount", label: "Sömnmängd", placeholder: "t.ex. 6–7 timmar" },
        { type: "dropdown", key: "sleep_quality", label: "Upplevd sömnkvalitet", options: ["Mycket dålig", "Dålig", "Varierande", "God", "Mycket god"] },
        { type: "slider", key: "stress", label: "Stress (1–10)", min: 1, max: 10 },
        { type: "slider", key: "energy", label: "Energi (1–10)", min: 1, max: 10 },
        { type: "slider", key: "fatigue", label: "Trötthet (1–10)", min: 1, max: 10 },
        timeframe,
      ],
    },
    {
      title: "Träning & belastning",
      fields: [
        { type: "dropdown", key: "soreness", label: "Träningsvärk", options: ["Ingen", "Lätt", "Måttlig", "Uttalad"] },
        { type: "slider", key: "recovery", label: "Upplevd återhämtning (1–10)", min: 1, max: 10 },
        { type: "text", key: "training_load", label: "Nuvarande träningsfrekvens och belastning" },
        { type: "radio", key: "performance_change", label: "Förändrad prestation", options: ["Bättre", "Oförändrad", "Sämre"] },
        { type: "chips", key: "hard_days", label: "Vilka dagar som känns tyngst", multi: true, options: ["Mån", "Tis", "Ons", "Tors", "Fre", "Lör", "Sön"] },
        { type: "textarea", key: "barriers", label: "Huvudsakligt hinder" },
      ],
    },
  ],
  groups: {
    anamnesis: [["Önskad anpassning", "primary_goal"], ["Sömnmängd", "sleep_amount"], ["Sömnkvalitet", "sleep_quality"], ["Träningsbelastning", "training_load"], ["Tidsperspektiv", "timeframe"]],
    assessment: [["Stress (1–10)", "stress"], ["Energi (1–10)", "energy"], ["Trötthet (1–10)", "fatigue"], ["Träningsvärk", "soreness"], ["Återhämtning (1–10)", "recovery"], ["Prestation", "performance_change"], ["Hinder", "barriers"]],
    action: [["Anpassning fokuserar på", "primary_goal"], ["Tyngsta dagar", "hard_days"]],
    next_steps: [],
  },
});

export const otherGoalConfig = makeArea({
  id: "other",
  icon: Target,
  description: "Ett mål som inte passar i de andra kategorierna",
  steps: [
    {
      title: "Målet",
      fields: [
        { type: "textarea", key: "primary_goal", label: "Beskriv klientens mål", required: true },
        { type: "textarea", key: "why_important", label: "Varför målet är viktigt" },
        { type: "textarea", key: "current_situation", label: "Nuvarande situation" },
        desiredOutcome,
        timeframe,
      ],
    },
    {
      title: "Förutsättningar",
      fields: [
        { type: "textarea", key: "experience", label: "Tidigare erfarenhet" },
        barriers,
        motivation,
        { type: "textarea", key: "support_wanted", label: "Vilket stöd klienten önskar" },
      ],
    },
  ],
  groups: {
    anamnesis: [["Mål", "primary_goal"], ["Varför viktigt", "why_important"], ["Nuläge", "current_situation"], ["Önskat resultat", "desired_outcome"], ["Tidsperspektiv", "timeframe"], ["Tidigare erfarenhet", "experience"]],
    assessment: [["Hinder", "barriers"], ["Motivation (1–10)", "motivation"]],
    action: [["Önskat stöd", "support_wanted"]],
    next_steps: [],
  },
});

export const ptAreaConfigs: AreaConfig[] = [
  weightManagementConfig,
  strengthMuscleConfig,
  enduranceConfig,
  eventPerformanceConfig,
  sportsNutritionConfig,
  habitBuildingConfig,
  mobilityFunctionConfig,
  energyRecoveryConfig,
  otherGoalConfig,
];
