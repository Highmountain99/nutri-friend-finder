import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClientTrainingDays, WEEKDAY_LABELS } from "@/hooks/useTrainingDays";

interface Props {
  patientId: string;
}

const PRESETS: { label: string; days: number[] }[] = [
  { label: "Mån + Ons", days: [1, 3] },
  { label: "Tis + Tors", days: [2, 4] },
  { label: "Mån/Ons/Fre", days: [1, 3, 5] },
  { label: "Helg", days: [6, 0] },
];

const WEEKS_SHOWN = 6;

function startOfWeekMonday(d: Date) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const diff = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - diff);
  return date;
}

export function TrainingDaysCard({ patientId }: Props) {
  const { data: days, isLoading, addDay, updateTime, removeDay } = useClientTrainingDays(patientId);
  const [defaultTime, setDefaultTime] = useState("18:00");

  const busy = isLoading || addDay.isPending || removeDay.isPending || updateTime.isPending;
  const byWeekday = (w: number) => days?.find((d) => d.weekday === w);
  const activeWeekdays = useMemo(() => new Set((days ?? []).map((d) => d.weekday)), [days]);

  const toggleWeekday = (w: number) => {
    const existing = byWeekday(w);
    if (existing) removeDay.mutate(existing.id);
    else addDay.mutate({ weekday: w, startTime: defaultTime });
  };

  const applyPreset = async (preset: number[]) => {
    const wanted = new Set(preset);
    for (const d of days ?? []) {
      if (!wanted.has(d.weekday)) await removeDay.mutateAsync(d.id);
    }
    for (const w of preset) {
      if (!activeWeekdays.has(w)) await addDay.mutateAsync({ weekday: w, startTime: defaultTime });
    }
  };

  const weeks = useMemo(() => {
    const start = startOfWeekMonday(new Date());
    return Array.from({ length: WEEKS_SHOWN }, (_, wi) =>
      Array.from({ length: 7 }, (_, di) => {
        const d = new Date(start);
        d.setDate(start.getDate() + wi * 7 + di);
        return d;
      })
    );
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm uppercase tracking-wide">Klientens träningspass</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Välj veckodagar – passen upprepas varje vecka. Klienten ser sitt nästa pass på startsidan.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <Button
              key={p.label}
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full"
              disabled={busy}
              onClick={() => applyPreset(p.days)}
            >
              {p.label}
            </Button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Tid</span>
            <Input
              type="time"
              className="w-28"
              value={defaultTime}
              onChange={(e) => {
                setDefaultTime(e.target.value);
                (days ?? []).forEach((d) =>
                  updateTime.mutate({ id: d.id, startTime: e.target.value })
                );
              }}
            />
          </div>
        </div>

        <div className="rounded-2xl border p-3">
          <div className="grid grid-cols-7 gap-1 pb-2">
            {[1, 2, 3, 4, 5, 6, 0].map((w) => (
              <button
                key={w}
                type="button"
                disabled={busy}
                onClick={() => toggleWeekday(w)}
                className={`rounded-full py-1 text-xs font-medium transition-colors ${
                  activeWeekdays.has(w)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {WEEKDAY_LABELS[w]}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1">
                {week.map((date) => {
                  const active = activeWeekdays.has(date.getDay());
                  const isPast = date < today;
                  return (
                    <button
                      key={date.toISOString()}
                      type="button"
                      disabled={busy}
                      onClick={() => toggleWeekday(date.getDay())}
                      className={`flex h-9 flex-col items-center justify-center rounded-xl text-xs transition-colors ${
                        active
                          ? "bg-primary/15 font-semibold text-primary"
                          : "text-muted-foreground hover:bg-muted"
                      } ${isPast ? "opacity-40" : ""}`}
                    >
                      <span>{date.getDate()}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {days && days.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {days
              .slice()
              .sort((a, b) => ((a.weekday + 6) % 7) - ((b.weekday + 6) % 7))
              .map((d) => `${WEEKDAY_LABELS[d.weekday]} ${d.start_time?.slice(0, 5) ?? ""}`.trim())
              .join(" · ")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
