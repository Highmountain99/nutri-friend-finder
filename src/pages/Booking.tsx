import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays, setHours, setMinutes, isSameDay } from "date-fns";
import { sv } from "date-fns/locale";
import { cn } from "@/lib/utils";

const timeSlots = [
  { hour: 9, minute: 0 },
  { hour: 10, minute: 0 },
  { hour: 11, minute: 0 },
  { hour: 13, minute: 0 },
  { hour: 14, minute: 0 },
  { hour: 15, minute: 0 },
  { hour: 16, minute: 0 },
];

export default function Booking() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<{ hour: number; minute: number } | null>(null);
  const [isBooked, setIsBooked] = useState(false);

  const handleBooking = () => {
    if (selectedDate && selectedTime) {
      setIsBooked(true);
      // In real app, this would make an API call
    }
  };

  if (isBooked && selectedDate && selectedTime) {
    const bookedDateTime = setMinutes(setHours(selectedDate, selectedTime.hour), selectedTime.minute);
    
    return (
      <div className="px-4 py-6 animate-fade-in">
        <div className="text-center space-y-6 py-12">
          <div className="w-20 h-20 rounded-full gradient-hero flex items-center justify-center mx-auto shadow-elevated">
            <Check className="w-10 h-10 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tiden är bokad!</h1>
            <p className="text-muted-foreground mt-2">
              Ditt videosamtal är inbokat
            </p>
          </div>
          <Card className="shadow-soft">
            <CardContent className="p-5 text-center">
              <p className="text-lg font-semibold text-foreground capitalize">
                {format(bookedDateTime, "EEEE d MMMM", { locale: sv })}
              </p>
              <p className="text-2xl font-bold text-primary mt-1">
                {format(bookedDateTime, "HH:mm")}
              </p>
            </CardContent>
          </Card>
          <Button onClick={() => navigate("/")} size="lg" className="w-full">
            Tillbaka till startsidan
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Boka videosamtal</h1>
          <p className="text-sm text-muted-foreground">Välj dag och tid</p>
        </div>
      </div>

      {/* Calendar */}
      <Card className="shadow-soft mb-6">
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
        <div className="space-y-3 mb-6 animate-fade-in">
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

      {/* Warning */}
      <Card className="border-accent/30 bg-accent/5 mb-6">
        <CardContent className="p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground">Observera</p>
            <p className="text-muted-foreground">
              No-show debiteras med 275 kr
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Book Button */}
      <Button
        onClick={handleBooking}
        disabled={!selectedDate || !selectedTime}
        size="lg"
        className="w-full"
      >
        Bekräfta bokning
      </Button>
    </div>
  );
}
