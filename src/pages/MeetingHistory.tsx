import { useEffect, useState } from "react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Video, Phone, MapPin, FileText, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface PastAppointment {
  id: string;
  appointment_date: string;
  appointment_type: string;
  notes: string | null;
  status: string;
  dietitian: {
    first_name: string;
    last_name: string;
    title: string;
    avatar_url: string | null;
  } | null;
}

export default function MeetingHistory() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<PastAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchPastAppointments = async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          appointment_date,
          appointment_type,
          notes,
          status,
          dietitian:dietitian_profiles (
            first_name,
            last_name,
            title,
            avatar_url
          )
        `)
        .eq("user_id", user.id)
        .in("status", ["completed", "cancelled"])
        .order("appointment_date", { ascending: false });

      if (error) {
        console.error("Error fetching past appointments:", error);
      } else {
        setAppointments(data || []);
      }
      setLoading(false);
    };

    fetchPastAppointments();
  }, [user]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4" />;
      case "phone":
        return <Phone className="w-4 h-4" />;
      case "in_person":
        return <MapPin className="w-4 h-4" />;
      default:
        return <Video className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "video":
        return "Videomöte";
      case "phone":
        return "Telefonmöte";
      case "in_person":
        return "Fysiskt möte";
      default:
        return "Möte";
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Möteshistorik</h1>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32 mt-1" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Möteshistorik</h1>
      <p className="text-muted-foreground text-sm">
        Här ser du dina tidigare konsultationer och sammanfattningar.
      </p>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-1">Inga tidigare möten</h3>
            <p className="text-sm text-muted-foreground">
              När du haft möten med din dietist visas de här.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {appointment.dietitian?.avatar_url ? (
                      <img
                        src={appointment.dietitian.avatar_url}
                        alt={`${appointment.dietitian.first_name} ${appointment.dietitian.last_name}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary-soft flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-base">
                        {appointment.dietitian
                          ? `${appointment.dietitian.first_name} ${appointment.dietitian.last_name}`
                          : "Okänd dietist"}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {appointment.dietitian?.title || "Dietist"}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={appointment.status === "completed" ? "default" : "secondary"}
                    className={appointment.status === "completed" ? "bg-success/10 text-success hover:bg-success/20" : ""}
                  >
                    {appointment.status === "completed" ? "Genomfört" : "Avbokat"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    {getTypeIcon(appointment.appointment_type)}
                    {getTypeLabel(appointment.appointment_type)}
                  </span>
                  <span>
                    {format(new Date(appointment.appointment_date), "d MMMM yyyy 'kl.' HH:mm", {
                      locale: sv,
                    })}
                  </span>
                </div>

                {appointment.notes ? (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-foreground mb-1 flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      Sammanfattning
                    </h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {appointment.notes}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Ingen sammanfattning tillgänglig.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
