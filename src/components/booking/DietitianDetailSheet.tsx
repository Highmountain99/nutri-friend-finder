import { useState, useEffect } from "react";
import { Globe, Calendar as CalendarIcon, CreditCard } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { TimeSlotPicker } from "./TimeSlotPicker";
import { DietitianProfile, specializationLabels, languageLabels, TimeSlot } from "@/types/dietitian";
import { useDietitianAvailability } from "@/hooks/useDietitianAvailability";
import { useBookingCheckout } from "@/hooks/useBookingCheckout";
import { sv } from "date-fns/locale";
import { format, addDays } from "date-fns";

interface DietitianDetailSheetProps {
  dietitian: DietitianProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBook?: (dietitian: DietitianProfile, date: Date, slot: TimeSlot) => void;
  initialDate?: Date;
}

export function DietitianDetailSheet({
  dietitian,
  open,
  onOpenChange,
  onBook,
  initialDate,
}: DietitianDetailSheetProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const { availability, loading, getAvailableTimeSlots } = useDietitianAvailability(
    dietitian?.id,
    selectedDate
  );
  const { createCheckoutFromSlot, loading: checkoutLoading } = useBookingCheckout();

  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate);
    }
  }, [initialDate]);

  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDate]);

  if (!dietitian) return null;

  const initials = `${dietitian.firstName[0]}${dietitian.lastName[0]}`;
  const availableSlots = getAvailableTimeSlots();

  const handleBook = async () => {
    if (selectedDate && selectedSlot) {
      const dietitianName = `${dietitian.firstName} ${dietitian.lastName}`;
      const success = await createCheckoutFromSlot(
        dietitian.id,
        dietitianName,
        selectedDate,
        selectedSlot,
        'video'
      );

      if (success) {
        // Close sheet - user will be redirected to Stripe checkout
        onOpenChange(false);
      }
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl overflow-y-auto">
        <SheetHeader className="text-left pb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {dietitian.avatarUrl && (
                <AvatarImage
                  src={dietitian.avatarUrl}
                  alt={`${dietitian.firstName} ${dietitian.lastName}`}
                />
              )}
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-xl">
                {dietitian.firstName} {dietitian.lastName}
              </SheetTitle>
              <p className="text-muted-foreground">{dietitian.title}</p>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 pb-6">
          {/* Bio */}
          {dietitian.bio && (
            <p className="text-muted-foreground">{dietitian.bio}</p>
          )}

          {/* Specializations */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Specialisering
            </h3>
            <div className="flex flex-wrap gap-2">
              {dietitian.specializations.map((spec) => (
                <Badge key={spec} variant="secondary" className="bg-primary/10 text-primary">
                  {specializationLabels[spec] || spec}
                </Badge>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Globe className="h-4 w-4" />
            <span>
              {dietitian.languages.map((lang) => languageLabels[lang] || lang).join(', ')}
            </span>
          </div>

          {/* Calendar */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Välj datum
            </h3>
            <Card className="shadow-soft">
              <CardContent className="p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => setSelectedDate(date)}
                  disabled={(date) => date < new Date() || date > addDays(new Date(), 30)}
                  locale={sv}
                  className="pointer-events-auto"
                />
              </CardContent>
            </Card>
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div className="animate-fade-in">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Lediga tider {format(selectedDate, "d MMMM", { locale: sv })}
              </h3>
              <TimeSlotPicker
                slots={availableSlots}
                selectedSlot={selectedSlot}
                onSelect={setSelectedSlot}
                loading={loading}
              />
            </div>
          )}

          {/* Info about card requirement */}
          <div className="bg-muted rounded-xl p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Besöket kostar 0 kr.</strong> Vi behöver dina kortuppgifter för eventuell no-show-avgift på 275 kr om du uteblir utan att avboka.
            </p>
          </div>

          {/* Book Button */}
          <Button
            size="lg"
            className="w-full"
            disabled={!selectedDate || !selectedSlot || checkoutLoading}
            onClick={handleBook}
          >
            {checkoutLoading ? (
              "Förbereder..."
            ) : selectedSlot ? (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Bekräfta bokning
              </>
            ) : (
              'Välj tid för att boka'
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
