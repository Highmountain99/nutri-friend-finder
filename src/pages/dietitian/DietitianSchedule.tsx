import { useDietitianSchedule } from "@/hooks/dietitian/useDietitianSchedule";
import { useAssignedPatients } from "@/hooks/dietitian/useAssignedPatients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Video } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { sv } from "date-fns/locale";
import { useState } from "react";
import { VideoCallModal } from "@/components/dietitian/VideoCallModal";

const defaultSlots = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00"];

const HOURS = Array.from({ length: 10 }, (_, i) => i + 8); // 8-17

export default function DietitianSchedule() {
  const { appointments, availability, addAvailability, removeAvailability } = useDietitianSchedule();
  const { data: patients } = useAssignedPatients();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [videoOpen, setVideoOpen] = useState(false);
  const [view, setView] = useState<"week" | "day">("week");

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const existingAvail = availability.data?.find((a) => a.available_date === dateStr);
  const existingSlots = existingAvail ? (existingAvail.time_slots as string[]) : [];

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const toggleSlot = (slot: string) => {
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const handleSaveSlots = () => {
    if (!dateStr) return;
    addAvailability.mutate({ date: dateStr, slots: selectedSlots });
    setSelectedSlots([]);
  };

  const getAppointmentsForDay = (date: Date) =>
    (appointments.data ?? []).filter((a) =>
      a.status === "booked" && isSameDay(new Date(a.appointment_date), date)
    );

  const getAvailForDay = (date: Date) => {
    const ds = format(date, "yyyy-MM-dd");
    const avail = availability.data?.find((a) => a.available_date === ds);
    return avail ? (avail.time_slots as string[]) : [];
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <VideoCallModal open={videoOpen} onOpenChange={setVideoOpen} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kalender</h1>
          <p className="text-muted-foreground">Hantera din tillgänglighet och bokningar.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={view === "week" ? "default" : "outline"} size="sm" onClick={() => setView("week")}>Vecka</Button>
          <Button variant={view === "day" ? "default" : "outline"} size="sm" onClick={() => setView("day")}>Dag</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Main calendar area */}
        <Card>
          <CardContent className="p-0">
            {view === "week" ? (
              <div className="overflow-x-auto">
                <div className="min-w-[700px]">
                  {/* Header */}
                  <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b">
                    <div className="p-2" />
                    {weekDays.map((day) => (
                      <div
                        key={day.toISOString()}
                        className={`p-2 text-center text-sm cursor-pointer hover:bg-muted/50 transition-colors ${
                          isSameDay(day, selectedDate) ? "bg-primary/10 font-semibold" : ""
                        }`}
                        onClick={() => setSelectedDate(day)}
                      >
                        <p className="text-xs text-muted-foreground">{format(day, "EEE", { locale: sv })}</p>
                        <p className="text-sm font-medium">{format(day, "d")}</p>
                      </div>
                    ))}
                  </div>

                  {/* Time grid */}
                  {HOURS.map((hour) => (
                    <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b min-h-[48px]">
                      <div className="p-2 text-xs text-muted-foreground text-right pr-3">
                        {`${hour.toString().padStart(2, "0")}:00`}
                      </div>
                      {weekDays.map((day) => {
                        const dayAppts = getAppointmentsForDay(day);
                        const apptAtHour = dayAppts.find((a) => {
                          const h = new Date(a.appointment_date).getHours();
                          return h === hour;
                        });
                        const slots = getAvailForDay(day);
                        const hasSlot = slots.some((s) => parseInt(s.split(":")[0]) === hour);

                        return (
                          <div
                            key={day.toISOString()}
                            className={`border-l p-1 min-h-[48px] ${hasSlot && !apptAtHour ? "bg-muted/30" : ""}`}
                          >
                            {apptAtHour && (
                              <div
                                className={`text-xs p-1 rounded ${
                                  apptAtHour.appointment_type === "initial"
                                    ? "bg-primary/15 text-primary"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                <p className="font-medium truncate">
                                  {format(new Date(apptAtHour.appointment_date), "HH:mm")}
                                </p>
                                <p className="truncate">Pat. {apptAtHour.user_id?.slice(0, 6)}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Day view */
              <div className="p-4 space-y-2">
                <h3 className="text-sm font-semibold mb-3">
                  {format(selectedDate, "EEEE d MMMM", { locale: sv })}
                </h3>
                {HOURS.map((hour) => {
                  const dayAppts = getAppointmentsForDay(selectedDate);
                  const appt = dayAppts.find((a) => new Date(a.appointment_date).getHours() === hour);
                  const hasSlot = existingSlots.some((s) => parseInt(s.split(":")[0]) === hour);

                  return (
                    <div key={hour} className="flex items-center gap-3 py-2 border-b">
                      <span className="text-sm text-muted-foreground w-12">
                        {`${hour.toString().padStart(2, "0")}:00`}
                      </span>
                      <div className="flex-1">
                        {appt ? (
                          <div className={`p-2 rounded text-sm ${
                            appt.appointment_type === "initial"
                              ? "bg-primary/10 text-primary"
                              : "bg-blue-50 text-blue-700"
                          }`}>
                            <span className="font-medium">
                              {format(new Date(appt.appointment_date), "HH:mm")} — Patient {appt.user_id?.slice(0, 8)}
                            </span>
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {appt.appointment_type === "initial" ? "Nybesök" : "Uppföljning"}
                            </Badge>
                          </div>
                        ) : hasSlot ? (
                          <div className="p-2 rounded border border-dashed border-muted-foreground/30 text-xs text-muted-foreground">
                            Ledig tid
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => { if (d) { setSelectedDate(d); setSelectedSlots([]); }}}
                locale={sv}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">
                Tillgänglighet — {format(selectedDate, "d MMM", { locale: sv })}
              </CardTitle>
              {existingAvail && (
                <Button variant="ghost" size="icon" onClick={() => removeAvailability.mutate(existingAvail.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {existingSlots.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {existingSlots.map((s) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                </div>
              )}
              <p className="text-xs font-medium text-muted-foreground">Lägg till tider:</p>
              <div className="flex flex-wrap gap-1">
                {defaultSlots.map((slot) => (
                  <Button
                    key={slot}
                    variant={selectedSlots.includes(slot) ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-7 px-2"
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
                size="sm"
              >
                {addAvailability.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                Spara
              </Button>
            </CardContent>
          </Card>

          {/* Today's list */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Dagens bokningar</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {getAppointmentsForDay(new Date()).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">Inga bokningar idag.</p>
              ) : (
                getAppointmentsForDay(new Date()).map((a) => (
                  <div key={a.id} className="p-2 bg-muted/50 rounded-lg text-sm flex justify-between items-center">
                    <span className="font-medium">{format(new Date(a.appointment_date), "HH:mm")}</span>
                    <Badge variant="secondary" className="text-xs">
                      {a.appointment_type === "initial" ? "Nybesök" : "Uppföljning"}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
