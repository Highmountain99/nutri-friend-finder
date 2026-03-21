import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { sv } from "date-fns/locale";
import { addDays, startOfDay } from "date-fns";

interface DietitianCalendarStepProps {
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  onBack: () => void;
  onNext: () => void;
}

export function DietitianCalendarStep({
  selectedDate,
  onDateSelect,
  onBack,
  onNext,
}: DietitianCalendarStepProps) {
  return (
    <div className="px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Välj datum</h1>
          <p className="text-sm text-muted-foreground">Vilken dag passar dig bäst?</p>
        </div>
      </div>

      {/* Calendar */}
      <Card className="shadow-soft mb-6">
        <CardContent className="p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onDateSelect}
            disabled={(date) => date < new Date() || date > addDays(new Date(), 30)}
            locale={sv}
            className="pointer-events-auto"
          />
        </CardContent>
      </Card>

      {/* Next Button */}
      <Button
        size="lg"
        className="w-full"
        disabled={!selectedDate}
        onClick={onNext}
      >
        Nästa
      </Button>
    </div>
  );
}
