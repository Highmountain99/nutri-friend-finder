export type CareSeekerType = 'self' | 'other';
export type RelationshipType = 'guardian' | 'trustee' | 'relative';
export type MotivationLevel = 'excited' | 'curious' | 'hesitant' | 'not_ready';

// Triage result types
export type TriageResult = 'dietist' | 'coach' | 'pending';
export type ProviderCategory = 'medical' | 'wellness';

// Pregnancy status and triage
export type PregnancyStatus = 'pregnant' | 'postpartum' | 'no' | 'unsure';

export type PregnancyTriageReason = 
  | 'general_planning'
  | 'nausea_cravings'
  | 'weight_concern'
  | 'gdm_risk_or_dx'
  | 'diabetes'
  | 'nutrient_deficiency'
  | 'medical_complication'
  | 'unsure';

export type TriageReasonCode =
  | 'DIAGNOSIS_SELECTED'
  | 'RED_FLAG_SYMPTOM'
  | 'EATING_DISORDER'
  | 'PREGNANCY_MEDICAL'
  | 'PREGNANCY_REFERRED_OR_UNSURE'
  | 'PREGNANCY_GENERAL'
  | 'UNCERTAIN'
  | 'GI_PERSISTENT'
  | 'SAFE_COACH';

// Red flag symptoms that require dietist
export type RedFlagSymptom =
  | 'medical_diagnosis'
  | 'pregnancy'
  | 'involuntary_weight_loss'
  | 'eating_disorder_risk'
  | 'medication_risk';

// Dietist-specific primary concern categories (medical)
export type PrimaryConcernCategory = 
  | 'weight_loss'
  | 'diabetes'
  | 'gut_health'
  | 'general_health'
  | 'womens_health'
  | 'emotional_eating'
  | 'eating_disorder'
  | 'heart_health'
  | 'other';

// Coach-specific concern categories (wellness)
export type CoachConcernCategory =
  | 'weight_loss_general'
  | 'muscle_building'
  | 'healthy_habits'
  | 'training_nutrition'
  | 'energy_focus'
  | 'plant_based'
  | 'emotional_eating_mild'
  | 'meal_planning'
  | 'social_eating'
  | 'supplements';

export type ActivityLevel = 
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'active'
  | 'very_active';

export interface IntakeFormData {
  careSeekerType?: CareSeekerType;
  relationshipIfOther?: RelationshipType;
  
  // Screening data
  redFlagSymptoms: RedFlagSymptom[];
  pregnancyStatus?: PregnancyStatus;
  pregnancyTriageReason?: PregnancyTriageReason;
  pregnancyReferredByCare?: boolean;
  
  // Dietist path (medical)
  primaryConcernCategory?: PrimaryConcernCategory;
  primaryConcernSubcategory?: string;
  concernTags: string[];
  
  // Coach path (wellness)
  coachConcernCategory?: CoachConcernCategory;
  coachConcernSubcategory?: string;
  
  // Preference tags (multi-select)
  preferenceTags: string[];
  
  // Triage result
  triageResult?: TriageResult;
  triageReasonCode?: TriageReasonCode;
  providerCategory?: ProviderCategory;
  
  // Other fields
  activityLevel?: ActivityLevel;
  motivationLevel?: MotivationLevel;
  supportAreas: string[];
  aiFreeText?: string;
  aiParsedFields?: {
    primaryConcernCategory?: string;
    primaryConcernSubcategory?: string;
    supportAreas?: string[];
    confidence?: number;
  };
}

export interface IntakeProfile extends IntakeFormData {
  id: string;
  userId: string;
  completedAt?: string;
  currentStep: number;
  createdAt: string;
  updatedAt: string;
}

// Category display labels in Swedish - Dietist path
export const categoryLabels: Record<PrimaryConcernCategory, string> = {
  weight_loss: 'Gå ner i vikt',
  diabetes: 'Diabetes eller fördiabetes',
  gut_health: 'Tarmhälsa',
  general_health: 'Allmän hälsa',
  womens_health: 'Kvinnohälsa',
  emotional_eating: 'Känsloätande',
  eating_disorder: 'Ätstörning',
  heart_health: 'Hjärthälsa',
  other: 'Övrigt',
};

