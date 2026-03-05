export interface TagOption {
  id: string;
  label: string;
}

export interface TagGroup {
  key: string;
  label: string;
  dbColumn: string;
  options: TagOption[];
}

export const TAG_GROUPS: TagGroup[] = [
  {
    key: 'cuisine',
    label: 'Kök',
    dbColumn: 'cuisine_types',
    options: [
      { id: 'mediterranean', label: 'Medelhav' },
      { id: 'asian', label: 'Asiatiskt' },
      { id: 'swedish', label: 'Svenskt' },
      { id: 'mexican', label: 'Mexikanskt' },
      { id: 'italian', label: 'Italienskt' },
      { id: 'indian', label: 'Indiskt' },
    ],
  },
  {
    key: 'mealType',
    label: 'Måltidstyp',
    dbColumn: 'meal_types',
    options: [
      { id: 'breakfast', label: 'Frukost' },
      { id: 'lunch', label: 'Lunch' },
      { id: 'dinner', label: 'Middag' },
      { id: 'salad', label: 'Sallad' },
      { id: 'soup', label: 'Soppa' },
      { id: 'main_course', label: 'Huvudrätt' },
      { id: 'starter', label: 'Förrätt' },
    ],
  },
  {
    key: 'healthPlan',
    label: 'Hälsoplan',
    dbColumn: 'health_plans',
    options: [
      { id: 'low_carb', label: 'Låga kolhydrater' },
      { id: 'high_fiber', label: 'Högt fiber' },
      { id: 'high_protein', label: 'Högt protein' },
      { id: 'mediterranean_diet', label: 'Medelhavs' },
      { id: 'heart_friendly', label: 'Bra för hjärta' },
      { id: 'low_sodium', label: 'Lågt sodium' },
      { id: 'kidney_friendly', label: 'Bra för njurar' },
      { id: 'diabetes_friendly', label: 'Bra för diabetes' },
    ],
  },
  {
    key: 'dietary',
    label: 'Kostbehov',
    dbColumn: 'dietary_needs',
    options: [
      { id: 'vegetarian', label: 'Vegetarian' },
      { id: 'vegan', label: 'Vegan' },
      { id: 'pescitarian', label: 'Pescitarian' },
      { id: 'keto', label: 'Keto' },
      { id: 'paleo', label: 'Paleo' },
      { id: 'kosher', label: 'Kosher' },
    ],
  },
  {
    key: 'allergens',
    label: 'Allergier',
    dbColumn: 'allergen_free',
    options: [
      { id: 'lactose_free', label: 'Laktosfri' },
      { id: 'gluten_free', label: 'Glutenfri' },
      { id: 'soy_free', label: 'Sojafri' },
      { id: 'egg_free', label: 'Äggfri' },
      { id: 'shellfish_free', label: 'Skaldjursfri' },
      { id: 'peanut_free', label: 'Jordnötsfri' },
      { id: 'nut_free', label: 'Nötfri' },
      { id: 'sesame_free', label: 'Sesamfri' },
      { id: 'sulfite_free', label: 'Sulfitfri' },
      { id: 'fodmap_free', label: 'FODMAP-fri' },
    ],
  },
];

/** Get Swedish label for a tag id */
export function getTagLabel(tagId: string): string {
  for (const group of TAG_GROUPS) {
    const opt = group.options.find((o) => o.id === tagId);
    if (opt) return opt.label;
  }
  return tagId;
}

/** Collect all tags from all groups into a flat lookup */
export function getAllTagLabels(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const group of TAG_GROUPS) {
    for (const opt of group.options) {
      map[opt.id] = opt.label;
    }
  }
  return map;
}
