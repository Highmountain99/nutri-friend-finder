import { Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    <Card className={cn("shadow-soft relative", className)}>
      <CardContent className="p-4">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={onEdit}
          aria-label={`Redigera ${label}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <div className="flex items-center gap-2 mb-1 pr-6">
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
