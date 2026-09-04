import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CalendarClock, Check, Loader2 } from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
import { sv } from "date-fns/locale";
import { toast } from "sonner";
import { useWeeklyReport } from "@/hooks/useWeeklyReport";
import {
  useCoachWeeklyComment,
  useSaveWeeklyComment,
  weekDeadlines,
} from "@/hooks/useWeeklyReportComment";

interface Props {
  patientId: string;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/40 p-3">
      <div className="text-xl font-semibold leading-none">{value}</div>
      <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

export function WeeklySummaryReviewCard({ patientId }: Props) {
  const { data, isLoading } = useWeeklyReport(patientId);
  const weekStart = data?.weekStart;
  const { data: existing, isLoading: loadingComment } = useCoachWeeklyComment(patientId, weekStart);
  const save = useSaveWeeklyComment(patientId, weekStart);
  const [text, setText] = useState("");

  useEffect(() => {
    setText(existing?.comment ?? "");
  }, [existing?.id, existing?.comment]);

  const { deadline, publish } = weekStart
    ? weekDeadlines(weekStart)
    : { deadline: null, publish: null };
  const daysLeft = deadline ? differenceInCalendarDays(deadline, new Date()) : null;
  const overdue = daysLeft !== null && daysLeft < 0;
  const urgent = daysLeft !== null && daysLeft <= 1 && !overdue;

  const handleSave = async () => {
    if (!text.trim()) {
      toast.error("Skriv en kommentar innan du sparar.");
      return;
    }
    try {
      await save.mutateAsync(text.trim());
      toast.success("Kommentaren sparad");
    } catch {
      toast.error("Kunde inte spara kommentaren");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">
            Veckosammanfattning{data ? ` · Vecka ${data.weekNumber}` : ""}
          </CardTitle>
          {data && <Badge variant="secondary">{data.rangeLabel}</Badge>}
        </div>
        {deadline && publish && (
          <div
            className={`mt-2 flex items-start gap-2 rounded-lg border p-3 text-sm ${
              overdue || urgent
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "bg-muted/40 text-muted-foreground"
            }`}
          >
            {overdue || urgent ? (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <div>
              <p className="font-medium">
                Deadline {format(deadline, "EEEE d MMMM", { locale: sv })} kl 23:59
                {daysLeft !== null && !overdue && (
                  <> · {daysLeft === 0 ? "idag" : daysLeft === 1 ? "imorgon" : `om ${daysLeft} dagar`}</>
                )}
                {overdue && " · passerad"}
              </p>
              <p className="text-xs">
                Sammanfattningen publiceras för klienten{" "}
                {format(publish, "EEEE d MMMM", { locale: sv })} — dagen efter deadline.
              </p>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading || !data ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Kompletta dagar" value={`${data.completeDays}/7`} />
              <Stat label="Loggade måltider" value={`${data.mealsLogged}`} />
              <Stat label="Kostplan följd" value={`${data.planFollowedPct}%`} />
              <Stat label="Måltider/dag" value={data.mealsPerDay.toString().replace(".", ",")} />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border p-3 text-sm">
                <p className="font-medium">Energi & näring</p>
                <p className="text-muted-foreground">
                  {data.caloriesAvg} kcal/dag i snitt ({data.caloriesMin}–{data.caloriesMax})
                </p>
                <p className="text-muted-foreground">
                  Protein {data.macros.protein}% · Kolhydrater {data.macros.carbs}% · Fett{" "}
                  {data.macros.fat}%
                </p>
                <p className="text-muted-foreground">
                  Fiber {data.fiberAvg} g/dag (mål {data.fiberGoal} g)
                </p>
              </div>
              <div className="rounded-lg border p-3 text-sm">
                <p className="font-medium">Mönster & kvalitet</p>
                <ul className="mt-1 space-y-1 text-muted-foreground">
                  {data.patternInsights.map((i, idx) => (
                    <li key={idx}>
                      <span className="font-medium text-foreground">{i.bold}</span> {i.text}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-muted-foreground">{data.qualityNote}</p>
              </div>
            </div>

            {data.correlations.length > 0 && (
              <div className="rounded-lg border p-3 text-sm">
                <p className="font-medium">Identifierade samband</p>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-muted-foreground">
                  {data.correlations.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        <div className="space-y-2 border-t pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Din kommentar till klienten</p>
            {existing && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Check className="h-3 w-3" /> Sparad{" "}
                {format(new Date(existing.updated_at), "d MMM HH:mm", { locale: sv })}
              </span>
            )}
          </div>
          {loadingComment ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="Sammanfatta veckan för klienten — vad gick bra och vad fokuserar ni på nästa vecka?"
            />
          )}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={save.isPending || !weekStart}>
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Spara kommentar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
