import { ChevronRight, Clock } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DietitianProfile, TimeSlot } from "@/types/dietitian";
import { cn } from "@/lib/utils";

interface DietitianListItemProps {
  dietitian: DietitianProfile;
  nextAvailable?: { date: Date; slot: TimeSlot } | null;
  additionalSlotsCount?: number;
  onClick: () => void;
  className?: string;
}

export function DietitianListItem({
  dietitian,
  nextAvailable,
  additionalSlotsCount = 0,
  onClick,
  className,
}: DietitianListItemProps) {
  const initials = `${dietitian.firstName[0]}${dietitian.lastName[0]}`;

  const formatNextAvailable = () => {
    if (!nextAvailable) return null;
    const { date, slot } = nextAvailable;
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const timeStr = `${String(slot.hour).padStart(2, '0')}:${String(slot.minute).padStart(2, '0')}`;

    if (isToday) return `idag kl. ${timeStr}`;
    if (isTomorrow) return `imorgon kl. ${timeStr}`;

    return `${date.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' })} kl. ${timeStr}`;
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 p-4 bg-card rounded-lg border shadow-soft",
        "hover:shadow-md transition-all text-left",
        className
      )}
    >
      <Avatar className="h-14 w-14 flex-shrink-0">
        {dietitian.avatarUrl && (
          <AvatarImage
            src={dietitian.avatarUrl}
            alt={`${dietitian.firstName} ${dietitian.lastName}`}
          />
        )}
        <AvatarFallback className="bg-primary/10 text-primary font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground truncate">
          {dietitian.firstName} {dietitian.lastName}
        </h3>
        <p className="text-sm text-muted-foreground truncate">{dietitian.title}</p>
        
        {nextAvailable && (
          <div className="flex items-center gap-1 mt-1">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm text-primary font-medium">
              Nästa tid: {formatNextAvailable()}
            </span>
          </div>
        )}
        
        {additionalSlotsCount > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5">
            (+{additionalSlotsCount} andra passande tider)
          </p>
        )}
      </div>

      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
    </button>
  );
}
