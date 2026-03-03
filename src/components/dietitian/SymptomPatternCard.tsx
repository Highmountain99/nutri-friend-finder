import { useMemo } from "react";
import { usePatientJournal } from "@/hooks/dietitian/usePatientJournal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { subDays, isAfter } from "date-fns";

interface Props {
  patientId: string;
  onNavigate?: () => void;
}

export function SymptomPatternCard({ patientId, onNavigate }: Props) {
  const { symptoms } = usePatientJournal(patientId);

  const analysis = useMemo(() => {
    const all = symptoms.data ?? [];
    if (all.length === 0) return null;

    const now = new Date();
    const d30 = subDays(now, 30);
    const d60 = subDays(now, 60);

    const recent = all.filter((s) => isAfter(new Date(s.entry_date), d30));
    const previous = all.filter((s) => {
      const d = new Date(s.entry_date);
      return isAfter(d, d60) && !isAfter(d, d30);
    });

    // Count by description keyword
    const countByType = (items: typeof all) => {
      const counts: Record<string, number> = {};
      items.forEach((s) => {
        const key = s.description.toLowerCase().split(/[,.\s]/)[0];
        counts[key] = (counts[key] || 0) + 1;
      });
      return counts;
    };

    const recentCounts = countByType(recent);
    const prevCounts = countByType(previous);

    const top3 = Object.entries(recentCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type, count]) => {
        const prevCount = prevCounts[type] ?? 0;
        let trend: "up" | "down" | "stable" = "stable";
        if (count > prevCount * 1.2) trend = "up";
        else if (count < prevCount * 0.8) trend = "down";
        return { type: type.charAt(0).toUpperCase() + type.slice(1), count, trend };
      });

    return { total: recent.length, top3 };
  }, [symptoms.data]);

  if (!analysis || analysis.top3.length === 0) return null;

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === "up") return <TrendingUp className="h-3 w-3 text-destructive" />;
    if (trend === "down") return <TrendingDown className="h-3 w-3 text-primary" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Symptommönster</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground">{analysis.total} symptom senaste 30 dagarna</p>
        {analysis.top3.map((item) => (
          <div key={item.type} className="flex items-center justify-between">
            <span className="text-sm">{item.type}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{item.count}x</span>
              <TrendIcon trend={item.trend} />
            </div>
          </div>
        ))}
        {onNavigate && (
          <button onClick={onNavigate} className="text-xs text-primary hover:underline mt-2 block">
            Visa fullständig analys →
          </button>
        )}
      </CardContent>
    </Card>
  );
}
