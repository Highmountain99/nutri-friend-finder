import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface NutritionProgressCardProps {
  icon: LucideIcon;
  label: string;
  remaining: number;
  goal: number;
  unit: string;
  color: string;
  bgColor: string;
}

export function NutritionProgressCard({ 
  icon: Icon, 
  label, 
  remaining,
  goal, 
  unit,
  color,
  bgColor
}: NutritionProgressCardProps) {
  const consumed = goal - remaining;
  const percentage = Math.min((consumed / goal) * 100, 100);
  const isOverGoal = remaining < 0;
  
  return (
    <Card className="shadow-soft">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", bgColor)}>
            <Icon className={cn("w-3.5 h-3.5", color)} />
          </div>
          <span className="text-xs font-medium text-muted-foreground">{label} kvar</span>
        </div>
        <div className="space-y-1">
          <div className="flex items-baseline gap-1">
            <span className={cn(
              "text-2xl font-bold",
              isOverGoal ? "text-destructive" : "text-foreground"
            )}>
              {isOverGoal ? "+" : ""}{Math.abs(remaining).toLocaleString("sv-SE")}
            </span>
            <span className="text-xs text-muted-foreground">{unit}</span>
          </div>
          <Progress 
            value={percentage} 
            className={cn(
              "h-1.5",
              isOverGoal && "[&>div]:bg-destructive",
              color.replace("text-", "[&>div]:bg-")
            )} 
          />
        </div>
      </CardContent>
    </Card>
  );
}
