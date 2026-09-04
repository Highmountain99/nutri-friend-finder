import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useWeeklyReport } from "@/hooks/useWeeklyReport";
import { useMyDietitian } from "@/hooks/useMyDietitian";
import { usePublishedWeeklyComment } from "@/hooks/useWeeklyReportComment";
import { getISOWeek } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const TONE: Record<string, string> = {
  sage: "hsl(var(--sage))",
  gold: "hsl(var(--gold))",
  apricot: "hsl(var(--apricot))",
  terracotta: "hsl(var(--terracotta))",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[12px] font-bold uppercase tracking-[0.06em] text-primary/60">{children}</h2>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-card bg-card p-[18px] ${className}`}>{children}</section>;
}

function DayDots({ label, days }: { label: string; days: boolean[] }) {
  const hit = days.filter(Boolean).length;
  return (
    <div className="flex items-center gap-2">
      <span className="w-[76px] shrink-0 text-[12.5px] font-semibold text-primary">{label}</span>
      <div className="flex flex-1 gap-1.5">
        {days.map((d, i) => (
          <span
            key={i}
            className="h-4 w-4 rounded-full"
            style={{ background: d ? "hsl(var(--sage))" : "hsl(var(--background))" }}
          />
        ))}
      </div>
      <span className="text-[12.5px] font-bold text-primary">{hit}/7</span>
    </div>
  );
}

