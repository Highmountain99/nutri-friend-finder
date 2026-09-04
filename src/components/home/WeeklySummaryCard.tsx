import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useWeeklyReport } from "@/hooks/useWeeklyReport";

const TONE: Record<string, string> = {
  terracotta: "hsl(var(--terracotta))",
  sage: "hsl(var(--sage))",
  gold: "hsl(var(--gold))",
};

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[16px] bg-[hsl(var(--card))]/[0.12] px-2 py-2.5 text-center">
      <div className="display text-[20px] leading-none" style={{ color: "hsl(var(--card))" }}>{value}</div>
      <div className="mt-1 text-[9.5px] font-semibold uppercase tracking-wide text-[hsl(var(--card))]/70 leading-tight">
        {label}
      </div>
    </div>
  );
}

export function WeeklySummaryCard() {
  const navigate = useNavigate();
  const [showWeek, setShowWeek] = useState(false);
  const { data } = useWeeklyReport();

  return (
    <div className="rounded-card bg-primary p-5 text-[hsl(var(--card))]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gold">
          {showWeek ? "Veckans sammanfattning" : "Dagens tanke"}
        </span>
        <button
          onClick={() => setShowWeek((v) => !v)}
          className="rounded-pill border-[1.5px] border-[hsl(var(--card))]/40 px-3 py-[5px] text-[10.5px] font-bold text-[hsl(var(--card))]"
        >
          {showWeek ? "Dagens tanke" : "Visa veckan"}
        </button>
      </div>

      {!showWeek ? (
        <p className="display mt-3 text-[22px] leading-[1.05]" style={{ color: "hsl(var(--card))" }}>
          Små steg varje dag leder till stora förändringar.
        </p>
      ) : (
        <>
          <h3 className="display mt-3 text-[22px] leading-[1.05]" style={{ color: "hsl(var(--card))" }}>
            EN STARK{" "}
            <span className="rounded-pill bg-gold px-2.5 pb-0.5" style={{ color: "hsl(var(--primary))" }}>VECKA</span>.
          </h3>

          <div className="mt-3.5 grid grid-cols-3 gap-2">
            <Stat value={`${data?.symptomFreeDays ?? 0}/7`} label="Symptomfria dagar" />
            <Stat
              value={
                data?.weightChange != null
                  ? `${data.weightChange > 0 ? "+" : "−"}${Math.abs(data.weightChange)
                      .toString()
                      .replace(".", ",")}`
                  : "–"
              }
              label="Kg denna vecka"
            />
            <Stat value={`${data?.loggedDays ?? 0}/7`} label="Loggade dagar" />
          </div>

          <div className="mt-3 flex flex-col gap-2">
            {(data?.patternInsights ?? []).slice(0, 2).map((i, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 rounded-[16px] bg-[hsl(var(--card))]/[0.12] px-3.5 py-2.5"
              >
                <span
                  className="mt-[6px] h-2 w-2 shrink-0 rounded-full"
                  style={{ background: TONE[i.tone] }}
                />
                <p className="text-[12.5px] leading-snug text-[hsl(var(--card))]">
                  <strong className="font-bold">{i.bold}</strong> {i.text}
                </p>
              </div>
            ))}
            <div className="flex items-center gap-2.5 rounded-[16px] bg-gold px-3.5 py-2.5 text-primary">
              <ArrowRight className="h-3.5 w-3.5 shrink-0" />
              <p className="text-[12.5px] font-semibold leading-snug">
                Nästa vecka: {data?.highlight ?? "fortsätt logga dina måltider"}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/weekly-report")}
            className="mt-3 w-full rounded-pill bg-[hsl(var(--card))] py-3 text-[13px] font-bold text-primary"
          >
            Öppna hela veckorapporten
          </button>
        </>
      )}
    </div>
  );
}
