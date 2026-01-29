import { Badge } from "@/components/ui/badge";

const cuisineTypes = [
  { id: "medelhav", label: "Medelhav", emoji: "🫒" },
  { id: "asiatiskt", label: "Asiatiskt", emoji: "🥢" },
  { id: "svenskt", label: "Svenskt", emoji: "🇸🇪" },
  { id: "mexikanskt", label: "Mexikanskt", emoji: "🌮" },
  { id: "indiskt", label: "Indiskt", emoji: "🍛" },
  { id: "italienskt", label: "Italienskt", emoji: "🍝" },
];

interface CuisineShortcutsProps {
  onSelect: (cuisineType: string) => void;
}

export function CuisineShortcuts({ onSelect }: CuisineShortcutsProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">Populära kök</h2>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {cuisineTypes.map((cuisine) => (
          <Badge
            key={cuisine.id}
            variant="secondary"
            className="rounded-full px-4 py-2 whitespace-nowrap cursor-pointer hover:bg-secondary/80 transition-colors text-sm"
            onClick={() => onSelect(cuisine.id)}
          >
            <span className="mr-1.5">{cuisine.emoji}</span>
            {cuisine.label}
          </Badge>
        ))}
      </div>
    </section>
  );
}
