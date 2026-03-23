import { Card } from "@/components/ui/card";
import { Check, Circle, TrendingDown, TrendingUp, Minus } from "lucide-react";
import * as Icons from "lucide-react";
import { ComputedBlockData } from "@/hooks/usePatientBlocks";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Area, AreaChart } from "recharts";

function getIcon(iconName: string) {
  const Icon = (Icons as any)[iconName];
  return Icon ? <Icon className="h-4 w-4" /> : <Icons.Square className="h-4 w-4" />;
}

interface DynamicBlockProps {
  data: ComputedBlockData;
}

export function DynamicBlock({ data }: DynamicBlockProps) {
  const { block, computedItems, computedValue, computedTotal, chartData, chartMeta } = data;
  const template = block.template;
  const title = block.override_title || template.title;

  // ── Chart block (trend graph) ──
  if (chartData && chartData.length > 0 && chartMeta) {
    const latest = chartData[chartData.length - 1].value;
    const first = chartData[0].value;
    const diff = latest - first;
    const isDown = diff < 0;
    const isFlat = Math.abs(diff) < 0.1;

    return (
      <Card className="p-4 border-border/40 overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/8 text-primary">
              {getIcon(template.icon)}
            </div>
            <h4 className="text-sm font-semibold">{title}</h4>
          </div>
          <div className="flex items-center gap-1.5 text-right">
            <span className="text-lg font-bold tabular-nums">{latest.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">{chartMeta.unit}</span>
          </div>
        </div>

        <div className="h-[100px] w-full -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`grad-${block.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
              <Tooltip
                contentStyle={{
                  fontSize: 11,
                  borderRadius: 10,
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--background))",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
                formatter={(v: number) => [`${v} ${chartMeta.unit}`, ""]}
                labelStyle={{ fontSize: 10, color: "hsl(var(--muted-foreground))" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill={`url(#grad-${block.id})`}
                dot={false}
                activeDot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--background))" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {chartData.length > 7 ? "Senaste 30 dagarna" : `${chartData.length} mätningar`}
          </span>
          {!isFlat && (
            <div className="flex items-center gap-1">
              {isDown ? (
                <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
              )}
              <span className={`text-xs font-semibold tabular-nums ${isDown ? "text-emerald-600" : "text-amber-600"}`}>
                {diff > 0 ? "+" : ""}{diff.toFixed(1)} {chartMeta.unit}
              </span>
            </div>
          )}
          {isFlat && (
            <div className="flex items-center gap-1">
              <Minus className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Stabil</span>
            </div>
          )}
        </div>
      </Card>
    );
  }

  // ── Checklist block (meal rhythm etc.) ──
  if (computedItems.length > 0) {
    const doneCount = computedItems.filter(i => i.done).length;
    const total = computedItems.length;
    const pct = (doneCount / total) * 100;

    return (
      <Card className="p-4 border-border/40">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/8 text-primary">
              {getIcon(template.icon)}
            </div>
            <h4 className="text-sm font-semibold">{title}</h4>
          </div>
          <span className="text-xs font-medium text-muted-foreground">{doneCount}/{total}</span>
        </div>

        {/* Visual progress ring / bar */}
        <div className="w-full bg-muted/50 rounded-full h-2 mb-3">
          <div
            className="bg-primary rounded-full h-2 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {computedItems.map((item) => (
            <div
              key={item.key}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-2 transition-colors ${
                item.done
                  ? "bg-emerald-50 dark:bg-emerald-950/20"
                  : "bg-muted/30"
              }`}
            >
              {item.done ? (
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/25 shrink-0" />
              )}
              <span className={`text-xs font-medium ${item.done ? "text-foreground" : "text-muted-foreground/60"}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  // ── Progress bar block (regularity etc.) ──
  if (computedValue !== null && computedTotal !== null) {
    const pct = Math.min((computedValue / computedTotal) * 100, 100);

    return (
      <Card className="p-4 border-border/40">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/8 text-primary">
              {getIcon(template.icon)}
            </div>
            <h4 className="text-sm font-semibold">{title}</h4>
          </div>
        </div>

        <div className="flex items-end gap-1 mb-2">
          <span className="text-3xl font-bold tabular-nums text-primary">{computedValue}</span>
          <span className="text-sm text-muted-foreground mb-1">/ {computedTotal}</span>
        </div>

        <div className="w-full bg-muted/50 rounded-full h-2.5">
          <div
            className="bg-primary rounded-full h-2.5 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </Card>
    );
  }

  // ── Simple label / manual block ──
  return (
    <Card className="p-4 border-border/40">
      <div className="flex items-center gap-2 mb-1">
        <div className="p-1.5 rounded-lg bg-primary/8 text-primary">
          {getIcon(template.icon)}
        </div>
        <h4 className="text-sm font-semibold">{title}</h4>
      </div>
      {data.computedLabel && (
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{data.computedLabel}</p>
      )}
    </Card>
  );
}
