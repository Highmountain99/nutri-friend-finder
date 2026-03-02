import { useDietitianSchedule } from "@/hooks/dietitian/useDietitianSchedule";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { useState } from "react";

const defaultSlots = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];

export default function DietitianSchedule() {
  const { appointments, availability, addAvailability, removeAvailability } = useDietitianSchedule();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const existingAvail = availability.data?.find((a) => a.available_date === dateStr);
  const existingSlots = existingAvail ? (existingAvail.time_slots as string[]) : [];

  const toggleSlot = (slot: string) => {
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const handleSaveSlots = () => {
    if (!dateStr) return;
    addAvailability.mutate({ date: dateStr, slots: selectedSlots });
  };

  const dayAppointments = appointments.data?.filter(
    (a) => format(new Date(a.appointment_date), "yyyy-MM-dd") === dateStr
  ) ?? [];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Schema</h1>
        <p className="text-muted-foreground">Hantera din tillgänglighet och se bokade tider.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Kalender</CardTitle></CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => {
                setSelectedDate(d);
                setSelectedSlots([]);
              }}
              locale={sv}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* Existing availability for selected date */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Tillgänglighet {dateStr && `- ${format(selectedDate!, "d MMMM", { locale: sv })}`}</CardTitle>
              {existingAvail && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAvailability.mutate(existingAvail.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {existingSlots.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-4">
                  {existingSlots.map((s) => (
                    <Badge key={s} variant="secondary">{s}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mb-4">Ingen tillgänglighet inlagd.</p>
              )}

              <p className="text-xs font-medium text-muted-foreground mb-2">Lägg till tider:</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {defaultSlots.map((slot) => (
                  <Button
                    key={slot}
                    variant={selectedSlots.includes(slot) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSlot(slot)}
                  >
                    {slot}
                  </Button>
                ))}
              </div>
              <Button
                onClick={handleSaveSlots}
                disabled={!selectedSlots.length || addAvailability.isPending}
                className="w-full"
              >
                {addAvailability.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                Spara tillgänglighet
              </Button>
            </CardContent>
          </Card>

          {/* Appointments for selected date */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Bokade tider</CardTitle></CardHeader>
            <CardContent>
              {!dayAppointments.length ? (
                <p className="text-sm text-muted-foreground">Inga bokningar denna dag.</p>
              ) : (
                <div className="space-y-2">
                  {dayAppointments.map((a) => (
                    <div key={a.id} className="p-3 bg-muted/50 rounded-lg flex justify-between">
                      <span className="text-sm font-medium">
                        {format(new Date(a.appointment_date), "HH:mm")}
                      </span>
                      <Badge variant="secondary">{a.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
