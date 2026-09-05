import type { AreaConfig } from "./types";
import { cn } from "@/lib/utils";

interface AreaSelectorProps {
  areas: AreaConfig[];
  onSelect: (id: string) => void;
}

export function AreaSelector({ areas, onSelect }: AreaSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Vad vill klienten ha hjälp med?</h2>
        <p className="text-sm text-muted-foreground">
          Välj det mål som är viktigast just nu. Kompletterande mål kan anges i nästa steg.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {areas.map(area => {
          const Icon = area.icon;
          return (
            <button
              key={area.id}
              onClick={() => onSelect(area.id)}
              className={cn(
                "flex items-start gap-3 p-4 rounded-lg border text-left transition-colors",
                "hover:bg-accent hover:border-primary/30"
              )}
            >
              <Icon className="h-6 w-6 shrink-0 text-primary" strokeWidth={1.75} aria-hidden="true" />
              <div>
                <p className="font-medium text-sm">{area.title}</p>
                <p className="text-xs text-muted-foreground">{area.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
