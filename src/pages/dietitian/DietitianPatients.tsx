import { useAssignedPatients, getPatientDisplayName } from "@/hooks/dietitian/useAssignedPatients";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, User, ArrowRight, Search, LayoutGrid, List } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { useState } from "react";

const concernLabels: Record<string, string> = {
  weight_loss: "Viktnedgång",
  diabetes: "Diabetes",
  gut_health: "Maghälsa",
  general_health: "Allmän hälsa",
  womens_health: "Kvinnohälsa",
  emotional_eating: "Emotionellt ätande",
  eating_disorder: "Ätstörning",
  heart_health: "Hjärthälsa",
};

export default function DietitianPatients() {
  const { data: patients, isLoading } = useAssignedPatients();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const filtered = (patients ?? []).filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const concern = p.intake_profile?.primary_concern_category ?? "";
    const name = getPatientDisplayName(p).toLowerCase();
    return (
      name.includes(q) ||
      p.patient_id.toLowerCase().includes(q) ||
      (concernLabels[concern] ?? concern).toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patienter</h1>
          <p className="text-muted-foreground">{patients?.length ?? 0} tilldelade patienter</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Sök patient eller fokusområde..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {!filtered.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {search ? "Inga patienter matchar din sökning." : "Du har inga tilldelade patienter ännu."}
          </CardContent>
        </Card>
      ) : viewMode === "list" ? (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left text-xs font-medium text-muted-foreground p-3">Patient</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-3">Fokusområde</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">Nästa besök</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">Senaste kontakt</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const concern = p.intake_profile?.unified_concern_category || p.intake_profile?.primary_concern_category;
                return (
                  <tr key={p.patient_id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">{getPatientDisplayName(p)}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      {concern && (
                        <Badge variant="secondary" className="text-xs">
                          {concernLabels[concern] ?? concern}
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 hidden md:table-cell text-sm text-muted-foreground">
                      {p.upcoming_appointment
                        ? format(new Date(p.upcoming_appointment.appointment_date), "d MMM HH:mm", { locale: sv })
                        : "—"}
                    </td>
                    <td className="p-3 hidden lg:table-cell text-sm text-muted-foreground">
                      {p.latest_meal
                        ? format(new Date(p.latest_meal.entry_date), "d MMM", { locale: sv })
                        : "—"}
                    </td>
                    <td className="p-3 text-right">
                      <Link to={`/dietitian/patients/${p.patient_id}`}>
                        <Button variant="ghost" size="sm">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const concern = p.intake_profile?.unified_concern_category || p.intake_profile?.primary_concern_category;
            return (
              <Link key={p.patient_id} to={`/dietitian/patients/${p.patient_id}`}>
                <Card className="hover:shadow-elevated transition-shadow cursor-pointer h-full">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <p className="text-sm font-medium">{getPatientDisplayName(p)}</p>
                    </div>
                    {concern && (
                      <Badge variant="secondary" className="text-xs">
                        {concernLabels[concern] ?? concern}
                      </Badge>
                    )}
                    {p.upcoming_appointment && (
                      <p className="text-xs text-muted-foreground">
                        Nästa: {format(new Date(p.upcoming_appointment.appointment_date), "d MMM HH:mm", { locale: sv })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
