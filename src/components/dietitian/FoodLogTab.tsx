import { useState, useMemo } from "react";
import { usePatientJournal } from "@/hooks/dietitian/usePatientJournal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sun, Utensils, Moon, Apple } from "lucide-react";
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { sv } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const mealIcons: Record<string, any> = {
  breakfast: Sun,
  lunch: Utensils,
  dinner: Moon,
  snack: Apple,
};

const mealLabels: Record<string, string> = {
  breakfast: "Frukost",
  lunch: "Lunch",
  dinner: "Middag",
  snack: "Mellanmål",
};

interface Props {
  patientId: string;
}

export function FoodLogTab({ patientId }: Props) {
  const { meals, symptoms } = usePatientJournal(patientId);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week">("day");

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const dayMeals = useMemo(() =>
    (meals.data ?? []).filter((m) => m.entry_date === dateStr)
      .sort((a, b) => {
        const order = ["breakfast", "lunch", "snack", "dinner"];
        return order.indexOf(a.meal_type ?? "") - order.indexOf(b.meal_type ?? "");
      }),
    [meals.data, dateStr]
  );

  const daySymptoms = useMemo(() =>
    (symptoms.data ?? []).filter((s) => s.entry_date === dateStr),
    [symptoms.data, dateStr]
  );

  // Week data
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weekData = useMemo(() =>
    weekDays.map((day) => {
      const ds = format(day, "yyyy-MM-dd");
      const dayMeals = (meals.data ?? []).filter((m) => m.entry_date === ds);
      const daySymptoms = (symptoms.data ?? []).filter((s) => s.entry_date === ds);
      const totalCal = dayMeals.reduce((sum, m) => sum + (m.calories ?? 0), 0);
      return {
        day: format(day, "EEE", { locale: sv }),
        date: ds,
        calories: totalCal,
        meals: dayMeals.length,
        symptoms: daySymptoms.length,
      };
    }),
    [meals.data, symptoms.data, weekDays]
  );

  const getSymptomForMeal = (mealId: string) =>
    (symptoms.data ?? []).filter((s) => s.meal_id === mealId);

  return (
    <div className="space-y-4">
      {/* Date picker + view toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setSelectedDate((d) => subDays(d, viewMode === "day" ? 1 : 7))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[140px] text-center">
            {viewMode === "day"
              ? format(selectedDate, "d MMMM yyyy", { locale: sv })
              : `${format(weekStart, "d MMM", { locale: sv })} – ${format(weekEnd, "d MMM", { locale: sv })}`}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setSelectedDate((d) => addDays(d, viewMode === "day" ? 1 : 7))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex rounded-lg border overflow-hidden">
          <button className={`px-3 py-1.5 text-xs font-medium ${viewMode === "day" ? "bg-primary text-primary-foreground" : "bg-background"}`} onClick={() => setViewMode("day")}>Dag</button>
          <button className={`px-3 py-1.5 text-xs font-medium ${viewMode === "week" ? "bg-primary text-primary-foreground" : "bg-background"}`} onClick={() => setViewMode("week")}>Vecka</button>
        </div>
      </div>

      {viewMode === "day" ? (
        /* Day view */
        dayMeals.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Ingen loggning denna dag</p>
        ) : (
          <div className="space-y-3">
            {dayMeals.map((meal) => {
              const Icon = mealIcons[meal.meal_type ?? "snack"] ?? Apple;
              const mealSymptoms = getSymptomForMeal(meal.id);

              return (
                <Card key={meal.id}>
                  <CardContent className="py-3">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{mealLabels[meal.meal_type ?? ""] ?? meal.meal_type}</span>
                          {mealSymptoms.length > 0 && mealSymptoms.map((s) => (
                            <Badge key={s.id} variant="destructive" className="text-[10px] px-1.5 py-0">
                              {s.description.slice(0, 20)}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm font-medium mt-0.5">{meal.meal_name || "Ingen beskrivning"}</p>
                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{meal.calories ?? 0} kcal</span>
                          <span>{meal.protein ?? 0}g P</span>
                          <span>{meal.carbs ?? 0}g K</span>
                          <span>{meal.fat ?? 0}g F</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Day summary */}
            <Card className="bg-muted/30">
              <CardContent className="py-3">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div><p className="text-lg font-bold">{dayMeals.reduce((s, m) => s + (m.calories ?? 0), 0)}</p><p className="text-xs text-muted-foreground">kcal</p></div>
                  <div><p className="text-lg font-bold">{dayMeals.reduce((s, m) => s + Number(m.protein ?? 0), 0).toFixed(0)}g</p><p className="text-xs text-muted-foreground">Protein</p></div>
                  <div><p className="text-lg font-bold">{dayMeals.reduce((s, m) => s + Number(m.carbs ?? 0), 0).toFixed(0)}g</p><p className="text-xs text-muted-foreground">Kolhydr.</p></div>
                  <div><p className="text-lg font-bold">{dayMeals.reduce((s, m) => s + Number(m.fat ?? 0), 0).toFixed(0)}g</p><p className="text-xs text-muted-foreground">Fett</p></div>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      ) : (
        /* Week view */
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Kalorier per dag</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weekData}>
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => [`${v} kcal`, "Kalorier"]} />
                  <Bar dataKey="calories" radius={[4, 4, 0, 0]}>
                    {weekData.map((entry, i) => (
                      <Cell key={i} className="fill-primary" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* Symptom dots */}
              <div className="flex justify-around mt-1">
                {weekData.map((d) => (
                  <div key={d.date} className="flex gap-0.5 justify-center" style={{ width: `${100 / 7}%` }}>
                    {Array.from({ length: Math.min(d.symptoms, 5) }).map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-destructive" />
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Week table */}
          <Card>
            <CardContent className="py-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b">
                    <th className="text-left py-2">Dag</th>
                    <th className="text-right py-2">Måltider</th>
                    <th className="text-right py-2">Kcal</th>
                    <th className="text-right py-2">Symptom</th>
                  </tr>
                </thead>
                <tbody>
                  {weekData.map((d) => (
                    <tr key={d.date} className="border-b last:border-0">
                      <td className="py-2">{d.day}</td>
                      <td className="py-2 text-right">{d.meals}</td>
                      <td className="py-2 text-right">{d.calories}</td>
                      <td className="py-2 text-right">
                        {d.symptoms > 0 ? <Badge variant="destructive" className="text-[10px]">{d.symptoms}</Badge> : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
