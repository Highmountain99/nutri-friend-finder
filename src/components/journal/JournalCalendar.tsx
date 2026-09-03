import { useState, useRef, useLayoutEffect } from "react";
import { format, subDays, isSameDay, isBefore, isAfter, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { Flame } from "lucide-react";
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
  streak?: number;
}

const WEEK_DAY_LETTER = ["S", "M", "T", "O", "T", "F", "L"];

// Start of the archive (January 1, 2025)
const ARCHIVE_START = new Date(2025, 0, 1);

// Number of days to show in each direction from today
const DAYS_BEFORE = 60;
const DAYS_AFTER = 0;

export function JournalCalendar({ selectedDate, onSelectDate, daysWithEntries, streak = 0 }: JournalCalendarProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    const itemWidth = 56;
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

  const daysWithEntriesAsDate = daysWithEntries.map(d => parseISO(d));

  return (
    <div className="screen-header bg-gold -mx-3 sm:-mx-4 px-4 pt-3 pb-5">
      {/* Date row */}
      <div className="flex items-center gap-2 mb-4">
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-baseline gap-2 min-w-0 text-left">
              <span className="display text-[26px] truncate">
                {format(selectedDate, "EEEE", { locale: sv })}
              </span>
              <span className="pill-highlight pill-highlight--light display text-[22px] py-0.5 whitespace-nowrap">
                {format(selectedDate, "d MMM", { locale: sv })}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && handleDateSelect(d)}
              disabled={(date) => isAfter(date, today) || isBefore(date, ARCHIVE_START)}
              modifiers={{ hasEntry: daysWithEntriesAsDate }}
              modifiersClassNames={{ hasEntry: "font-bold underline" }}
              locale={sv}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        {streak > 0 && (
          <span className="ml-auto shrink-0 inline-flex items-center gap-1 rounded-pill bg-terracotta px-3 py-1.5 text-[12px] font-bold text-card">
            <Flame className="w-3.5 h-3.5" strokeWidth={2.2} />
            {streak} dagar
          </span>
        )}
      </div>

      {/* Horizontally scrollable days */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4"
        style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
      >
        {allDates.map((date) => {
          const isSelected = isSameDay(date, selectedDate);
          const isFuture = isAfter(date, today);
          const hasEntry = hasEntries(date);
          const dayOfWeek = date.getDay();

          return (
            <button
              key={date.toISOString()}
              onClick={() => handleDayClick(date)}
              disabled={isFuture}
              style={{ scrollSnapAlign: "center" }}
              className={cn(
                "flex-shrink-0 w-12 h-12 rounded-pill flex flex-col items-center justify-center transition-all duration-200 relative leading-none",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : isFuture
                    ? "bg-card/40 text-primary/30 cursor-not-allowed"
                    : "bg-card text-primary"
              )}
            >
              <span className="text-[11px] font-bold">{WEEK_DAY_LETTER[dayOfWeek]}</span>
              <span className="text-[13px] font-semibold mt-0.5 opacity-80">{format(date, "d")}</span>

              {hasEntry && (
                <span
                  className={cn(
                    "absolute bottom-1 w-1 h-1 rounded-pill",
                    isSelected ? "bg-primary-foreground/70" : "bg-terracotta"
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
