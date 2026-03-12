import { useDietitianSchedule } from "@/hooks/dietitian/useDietitianSchedule";
import { useAssignedPatients } from "@/hooks/dietitian/useAssignedPatients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Clock, X } from "lucide-react";
import { CalendarSyncSheet } from "@/components/dietitian/CalendarSyncSheet";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { sv } from "date-fns/locale";
import { useState, useEffect, useCallback } from "react";
import { VideoCallModal } from "@/components/dietitian/VideoCallModal";
import { useDragSelect } from "@/hooks/useDragSelect";
import { toast } from "sonner";

const HOURS = Array.from({ length: 10 }, (_, i) => i + 8); // 8-17
const HALF_HOURS = HOURS.flatMap((h) => [
  `${h.toString().padStart(2, "0")}:00`,
  `${h.toString().padStart(2, "0")}:30`,
]);

export default function DietitianSchedule() {
  const { appointments, availability, addAvailability, removeAvailability } = useDietitianSchedule();
  const { data: patients } = useAssignedPatients();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [videoOpen, setVideoOpen] = useState(false);
  const [view, setView] = useState<"week" | "day">("week");

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const existingAvail = availability.data?.find((a) => a.available_date === dateStr);
  const existingSlots = existingAvail ? (existingAvail.time_slots as string[]) : [];

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Build selectable IDs for drag-select
  // Week view: "day_col:slot" e.g. "0:09:00"
  // Day view: "slot" e.g. "09:00"
  const weekSlotIds = weekDays.flatMap((_, dayIdx) =>
    HALF_HOURS.map((slot) => `${dayIdx}:${slot}`)
  );
  const daySlotIds = HALF_HOURS.map((slot) => slot);

  const handleWeekSelectionComplete = useCallback(
    (selectedIds: string[]) => {
      // Group by day
      const byDay: Record<number, string[]> = {};
      selectedIds.forEach((id) => {
        const [dayIdx, slot] = [parseInt(id.split(":")[0]), id.slice(id.indexOf(":") + 1)];
        if (!byDay[dayIdx]) byDay[dayIdx] = [];
        byDay[dayIdx].push(slot);
      });

      Object.entries(byDay).forEach(([dayIdxStr, slots]) => {
        const day = weekDays[parseInt(dayIdxStr)];
        const ds = format(day, "yyyy-MM-dd");
        const existingForDay = availability.data?.find((a) => a.available_date === ds);
        const existingDaySlots = existingForDay ? (existingForDay.time_slots as string[]) : [];
        const merged = Array.from(new Set([...existingDaySlots, ...slots])).sort();
        addAvailability.mutate({ date: ds, slots: merged });
      });

      toast.success("Tillgänglighet sparad");
    },
    [weekDays, availability.data, addAvailability]
  );

  const handleDaySelectionComplete = useCallback(
    (selectedIds: string[]) => {
      const merged = Array.from(new Set([...existingSlots, ...selectedIds])).sort();
      addAvailability.mutate({ date: dateStr, slots: merged });
      toast.success("Tillgänglighet sparad");
    },
    [existingSlots, dateStr, addAvailability]
  );

  const removeSlot = useCallback(
    (day: Date, slot: string) => {
      const ds = format(day, "yyyy-MM-dd");
      const avail = availability.data?.find((a) => a.available_date === ds);
      if (!avail) return;
      const currentSlots = avail.time_slots as string[];
      const updated = currentSlots.filter((s) => s !== slot);
      if (updated.length === 0) {
        removeAvailability.mutate(avail.id);
      } else {
        addAvailability.mutate({ date: ds, slots: updated });
      }
      toast.success("Tid borttagen");
    },
    [availability.data, addAvailability, removeAvailability]
  );

  const weekDrag = useDragSelect({ onSelectionComplete: handleWeekSelectionComplete });
  const dayDrag = useDragSelect({ onSelectionComplete: handleDaySelectionComplete });

  useEffect(() => {
    weekDrag.setSelectableIds(weekSlotIds);
  }, [weekSlotIds.join(",")]);

  useEffect(() => {
    dayDrag.setSelectableIds(daySlotIds);
  }, [daySlotIds.join(",")]);

  // Global pointer up listener for drag
  useEffect(() => {
    const handleUp = () => {
      weekDrag.handlePointerUp();
      dayDrag.handlePointerUp();
    };
    window.addEventListener("pointerup", handleUp);
    return () => window.removeEventListener("pointerup", handleUp);
  }, [weekDrag.handlePointerUp, dayDrag.handlePointerUp]);

  const getAppointmentsForDay = (date: Date) =>
    (appointments.data ?? []).filter(
      (a) => a.status === "booked" && isSameDay(new Date(a.appointment_date), date)
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
          <p className="text-muted-foreground">Dra över tidsluckor för att göra dig tillgänglig.</p>
        </div>
        <div className="flex gap-2">
          <CalendarSyncSheet />
          <Button variant={view === "week" ? "default" : "outline"} size="sm" onClick={() => setView("week")}>Vecka</Button>
          <Button variant={view === "day" ? "default" : "outline"} size="sm" onClick={() => setView("day")}>Dag</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Main calendar area */}
        <Card>
          <CardContent className="p-0">
            {view === "week" ? (
              <WeekView
                weekDays={weekDays}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                getAppointmentsForDay={getAppointmentsForDay}
                getAvailForDay={getAvailForDay}
                drag={weekDrag}
                onRemoveSlot={(dayIdx: number, slot: string) => removeSlot(weekDays[dayIdx], slot)}
              />
            ) : (
              <DayView
                selectedDate={selectedDate}
                existingSlots={existingSlots}
                getAppointmentsForDay={getAppointmentsForDay}
                drag={dayDrag}
                onRemoveSlot={(slot: string) => removeSlot(selectedDate, slot)}
              />
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
                onSelect={(d) => { if (d) setSelectedDate(d); }}
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
              {existingSlots.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {existingSlots.map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs flex items-center gap-1 pr-1">
                      {s}
                      <button
                        onClick={() => removeSlot(selectedDate, s)}
                        className="ml-0.5 rounded-full hover:bg-destructive/20 p-0.5 transition-colors"
                      >
                        <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Inga tider markerade. Dra i kalendern för att lägga till.</p>
              )}
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

// --- Week View ---

interface WeekViewProps {
  weekDays: Date[];
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
  getAppointmentsForDay: (d: Date) => any[];
  getAvailForDay: (d: Date) => string[];
  drag: ReturnType<typeof useDragSelect>;
  onRemoveSlot: (dayIdx: number, slot: string) => void;
}

function WeekView({ weekDays, selectedDate, setSelectedDate, getAppointmentsForDay, getAvailForDay, drag, onRemoveSlot }: WeekViewProps) {
  return (
    <div className="overflow-x-auto select-none">
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

        {/* Time grid with half-hour rows */}
        {HOURS.map((hour) => (
          <div key={hour}>
            {[0, 30].map((minutes) => {
              const slotTime = `${hour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
              const isHour = minutes === 0;

              return (
                <div key={`${hour}:${minutes}`} className={`grid grid-cols-[60px_repeat(7,1fr)] ${isHour ? "border-b" : "border-b border-dashed border-border/40"} min-h-[28px]`}>
                  <div className="px-2 text-right pr-3 flex items-center justify-end">
                    {isHour && (
                      <span className="text-xs text-muted-foreground">{slotTime}</span>
                    )}
                  </div>
                  {weekDays.map((day, dayIdx) => {
                    const cellId = `${dayIdx}:${slotTime}`;
                    const dayAppts = getAppointmentsForDay(day);
                    const apptAtSlot = dayAppts.find((a) => {
                      const d = new Date(a.appointment_date);
                      return d.getHours() === hour && d.getMinutes() === minutes;
                    });
                    const availSlots = getAvailForDay(day);
                    const hasSlot = availSlots.includes(slotTime);
                    const isDragSelected = drag.dragSelected.has(cellId);

                    return (
                      <div
                        key={cellId}
                        className={`border-l min-h-[28px] relative cursor-pointer transition-colors ${
                          isDragSelected
                            ? "bg-primary/25 ring-1 ring-inset ring-primary/40"
                            : hasSlot && !apptAtSlot
                            ? "bg-primary/5"
                            : "hover:bg-muted/30"
                        }`}
                        onPointerDown={(e) => {
                          e.preventDefault();
                          if (!apptAtSlot) drag.handlePointerDown(cellId);
                        }}
                        onPointerEnter={() => {
                          if (!apptAtSlot) drag.handlePointerEnter(cellId);
                        }}
                      >
                        {apptAtSlot ? (
                          <div
                            className={`text-xs p-1 rounded m-0.5 ${
                              apptAtSlot.appointment_type === "initial"
                                ? "bg-primary/15 text-primary"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            <p className="font-medium truncate text-[10px]">
                              {format(new Date(apptAtSlot.appointment_date), "HH:mm")}
                            </p>
                          </div>
                        ) : hasSlot ? (
                          <div className="flex items-center justify-center h-full group/slot">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover/slot:hidden" />
                            <button
                              className="hidden group-hover/slot:flex items-center justify-center"
                              onClick={(e) => { e.stopPropagation(); onRemoveSlot(dayIdx, slotTime); }}
                            >
                              <X className="h-3 w-3 text-destructive/70 hover:text-destructive" />
                            </button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Day View ---

interface DayViewProps {
  selectedDate: Date;
  existingSlots: string[];
  getAppointmentsForDay: (d: Date) => any[];
  drag: ReturnType<typeof useDragSelect>;
  onRemoveSlot: (slot: string) => void;
}

function DayView({ selectedDate, existingSlots, getAppointmentsForDay, drag, onRemoveSlot }: DayViewProps) {
  const dayAppts = getAppointmentsForDay(selectedDate);

  return (
    <div className="p-4 space-y-1 select-none">
      <h3 className="text-sm font-semibold mb-3">
        {format(selectedDate, "EEEE d MMMM", { locale: sv })}
      </h3>
      <p className="text-xs text-muted-foreground mb-3">Dra över tiderna nedan för att markera tillgänglighet</p>
      {HALF_HOURS.map((slotTime) => {
        const hour = parseInt(slotTime.split(":")[0]);
        const minutes = parseInt(slotTime.split(":")[1]);
        const appt = dayAppts.find((a) => {
          const d = new Date(a.appointment_date);
          return d.getHours() === hour && d.getMinutes() === minutes;
        });
        const hasSlot = existingSlots.includes(slotTime);
        const isDragSelected = drag.dragSelected.has(slotTime);
        const isHour = minutes === 0;

        return (
          <div
            key={slotTime}
            className={`flex items-center gap-3 py-2 px-3 rounded-lg cursor-pointer transition-colors ${
              isHour ? "border-t" : ""
            } ${
              isDragSelected
                ? "bg-primary/20 ring-1 ring-primary/30"
                : hasSlot
                ? "bg-primary/5"
                : appt
                ? ""
                : "hover:bg-muted/40"
            }`}
            onPointerDown={(e) => {
              e.preventDefault();
              if (!appt) drag.handlePointerDown(slotTime);
            }}
            onPointerEnter={() => {
              if (!appt) drag.handlePointerEnter(slotTime);
            }}
          >
            <span className="text-sm text-muted-foreground w-12 font-mono">{slotTime}</span>
            <div className="flex-1">
              {appt ? (
                <div className={`p-2 rounded text-sm ${
                  appt.appointment_type === "initial"
                    ? "bg-primary/10 text-primary"
                    : "bg-blue-50 text-blue-700"
                }`}>
                  <span className="font-medium">
                    Patient {appt.user_id?.slice(0, 8)}
                  </span>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {appt.appointment_type === "initial" ? "Nybesök" : "Uppföljning"}
                  </Badge>
                </div>
              ) : hasSlot ? (
                <div className="flex items-center gap-2 text-sm text-primary/70 flex-1 justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Ledig tid</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemoveSlot(slotTime); }}
                    className="rounded-full hover:bg-destructive/20 p-1 transition-colors"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ) : isDragSelected ? (
                <span className="text-xs text-primary/60">Markeras...</span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
