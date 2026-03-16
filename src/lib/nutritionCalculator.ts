/**
 * Mifflin-St Jeor BMR calculation + TDEE + macro derivation.
 * Uses a default age of 30 since we don't collect age.
 */

type Gender = "male" | "female" | "other";
type ActivityLevel = "sedentary" | "lightly_active" | "moderately_active" | "active" | "very_active";

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const DEFAULT_AGE = 30;

export interface CalculatedGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function calculateNutritionGoals(
  gender: Gender,
  heightCm: number,
  weightKg: number,
  activityLevel: ActivityLevel
): CalculatedGoals {
  // Mifflin-St Jeor BMR
  let bmr: number;
  if (gender === "male") {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * DEFAULT_AGE + 5;
  } else {
    // female and other use the female formula
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * DEFAULT_AGE - 161;
  }

  const tdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);

  // Protein: ~1.6g per kg body weight
  const protein = Math.round(weightKg * 1.6);

  // Fat: ~30% of TDEE (9 kcal/g)
  const fat = Math.round((tdee * 0.3) / 9);

  // Carbs: remaining calories (4 kcal/g)
  const proteinCals = protein * 4;
  const fatCals = fat * 9;
  const carbs = Math.round(Math.max(0, tdee - proteinCals - fatCals) / 4);

  return { calories: tdee, protein, carbs, fat };
}
