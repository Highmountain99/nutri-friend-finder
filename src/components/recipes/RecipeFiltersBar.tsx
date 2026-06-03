import { FilterDropdown } from "./FilterDropdown";
import type { RecipeFilters } from "@/hooks/useRecipeSearch";

interface RecipeFiltersBarProps {
  filters: RecipeFilters;
  onFiltersChange: (filters: RecipeFilters) => void;
}

const cuisineOptions = [
  { id: "mediterranean", label: "Medelhav" },
  { id: "asian", label: "Asiatiskt" },
  { id: "swedish", label: "Svenskt" },
  { id: "mexican", label: "Mexikanskt" },
  { id: "italian", label: "Italienskt" },
  { id: "indian", label: "Indiskt" },
];

const mealTypeOptions = [
  { id: "breakfast", label: "Frukost" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Middag" },
  { id: "salad", label: "Sallad" },
  { id: "soup", label: "Soppa" },
  { id: "main_course", label: "Huvudrätt" },
  { id: "appetizer", label: "Förrätt" },
];

const healthPlanOptions = [
  { id: "low_carb", label: "Låga kolhydrater" },
  { id: "high_fiber", label: "Högt fiber" },
  { id: "high_protein", label: "Högt protein" },
  { id: "mediterranean", label: "Medelhavs" },
  { id: "heart_friendly", label: "Bra för hjärta" },
  { id: "low_sodium", label: "Lågt sodium" },
  { id: "kidney_friendly", label: "Bra för njurar" },
  { id: "diabetic_friendly", label: "Bra för diabetes" },
];

const dietaryNeedsOptions = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "pescitarian", label: "Pescitarian" },
  { id: "keto", label: "Keto" },
  { id: "paleo", label: "Paleo" },
  { id: "kosher", label: "Kosher" },
];

const allergenFreeOptions = [
  { id: "lactose_free", label: "Laktosfri" },
  { id: "gluten_free", label: "Glutenfri" },
  { id: "soy_free", label: "Sojafri" },
  { id: "egg_free", label: "Äggfri" },
  { id: "shellfish_free", label: "Skaldjursfri" },
  { id: "peanut_free", label: "Jordnötsfri" },
  { id: "nut_free", label: "Nötfri" },
  { id: "sesame_free", label: "Sesamfri" },
  { id: "sulfite_free", label: "Sulfitfri" },
  { id: "fodmap_free", label: "FODMAPfri" },
];

export function RecipeFiltersBar({ filters, onFiltersChange }: RecipeFiltersBarProps) {
  const updateFilter = <K extends keyof RecipeFilters>(key: K, value: RecipeFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="relative z-50 flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
      <FilterDropdown
        label="Kök"
        options={cuisineOptions}
        selected={filters.cuisineTypes}
        onSelectionChange={(selected) => updateFilter("cuisineTypes", selected)}
      />
      <FilterDropdown
        label="Måltidstyp"
        options={mealTypeOptions}
        selected={filters.mealTypes}
        onSelectionChange={(selected) => updateFilter("mealTypes", selected)}
      />
      <FilterDropdown
        label="Hälsoplan"
        options={healthPlanOptions}
        selected={filters.healthPlans}
        onSelectionChange={(selected) => updateFilter("healthPlans", selected)}
      />
      <FilterDropdown
        label="Kostbehov"
        options={dietaryNeedsOptions}
        selected={filters.dietaryNeeds}
        onSelectionChange={(selected) => updateFilter("dietaryNeeds", selected)}
      />
      <FilterDropdown
        label="Allergier"
        options={allergenFreeOptions}
        selected={filters.allergenFree}
        onSelectionChange={(selected) => updateFilter("allergenFree", selected)}
      />
    </div>
  );
}
