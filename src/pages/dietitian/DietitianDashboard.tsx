import { useAssignedPatients, getPatientDisplayName } from "@/hooks/dietitian/useAssignedPatients";
import { useDietitianSchedule } from "@/hooks/dietitian/useDietitianSchedule";
import { useDietitianProfile } from "@/hooks/dietitian/useDietitianProfile";
import { useUnreadMessages } from "@/hooks/dietitian/useUnreadMessages";
import { useDietitianNotifications } from "@/hooks/dietitian/useDietitianNotifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, CalendarDays, Clock, TrendingUp, Video, User, AlertTriangle, Bell, X } from "lucide-react";
import { Link } from "react-router-dom";
import { format, isToday, differenceInMinutes } from "date-fns";
import { sv } from "date-fns/locale";
import { useState } from "react";
import { VideoCallModal } from "@/components/dietitian/VideoCallModal";

const concernLabels: Record<string, string> = {
  weight_loss: "Viktnedgång",
  diabetes: "Diabetes",
  gut_health: "Maghälsa / IBS",
  general_health: "Allmän hälsa",
  womens_health: "Kvinnohälsa",
  emotional_eating: "Emotionellt ätande",
  eating_disorder: "Ätstörning",
  heart_health: "Hjärthälsa",
};

export default function DietitianDashboard() {
  const { data: patients } = useAssignedPatients();
  const { appointments } = useDietitianSchedule();
  const { data: profile } = useDietitianProfile();
  const { data: unread } = useUnreadMessages();
  const { notifications, markAsRead } = useDietitianNotifications();
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoAppointmentId, setVideoAppointmentId] = useState<string | null>(null);

  const now = new Date();
  const allAppointments = appointments.data ?? [];

  const todayAppointments = allAppointments
    .filter((a) => a.status === "booked" && isToday(new Date(a.appointment_date)))
    .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());

  const upcomingAll = allAppointments
    .filter((a) => a.status === "booked" && new Date(a.appointment_date) > now)
    .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());

  const nextAppointment = upcomingAll[0];

  // Occupancy calculation: booked vs available slots this week
  const totalPatients = patients?.length ?? 0;

  const greeting = () => {
    const h = now.getHours();
    if (h < 12) return "God morgon";
    if (h < 18) return "God eftermiddag";
    return "God kväll";
  };

  const canStartCall = (appointmentDate: string) => {
    const diff = differenceInMinutes(new Date(appointmentDate), now);
    return diff <= 5 && diff >= -60;
  };

  // Attention items: patients with no upcoming appointment or missed
  const attentionItems = (patients ?? []).filter((p) => {
    if (!p.intake_profile?.completed_at) return true;
    return false;
  });

  const missedAppointments = allAppointments.filter((a) => a.status === "missed");

  return (
    <div className="space-y-6 max-w-6xl">
      <VideoCallModal open={videoOpen} onOpenChange={(open) => { setVideoOpen(open); if (!open) setVideoAppointmentId(null); }} appointmentId={videoAppointmentId ?? undefined} isHost />

      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {greeting()}, {profile?.first_name ?? "Dietist"}
        </h1>
        <p className="text-muted-foreground">
          {format(now, "EEEE d MMMM yyyy", { locale: sv })}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Patienter idag</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAppointments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aktiva patienter</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPatients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Nästa besök</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {nextAppointment
                ? format(new Date(nextAppointment.appointment_date), "HH:mm", { locale: sv })
                : "—"}
            </div>
            {nextAppointment && (
              <p className="text-xs text-muted-foreground">
                {format(new Date(nextAppointment.appointment_date), "d MMM", { locale: sv })}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bokningar denna vecka</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAll.filter((a) => {
              const d = new Date(a.appointment_date);
              const weekEnd = new Date(now);
              weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()));
              return d <= weekEnd;
            }).length}</div>
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
              const name = patient ? getPatientDisplayName(patient) : `Patient ${n.patient_id.slice(0, 8)}`;
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

      {/* Today's schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dagens schema</CardTitle>
        </CardHeader>
        <CardContent>
          {todayAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Inga bokningar idag.</p>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((a) => {
                const time = format(new Date(a.appointment_date), "HH:mm");
                const isInitial = a.appointment_type === "initial" || a.appointment_type === "video";
                const patient = patients?.find((p) => p.patient_id === a.user_id);
                const concern = patient?.intake_profile?.primary_concern_category;

                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border border-border/50"
                  >
                    <div className="text-sm font-semibold text-foreground w-14 shrink-0">
                      {time}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {patient ? getPatientDisplayName(patient) : `Patient ${a.user_id?.slice(0, 8)}`}
                        </p>
                        <Badge
                          variant="secondary"
                          className={
                            isInitial
                              ? "bg-primary/10 text-primary border-0"
                              : "bg-blue-100 text-blue-700 border-0"
                          }
                        >
                          {isInitial ? "Nybesök" : "Uppföljning"}
                        </Badge>
                      </div>
                      {concern && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {concernLabels[concern] ?? concern}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {canStartCall(a.appointment_date) && (
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary/90"
                          onClick={() => { setVideoAppointmentId(a.id); setVideoOpen(true); }}
                        >
                          <Video className="h-4 w-4 mr-1" />
                          Starta videosamtal
                        </Button>
                      )}
                      <Link to={`/dietitian/patients/${a.user_id}`}>
                        <Button variant="outline" size="sm">
                          <User className="h-4 w-4 mr-1" />
                          Visa profil
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attention needed */}
      {(attentionItems.length > 0 || missedAppointments.length > 0) && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Kräver uppmärksamhet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {attentionItems.map((p) => (
              <div key={p.patient_id} className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{getPatientDisplayName(p)}</p>
                  <p className="text-xs text-muted-foreground">Ej slutfört kvalificering</p>
                </div>
                <Link to={`/dietitian/patients/${p.patient_id}`}>
                  <Button variant="outline" size="sm">Visa</Button>
                </Link>
              </div>
            ))}
            {missedAppointments.slice(0, 3).map((a) => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{patients?.find(p => p.patient_id === a.user_id) ? getPatientDisplayName(patients.find(p => p.patient_id === a.user_id)!) : `Patient ${a.user_id?.slice(0, 8)}`}</p>
                  <p className="text-xs text-muted-foreground">
                    Missat besök {format(new Date(a.appointment_date), "d MMM", { locale: sv })}
                  </p>
                </div>
                <Link to={`/dietitian/patients/${a.user_id}`}>
                  <Button variant="outline" size="sm">Visa</Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
