import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DietitianSelectionStep } from "@/components/booking/DietitianSelectionStep";
import { DietitianCalendarStep } from "@/components/booking/DietitianCalendarStep";
import { DietitianRecommendations } from "@/components/booking/DietitianRecommendations";
import { DietitianList } from "@/components/booking/DietitianList";
import { DietitianDetailSheet } from "@/components/booking/DietitianDetailSheet";
import { BookingConfirmation } from "@/components/booking/BookingConfirmation";
import { DietitianProfile, TimeSlot } from "@/types/dietitian";
import { useAppointments } from "@/hooks/useAppointments";
import { useMyDietitian } from "@/hooks/useMyDietitian";
import { OrganicLoader } from "@/components/ui/OrganicLoader";

type BookingPhase = 
  | 'selection'      // Choose between recommend or show all
  | 'calendar'       // Select date (recommend path)
  | 'recommendations'// Show recommended dietitians
  | 'all'            // Show all dietitians list
  | 'locked'         // Patient has an assigned dietitian — no choice
  | 'confirm';       // Booking confirmed

const toDietitianProfile = (d: any): DietitianProfile => ({
  id: d.id,
  userId: d.user_id || '',
  firstName: d.first_name,
  lastName: d.last_name,
  title: d.title,
  specializations: d.specializations || [],
  languages: d.languages || [],
  avatarUrl: d.avatar_url || null,
  bio: d.bio || null,
  isAvailable: d.is_available ?? true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

export default function Booking() {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookAppointment, cancelUpcomingBookedAppointments } = useAppointments();
  const { data: myDietitian, isLoading: myDietitianLoading } = useMyDietitian();

  const locationState = location.state as { mode?: string; preselectedDietitian?: any } | null;
  const isRebook = locationState?.mode === 'rebook';
  const preselected = locationState?.preselectedDietitian;

  const [phase, setPhase] = useState<BookingPhase>(preselected ? 'all' : 'selection');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedDietitian, setSelectedDietitian] = useState<DietitianProfile | null>(
    preselected ? toDietitianProfile(preselected) : null
  );
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [sheetOpen, setSheetOpen] = useState(!!preselected);

  // Patients invited by a dietitian are locked to that dietitian — no picking others.
  useEffect(() => {
    if (preselected || !myDietitian) return;
    setSelectedDietitian(toDietitianProfile(myDietitian));
    setSheetOpen(true);
    setPhase('locked');
  }, [myDietitian, preselected]);

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
      setSheetOpen(false);
      navigate('/home', { state: { bookingConfirmed: true } });
    }
  };

  // Wait for the assignment check so we never flash the "choose dietitian" step.
  if (!preselected && myDietitianLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <OrganicLoader size={32} />
      </div>
    );
  }

  // Render based on current phase
  switch (phase) {
    case 'locked':
      return (
        <DietitianDetailSheet
          dietitian={selectedDietitian}
          open={sheetOpen}
          onOpenChange={(open) => {
            setSheetOpen(open);
            if (!open) navigate(-1);
          }}
          onBook={handleBook}
          initialDate={selectedDate}
        />
      );

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
          onGoHome={() => navigate('/home')}
        />
      );

    default:
      return null;
  }
}
