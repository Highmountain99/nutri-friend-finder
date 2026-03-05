export type TrafficLight = "green" | "yellow" | "red";

export function getFatColor(v?: number): TrafficLight {
  if (v == null) return "yellow";
  if (v <= 3) return "green";
  if (v <= 17.5) return "yellow";
  return "red";
}

export function getSaturatedFatColor(v?: number): TrafficLight {
  if (v == null) return "yellow";
  if (v <= 1.5) return "green";
  if (v <= 5) return "yellow";
  return "red";
}

export function getSugarColor(v?: number): TrafficLight {
  if (v == null) return "yellow";
  if (v <= 5) return "green";
  if (v <= 22.5) return "yellow";
  return "red";
}

export function getSaltColor(v?: number): TrafficLight {
  if (v == null) return "yellow";
  if (v <= 0.3) return "green";
  if (v <= 1.5) return "yellow";
  return "red";
}

export function getFiberColor(v?: number): TrafficLight {
  if (v == null) return "yellow";
  if (v >= 3) return "green";
  if (v >= 1.5) return "yellow";
  return "red";
}

export function getProteinColor(v?: number): TrafficLight {
  if (v == null) return "yellow";
  if (v >= 8) return "green";
  if (v >= 4) return "yellow";
  return "red";
}

export const trafficLightClasses: Record<TrafficLight, string> = {
  green: "text-green-700 dark:text-green-400",
  yellow: "text-yellow-600 dark:text-yellow-400",
  red: "text-red-600 dark:text-red-400",
};

export const allergenTranslations: Record<string, string> = {
  "en:gluten": "Gluten",
  "en:milk": "Mjölk",
  "en:eggs": "Ägg",
  "en:nuts": "Nötter",
  "en:peanuts": "Jordnötter",
  "en:soybeans": "Soja",
  "en:fish": "Fisk",
  "en:celery": "Selleri",
  "en:mustard": "Senap",
  "en:sesame-seeds": "Sesam",
  "en:sulphur-dioxide-and-sulphites": "Sulfiter",
  "en:lupin": "Lupin",
  "en:molluscs": "Blötdjur",
  "en:crustaceans": "Skaldjur",
};
