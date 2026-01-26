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
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", bgColor)}>
            <Icon className={cn("w-5 h-5", color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-foreground">{label}</span>
              <span className={cn(
                "text-sm",
                isOverGoal ? "text-destructive font-medium" : "text-muted-foreground"
              )}>
                {current} / {goal} {unit}
              </span>
            </div>
            <Progress 
              value={percentage} 
              className={cn("h-2", isOverGoal && "[&>div]:bg-destructive")} 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
