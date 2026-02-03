import { Calendar, Clock, Video, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface AppointmentCardProps {
  appointment?: {
    date: Date;
    dietitianName: string;
    dietitianImage?: string;
  };
  onRebook?: () => void;
  onBook?: () => void;
}

export function AppointmentCard({ appointment, onRebook, onBook }: AppointmentCardProps) {
  if (!appointment) {
    return (
      <Card className="shadow-soft border-2 border-dashed border-primary/20 bg-primary-soft/30">
        <CardContent className="p-5">
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Video className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Inget bokat möte</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Boka ett videosamtal med din dietist
              </p>
            </div>
            <Button onClick={onBook} className="w-full" size="lg">
              <Calendar className="w-4 h-4 mr-2" />
              Boka tid
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const dayName = format(appointment.date, "EEEE", { locale: sv });
  const dateFormatted = format(appointment.date, "d MMMM", { locale: sv });
  const time = format(appointment.date, "HH:mm");

  const initials = appointment.dietitianName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="shadow-elevated overflow-hidden">
      <div className="h-1.5 gradient-hero" />
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {appointment.dietitianImage ? (
            <Avatar className="w-12 h-12 flex-shrink-0">
              <AvatarImage src={appointment.dietitianImage} alt={appointment.dietitianName} />
              <AvatarFallback className="bg-primary-soft text-primary font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary-soft flex items-center justify-center flex-shrink-0">
              <Video className="w-6 h-6 text-primary" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground">Kommande videosamtal</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              med {appointment.dietitianName}
            </p>
            
            <div className="flex items-center gap-4 mt-3 text-sm">
              <div className="flex items-center gap-1.5 text-foreground">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="capitalize">{dayName}, {dateFormatted}</span>
              </div>
              <div className="flex items-center gap-1.5 text-foreground">
                <Clock className="w-4 h-4 text-primary" />
                <span>{time}</span>
              </div>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={onRebook}
          className="w-full mt-4"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Omboka tid
        </Button>
      </CardContent>
    </Card>
  );
}
