import { Button } from "@/components/ui/button";
import { TimeSlot } from "@/types/dietitian";
import { cn } from "@/lib/utils";

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelect: (slot: TimeSlot) => void;
  loading?: boolean;
}

export function TimeSlotPicker({
  slots,
  selectedSlot,
  onSelect,
  loading = false,
}: TimeSlotPickerProps) {
  const availableSlots = slots.filter((slot) => !slot.booked);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-12 rounded-md bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (availableSlots.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-4">
        Inga lediga tider detta datum
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {availableSlots.map((slot) => {
        const isSelected =
          selectedSlot?.hour === slot.hour &&
          selectedSlot?.minute === slot.minute;
        
        const timeStr = `${String(slot.hour).padStart(2, '0')}:${String(slot.minute).padStart(2, '0')}`;

        return (
          <Button
            key={`${slot.hour}-${slot.minute}`}
            variant={isSelected ? "default" : "outline"}
            onClick={() => onSelect(slot)}
            className={cn(
              "h-12",
              isSelected && "ring-2 ring-primary ring-offset-2"
            )}
          >
            {timeStr}
          </Button>
        );
      })}
    </div>
  );
}
