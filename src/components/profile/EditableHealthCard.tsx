import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EditableHealthCardProps {
  icon: LucideIcon;
  label: string;
  value: string | undefined;
  placeholder?: string;
  onEdit: () => void;
  className?: string;
}

export function EditableHealthCard({
  icon: Icon,
  label,
  value,
  placeholder = "Ej angivet",
  onEdit,
  className,
}: EditableHealthCardProps) {
  const displayValue = value || placeholder;
  const isEmpty = !value;

  return (
    <Card
      className={cn("shadow-soft cursor-pointer hover:bg-muted/50 transition-colors", className)}
      onClick={onEdit}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onEdit(); }}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className={cn(
          "font-semibold",
          isEmpty ? "text-muted-foreground italic" : "text-foreground"
        )}>
          {displayValue}
        </p>
      </CardContent>
    </Card>
  );
}
