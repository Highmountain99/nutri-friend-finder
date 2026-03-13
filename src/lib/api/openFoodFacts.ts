import type { ProductResponse, Product } from "@/types/scanner";

const cache = new Map<string, Product>();

const FIELDS = [
  "product_name", "brands", "image_front_url", "image_front_small_url",
  "nutriments", "nutrition_grades", "nutriscore_data", "categories",
  "quantity", "allergens_tags", "nova_group", "ecoscore_grade",
  "ingredients_text_sv", "ingredients_text",
].join(",");

export async function searchProducts(query: string): Promise<Product[]> {
  const res = await fetch(
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10&fields=${FIELDS},code`,
    { headers: { "User-Agent": "GutFeeling/1.0 (kontakt@gutfeeling.se)" } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  if (!data.products || !Array.isArray(data.products)) return [];

  return data.products
    .filter((p: any) => p.product_name)
    .map((p: any): Product => {
      const product: Product = {
        code: p.code || "",
        product_name: p.product_name || "Okänd produkt",
        brands: p.brands || "",
        quantity: p.quantity || "",
        image_front_url: p.image_front_url || "",
        image_front_small_url: p.image_front_small_url || "",
        nutrition_grades: p.nutrition_grades || null,
        nova_group: p.nova_group || null,
        allergens_tags: p.allergens_tags || [],
        ingredients_text_sv: p.ingredients_text_sv,
        ingredients_text: p.ingredients_text,
        nutriments: p.nutriments || {},
      };
      cache.set(product.code, product);
      return product;
    });
}

export async function fetchProduct(barcode: string): Promise<{ found: boolean; product?: Product }> {
  const cached = cache.get(barcode);
  if (cached) return { found: true, product: cached };

  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=${FIELDS}`,
    { headers: { "User-Agent": "EatSuite/1.0 (kontakt@eatsuite.se)" } }
  );

  if (!res.ok) throw new Error("Kunde inte hämta produktdata. Kontrollera din internetanslutning.");

  const data: ProductResponse = await res.json();

  if (data.status !== 1 || !data.product) return { found: false };

  const product: Product = {
    code: barcode,
    product_name: data.product.product_name || "Okänd produkt",
    brands: data.product.brands || "",
    quantity: data.product.quantity || "",
    image_front_url: data.product.image_front_url || "",
    image_front_small_url: data.product.image_front_small_url || "",
    nutrition_grades: data.product.nutrition_grades || null,
    nova_group: data.product.nova_group || null,
    allergens_tags: data.product.allergens_tags || [],
    ingredients_text_sv: data.product.ingredients_text_sv,
    ingredients_text: data.product.ingredients_text,
    nutriments: data.product.nutriments || {},
  };

  cache.set(barcode, product);
  return { found: true, product };
}
