import { useRef, useEffect } from "react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { sv } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface WeekDaySelectorProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const WEEK_DAYS = ["M", "T", "O", "T", "F", "L", "S"];

export function WeekDaySelector({ selectedDate, onSelectDate }: WeekDaySelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Get the start of the current week (Monday)
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  
  // Generate dates for the week
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Scroll to selected day on mount
  useEffect(() => {
    if (scrollRef.current) {
      const selectedIndex = weekDates.findIndex(date => isSameDay(date, selectedDate));
      const scrollAmount = selectedIndex * 56; // 48px button + 8px gap
      scrollRef.current.scrollTo({ left: scrollAmount - 100, behavior: 'smooth' });
    }
  }, [selectedDate]);

  return (
    <div className="space-y-2">
      {/* Week day circles */}
      <div 
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 px-1"
      >
        {weekDates.map((date, index) => {
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, new Date());
          
          return (
            <button
              key={date.toISOString()}
              onClick={() => onSelectDate(date)}
              className={cn(
                "flex-shrink-0 w-12 h-12 rounded-full flex flex-col items-center justify-center transition-all duration-200",
                isSelected 
                  ? "bg-primary text-primary-foreground shadow-soft" 
                  : isToday
                    ? "bg-primary/10 text-primary border-2 border-primary/30"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <span className="text-sm font-semibold">{WEEK_DAYS[index]}</span>
              <span className="text-xs">{format(date, "d")}</span>
            </button>
          );
        })}
      </div>
      
      {/* Selected date display */}
      <p className="text-center text-sm text-muted-foreground">
        {format(selectedDate, "d MMMM yyyy", { locale: sv })}
      </p>
    </div>
  );
}
