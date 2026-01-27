export type CareSeekerType = 'self' | 'other';
export type RelationshipType = 'guardian' | 'trustee' | 'relative';
export type MotivationLevel = 'excited' | 'curious' | 'hesitant' | 'not_ready';

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

export type ActivityLevel = 
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'active'
  | 'very_active';

export interface IntakeFormData {
  careSeekerType?: CareSeekerType;
  relationshipIfOther?: RelationshipType;
  primaryConcernCategory?: PrimaryConcernCategory;
  primaryConcernSubcategory?: string;
  concernTags: string[];
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

// Category display labels in Swedish
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

// Subcategory options per category
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