// Coach category labels in Swedish
export const coachCategoryLabels: Record<CoachConcernCategory, string> = {
  weight_loss_general: 'Gå ner i vikt (utan diagnos)',
  muscle_building: 'Bygga muskler / gå upp i vikt',
  healthy_habits: 'Hälsosamma vanor & struktur',
  training_nutrition: 'Träning, prestation & återhämtning',
  energy_focus: 'Energi, fokus & mättnad',
  plant_based: 'Vegetariskt/veganskt eller balanserad kost',
  emotional_eating_mild: 'Känsloätande & cravings',
  meal_planning: 'Matplanering: matlådor, budget, tid',
  social_eating: 'Mat i sociala situationer',
  supplements: 'Kosttillskott (generell vägledning)',
};

// Subcategory options per category - Dietist path
export const subcategoryOptions: Partial<Record<PrimaryConcernCategory, { value: string; label: string }[]>> = {
  diabetes: [
    { value: 'gestational', label: 'Graviditetsdiabetes' },
    { value: 'prediabetes', label: 'Fördiabetes' },
    { value: 'type2', label: 'Typ 2-diabetes' },
    { value: 'type1', label: 'Typ 1-diabetes' },
  ],
  gut_health: [
    { value: 'reflux', label: 'Reflux / sura uppstötningar' },
    { value: 'crohns', label: 'Crohns sjukdom' },
    { value: 'sibo', label: 'SIBO' },
    { value: 'ibs', label: 'IBS' },
    { value: 'ulcerative_colitis', label: 'Ulcerös kolit' },
    { value: 'other', label: 'Annat' },
  ],
  womens_health: [
    { value: 'pregnancy_nutrition', label: 'Kost före eller efter graviditet' },
    { value: 'fertility', label: 'Fertilitet' },
    { value: 'endometriosis', label: 'Endometrios' },
    { value: 'pcos', label: 'PCOS' },
    { value: 'menopause', label: 'Klimakteriet' },
    { value: 'hormonal_health', label: 'Hormonell hälsa' },
    { value: 'uti', label: 'Urinvägsinfektioner' },
    { value: 'other', label: 'Annat' },
  ],
  eating_disorder: [
    { value: 'bulimia', label: 'Bulimi' },
    { value: 'binge_eating', label: 'Hetsätning' },
    { value: 'anorexia', label: 'Anorexi' },
    { value: 'arfid', label: 'Undvikande/restriktiv ätstörning (ARFID)' },
    { value: 'osfed', label: 'Annan specificerad ätstörning (OSFED)' },
    { value: 'other', label: 'Annat' },
  ],
  heart_health: [
    { value: 'heart_disease', label: 'Hjärtsjukdom' },
    { value: 'high_cholesterol', label: 'Högt kolesterol' },
    { value: 'high_blood_pressure', label: 'Högt blodtryck' },
    { value: 'other', label: 'Annat' },
  ],
};

