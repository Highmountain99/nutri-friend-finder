import { Badge } from "@/components/ui/badge";

const mealTypes = [
  { id: "frukost", label: "Frukost", emoji: "🥐" },
  { id: "lunch", label: "Lunch", emoji: "🥗" },
  { id: "middag", label: "Middag", emoji: "🍽️" },
  { id: "mellanmål", label: "Mellanmål", emoji: "🍎" },
  { id: "dessert", label: "Dessert", emoji: "🍰" },
];

interface MealTypeShortcutsProps {
  onSelect: (mealType: string) => void;
}

export function MealTypeShortcuts({ onSelect }: MealTypeShortcutsProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">Måltidstyper</h2>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {mealTypes.map((meal) => (
          <Badge
            key={meal.id}
            variant="secondary"
            className="rounded-full px-4 py-2 whitespace-nowrap cursor-pointer hover:bg-secondary/80 transition-colors text-sm"
            onClick={() => onSelect(meal.id)}
          >
            <span className="mr-1.5">{meal.emoji}</span>
            {meal.label}
          </Badge>
        ))}
      </div>
    </section>
  );
}
