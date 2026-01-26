import { Plus, Apple, Droplets, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const todayStats = [
  { icon: Apple, label: "Måltider", current: 2, goal: 4, unit: "st", color: "text-primary" },
  { icon: Droplets, label: "Vatten", current: 1.2, goal: 2, unit: "L", color: "text-blue-500" },
  { icon: Moon, label: "Sömn", current: 7, goal: 8, unit: "h", color: "text-purple-500" },
];

export default function Journal() {
  return (
    <div className="px-4 py-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Din journal</h1>
          <p className="text-sm text-muted-foreground">Håll koll på din dag</p>
        </div>
        <Button size="icon" className="rounded-full">
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Today's Stats */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Idag
        </h2>
        <div className="grid gap-3">
          {todayStats.map((stat) => {
            const percentage = (stat.current / stat.goal) * 100;
            return (
              <Card key={stat.label} className="shadow-soft">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-primary">
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{stat.label}</span>
                        <span className="text-sm text-muted-foreground">
                          {stat.current} / {stat.goal} {stat.unit}
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Quick Add */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Snabbloggning
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-auto py-4 flex-col gap-2">
            <Apple className="w-6 h-6 text-primary" />
            <span>Lägg till måltid</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2">
            <Droplets className="w-6 h-6 text-primary" />
            <span>Logga vatten</span>
          </Button>
        </div>
      </section>

      {/* Recent Entries Placeholder */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Senaste anteckningar
        </h2>
        <Card className="shadow-soft">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              Dina loggade måltider och anteckningar kommer visas här
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