// Coach subcategory options
export const coachSubcategoryOptions: Partial<Record<CoachConcernCategory, { value: string; label: string }[]>> = {
  weight_loss_general: [
    { value: 'reduce_snacking', label: 'Jag vill minska småätande/snacks' },
    { value: 'portion_satiety', label: 'Jag vill få bättre portionsstorlek & mättnad' },
    { value: 'plan_no_counting', label: 'Jag vill ha en tydlig plan utan kaloriräkning' },
    { value: 'lose_keep_muscle', label: 'Jag vill gå ner i vikt men behålla muskelmassa' },
    { value: 'all_or_nothing', label: 'Jag fastnar i "allt eller inget"' },
    { value: 'other', label: 'Annat' },
  ],
  muscle_building: [
    { value: 'more_protein', label: 'Jag vill få i mig mer protein och bra måltidsstruktur' },
    { value: 'gain_weight_healthy', label: 'Jag vill gå upp i vikt på ett hälsosamt sätt' },
    { value: 'optimize_gym', label: 'Jag vill optimera kost för gym/styrka' },
    { value: 'eat_more_low_appetite', label: 'Jag vill äta mer men har låg aptit' },
    { value: 'bulk_lean_bulk', label: 'Jag vill ha ett upplägg för bulk/lean bulk' },
    { value: 'other', label: 'Annat' },
  ],
  healthy_habits: [
    { value: 'meal_routines', label: 'Jag vill få rutiner för frukost/lunch/middag' },
    { value: 'stop_evening_eating', label: 'Jag vill sluta kvällsäta' },
    { value: 'eat_regularly', label: 'Jag vill äta mer regelbundet' },
    { value: 'better_discipline', label: 'Jag vill få bättre planering/disciplin' },
    { value: 'learn_base_foods', label: 'Jag vill lära mig "bra basmat" som funkar alltid' },
    { value: 'other', label: 'Annat' },
  ],
  training_nutrition: [
    { value: 'pre_post_workout', label: 'Vad ska jag äta före/efter träning?' },
    { value: 'more_energy_training', label: 'Jag vill få mer ork i träningen' },
    { value: 'improve_recovery', label: 'Jag vill förbättra återhämtning' },
    { value: 'early_training_timing', label: 'Jag tränar morgon/tidig kväll och behöver timing' },
    { value: 'sports_nutrition_light', label: 'Jag vill ha sportnutrition "light" (vardagsnivå)' },
    { value: 'other', label: 'Annat' },
  ],
  energy_focus: [
    { value: 'afternoon_dip', label: 'Jag blir trött efter lunch / dippar på eftermiddagen' },
    { value: 'always_hungry', label: 'Jag är hungrig hela tiden' },
    { value: 'hard_to_feel_full', label: 'Jag har svårt att känna mättnad' },
    { value: 'stabilize_energy', label: 'Jag vill stabilisera energi under dagen' },
    { value: 'reduce_caffeine_sugar', label: 'Jag vill minska koffein/socker utan att krascha' },
    { value: 'other', label: 'Annat' },
  ],
  plant_based: [
    { value: 'more_vegetarian', label: 'Jag vill äta mer vegetariskt men få i mig rätt näring' },
    { value: 'vegan_protein', label: 'Jag är vegan och vill säkra protein/struktur' },
    { value: 'eat_cleaner', label: 'Jag vill äta mer "ren"/mindre ultraprocessat' },
    { value: 'more_veggies_fiber', label: 'Jag vill få in mer grönsaker/fiber' },
    { value: 'recipes_shopping', label: 'Jag vill ha recept och inköpslista' },
    { value: 'other', label: 'Annat' },
  ],
  emotional_eating_mild: [
    { value: 'stress_boredom', label: 'Jag äter när jag är stressad/uttråkad' },
    { value: 'evening_cravings', label: 'Jag får starkt sug på kvällen' },
    { value: 'lose_control_snacks', label: 'Jag tappar kontrollen runt snacks ibland' },
    { value: 'mindful_eating', label: 'Jag vill ha verktyg för mindful eating' },
    { value: 'balance_no_bans', label: 'Jag vill hitta balans utan förbud' },
    { value: 'other', label: 'Annat' },
  ],
  meal_planning: [
    { value: 'meal_prep', label: 'Jag vill meal-preppa och ha rutiner' },
    { value: 'healthy_budget', label: 'Jag vill äta nyttigt på budget' },
    { value: 'quick_defaults', label: 'Jag har lite tid och behöver "snabba standardmåltider"' },
    { value: 'weekly_menu', label: 'Jag vill ha veckomeny + inköpslista' },
    { value: 'simple_food', label: 'Jag vill ha enklare mat som är lätt att följa' },
    { value: 'other', label: 'Annat' },
  ],
  social_eating: [
    { value: 'weekend_routines', label: 'Jag tappar rutiner på helgen' },
    { value: 'eating_out', label: 'Jag vill kunna äta ute utan att sabba allt' },
    { value: 'travel_strategy', label: 'Jag reser mycket och vill ha strategi' },
    { value: 'alcohol_balance', label: 'Jag dricker alkohol ibland och vill ha balans' },
    { value: 'social_pressure', label: 'Jag vill hantera social press runt mat' },
    { value: 'other', label: 'Annat' },
  ],
  supplements: [
    { value: 'worth_vs_not', label: 'Jag vill veta vad som är värt vs onödigt' },
    { value: 'protein_creatine', label: 'Proteinpulver/kreatin – hur använder jag det smart?' },
    { value: 'food_first', label: 'Jag vill få "mat först" men stöd där det behövs' },
    { value: 'supplement_routine', label: 'Jag vill ha rutin kring tillskott' },
    { value: 'other', label: 'Annat' },
  ],
};

// Pregnancy triage reason labels
export const pregnancyTriageReasonLabels: Record<PregnancyTriageReason, string> = {
  general_planning: 'Allmän kostplanering (näring, måltidsstruktur, tips)',
  nausea_cravings: 'Illamående/cravings/mataversioner (utan komplikation)',
  weight_concern: 'Viktuppgång som oroar mig (utan diagnos)',
  gdm_risk_or_dx: 'Jag har fått graviditetsdiabetes eller är under utredning',
  diabetes: 'Jag har diabetes typ 1 eller typ 2',
  nutrient_deficiency: 'Jag har näringsbrist (t.ex. järnbrist) eller misstänker brist',
  medical_complication: 'Jag har andra medicinska komplikationer',
  unsure: 'Osäker / vill att vården bedömer',
};

