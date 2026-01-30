import { FilterDropdown } from "./FilterDropdown";
import type { RecipeFilters } from "@/hooks/useRecipeSearch";

interface RecipeFiltersBarProps {
  filters: RecipeFilters;
  onFiltersChange: (filters: RecipeFilters) => void;
}

const cuisineOptions = [
  { id: "medelhav", label: "Medelhav" },
  { id: "asiatiskt", label: "Asiatiskt" },
  { id: "svenskt", label: "Svenskt" },
  { id: "mexikanskt", label: "Mexikanskt" },
  { id: "italienskt", label: "Italienskt" },
  { id: "indiskt", label: "Indiskt" },
];

const mealTypeOptions = [
  { id: "frukost", label: "Frukost" },
  { id: "lunch", label: "Lunch" },
  { id: "middag", label: "Middag" },
  { id: "sallad", label: "Sallad" },
  { id: "soppa", label: "Soppa" },
  { id: "huvudrätt", label: "Huvudrätt" },
  { id: "förrätt", label: "Förrätt" },
];

const healthPlanOptions = [
  { id: "low_carb", label: "Låga kolhydrater" },
  { id: "high_fiber", label: "Högt fiber" },
  { id: "high_protein", label: "Högt protein" },
  { id: "mediterranean", label: "Medelhavs" },
  { id: "heart_healthy", label: "Bra för hjärta" },
  { id: "low_sodium", label: "Lågt sodium" },
  { id: "kidney_friendly", label: "Bra för njurar" },
  { id: "diabetic_friendly", label: "Bra för diabetes" },
];

const dietaryNeedsOptions = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "pescatarian", label: "Pescitarian" },
  { id: "keto", label: "Keto" },
  { id: "paleo", label: "Paleo" },
  { id: "kosher", label: "Kosher" },
];

const allergenFreeOptions = [
  { id: "laktosfri", label: "Laktosfri" },
  { id: "glutenfri", label: "Glutenfri" },
  { id: "sojafri", label: "Sojafri" },
  { id: "äggfri", label: "Äggfri" },
  { id: "skaldjursfri", label: "Skaldjursfri" },
  { id: "jordnötsfri", label: "Jordnötsfri" },
  { id: "nötfri", label: "Nötfri" },
  { id: "sesamfri", label: "Sesamfri" },
  { id: "sulfitfri", label: "Sulfitfri" },
  { id: "fodmapfri", label: "FODMAPfri" },
];

export function RecipeFiltersBar({ filters, onFiltersChange }: RecipeFiltersBarProps) {
  const updateFilter = <K extends keyof RecipeFilters>(key: K, value: RecipeFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
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
