import { Calendar, Clock, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface AppointmentCardProps {
  appointment?: {
    date: Date;
    dietitianName: string;
    dietitianTitle?: string;
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
  const dateFormatted = format(appointment.date, "d MMMM yyyy", { locale: sv });
  const time = format(appointment.date, "HH:mm");

  const initials = appointment.dietitianName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="shadow-elevated overflow-hidden bg-card">
      <CardContent className="p-5">
        {/* Dietitian info section */}
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="w-14 h-14 flex-shrink-0 border-2 border-primary/20">
            {appointment.dietitianImage ? (
              <AvatarImage 
                src={appointment.dietitianImage} 
                alt={appointment.dietitianName}
                className="object-cover"
              />
            ) : null}
            <AvatarFallback className="bg-primary-soft text-primary font-semibold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-lg">
              {appointment.dietitianName}
            </h3>
            <p className="text-sm text-primary font-medium">
              {appointment.dietitianTitle || "Legitimerad dietist"}
            </p>
          </div>
        </div>

        {/* Date and time section */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <span className="text-foreground font-medium capitalize">
              {dayName} {dateFormatted}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <span className="text-primary font-semibold text-lg">
              {time}
            </span>
          </div>
        </div>

        {/* Rebook button */}
        {onRebook && (
          <Button
            variant="outline"
            onClick={onRebook}
            className="w-full mt-5"
          >
            Ändra tid
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
