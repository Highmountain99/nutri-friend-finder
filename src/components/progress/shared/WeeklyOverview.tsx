import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { WeeklyStats } from "@/types/progress";

interface WeeklyOverviewProps {
  stats: WeeklyStats;
  showCalories?: boolean;
}

const WEEKDAYS = ["M", "T", "O", "T", "F", "L", "S"];

export function WeeklyOverview({ stats, showCalories = true }: WeeklyOverviewProps) {
  return (
    <section>
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
        Veckoöversikt
      </h2>
      <Card className="shadow-soft">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span className="font-medium text-foreground">
              {stats.activeDays >= 5 
                ? "Du är på rätt spår!" 
                : stats.activeDays >= 3 
                  ? "Bra jobbat hittills!" 
                  : "Fortsätt logga!"
              }
            </span>
          </div>
          
          <div className="flex justify-between gap-1 mb-4">
            {WEEKDAYS.map((day, index) => (
              <div key={`${day}-${index}`} className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    index < stats.activeDays
                      ? "bg-primary text-primary-foreground"
                      : index === stats.activeDays
                        ? "bg-primary-soft text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {day}
                </div>
              </div>
            ))}
          </div>

          {showCalories && stats.caloriesAvg !== undefined && stats.caloriesGoal !== undefined && (
            <div className="pt-3 border-t border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Kalorier snitt</span>
                <span className="font-medium text-foreground">
                  {stats.caloriesAvg} / {stats.caloriesGoal} kcal
                </span>
              </div>
            </div>
          )}

          {stats.mealsLogged !== undefined && (
            <div className={`pt-3 ${showCalories ? '' : 'border-t border-border'}`}>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Måltider loggade</span>
                <span className="font-medium text-foreground">{stats.mealsLogged}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
