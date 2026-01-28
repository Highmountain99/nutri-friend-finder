import { useState } from "react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { CalendarIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface MealTimeSelectorProps {
  value: Date;
  onChange: (date: Date) => void;
}

// Generate hour options 0-23
const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i.toString().padStart(2, "0"),
  label: i.toString().padStart(2, "0"),
}));

// Generate minute options in 5-minute intervals
const MINUTES = Array.from({ length: 12 }, (_, i) => ({
  value: (i * 5).toString().padStart(2, "0"),
  label: (i * 5).toString().padStart(2, "0"),
}));

export function MealTimeSelector({ value, onChange }: MealTimeSelectorProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    // Keep the existing time when changing the date
    const newDate = new Date(date);
    newDate.setHours(value.getHours(), value.getMinutes());
    onChange(newDate);
    setCalendarOpen(false);
  };
  
  const handleHourChange = (hour: string) => {
    const newDate = new Date(value);
    newDate.setHours(parseInt(hour, 10));
    onChange(newDate);
  };
  
  const handleMinuteChange = (minute: string) => {
    const newDate = new Date(value);
    newDate.setMinutes(parseInt(minute, 10));
    onChange(newDate);
  };
  
  const currentHour = value.getHours().toString().padStart(2, "0");
  const currentMinute = (Math.floor(value.getMinutes() / 5) * 5).toString().padStart(2, "0");
  
  return (
    <div className="flex gap-2">
      {/* Date picker */}
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "flex-1 justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(value, "d MMM", { locale: sv })}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-background" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDateSelect}
            disabled={(date) => date > new Date()}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
      
      {/* Time picker */}
      <div className="flex items-center gap-1">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <Select value={currentHour} onValueChange={handleHourChange}>
          <SelectTrigger className="w-16">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background max-h-48">
            {HOURS.map((hour) => (
              <SelectItem key={hour.value} value={hour.value}>
                {hour.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground">:</span>
        <Select value={currentMinute} onValueChange={handleMinuteChange}>
          <SelectTrigger className="w-16">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background">
            {MINUTES.map((minute) => (
              <SelectItem key={minute.value} value={minute.value}>
                {minute.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

