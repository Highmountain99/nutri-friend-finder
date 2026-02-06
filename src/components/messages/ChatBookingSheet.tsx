import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, Check } from "lucide-react";
import { DietitianRecommendations } from "@/components/booking/DietitianRecommendations";
import { DietitianList } from "@/components/booking/DietitianList";
import { DietitianDetailSheet } from "@/components/booking/DietitianDetailSheet";
import { DietitianProfile, TimeSlot } from "@/types/dietitian";
import { useAppointments } from "@/hooks/useAppointments";
import { format, addDays } from "date-fns";
import { sv } from "date-fns/locale";

type BookingPhase = 
  | 'selection'
  | 'calendar'
  | 'recommendations'
  | 'all'
  | 'confirm';

interface ChatBookingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatBookingSheet({ open, onOpenChange }: ChatBookingSheetProps) {
  const { bookAppointment, cancelUpcomingBookedAppointments } = useAppointments();

  const [phase, setPhase] = useState<BookingPhase>('selection');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedDietitian, setSelectedDietitian] = useState<DietitianProfile | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  const resetState = () => {
    setPhase('selection');
    setSelectedDate(undefined);
    setSelectedDietitian(null);
    setSelectedSlot(null);
    setDetailSheetOpen(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetState, 300);
  };

  const handleBack = () => {
    switch (phase) {
      case 'calendar':
        setPhase('selection');
        break;
      case 'recommendations':
        setPhase('calendar');
        break;
      case 'all':
        setPhase('selection');
        break;
      default:
        handleClose();
    }
  };

  const handleRecommend = () => {
    setPhase('calendar');
  };

  const handleShowAll = () => {
    setPhase('all');
  };

  const handleDateSelected = () => {
    if (selectedDate) {
      setPhase('recommendations');
    }
  };

  const handleSelectDietitian = (dietitian: DietitianProfile) => {
    setSelectedDietitian(dietitian);
    setDetailSheetOpen(true);
  };

  const handleBook = async (dietitian: DietitianProfile, date: Date, slot: TimeSlot) => {
    const appointmentDate = new Date(date);
    appointmentDate.setHours(slot.hour, slot.minute, 0, 0);

    // Cancel any existing upcoming appointments first
    await cancelUpcomingBookedAppointments();

    const result = await bookAppointment(appointmentDate, 'video', dietitian.id);

    if (result) {
      setSelectedDietitian(dietitian);
      setSelectedDate(date);
      setSelectedSlot(slot);
      setDetailSheetOpen(false);
      setPhase('confirm');
    }
  };

  const renderContent = () => {
    switch (phase) {
      case 'selection':
        return (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6">
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-xl font-semibold">Boka möte</h2>
            </div>
            <div className="flex-1 space-y-4">
              <p className="text-muted-foreground">
                Hur vill du hitta en dietist?
              </p>
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex flex-col items-start text-left"
                onClick={handleRecommend}
              >
                <span className="font-medium">Hjälp mig välja</span>
                <span className="text-sm text-muted-foreground">
                  Vi rekommenderar dietister baserat på dina behov
                </span>
              </Button>
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex flex-col items-start text-left"
                onClick={handleShowAll}
              >
                <span className="font-medium">Visa alla</span>
                <span className="text-sm text-muted-foreground">
                  Bläddra bland alla tillgängliga dietister
                </span>
              </Button>
            </div>
          </div>
        );

      case 'calendar':
        return (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6">
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-xl font-semibold">Välj datum</h2>
                <p className="text-sm text-muted-foreground">Vilken dag passar dig bäst?</p>
              </div>
            </div>
            <Card className="shadow-soft mb-6">
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

      case 'recommendations':
        return (
          <div className="flex flex-col h-full -mx-6 -mt-6">
            <DietitianRecommendations
              selectedDate={selectedDate!}
              onBack={handleBack}
              onSelectDietitian={handleSelectDietitian}
              onShowAll={handleShowAll}
            />
          </div>
        );

      case 'all':
        return (
          <div className="flex flex-col h-full -mx-6 -mt-6">
            <DietitianList
              onBack={handleBack}
              onSelectDietitian={handleSelectDietitian}
            />
          </div>
        );

      case 'confirm':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Möte bokat!</h2>
              <p className="text-muted-foreground">
                Du har bokat ett möte med {selectedDietitian?.firstName} {selectedDietitian?.lastName}
              </p>
              {selectedDate && selectedSlot && (
                <p className="text-sm text-muted-foreground">
                  {format(selectedDate, "EEEE d MMMM", { locale: sv })} kl.{" "}
                  {String(selectedSlot.hour).padStart(2, "0")}:
                  {String(selectedSlot.minute).padStart(2, "0")}
                </p>
              )}
            </div>
            <Button onClick={handleClose} className="w-full max-w-xs">
              Stäng
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-6">
          <SheetHeader className="sr-only">
            <SheetTitle>Boka möte</SheetTitle>
          </SheetHeader>
          {renderContent()}
        </SheetContent>
      </Sheet>
      
      {/* Nested detail sheet for viewing dietitian details */}
      <DietitianDetailSheet
        dietitian={selectedDietitian}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        onBook={handleBook}
        initialDate={selectedDate}
      />
    </>
  );
}
