import { useAssignedPatients, getPatientDisplayName } from "@/hooks/dietitian/useAssignedPatients";
import { useDietitianProfile } from "@/hooks/dietitian/useDietitianProfile";
import { useUnreadMessages } from "@/hooks/dietitian/useUnreadMessages";
import { useDietitianNotifications } from "@/hooks/dietitian/useDietitianNotifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, MessageSquare, Bell, User, X } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

const concernLabels: Record<string, string> = {
  weight_loss: "Viktnedgång",
  diabetes: "Diabetes",
  gut_health: "Maghälsa / IBS",
  general_health: "Allmän hälsa",
  womens_health: "Kvinnohälsa",
  emotional_eating: "Emotionellt ätande",
  eating_disorder: "Ätstörning",
  heart_health: "Hjärthälsa",
  healthy_habits: "Hälsosamma vanor",
  energy_focus: "Energi & ork",
  pregnancy: "Graviditet",
  sports_nutrition: "Idrottsnutrition",
  other: "Övrigt",
};

export default function DietitianDashboard() {
  const { data: patients } = useAssignedPatients();
  const { data: profile } = useDietitianProfile();
  const { data: unread } = useUnreadMessages();
  const { notifications, markAsRead } = useDietitianNotifications();

  const now = new Date();
  const totalPatients = patients?.length ?? 0;

  const greeting = () => {
    const h = now.getHours();
    if (h < 12) return "God morgon";
    if (h < 18) return "God eftermiddag";
    return "God kväll";
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {greeting()}, {profile?.first_name ?? "Coach"}
        </h1>
        <p className="text-muted-foreground">
          {format(now, "EEEE d MMMM yyyy", { locale: sv })}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aktiva klienter</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPatients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Olästa meddelanden</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unread?.total ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Notiser</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.data?.length ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      {notifications.data && notifications.data.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="h-4 w-4 text-orange-500" />
              Notiser ({notifications.data.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {notifications.data.map((n) => {
              const patient = patients?.find((p) => p.patient_id === n.patient_id);
              const name = patient ? getPatientDisplayName(patient) : `Klient ${n.patient_id.slice(0, 8)}`;
              return (
                <div key={n.id} className="flex items-start justify-between gap-3 p-3 bg-background rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{format(new Date(n.created_at), "d MMM HH:mm", { locale: sv })}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7" onClick={() => markAsRead.mutate(n.id)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Clients */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dina klienter</CardTitle>
        </CardHeader>
        <CardContent>
          {totalPatients === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Du har inga klienter ännu. Bjud in dem från Klienter-sidan.
            </p>
          ) : (
            <div className="space-y-3">
              {(patients ?? []).slice(0, 8).map((p) => {
                const concern = p.intake_profile?.primary_concern_category;
                return (
                  <div
                    key={p.patient_id}
                    className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border border-border/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{getPatientDisplayName(p)}</p>
                      {concern && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {concernLabels[concern] ?? concern}
                        </p>
                      )}
                    </div>
                    <Link to={`/dietitian/patients/${p.patient_id}`}>
                      <Button variant="outline" size="sm">
                        <User className="h-4 w-4 mr-1" />
                        Visa profil
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
