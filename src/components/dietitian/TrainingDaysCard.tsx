import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useClientTrainingDays, WEEKDAY_LABELS } from "@/hooks/useTrainingDays";

interface Props {
  patientId: string;
}

const MONTHS = [
  "januari",
  "februari",
  "mars",
  "april",
  "maj",
  "juni",
  "juli",
  "augusti",
  "september",
  "oktober",
  "november",
  "december",
];

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // mån..sön

function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function startOfWeekMonday(d: Date) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return date;
}

function isoWeek(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function TrainingDaysCard({ patientId }: Props) {
  const { data: days, isLoading, addDay, updateTime, removeDay } = useClientTrainingDays(patientId);
  const [defaultTime, setDefaultTime] = useState("18:00");
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const busy = isLoading || addDay.isPending || removeDay.isPending;

  const byDate = useMemo(() => {
    const map = new Map<string, string>(); // dateKey -> row id
    (days ?? []).forEach((d) => {
      if (d.session_date) map.set(d.session_date, d.id);
    });
    return map;
  }, [days]);

  const recurringWeekdays = useMemo(
    () => new Set((days ?? []).filter((d) => !d.session_date).map((d) => d.weekday)),
    [days]
  );

  const weeks = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = startOfWeekMonday(first);
    const rows: Date[][] = [];
    const cur = new Date(start);
    while (rows.length < 6) {
      const row = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(cur);
        d.setDate(cur.getDate() + i);
        return d;
      });
      rows.push(row);
      cur.setDate(cur.getDate() + 7);
      if (cur.getMonth() !== cursor.getMonth() && cur > first) break;
    }
    return rows;
  }, [cursor]);

  const monthDatesForWeekday = (weekday: number) => {
    const res: Date[] = [];
    const d = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    while (d.getMonth() === cursor.getMonth()) {
      if (d.getDay() === weekday) res.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return res;
  };

  const toggleDate = async (date: Date) => {
    const key = toKey(date);
    const existing = byDate.get(key);
    if (existing) await removeDay.mutateAsync(existing);
    else
      await addDay.mutateAsync({
        weekday: date.getDay(),
        startTime: defaultTime,
        sessionDate: key,
      });
  };

  const toggleWeekdayInMonth = async (weekday: number) => {
    const dates = monthDatesForWeekday(weekday);
    const allSelected = dates.every((d) => byDate.has(toKey(d)));
    for (const d of dates) {
      const key = toKey(d);
      const existing = byDate.get(key);
      if (allSelected) {
        if (existing) await removeDay.mutateAsync(existing);
      } else if (!existing) {
        await addDay.mutateAsync({ weekday, startTime: defaultTime, sessionDate: key });
      }
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedCount = byDate.size;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm uppercase tracking-wide">Klientens träningspass</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Klicka på en dag för att lägga till ett pass, eller på en veckodag högst upp för att välja
          alla den veckodagen i månaden.
        </p>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Föregående månad"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[9rem] text-center text-sm font-semibold capitalize">
              {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Nästa månad"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
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
          <div className="grid grid-cols-[2.2rem_repeat(7,1fr)] gap-1 pb-1">
            <span className="text-center text-[10px] uppercase text-muted-foreground">v.</span>
            {WEEK_ORDER.map((w) => (
              <button
                key={w}
                type="button"
                disabled={busy}
                onClick={() => toggleWeekdayInMonth(w)}
                className={`rounded-full py-1 text-xs font-medium transition-colors hover:bg-muted ${
                  recurringWeekdays.has(w) ? "text-primary" : "text-muted-foreground"
                }`}
                title={`Välj alla ${WEEKDAY_LABELS[w]} i ${MONTHS[cursor.getMonth()]}`}
              >
                {WEEKDAY_LABELS[w]}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-[2.2rem_repeat(7,1fr)] items-center gap-1">
                <span className="text-center text-[10px] text-muted-foreground">
                  {isoWeek(week[0])}
                </span>
                {week.map((date) => {
                  const key = toKey(date);
                  const selected = byDate.has(key) || recurringWeekdays.has(date.getDay());
                  const inMonth = date.getMonth() === cursor.getMonth();
                  const isToday = date.getTime() === today.getTime();
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={busy}
                      onClick={() => toggleDate(date)}
                      className={`flex h-9 items-center justify-center rounded-xl text-xs transition-colors ${
                        selected
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "hover:bg-muted"
                      } ${inMonth ? "" : "opacity-35"} ${
                        isToday && !selected ? "ring-1 ring-primary/50" : ""
                      }`}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {selectedCount > 0
            ? `${selectedCount} inplanerade pass${defaultTime ? ` · ${defaultTime}` : ""}`
            : "Inga pass inlagda ännu."}
        </p>
      </CardContent>
    </Card>
  );
}
