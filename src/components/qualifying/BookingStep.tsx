import { useState } from 'react';
import { StepLayout } from './StepLayout';
import { DietitianSelectionStep } from '@/components/booking/DietitianSelectionStep';
import { DietitianCalendarStep } from '@/components/booking/DietitianCalendarStep';
import { DietitianRecommendations } from '@/components/booking/DietitianRecommendations';
import { DietitianList } from '@/components/booking/DietitianList';
import { DietitianDetailSheet } from '@/components/booking/DietitianDetailSheet';
import { DietitianProfile, TimeSlot } from '@/types/dietitian';
import { Button } from '@/components/ui/button';
import { TriageResult } from '@/types/intake';
import { useAppointments } from '@/hooks/useAppointments';

type BookingPhase = 
  | 'selection'      
  | 'calendar'       
  | 'recommendations'
  | 'all';

interface BookingStepProps {
  currentStep: number;
  totalSteps: number;
  onComplete: () => void;
  onBack: () => void;
  onSkip: () => void;
  isLoading?: boolean;
  triageResult?: TriageResult;
}

export function BookingStep({
  currentStep,
  totalSteps,
  onComplete,
  onBack,
  onSkip,
  isLoading = false,
  triageResult = 'dietist',
}: BookingStepProps) {
  const { bookAppointment, cancelUpcomingBookedAppointments } = useAppointments();
  const [phase, setPhase] = useState<BookingPhase>('selection');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedDietitian, setSelectedDietitian] = useState<DietitianProfile | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleBook = async (dietitian: DietitianProfile, date: Date, slot: TimeSlot) => {
    const appointmentDate = new Date(date);
    appointmentDate.setHours(slot.hour, slot.minute, 0, 0);

    await cancelUpcomingBookedAppointments();
    const result = await bookAppointment(appointmentDate, 'video', dietitian.id);

    if (result) {
      setSheetOpen(false);
      onComplete();
    }
  };

  const handlePhaseBack = () => {
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
      case 'selection':
        onBack();
        break;
      default:
        break;
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

  // Render based on current phase
  switch (phase) {
    case 'selection':
      return (
        <div className="min-h-screen bg-background">
          <DietitianSelectionStep
            onBack={handlePhaseBack}
            onRecommend={handleRecommend}
            onShowAll={handleShowAll}
          />
          <div className="px-4 pb-6">
            <Button
              variant="ghost"
              onClick={onSkip}
              className="w-full text-muted-foreground"
            >
              Boka senare
            </Button>
          </div>
        </div>
      );

    case 'calendar':
      return (
        <DietitianCalendarStep
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          onBack={handlePhaseBack}
          onNext={handleDateSelected}
        />
      );

    case 'recommendations':
      return (
        <>
          <DietitianRecommendations
            selectedDate={selectedDate!}
            onBack={handlePhaseBack}
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
            onBack={handlePhaseBack}
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

    default:
      return null;
  }
}
