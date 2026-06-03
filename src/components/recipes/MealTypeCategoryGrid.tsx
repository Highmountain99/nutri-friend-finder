interface MealTypeCategoryGridProps {
  onSelect: (mealTypeId: string) => void;
}

const mealTypeCategories = [
  {
    id: "breakfast",
    label: "Frukost",
    emoji: "🥞",
    gradient: "from-yellow-400 to-orange-400",
  },
  {
    id: "lunch",
    label: "Lunch",
    emoji: "🥗",
    gradient: "from-green-400 to-emerald-500",
  },
  {
    id: "dinner",
    label: "Middag",
    emoji: "🍽️",
    gradient: "from-indigo-500 to-purple-600",
  },
  {
    id: "soup",
    label: "Soppa",
    emoji: "🥣",
    gradient: "from-orange-400 to-red-400",
  },
  {
    id: "salad",
    label: "Sallad",
    emoji: "🥬",
    gradient: "from-lime-400 to-green-500",
  },
  {
    id: "appetizer",
    label: "Förrätt",
    emoji: "🍤",
    gradient: "from-pink-400 to-rose-500",
  },
];

export function MealTypeCategoryGrid({ onSelect }: MealTypeCategoryGridProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Måltidstyper
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {mealTypeCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelect(category.id)}
            className={`relative h-24 rounded-xl bg-gradient-to-br ${category.gradient} overflow-hidden transition-transform active:scale-95 shadow-soft`}
          >
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl mb-1">{category.emoji}</span>
              <span className="text-white font-semibold text-sm drop-shadow-md">
                {category.label}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