export default function WeeklyReport() {
  const navigate = useNavigate();
  const { data, isLoading } = useWeeklyReport();
  const { data: coach } = useMyDietitian();
  const { data: published } = usePublishedWeeklyComment();
  const commentWeek = published ? getISOWeek(new Date(`${published.week_start}T00:00:00`)) : null;

  const coachName = coach ? `${coach.first_name} ${coach.last_name}` : null;
  const initials = coach ? `${coach.first_name?.[0] ?? ""}${coach.last_name?.[0] ?? ""}` : "GF";

  useLayoutEffect(() => {
    window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    return () => {
      window.history.scrollRestoration = "auto";
    };
  }, []);

  return (
    <div className="min-h-dvh bg-background pb-[110px] animate-fade-in">
      {/* Header */}
      <header className="rounded-b-[28px] bg-primary px-5 pb-[22px] pt-[calc(env(safe-area-inset-top)+48px)] text-card">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate("/home")}
            aria-label="Tillbaka"
            className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-card/15"
          >
            <ArrowLeft className="h-4 w-4 text-card" />
          </button>
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gold">Veckorapport</p>
            <h1 className="display text-[28px] leading-none" style={{ color: "hsl(var(--card))" }}>
              Vecka {data?.weekNumber ?? ""}
            </h1>
          </div>
          <span className="pt-5 text-[12px] font-semibold text-card/70">{data?.rangeLabel}</span>
        </div>
      </header>

      <div className="flex flex-col gap-3.5 px-5 pt-5">
        {isLoading || !data ? (
          <>
            <Skeleton className="h-64 w-full rounded-card" />
            <Skeleton className="h-56 w-full rounded-card" />
          </>
        ) : (
          <>
            {/* Kort 1 */}
            <Card>
              <SectionLabel>Veckan i korthet</SectionLabel>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <div className="rounded-[16px] bg-background p-3">
                  <div className="display text-[26px] leading-none text-primary">
                    {data.completeDays}
                    <span className="text-[14px]">/7</span>
                  </div>
                  <p className="mt-1 text-[10.5px] font-semibold uppercase text-primary/60">Kompletta dagar</p>
                </div>
                <div className="rounded-[16px] bg-background p-3">
                  <div className="display text-[26px] leading-none text-primary">{data.mealsLogged}</div>
                  <p className="mt-1 text-[10.5px] font-semibold uppercase text-primary/60">Loggade måltider</p>
                </div>
                <div className="rounded-[16px] bg-background p-3">
                  <div className="display text-[26px] leading-none text-primary">
                    {data.planFollowedPct}
                    <span className="text-[14px]">%</span>
                  </div>
                  <p className="mt-1 text-[10.5px] font-semibold uppercase text-primary/60">Av kostplanen följd</p>
                </div>
                <div className="rounded-[16px] bg-sage p-3">
                  <p className="text-[13px] font-bold leading-snug text-primary">{data.highlight}</p>
                  <p className="mt-1 text-[10.5px] font-semibold uppercase text-primary/60">Veckans framsteg</p>
                </div>
              </div>

              <div className="mt-3 flex items-start gap-3 rounded-[18px] bg-background p-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage text-[12px] font-bold text-primary">
                  {initials.toUpperCase()}
                </div>
                <div>
                  <p className="text-[13px] italic leading-snug text-primary">
                    {published
                      ? published.comment
                      : coachName
                        ? `${coach?.first_name} lämnar en kommentar här när veckan publiceras på måndagen.`
                        : "Din kostrådgivare lämnar en kommentar här när veckan publiceras på måndagen."}
                  </p>
                  <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-primary/50">
                    {published
                      ? `${coachName ?? "Kostrådgivare"} · vecka ${commentWeek}`
                      : "Väntar på kommentar"}
                  </p>
                </div>

              </div>
            </Card>

            {/* Kort 2 */}
            <Card>
              <SectionLabel>Energi & näring</SectionLabel>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="display text-[34px] leading-none text-primary">
                  {data.caloriesAvg.toLocaleString("sv-SE")}
                </span>
                <span className="text-[13px] font-semibold text-primary/70">
                  kcal/dag i snitt · intervall {data.caloriesMin.toLocaleString("sv-SE")}–
                  {data.caloriesMax.toLocaleString("sv-SE")}
                </span>
              </div>

              <div className="mt-3 flex h-3.5 w-full overflow-hidden rounded-pill bg-background">
                <div style={{ width: `${data.macros.protein}%`, background: TONE.sage }} />
                <div style={{ width: `${data.macros.carbs}%`, background: TONE.gold }} />
                <div style={{ width: `${data.macros.fat}%`, background: TONE.apricot }} />
              </div>
              <div className="mt-2 flex gap-4">
                {[
                  ["Protein", data.macros.protein, TONE.sage],
                  ["Kolhydrater", data.macros.carbs, TONE.gold],
                  ["Fett", data.macros.fat, TONE.apricot],
                ].map(([label, val, color]) => (
                  <span key={label as string} className="flex items-center gap-1.5 text-[11.5px] font-semibold text-primary">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: color as string }} />
                    {label} {val}%
                  </span>
                ))}
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-[12.5px] font-semibold text-primary">Fiber</span>
                <span className="text-[12px] font-semibold text-primary/70">
                  {data.fiberAvg} g/dag · mål {data.fiberGoal} g
                </span>
              </div>
              <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-pill bg-background">
                <div
                  className="h-full rounded-pill"
                  style={{
                    width: `${Math.min(100, (data.fiberAvg / data.fiberGoal) * 100)}%`,
                    background: TONE.sage,
                  }}
                />
              </div>

              <p className="mt-4 text-[12px] font-bold uppercase tracking-[0.06em] text-primary/60">
                Dagar inom ditt mål
              </p>
              <div className="mt-2 flex flex-col gap-2">
                <DayDots label="Energi" days={data.daysInGoal.energy} />
                <DayDots label="Protein" days={data.daysInGoal.protein} />
                <DayDots label="Fiber" days={data.daysInGoal.fiber} />
              </div>
              <p className="mt-3 text-[11px] text-primary/50">
                Intervall och trender — enskilda dagar bedöms inte.
              </p>
            </Card>

            {/* Kort 3 */}
            <Card>
              <SectionLabel>Måltidsmönster</SectionLabel>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="display text-[34px] leading-none text-primary">
                  {data.mealsPerDay.toString().replace(".", ",")}
                </span>
                <span className="text-[13px] font-semibold text-primary/70">måltider/dag i snitt</span>
              </div>

              <div className="mt-3 flex justify-between text-[10.5px] font-semibold uppercase text-primary/60">
                {["06", "10", "14", "18", "22"].map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
              <div className="relative mt-1 h-[26px] w-full rounded-pill bg-background">
                {data.mealPoints.map((p, i) => (
                  <span
                    key={i}
                    className="absolute top-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      left: `${p.pct}%`,
                      width: p.size,
                      height: p.size,
                      background: TONE[p.tone],
                    }}
                  />
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-primary/50">
                Måltidernas fördelning över dagen · större punkt = fler måltider
              </p>

              <div className="mt-3 flex flex-col gap-2">
                {data.patternInsights.map((i, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 rounded-[16px] bg-background px-3.5 py-2.5">
                    <span
                      className="mt-[6px] h-2 w-2 shrink-0 rounded-full"
                      style={{ background: TONE[i.tone] }}
                    />
                    <p className="text-[12.5px] leading-snug text-primary">
                      <strong className="font-bold">{i.bold}</strong> {i.text}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Kort 4 */}
            <Card>
              <SectionLabel>Matkvalitet & variation</SectionLabel>
              <div className="mt-3 flex flex-col gap-3">
                {data.quality.map((q) => (
                  <div key={q.label} className="flex items-center gap-3">
                    <span className="flex-1 text-[12.5px] font-semibold text-primary">{q.label}</span>
                    <span className="h-2.5 w-[110px] shrink-0 overflow-hidden rounded-pill bg-background">
                      <span
                        className="block h-full rounded-pill"
                        style={{ width: `${q.pct}%`, background: TONE[q.tone] }}
                      />
                    </span>
                    <span className="w-16 shrink-0 text-right text-[12px] font-bold text-primary">
                      {q.value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3.5 rounded-[16px] bg-gold px-3.5 py-3">
                <p className="text-[12.5px] leading-snug text-primary">
                  <strong className="font-bold">Att uppmärksamma:</strong> {data.qualityNote}
                </p>
              </div>
            </Card>

            {/* Kort 5 */}
            <Card>
              <SectionLabel>Hunger, mättnad & sug</SectionLabel>
              {data.hasWellbeingData && data.scales.length ? (
                <div className="mt-3 flex flex-col gap-3">
                  {data.scales.map((s) => (
                    <div key={s.label}>
                      <div className="flex items-baseline justify-between">
                        <span className="text-[12.5px] font-semibold text-primary">{s.label}</span>
                        <span className="text-[12px] font-semibold text-primary/60">{s.value}</span>
                      </div>
                      <div className="mt-1.5 flex gap-1">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <span
                            key={i}
                            className="h-2 flex-1 rounded-pill"
                            style={{
                              background: i < s.level ? TONE.sage : "hsl(var(--background))",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-[12.5px] leading-snug text-primary/60">
                  Här visas hunger, mättnad och sug när du börjar logga hur du mår i samband med måltiderna.
                </p>
              )}

              {data.cravingNote && (
                <div className="mt-3 flex items-start gap-2.5 rounded-[16px] bg-background px-3.5 py-2.5">
                  <span
                    className="mt-[6px] h-2 w-2 shrink-0 rounded-full"
                    style={{ background: TONE.apricot }}
                  />
                  <p className="text-[12.5px] leading-snug text-primary">{data.cravingNote}</p>
                </div>
              )}
            </Card>

            {/* Kort 6 */}
            <section className="rounded-card bg-sage p-[18px]">
              <SectionLabel>Identifierade samband</SectionLabel>
              <div className="mt-3 flex flex-col gap-2.5">
                {data.correlations.map((c, i) => (
                  <p key={i} className="rounded-[16px] bg-card px-3.5 py-3 text-[13px] leading-snug text-primary">
                    "{c}"
                  </p>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
