import type { AreaConfig } from "./types";
import { cn } from "@/lib/utils";

interface AreaSelectorProps {
  areas: AreaConfig[];
  onSelect: (id: string) => void;
}

export function AreaSelector({ areas, onSelect }: AreaSelectorProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Välj behandlingsområde</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {areas.map(area => (
          <button
            key={area.id}
            onClick={() => onSelect(area.id)}
            className={cn(
              "flex items-start gap-3 p-4 rounded-lg border text-left transition-colors",
              "hover:bg-accent hover:border-primary/30"
            )}
          >
            <span className="text-2xl">{area.icon}</span>
            <div>
              <p className="font-medium text-sm">{area.title}</p>
              <p className="text-xs text-muted-foreground">{area.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
