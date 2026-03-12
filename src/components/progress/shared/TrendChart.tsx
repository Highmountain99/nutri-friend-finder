import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip } from "recharts";
import { format, parseISO } from "date-fns";
import { sv } from "date-fns/locale";

interface DataPoint {
  date: string;
  value: number;
}

interface TrendChartProps {
  title: string;
  data: DataPoint[];
  unit?: string;
  targetValue?: number;
  targetLabel?: string;
  color?: string;
  minValue?: number;
  maxValue?: number;
}

export function TrendChart({
  title,
  data,
  unit = '',
  targetValue,
  targetLabel,
  color = 'hsl(var(--primary))',
  minValue,
  maxValue,
}: TrendChartProps) {
  const formattedData = data.map(d => ({
    ...d,
    dateLabel: format(parseISO(d.date), 'd MMM', { locale: sv }),
  }));

  const values = data.map(d => d.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  
  const yMin = minValue ?? Math.floor(dataMin * 0.95);
  const yMax = maxValue ?? Math.ceil(dataMax * 1.05);

  if (data.length === 0) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">{title}</h3>
          <div className="h-36 flex items-center justify-center text-muted-foreground text-sm rounded-xl bg-muted/30">
            Ingen data ännu – börja logga för att se trender
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-5">
        <h3 className="text-base font-semibold text-foreground mb-4">{title}</h3>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData} margin={{ top: 5, right: 10, bottom: 5, left: -15 }}>
              <XAxis 
                dataKey="dateLabel" 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                dy={8}
              />
              <YAxis 
                domain={[yMin, yMax]}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '13px',
                  padding: '8px 12px',
                  boxShadow: '0 4px 12px hsl(var(--foreground) / 0.08)',
                }}
                formatter={(value: number) => [`${value} ${unit}`, '']}
                labelFormatter={(label) => label}
              />
              {targetValue && (
                <ReferenceLine 
                  y={targetValue} 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeDasharray="6 4"
                  strokeOpacity={0.5}
                  label={{ 
                    value: targetLabel || `Mål: ${targetValue}`, 
                    position: 'right',
                    fontSize: 10,
                    fill: 'hsl(var(--muted-foreground))',
                  }}
                />
              )}
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2.5}
                dot={{ fill: color, strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: color, stroke: 'hsl(var(--card))', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
