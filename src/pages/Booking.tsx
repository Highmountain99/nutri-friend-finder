import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DietitianSelectionStep } from "@/components/booking/DietitianSelectionStep";
import { DietitianCalendarStep } from "@/components/booking/DietitianCalendarStep";
import { DietitianRecommendations } from "@/components/booking/DietitianRecommendations";
import { DietitianList } from "@/components/booking/DietitianList";
import { DietitianDetailSheet } from "@/components/booking/DietitianDetailSheet";
import { BookingConfirmation } from "@/components/booking/BookingConfirmation";
import { DietitianProfile, TimeSlot } from "@/types/dietitian";
import { useAppointments } from "@/hooks/useAppointments";

type BookingPhase = 
  | 'selection'      // Choose between recommend or show all
  | 'calendar'       // Select date (recommend path)
  | 'recommendations'// Show recommended dietitians
  | 'all'            // Show all dietitians list
  | 'confirm';       // Booking confirmed

export default function Booking() {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookAppointment, cancelUpcomingBookedAppointments } = useAppointments();

  const isRebook = (location.state as { mode?: string } | null)?.mode === 'rebook';
  
  const [phase, setPhase] = useState<BookingPhase>('selection');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedDietitian, setSelectedDietitian] = useState<DietitianProfile | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

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
        navigate(-1);
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
    setSheetOpen(true);
  };

  const handleBook = async (dietitian: DietitianProfile, date: Date, slot: TimeSlot) => {
    // Create the appointment datetime
    const appointmentDate = new Date(date);
    appointmentDate.setHours(slot.hour, slot.minute, 0, 0);

    // If user arrived here from "Ändra tid", replace any existing upcoming booking
    // so the home screen always reflects the latest chosen dietitian.
    if (isRebook) {
      await cancelUpcomingBookedAppointments();
    }

    // Book the appointment with dietitian_id
    const result = await bookAppointment(appointmentDate, 'video', dietitian.id);

    if (result) {
      setSelectedDietitian(dietitian);
      setSelectedDate(date);
      setSelectedSlot(slot);
      setSheetOpen(false);
      setPhase('confirm');
    }
  };

  // Render based on current phase
  switch (phase) {
    case 'selection':
      return (
        <DietitianSelectionStep
          onBack={() => navigate(-1)}
          onRecommend={handleRecommend}
          onShowAll={handleShowAll}
        />
      );

    case 'calendar':
      return (
        <DietitianCalendarStep
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          onBack={handleBack}
          onNext={handleDateSelected}
        />
      );

    case 'recommendations':
      return (
        <>
          <DietitianRecommendations
            selectedDate={selectedDate!}
            onBack={handleBack}
            onSelectDietitian={handleSelectDietitian}
            onShowAll={handleShowAll}
          />
          <DietitianDetailSheet
            dietitian={selectedDietitian}
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            onBook={handleBook}
            initialDate={selectedDate}
          />
        </>
      );

    case 'all':
      return (
        <>
          <DietitianList
            onBack={handleBack}
            onSelectDietitian={handleSelectDietitian}
          />
          <DietitianDetailSheet
            dietitian={selectedDietitian}
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            onBook={handleBook}
            initialDate={selectedDate}
          />
        </>
      );

    case 'confirm':
      return (
        <BookingConfirmation
          dietitian={selectedDietitian!}
          date={selectedDate!}
          slot={selectedSlot!}
          onGoHome={() => navigate('/')}
        />
      );

    default:
      return null;
  }
}
