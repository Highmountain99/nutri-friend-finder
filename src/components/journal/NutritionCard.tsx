import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface NutritionCardProps {
  icon: LucideIcon;
  label: string;
  current: number;
  goal: number;
  unit: string;
  color: string;
  bgColor: string;
}

export function NutritionCard({ 
  icon: Icon, 
  label, 
  current, 
  goal, 
  unit,
  color,
  bgColor
}: NutritionCardProps) {
  const percentage = Math.min((current / goal) * 100, 100);
  const isOverGoal = current > goal;
  
  return (
    <Card className="shadow-soft">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", bgColor)}>
            <Icon className={cn("w-4 h-4", color)} />
          </div>
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <div className="space-y-1">
          <div className="flex items-baseline justify-between">
            <span className={cn(
              "text-lg font-semibold",
              isOverGoal ? "text-destructive" : "text-foreground"
            )}>
              {current}
            </span>
            <span className="text-xs text-muted-foreground">
              / {goal} {unit}
            </span>
          </div>
          <Progress 
            value={percentage} 
            className={cn("h-1.5", isOverGoal && "[&>div]:bg-destructive")} 
          />
        </div>
      </CardContent>
    </Card>
  );
}
