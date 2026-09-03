import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { useClientTrainingDays, WEEKDAY_LABELS } from "@/hooks/useTrainingDays";

interface Props {
  patientId: string;
}

export function TrainingDaysCard({ patientId }: Props) {
  const { data: days, isLoading, addDay, updateTime, removeDay } = useClientTrainingDays(patientId);

  const byWeekday = (w: number) => days?.find((d) => d.weekday === w);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Klientens träningspass</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Välj vilka dagar klienten tränar. Klienten ser sitt nästa pass på startsidan.
        </p>

        <div className="flex flex-wrap gap-2">
          {WEEKDAY_LABELS.map((label, w) => {
            const existing = byWeekday(w);
            return (
              <Button
                key={w}
                type="button"
                size="sm"
                variant={existing ? "default" : "outline"}
                disabled={isLoading || addDay.isPending || removeDay.isPending}
                onClick={() =>
                  existing
                    ? removeDay.mutate(existing.id)
                    : addDay.mutate({ weekday: w, startTime: "18:00" })
                }
              >
                {label}
              </Button>
            );
          })}
        </div>

        {days && days.length > 0 && (
          <div className="space-y-2">
            {days.map((d) => (
              <div key={d.id} className="flex items-center gap-3">
                <span className="w-16 text-sm">{WEEKDAY_LABELS[d.weekday]}</span>
                <Input
                  type="time"
                  className="w-32"
                  value={d.start_time ? d.start_time.slice(0, 5) : ""}
                  onChange={(e) => updateTime.mutate({ id: d.id, startTime: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Ta bort ${WEEKDAY_LABELS[d.weekday]}`}
                  onClick={() => removeDay.mutate(d.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
