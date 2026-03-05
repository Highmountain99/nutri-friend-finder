export interface ProductNutriments {
  "energy-kcal_100g"?: number;
  fat_100g?: number;
  "saturated-fat_100g"?: number;
  carbohydrates_100g?: number;
  sugars_100g?: number;
  fiber_100g?: number;
  proteins_100g?: number;
  salt_100g?: number;
}

export interface Product {
  code: string;
  product_name: string;
  brands: string;
  quantity: string;
  image_front_url: string;
  image_front_small_url: string;
  nutrition_grades: "a" | "b" | "c" | "d" | "e" | null;
  nova_group: 1 | 2 | 3 | 4 | null;
  allergens_tags: string[];
  ingredients_text_sv?: string;
  ingredients_text?: string;
  nutriments: ProductNutriments;
}

export interface ProductResponse {
  code: string;
  status: number;
  product: Product;
}

export interface ScanHistoryEntry {
  product: Product;
  scannedAt: Date;
}

export type ScannerView = "scanner" | "product" | "history" | "compare";
