import { useNavigate } from "react-router-dom";
import { getISOWeek } from "date-fns";

export function WeeklySummaryCard() {
  const navigate = useNavigate();
  const week = getISOWeek(new Date());

  return (
    <div className="rounded-card bg-primary p-5 text-[hsl(var(--card))]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-gold">
            Veckans sammanfattning
          </span>
          <span className="text-[12px] font-medium text-[hsl(var(--card))]/70">
            Vecka {week}
          </span>
        </div>
        <button
          onClick={() => navigate("/weekly-report")}
          className="rounded-pill border-[1.5px] border-[hsl(var(--card))]/40 px-3 py-[5px] text-[10.5px] font-bold text-[hsl(var(--card))]"
        >
          Visa veckan
        </button>
      </div>
    </div>
  );
}
