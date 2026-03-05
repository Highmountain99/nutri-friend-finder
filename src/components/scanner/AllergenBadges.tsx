import { Badge } from "@/components/ui/badge";
import { allergenTranslations } from "@/lib/scanner/nutritionThresholds";

interface AllergenBadgesProps {
  tags: string[];
}

export function AllergenBadges({ tags }: AllergenBadgesProps) {
  if (!tags || tags.length === 0) {
    return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">Inga allergener registrerade</Badge>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Badge key={tag} variant="destructive">
          {allergenTranslations[tag] || tag.replace("en:", "").replace(/-/g, " ")}
        </Badge>
      ))}
    </div>
  );
}