export const supportAreaOptions = [
  { value: 'accountability', label: 'Ansvar och uppföljning' },
  { value: 'elimination_diet', label: 'Elimineringsdiet' },
  { value: 'exercise', label: 'Fysisk aktivitet/träning' },
  { value: 'fodmap', label: 'FODMAP' },
  { value: 'functional_medicine', label: 'Funktionsmedicin' },
  { value: 'intuitive_eating', label: 'Intuitivt ätande' },
  { value: 'lab_tests', label: 'Laboratorieprover' },
  { value: 'meal_planning', label: 'Måltidsplanering' },
  { value: 'macro_goals', label: 'Individanpassade makronutrientmål' },
  { value: 'food_relationship', label: 'Relation till mat och ätande' },
  { value: 'evidence_based', label: 'Evidens- och forskningsbaserat arbetssätt' },
  { value: 'sleep', label: 'Sömn' },
  { value: 'supplements', label: 'Kosttillskottsrådgivning och uppföljning' },
  { value: 'weight_neutral', label: 'Viktneutralt förhållningssätt' },
];

export const activityLevelLabels: Record<ActivityLevel, string> = {
  sedentary: 'Stillasittande',
  lightly_active: 'Lite aktiv',
  moderately_active: 'Medel aktiv',
  active: 'Aktiv',
  very_active: 'Mycket aktiv',
};

export const motivationLevelLabels: Record<MotivationLevel, string> = {
  excited: 'Jag är taggad',
  curious: 'Jag är nyfiken',
  hesitant: 'Jag är tveksam',
  not_ready: 'Jag är inte redo',
};

// Preference tag options for TagsStep (multi-select)
export const preferenceTagOptions = {
  goals: {
    label: 'Mål',
    options: [
      { value: 'goal_weight_loss', label: 'Gå ner i vikt' },
      { value: 'goal_muscle', label: 'Bygga muskler' },
      { value: 'goal_regular_eating', label: 'Äta mer regelbundet' },
      { value: 'goal_energy', label: 'Få mer energi' },
      { value: 'goal_reduce_sugar', label: 'Minska sötsug/snacks' },
      { value: 'goal_meal_planning', label: 'Bli bättre på matplanering' },
    ],
  },
  lifestyle: {
    label: 'Vardag & begränsningar',
    options: [
      { value: 'lifestyle_irregular_schedule', label: 'Oregelbundna tider (skift/resa)' },
      { value: 'lifestyle_busy', label: 'Jobbar mycket, lite tid' },
      { value: 'lifestyle_budget', label: 'Budgetvänliga upplägg' },
      { value: 'lifestyle_eating_out', label: 'Äter ofta ute' },
      { value: 'lifestyle_simple_meals', label: 'Enkla standardmåltider' },
    ],
  },
  preferences: {
    label: 'Preferenser',
    options: [
      { value: 'pref_vegetarian', label: 'Vegetarisk' },
      { value: 'pref_vegan', label: 'Vegansk' },
      { value: 'pref_high_protein', label: 'Mycket protein' },
      { value: 'pref_less_sugar', label: 'Minska socker' },
      { value: 'pref_more_fiber', label: 'Mer fiber/grönsaker' },
      { value: 'pref_no_counting', label: 'Undvika kaloriräkning' },
    ],
  },
  behaviors: {
    label: 'Beteenden',
    options: [
      { value: 'behavior_evening_eating', label: 'Kvällsätande' },
      { value: 'behavior_work_snacking', label: 'Småätande på jobbet' },
      { value: 'behavior_cravings', label: 'Sug/cravings' },
      { value: 'behavior_stress_eating', label: 'Stressätande' },
      { value: 'behavior_all_or_nothing', label: '"Allt eller inget"-tänk' },
    ],
  },
  training: {
    label: 'Träning',
    options: [
      { value: 'training_1_2', label: 'Tränar 1–2 ggr/vecka' },
      { value: 'training_3_5', label: 'Tränar 3–5 ggr/vecka' },
      { value: 'training_strength', label: 'Styrketräning' },
      { value: 'training_cardio', label: 'Kondition/löpning' },
      { value: 'training_pre_post', label: 'Pre-/post-workout strategi' },
    ],
  },
};
