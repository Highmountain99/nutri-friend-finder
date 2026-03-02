import { useAssignedPatients } from "@/hooks/dietitian/useAssignedPatients";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Patienter</h1>
        <p className="text-muted-foreground">{patients?.length ?? 0} tilldelade patienter</p>
      </div>

      {!patients?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Du har inga tilldelade patienter ännu.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {patients.map((p) => (
            <Link key={p.patient_id} to={`/dietitian/patients/${p.patient_id}`}>
              <Card className="hover:shadow-elevated transition-shadow cursor-pointer">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="h-10 w-10 rounded-full bg-primary-soft flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Patient {p.patient_id.slice(0, 8)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {p.intake_profile?.primary_concern_category && (
                        <Badge variant="secondary" className="text-xs">
                          {concernLabels[p.intake_profile.primary_concern_category] ?? p.intake_profile.primary_concern_category}
                        </Badge>
                      )}
                      {p.upcoming_appointment && (
                        <span className="text-xs text-muted-foreground">
                          Nästa tid: {format(new Date(p.upcoming_appointment.appointment_date), "d MMM", { locale: sv })}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
