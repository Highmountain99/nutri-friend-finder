import { useState } from 'react';
import { StepLayout } from './StepLayout';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Video, AlertTriangle, Heart } from 'lucide-react';
import { format, addDays, setHours, setMinutes } from 'date-fns';
import { sv } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { TriageResult } from '@/types/intake';

interface BookingStepProps {
  currentStep: number;
  totalSteps: number;
  onNext: (appointmentDate: Date) => void;
  onBack: () => void;
  onSkip: () => void;
  isLoading?: boolean;
  triageResult?: TriageResult;
}

const timeSlots = [
  { hour: 9, minute: 0 },
  { hour: 10, minute: 0 },
  { hour: 11, minute: 0 },
  { hour: 13, minute: 0 },
  { hour: 14, minute: 0 },
  { hour: 15, minute: 0 },
  { hour: 16, minute: 0 },
];

export function BookingStep({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  onSkip,
  isLoading = false,
  triageResult = 'dietist',
}: BookingStepProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<{ hour: number; minute: number } | null>(null);

  const isDietist = triageResult === 'dietist';
  const providerLabel = isDietist ? 'dietist' : 'kostrådgivare';
  const Icon = isDietist ? Video : Heart;

  const handleNext = () => {
    if (selectedDate && selectedTime) {
      const appointmentDate = setMinutes(
        setHours(selectedDate, selectedTime.hour),
        selectedTime.minute
      );
      onNext(appointmentDate);
    }
  };

  const isNextDisabled = !selectedDate || !selectedTime;

  return (
    <StepLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      title={`Boka ditt första samtal med ${providerLabel}`}
      onBack={onBack}
      onNext={handleNext}
      nextDisabled={isNextDisabled}
      nextLabel="Bekräfta bokning"
      isLoading={isLoading}
    >
      <div className="space-y-6">
        {/* Video call info */}
        <div className={cn(
          "flex items-center gap-3 p-4 rounded-xl",
          isDietist ? "bg-primary-soft" : "bg-accent/10"
        )}>
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            isDietist ? "bg-primary/10" : "bg-accent/20"
          )}>
            <Icon className={cn(
              "w-5 h-5",
              isDietist ? "text-primary" : "text-accent"
            )} />
          </div>
          <div>
            <p className="font-medium text-foreground">
              {isDietist ? 'Videosamtal med dietist' : 'Samtal med kostrådgivare'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isDietist ? '30 minuter • 0 kr' : '30 minuter • från 100 kr'}
            </p>
          </div>
        </div>

        {/* Calendar */}
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                setSelectedTime(null);
              }}
              disabled={(date) => date < new Date() || date > addDays(new Date(), 30)}
              locale={sv}
              className="pointer-events-auto"
            />
          </CardContent>
        </Card>

        {/* Time Slots */}
        {selectedDate && (
          <div className="space-y-3 animate-fade-in">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Tillgängliga tider {format(selectedDate, "d MMMM", { locale: sv })}
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((slot) => {
                const isSelected = selectedTime?.hour === slot.hour && selectedTime?.minute === slot.minute;
                return (
                  <Button
                    key={`${slot.hour}-${slot.minute}`}
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => setSelectedTime(slot)}
                    className={cn(
                      "h-12",
                      isSelected && "ring-2 ring-primary ring-offset-2"
                    )}
                  >
                    {String(slot.hour).padStart(2, "0")}:{String(slot.minute).padStart(2, "0")}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected summary */}
        {selectedDate && selectedTime && (
          <Card className={cn(
            "animate-fade-in",
            isDietist ? "border-primary/30 bg-primary/5" : "border-accent/30 bg-accent/5"
          )}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                isDietist ? "bg-primary" : "bg-accent"
              )}>
                <Check className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-foreground capitalize">
                  {format(selectedDate, "EEEE d MMMM", { locale: sv })}
                </p>
                <p className="text-sm text-muted-foreground">
                  kl. {String(selectedTime.hour).padStart(2, "0")}:{String(selectedTime.minute).padStart(2, "0")}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Warning */}
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Observera</p>
              <p className="text-muted-foreground">
                No-show debiteras med 275 kr. Avboka senast 24h innan.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Skip option */}
        <Button
          variant="ghost"
          onClick={onSkip}
          className="w-full text-muted-foreground"
        >
          Boka senare
        </Button>
      </div>
    </StepLayout>
  );
}
