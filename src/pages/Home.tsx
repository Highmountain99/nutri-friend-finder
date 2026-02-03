import { useNavigate } from "react-router-dom";
import { MessageCircle, User, Settings } from "lucide-react";
import { AppointmentCard } from "@/components/home/AppointmentCard";
import { QuickActionCard } from "@/components/home/QuickActionCard";
import { useAppointments } from "@/hooks/useAppointments";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const navigate = useNavigate();
  const { getUpcomingAppointment, cancelAppointment, loading } = useAppointments();

  const upcomingAppointment = getUpcomingAppointment();

  // Format appointment for card
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
