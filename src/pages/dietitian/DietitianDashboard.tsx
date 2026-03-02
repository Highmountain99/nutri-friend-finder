import { useAssignedPatients } from "@/hooks/dietitian/useAssignedPatients";
import { useDietitianSchedule } from "@/hooks/dietitian/useDietitianSchedule";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarDays, MessageSquare, UtensilsCrossed } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

export default function DietitianDashboard() {
  const { data: patients, isLoading: patientsLoading } = useAssignedPatients();
  const { appointments } = useDietitianSchedule();

  const upcomingAppointments = appointments.data?.filter(
    (a) => a.status === "booked" && new Date(a.appointment_date) > new Date()
  ) ?? [];

  const stats = [
    { label: "Patienter", value: patients?.length ?? 0, icon: Users, href: "/dietitian/patients" },
    { label: "Kommande bokningar", value: upcomingAppointments.length, icon: CalendarDays, href: "/dietitian/schedule" },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Välkommen tillbaka</h1>
        <p className="text-muted-foreground">Här är en översikt av din verksamhet.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.href}>
            <Card className="hover:shadow-elevated transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{s.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {upcomingAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nästa bokningar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingAppointments.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Patient</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(a.appointment_date), "EEEE d MMMM, HH:mm", { locale: sv })}
                  </p>
                </div>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{a.appointment_type}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
