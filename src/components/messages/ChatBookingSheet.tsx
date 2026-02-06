import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Clock, CreditCard } from "lucide-react";
import { TimeSlotPicker } from "@/components/booking/TimeSlotPicker";
import { TimeSlot } from "@/types/dietitian";
import { useDietitianAvailability } from "@/hooks/useDietitianAvailability";
import { useBookingCheckout } from "@/hooks/useBookingCheckout";
import { format, addDays } from "date-fns";
import { sv } from "date-fns/locale";

type BookingPhase = 'calendar' | 'time';

interface ChatBookingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dietitian: {
    id: string;
    firstName: string;
    lastName: string;
    title: string;
    avatarUrl?: string | null;
  } | null;
}

export function ChatBookingSheet({ open, onOpenChange, dietitian }: ChatBookingSheetProps) {
  const { createCheckoutFromSlot, loading: checkoutLoading } = useBookingCheckout();

  const [phase, setPhase] = useState<BookingPhase>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const { availability, loading: availabilityLoading } = useDietitianAvailability(
    dietitian?.id || '',
    selectedDate || new Date()
  );

  const resetState = () => {
    setPhase('calendar');
    setSelectedDate(undefined);
    setSelectedSlot(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetState, 300);
  };

  const handleBack = () => {
    switch (phase) {
      case 'time':
        setPhase('calendar');
        setSelectedSlot(null);
        break;
      default:
        handleClose();
    }
  };

  const handleDateSelected = () => {
    if (selectedDate) {
      setPhase('time');
    }
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  const handleBook = async () => {
    if (!dietitian || !selectedDate || !selectedSlot) return;
    
    const dietitianName = `${dietitian.firstName} ${dietitian.lastName}`;
    const success = await createCheckoutFromSlot(
      dietitian.id,
      dietitianName,
      selectedDate,
      selectedSlot,
      'video'
    );

    if (success) {
      // Close sheet - user will be redirected to Stripe
      handleClose();
    }
  };

  if (!dietitian) {
    return null;
  }

  const initials = `${dietitian.firstName[0]}${dietitian.lastName[0]}`;

  const renderContent = () => {
    switch (phase) {
      case 'calendar':
        return (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6">
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-xl font-semibold">Boka möte</h2>
            </div>

            {/* Dietitian info */}
            <div className="flex items-center gap-3 mb-6 p-4 bg-muted rounded-xl">
              <Avatar className="w-12 h-12">
                {dietitian.avatarUrl ? (
                  <AvatarImage src={dietitian.avatarUrl} alt={`${dietitian.firstName} ${dietitian.lastName}`} />
                ) : null}
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{dietitian.firstName} {dietitian.lastName}</p>
                <p className="text-sm text-muted-foreground">{dietitian.title}</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">Välj ett datum som passar dig</p>

            <Card className="shadow-soft mb-6 flex-1">
              <CardContent className="p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || date > addDays(new Date(), 30)}
                  locale={sv}
                  className="pointer-events-auto"
                />
              </CardContent>
            </Card>

            <Button
              size="lg"
              className="w-full"
              disabled={!selectedDate}
              onClick={handleDateSelected}
            >
              Nästa
            </Button>
          </div>
        );

      case 'time':
        return (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6">
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-xl font-semibold">Välj tid</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedDate && format(selectedDate, "EEEE d MMMM", { locale: sv })}
                </p>
              </div>
            </div>

            {/* Dietitian info */}
            <div className="flex items-center gap-3 mb-6 p-4 bg-muted rounded-xl">
              <Avatar className="w-10 h-10">
                {dietitian.avatarUrl ? (
                  <AvatarImage src={dietitian.avatarUrl} alt={`${dietitian.firstName} ${dietitian.lastName}`} />
                ) : null}
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{dietitian.firstName} {dietitian.lastName}</p>
                <p className="text-xs text-muted-foreground">{dietitian.title}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {availabilityLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : availability && availability.timeSlots.filter(s => !s.booked).length > 0 ? (
                <TimeSlotPicker
                  slots={availability.timeSlots}
                  selectedSlot={selectedSlot}
                  onSelect={handleSlotSelect}
                />
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Inga lediga tider detta datum.</p>
                  <Button variant="outline" className="mt-4" onClick={handleBack}>
                    Välj ett annat datum
                  </Button>
                </div>
              )}
            </div>

            {selectedSlot && (
              <Button
                size="lg"
                className="w-full mt-4"
                onClick={handleBook}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? (
                  "Förbereder..."
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Bekräfta bokning
                  </>
                )}
              </Button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-6">
        <SheetHeader className="sr-only">
          <SheetTitle>Boka möte med {dietitian.firstName}</SheetTitle>
        </SheetHeader>
        {renderContent()}
      </SheetContent>
    </Sheet>
  );
}
