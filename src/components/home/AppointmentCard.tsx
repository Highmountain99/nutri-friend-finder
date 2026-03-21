import { Calendar, Clock, Video, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, differenceInHours, differenceInMinutes } from "date-fns";
import { sv } from "date-fns/locale";
import { useState, useEffect } from "react";
import { VideoCallModal } from "@/components/dietitian/VideoCallModal";

interface AppointmentCardProps {
  appointment?: {
    id?: string;
    date: Date;
    dietitianName: string;
    dietitianTitle?: string;
    dietitianImage?: string;
  };
  onRebook?: () => void;
  onBook?: () => void;
  onCancel?: () => void;
}

export function AppointmentCard({ appointment, onRebook, onBook, onCancel }: AppointmentCardProps) {
  const [videoOpen, setVideoOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  // Update "now" every 30 seconds so the button appears in real-time
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

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

  const hoursUntilAppointment = differenceInHours(appointment.date, now);
  const minutesUntilAppointment = differenceInMinutes(appointment.date, now);
  const isWithin24Hours = hoursUntilAppointment <= 24 && hoursUntilAppointment >= 0;
  const showVideoButton = minutesUntilAppointment <= 10 && minutesUntilAppointment >= -60;

  return (
    <>
      <Card className="shadow-elevated overflow-hidden bg-card relative">
        {isWithin24Hours && (
          <Popover>
            <PopoverTrigger asChild>
              <button className="absolute top-3 right-3 w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                <Info className="w-4 h-4 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 text-sm" align="end">
              <p className="font-medium mb-1">Avbokning ej möjlig</p>
              <p className="text-muted-foreground">
                Du kan avboka/omboka fram till 24h innan. No show-avgift debiteras med 275 kr.
              </p>
            </PopoverContent>
          </Popover>
        )}

        <CardContent className="p-5">
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

          {/* Video call button - appears 10 min before appointment */}
          {showVideoButton && (
            <Button
              onClick={() => setVideoOpen(true)}
              className="w-full mt-5 gap-2"
              size="lg"
            >
              <Video className="w-5 h-5" />
              Starta videosamtal
            </Button>
          )}

          <div className={`flex gap-3 ${showVideoButton ? 'mt-3' : 'mt-5'}`}>
            <Button
              variant="outline"
              onClick={onRebook}
              disabled={isWithin24Hours}
              className="flex-1"
            >
              Ändra tid
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  disabled={isWithin24Hours}
                  className="flex-1"
                >
                  Avboka
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Avboka möte</AlertDialogTitle>
                  <AlertDialogDescription>
                    Är du säker på att du vill avboka ditt möte med {appointment.dietitianName} den {dateFormatted} kl {time}?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                  <AlertDialogAction onClick={onCancel}>
                    Ja, avboka
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      <VideoCallModal
        open={videoOpen}
        onOpenChange={setVideoOpen}
        appointmentId={appointment.id}
      />
    </>
  );
}
