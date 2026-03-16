import { useNavigate } from "react-router-dom";
import { MessageCircle, User, Settings, CalendarPlus } from "lucide-react";
import { AppointmentCard } from "@/components/home/AppointmentCard";
import { QuickActionCard } from "@/components/home/QuickActionCard";
import { useAppointments } from "@/hooks/useAppointments";
import { useMyDietitian } from "@/hooks/useMyDietitian";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Home() {
  const navigate = useNavigate();
  const { getUpcomingAppointment, cancelAppointment, loading } = useAppointments();
  const { data: dietitian, isLoading: dietitianLoading } = useMyDietitian();

  const upcomingAppointment = getUpcomingAppointment();

  const formattedAppointment = upcomingAppointment
    ? {
        date: upcomingAppointment.appointmentDate,
        dietitianName: upcomingAppointment.dietitian
          ? `${upcomingAppointment.dietitian.firstName} ${upcomingAppointment.dietitian.lastName}`
          : "Din dietist",
        dietitianTitle: upcomingAppointment.dietitian?.title || "Legitimerad dietist",
        dietitianImage: upcomingAppointment.dietitian?.avatarUrl || undefined,
      }
    : undefined;

  const handleCancel = async () => {
    if (upcomingAppointment) {
      await cancelAppointment(upcomingAppointment.id);
    }
  };

  return (
    <div className="px-4 py-6 space-y-6 animate-fade-in">
      {/* Dietitian Card */}
      {dietitianLoading ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : dietitian ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarImage src={dietitian.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {dietitian.first_name?.[0]}{dietitian.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {dietitian.first_name} {dietitian.last_name}
                </p>
                <p className="text-xs text-muted-foreground">{dietitian.title}</p>
                <p className="text-xs text-primary font-medium mt-0.5">Din dietist</p>
              </div>
              <Button
                size="sm"
                onClick={() => navigate("/booking", { state: { mode: "new", preselectedDietitian: dietitian } })}
                className="gap-1.5 shrink-0"
              >
                <CalendarPlus className="h-3.5 w-3.5" />
                Boka samtal
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Appointment Section */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Din nästa tid
        </h2>
        {loading ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : (
          <AppointmentCard
            appointment={formattedAppointment}
            onRebook={() => navigate("/booking", { state: { mode: "rebook" } })}
            onBook={() => navigate("/booking", { state: { mode: "new" } })}
            onCancel={handleCancel}
          />
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Snabbåtgärder
        </h2>
        <div className="space-y-3">
          <QuickActionCard
            icon={MessageCircle}
            title="Chatta med din dietist"
            description="Skicka ett meddelande när som helst"
            onClick={() => navigate("/messages")}
            variant="accent"
          />
          <QuickActionCard
            icon={User}
            title="Min hälsoprofil"
            description="Visa hälsoprofil"
            onClick={() => navigate("/profile")}
          />
          <QuickActionCard
            icon={Settings}
            title="Profilinställningar"
            description="Uppdatera din information"
            onClick={() => navigate("/settings")}
          />
        </div>
      </section>

      {/* Motivation Section */}
      <section className="pt-2">
        <div className="rounded-2xl gradient-hero p-5 text-primary-foreground">
          <p className="text-sm opacity-90 mb-1">Dagens tanke</p>
          <p className="font-medium leading-relaxed">
            "Små steg varje dag leder till stora förändringar. Du gör ett fantastiskt jobb!"
          </p>
        </div>
      </section>
    </div>
  );
}
