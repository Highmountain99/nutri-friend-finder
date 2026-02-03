import { Check, Calendar, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DietitianProfile, TimeSlot } from "@/types/dietitian";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface BookingConfirmationProps {
  dietitian: DietitianProfile;
  date: Date;
  slot: TimeSlot;
  onGoHome: () => void;
}

export function BookingConfirmation({
  dietitian,
  date,
  slot,
  onGoHome,
}: BookingConfirmationProps) {
  const initials = `${dietitian.firstName[0]}${dietitian.lastName[0]}`;
  const timeStr = `${String(slot.hour).padStart(2, '0')}:${String(slot.minute).padStart(2, '0')}`;

  return (
    <div className="px-4 py-6 animate-fade-in">
      <div className="text-center space-y-6 py-8">
        {/* Success Icon */}
        <div className="w-20 h-20 rounded-full gradient-hero flex items-center justify-center mx-auto shadow-elevated">
          <Check className="w-10 h-10 text-primary-foreground" />
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tiden är bokad!</h1>
          <p className="text-muted-foreground mt-2">
            Ditt videosamtal är bekräftat
          </p>
        </div>

        {/* Booking Details Card */}
        <Card className="shadow-soft">
          <CardContent className="p-5 space-y-4">
            {/* Dietitian */}
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                {dietitian.avatarUrl && (
                  <AvatarImage
                    src={dietitian.avatarUrl}
                    alt={`${dietitian.firstName} ${dietitian.lastName}`}
                  />
                )}
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="font-semibold text-foreground">
                  {dietitian.firstName} {dietitian.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{dietitian.title}</p>
              </div>
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              {/* Date */}
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground capitalize">
                  {format(date, "EEEE d MMMM yyyy", { locale: sv })}
                </span>
              </div>

              {/* Time */}
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold text-primary">{timeStr}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Text */}
        <p className="text-sm text-muted-foreground px-4">
          Du kommer att få en påminnelse via e-post och notifikation före mötet.
        </p>

        {/* Button */}
        <Button onClick={onGoHome} size="lg" className="w-full">
          Tillbaka till startsidan
        </Button>
      </div>
    </div>
  );
}
