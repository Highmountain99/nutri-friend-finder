import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { WeeklyStats } from "@/types/progress";

interface WeeklyOverviewProps {
  stats: WeeklyStats;
  showCalories?: boolean;
}

const WEEKDAYS = ["M", "T", "O", "T", "F", "L", "S"];

export function WeeklyOverview({ stats, showCalories = true }: WeeklyOverviewProps) {
  const getMessage = () => {
    if (stats.activeDays >= 5) return "Du är på rätt spår! 🌟";
    if (stats.activeDays >= 3) return "Bra jobbat hittills! 💪";
    return "Fortsätt logga!";
  };

  return (
    <section>
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
        Veckoöversikt
      </h2>
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-foreground text-sm">
              {getMessage()}
            </span>
          </div>
          
          <div className="flex justify-between gap-1.5 mb-5">
            {WEEKDAYS.map((day, index) => (
              <div key={`${day}-${index}`} className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    index < stats.activeDays
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : index === stats.activeDays
                        ? "bg-primary/15 text-primary ring-2 ring-primary/30"
                        : "bg-muted/60 text-muted-foreground"
                  }`}
                >
                  {day}
                </div>
              </div>
            ))}
          </div>

          {showCalories && stats.caloriesAvg !== undefined && stats.caloriesGoal !== undefined && (
            <div className="pt-4 border-t border-border/50">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Kalorier snitt</span>
                <span className="font-semibold text-foreground">
                  {stats.caloriesAvg} / {stats.caloriesGoal} kcal
                </span>
              </div>
            </div>
          )}

          {stats.mealsLogged !== undefined && (
            <div className={`pt-4 ${showCalories ? '' : 'border-t border-border/50'}`}>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Måltider loggade</span>
                <span className="font-semibold text-foreground">{stats.mealsLogged}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
