import { useState } from "react";
import { format, startOfWeek, addDays, addWeeks, isSameDay, isBefore, isAfter, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";

interface JournalCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  daysWithEntries: string[];
}

const WEEK_DAYS = ["M", "T", "O", "T", "F", "L", "S"];

// Start of the archive (January 1, 2025)
const ARCHIVE_START = new Date(2025, 0, 1);

export function JournalCalendar({ selectedDate, onSelectDate, daysWithEntries }: JournalCalendarProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get the start of the displayed week (adjusted by offset)
  const baseWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const displayedWeekStart = weekOffset === 0 
    ? baseWeekStart 
    : addWeeks(baseWeekStart, weekOffset);
  
  // Generate dates for the displayed week
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(displayedWeekStart, i));

  // Check if a date has entries
  const hasEntries = (date: Date): boolean => {
    const dateStr = format(date, "yyyy-MM-dd");
    return daysWithEntries.includes(dateStr);
  };

  // Check if we can go to next week (not past today's week)
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const canGoNext = isBefore(displayedWeekStart, currentWeekStart);
  
  // Check if we can go to previous week (not before archive start)
  const canGoPrev = isAfter(displayedWeekStart, ARCHIVE_START);

  const handlePrevWeek = () => {
    if (canGoPrev) {
      setWeekOffset(prev => prev - 1);
    }
  };

  const handleNextWeek = () => {
    if (canGoNext) {
      setWeekOffset(prev => prev + 1);
    }
  };

  // Swipe gesture for week navigation
  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: handleNextWeek,  // Swipe left = go to next (newer) week
    onSwipeRight: handlePrevWeek, // Swipe right = go to previous (older) week
    threshold: 50,
  });

  const handleDateSelect = (date: Date) => {
    // Don't allow selecting future dates
    if (isAfter(date, today)) return;
    
    // Reset week offset and select the date
    setWeekOffset(0);
    onSelectDate(date);
    setCalendarOpen(false);
  };

  const handleDayClick = (date: Date) => {
    // Don't allow selecting future dates
    if (isAfter(date, today)) return;
    onSelectDate(date);
  };

  // Modifiers for the calendar to mark days with entries
  const daysWithEntriesAsDate = daysWithEntries.map(d => parseISO(d));

  return (
    <div className="space-y-3">
      {/* Week navigation with day buttons - swipeable */}
      <div 
        className="flex items-center gap-2 touch-pan-y"
        onTouchStart={swipeHandlers.onTouchStart}
        onTouchMove={swipeHandlers.onTouchMove}
        onTouchEnd={swipeHandlers.onTouchEnd}
      >
        {/* Previous week button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={handlePrevWeek}
          disabled={!canGoPrev}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* Week day circles */}
        <div className="flex gap-1 sm:gap-2 flex-1 justify-between sm:justify-center">
          {weekDates.map((date, index) => {
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, today);
            const isFuture = isAfter(date, today);
            const hasEntry = hasEntries(date);
            
            return (
              <button
                key={date.toISOString()}
                onClick={() => handleDayClick(date)}
                disabled={isFuture}
                className={cn(
                  "flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex flex-col items-center justify-center transition-all duration-200 relative",
                  isSelected 
                    ? "bg-primary text-primary-foreground shadow-soft" 
                    : isToday
                      ? "bg-primary/10 text-primary border-2 border-primary/30"
                      : isFuture
                        ? "bg-muted/50 text-muted-foreground/50 cursor-not-allowed"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <span className="text-[10px] sm:text-xs font-semibold">{WEEK_DAYS[index]}</span>
                <span className="text-[9px] sm:text-[10px]">{format(date, "d")}</span>
                
                {/* Entry indicator dot */}
                {hasEntry && !isSelected && (
                  <span className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full bg-accent" />
                )}
              </button>
            );
          })}
        </div>

        {/* Next week button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={handleNextWeek}
          disabled={!canGoNext}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Clickable date display with calendar popover */}
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <button className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1">
            <CalendarDays className="w-4 h-4" />
            <span>{format(selectedDate, "d MMMM yyyy", { locale: sv })}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && handleDateSelect(date)}
            disabled={(date) => isAfter(date, today) || isBefore(date, ARCHIVE_START)}
            fromDate={ARCHIVE_START}
            toDate={today}
            locale={sv}
            weekStartsOn={1}
            className="pointer-events-auto"
            modifiers={{
              hasEntry: daysWithEntriesAsDate,
            }}
            modifiersClassNames={{
              hasEntry: "has-entry",
            }}
          />
          <style>{`
            .has-entry::after {
              content: '';
              position: absolute;
              bottom: 2px;
              left: 50%;
              transform: translateX(-50%);
              width: 4px;
              height: 4px;
              border-radius: 50%;
              background-color: hsl(var(--accent));
            }
            .has-entry {
              position: relative;
            }
          `}</style>
        </PopoverContent>
      </Popover>
    </div>
  );
}
