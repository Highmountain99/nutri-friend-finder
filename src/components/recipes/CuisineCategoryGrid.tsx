interface CuisineCategoryGridProps {
  onSelect: (cuisineId: string) => void;
}

const cuisineCategories = [
  {
    id: "medelhav",
    label: "Medelhav",
    emoji: "🫒",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    id: "asiatiskt",
    label: "Asiatiskt",
    emoji: "🍜",
    gradient: "from-red-500 to-pink-600",
  },
  {
    id: "svenskt",
    label: "Svenskt",
    emoji: "🇸🇪",
    gradient: "from-blue-500 to-yellow-400",
  },
  {
    id: "mexikanskt",
    label: "Mexikanskt",
    emoji: "🌮",
    gradient: "from-green-500 to-red-500",
  },
  {
    id: "italienskt",
    label: "Italienskt",
    emoji: "🍝",
    gradient: "from-green-600 to-red-600",
  },
  {
    id: "indiskt",
    label: "Indiskt",
    emoji: "🍛",
    gradient: "from-orange-500 to-yellow-500",
  },
];

export function CuisineCategoryGrid({ onSelect }: CuisineCategoryGridProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Populära kök
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {cuisineCategories.map((category) => (
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
