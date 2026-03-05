export interface ParsedIngredient {
  amount: number | null;
  unit: string;
  ingredient: string;
}

export interface ParsedRecipe {
  title: string;
  description: string;
  ingredients: ParsedIngredient[];
  instructions: string[];
  servings: number | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  caloriesPerServing: number | null;
  proteinPerServing: number | null;
  carbsPerServing: number | null;
  fatPerServing: number | null;
  fiberPerServing: number | null;
  imageUrl: string | null;
  sourceUrl: string | null;
}

const UNIT_REGEX = /^(\d+[.,]?\d*)\s*(g|kg|ml|dl|l|msk|tsk|st|krm|cl|port)?\s+(.+)$/i;

export function parseIngredientLine(line: string): ParsedIngredient {
  const trimmed = line.trim();
  const match = trimmed.match(UNIT_REGEX);
  if (match) {
    return {
      amount: parseFloat(match[1].replace(',', '.')),
      unit: (match[2] || '').toLowerCase(),
      ingredient: match[3].trim(),
    };
  }
  // No amount found – entire line is ingredient
  return { amount: null, unit: '', ingredient: trimmed };
}

export function parseIngredientList(text: string): ParsedIngredient[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map(parseIngredientLine);
}

export function parseRecipeText(text: string): Partial<ParsedRecipe> {
  const lines = text.split('\n').map((l) => l.trim());
  const result: Partial<ParsedRecipe> = {
    ingredients: [],
    instructions: [],
  };

  let section: 'none' | 'ingredients' | 'instructions' = 'none';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // Title
    if (lower.startsWith('titel:') || lower.startsWith('title:')) {
      result.title = line.slice(line.indexOf(':') + 1).trim();
      continue;
    }

    // Servings
    if (lower.startsWith('portioner:') || lower.startsWith('servings:')) {
      const num = parseInt(line.slice(line.indexOf(':') + 1).trim());
      if (!isNaN(num)) result.servings = num;
      continue;
    }

    // Time
    if (lower.startsWith('tid:') || lower.startsWith('time:')) {
      const num = parseInt(line.slice(line.indexOf(':') + 1).trim());
      if (!isNaN(num)) result.cookTimeMinutes = num;
      continue;
    }

    // Section headers
    if (lower.startsWith('ingredienser') || lower.startsWith('ingredients')) {
      section = 'ingredients';
      continue;
    }
    if (
      lower.startsWith('gör så här') ||
      lower.startsWith('instruktioner') ||
      lower.startsWith('instructions') ||
      lower.startsWith('tillagning')
    ) {
      section = 'instructions';
      continue;
    }

    if (!line) continue;

    if (section === 'ingredients') {
      result.ingredients!.push(parseIngredientLine(line));
    } else if (section === 'instructions') {
      // Strip leading step numbers like "1." or "1)"
      const step = line.replace(/^\d+[.)]\s*/, '');
      if (step) result.instructions!.push(step);
    } else if (!result.title && i === 0) {
      result.title = line;
    }
  }

  return result;
}

export function autoSuggestTags(recipe: Partial<ParsedRecipe>): {
  cuisine_types: string[];
  meal_types: string[];
  health_plans: string[];
  dietary_needs: string[];
  allergen_free: string[];
} {
  const tags = {
    cuisine_types: [] as string[],
    meal_types: [] as string[],
    health_plans: [] as string[],
    dietary_needs: [] as string[],
    allergen_free: [] as string[],
  };

  const allText = [
    recipe.title || '',
    recipe.description || '',
    ...(recipe.ingredients || []).map((i) => i.ingredient),
  ]
    .join(' ')
    .toLowerCase();

  // Meal type
  if (/frukost|breakfast|gröt|smoothie|müsli/.test(allText)) tags.meal_types.push('breakfast');
  if (/sallad|salad/.test(allText)) tags.meal_types.push('salad');
  if (/soppa|soup/.test(allText)) tags.meal_types.push('soup');

  // Dietary
  const hasMeat = /kyckling|nötkött|fläsk|bacon|korv|skinka|lax|fisk|räk|tonfisk/.test(allText);
  const hasDairy = /mjölk|grädde|ost|smör|yoghurt|crème/.test(allText);
  if (!hasMeat && !hasDairy) tags.dietary_needs.push('vegan');
  else if (!hasMeat) tags.dietary_needs.push('vegetarian');

  // Allergens
  if (/glutenfri|gluten.free/.test(allText)) tags.allergen_free.push('gluten_free');
  if (/laktosfri|lactose.free/.test(allText)) tags.allergen_free.push('lactose_free');
  if (/fodmap/.test(allText)) tags.allergen_free.push('fodmap_free');

  return tags;
}
