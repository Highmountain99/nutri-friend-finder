import { useState, useRef, useLayoutEffect } from "react";
import { format, addDays, subDays, isSameDay, isBefore, isAfter, parseISO, differenceInDays } from "date-fns";
import { sv } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface JournalCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  daysWithEntries: string[];
}

const WEEK_DAYS_SHORT = ["Sön", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör"];

// Start of the archive (January 1, 2025)
const ARCHIVE_START = new Date(2025, 0, 1);

// Number of days to show in each direction from today
const DAYS_BEFORE = 60;
const DAYS_AFTER = 0;

export function JournalCalendar({ selectedDate, onSelectDate, daysWithEntries }: JournalCalendarProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasScrolledToSelected = useRef(false);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Generate all dates from DAYS_BEFORE ago to today
  const allDates = Array.from({ length: DAYS_BEFORE + DAYS_AFTER + 1 }, (_, i) => 
    subDays(today, DAYS_BEFORE - i)
  ).filter(date => !isBefore(date, ARCHIVE_START));

  // Check if a date has entries
  const hasEntries = (date: Date): boolean => {
    const dateStr = format(date, "yyyy-MM-dd");
    return daysWithEntries.includes(dateStr);
  };

  // Position scroll on selected day synchronously before paint — no animation
  useLayoutEffect(() => {
    if (!scrollRef.current) return;
    const selectedIndex = allDates.findIndex(d => isSameDay(d, selectedDate));
    if (selectedIndex < 0) return;
    const itemWidth = 52;
    const containerWidth = scrollRef.current.clientWidth;
    const scrollPosition = (selectedIndex * itemWidth) - (containerWidth / 2) + (itemWidth / 2);
    scrollRef.current.scrollLeft = Math.max(0, scrollPosition);
  }, [selectedDate, allDates.length]);

  const handleDateSelect = (date: Date) => {
    if (isAfter(date, today)) return;
    onSelectDate(date);
    setCalendarOpen(false);
  };

  const handleDayClick = (date: Date) => {
    if (isAfter(date, today)) return;
    onSelectDate(date);
  };

  // Modifiers for the calendar to mark days with entries
  const daysWithEntriesAsDate = daysWithEntries.map(d => parseISO(d));

  return (
    <div className="space-y-3">
      {/* Horizontally scrollable days */}
      <div 
        ref={scrollRef}
        className="flex gap-1 overflow-x-auto scrollbar-hide pb-1 -mx-3 px-3 sm:-mx-4 sm:px-4"
        style={{ 
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {allDates.map((date) => {
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, today);
          const isFuture = isAfter(date, today);
          const hasEntry = hasEntries(date);
          const dayOfWeek = date.getDay();
          
          return (
            <button
              key={date.toISOString()}
              onClick={() => handleDayClick(date)}
              disabled={isFuture}
              style={{ scrollSnapAlign: 'center' }}
              className={cn(
                "flex-shrink-0 w-12 h-14 rounded-xl flex flex-col items-center justify-center transition-all duration-200 relative",
                isSelected 
                  ? "bg-primary text-primary-foreground shadow-soft scale-105" 
                  : isToday
                    ? "bg-primary/10 text-primary border-2 border-primary/30"
                    : isFuture
                      ? "bg-muted/50 text-muted-foreground/50 cursor-not-allowed"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
              )}
            >
              <span className="text-[10px] font-medium opacity-70">{WEEK_DAYS_SHORT[dayOfWeek]}</span>
              <span className="text-base font-bold">{format(date, "d")}</span>
              
              {/* Entry indicator dot */}
              {hasEntry && !isSelected && (
                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-accent" />
              )}
              {hasEntry && isSelected && (
                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-primary-foreground/70" />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Clickable date display with calendar popover */}
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <button className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1">
            <CalendarDays className="w-4 h-4" />
            <span>{format(selectedDate, "d MMMM yyyy", { locale: sv })}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-background" align="center">
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
