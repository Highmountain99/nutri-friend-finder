import { LucideIcon, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface QuickActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick?: () => void;
  variant?: "default" | "accent";
}

export function QuickActionCard({
  icon: Icon,
  title,
  description,
  onClick,
  variant = "default",
}: QuickActionCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-elevated active:scale-[0.98]",
        variant === "accent" && "border-accent/30 bg-accent/5"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-center gap-4">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
            variant === "accent" 
              ? "bg-accent/10 text-accent" 
              : "bg-primary-soft text-primary"
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground truncate">{description}</p>
        </div>

        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      </CardContent>
    </Card>
  );
}
