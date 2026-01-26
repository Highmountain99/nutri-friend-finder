import { Footprints, Flame, Watch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface HealthMetricsViewProps {
  isConnected: boolean;
  steps: number;
  activeEnergy: number;
  onConnect: () => void;
}

export function HealthMetricsView({ 
  isConnected, 
  steps, 
  activeEnergy, 
  onConnect 
}: HealthMetricsViewProps) {
  if (!isConnected) {
    return (
      <Card className="shadow-soft border-primary/20 bg-gradient-to-br from-primary-soft to-background h-full">
        <CardContent className="p-6 text-center space-y-4 flex flex-col items-center justify-center h-full">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Watch className="w-8 h-8 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Anslut Apple Health
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Synka steg och aktiv energi automatiskt från din Apple Watch eller iPhone.
            </p>
          </div>
          
          <Button onClick={onConnect} className="gap-2">
            <Watch className="w-4 h-4" />
            Anslut Apple Health
          </Button>
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    {
      icon: Footprints,
      label: "Steg",
      value: steps.toLocaleString("sv-SE"),
      unit: "steg",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Flame,
      label: "Aktiv energi",
      value: activeEnergy.toLocaleString("sv-SE"),
      unit: "kcal",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Watch className="w-4 h-4" />
        <span>Apple Health</span>
      </div>
      
      {metrics.map((metric) => (
        <Card key={metric.label} className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", metric.bgColor)}>
                <metric.icon className={cn("w-5 h-5", metric.color)} />
              </div>
              <div className="flex-1">
                <span className="text-sm text-muted-foreground">{metric.label}</span>
                <p className="text-lg font-semibold text-foreground">
                  {metric.value} <span className="text-sm font-normal text-muted-foreground">{metric.unit}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
