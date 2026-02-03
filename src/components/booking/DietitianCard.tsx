import { Clock, Globe, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DietitianProfile, specializationLabels, languageLabels, TimeSlot } from "@/types/dietitian";
import { cn } from "@/lib/utils";

interface DietitianCardProps {
  dietitian: DietitianProfile;
  matchingSpecializations?: string[];
  nextAvailable?: { date: Date; slot: TimeSlot } | null;
  onSelect: (dietitian: DietitianProfile) => void;
  onViewTimes?: (dietitian: DietitianProfile) => void;
  variant?: 'large' | 'compact';
}

export function DietitianCard({
  dietitian,
  matchingSpecializations = [],
  nextAvailable,
  onSelect,
  onViewTimes,
  variant = 'large',
}: DietitianCardProps) {
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
    
    if (isToday) return `Idag kl. ${timeStr}`;
    if (isTomorrow) return `Imorgon kl. ${timeStr}`;
    
    return `${date.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' })} kl. ${timeStr}`;
  };

  if (variant === 'compact') {
    return (
      <Card 
        className="shadow-soft cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onSelect(dietitian)}
      >
        <CardContent className="p-4 flex items-center gap-4">
          <Avatar className="h-14 w-14">
            {dietitian.avatarUrl && <AvatarImage src={dietitian.avatarUrl} alt={`${dietitian.firstName} ${dietitian.lastName}`} />}
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground">
              {dietitian.firstName} {dietitian.lastName}
            </h3>
            <p className="text-sm text-muted-foreground">{dietitian.title}</p>
            {nextAvailable && (
              <p className="text-sm text-primary font-medium mt-1">
                Nästa tid: {formatNextAvailable()}
              </p>
            )}
          </div>
          
          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft overflow-hidden">
      {/* Avatar Section */}
      <div className="relative aspect-[4/3] bg-muted">
        {dietitian.avatarUrl ? (
          <img
            src={dietitian.avatarUrl}
            alt={`${dietitian.firstName} ${dietitian.lastName}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl font-bold text-muted-foreground">{initials}</span>
          </div>
        )}
      </div>

      <CardContent className="p-5 space-y-4">
        {/* Name and Title */}
        <div>
          <h3 className="text-xl font-semibold text-foreground">
            {dietitian.firstName} {dietitian.lastName}
          </h3>
          <p className="text-muted-foreground">{dietitian.title}</p>
        </div>

        {/* Next Available */}
        {nextAvailable && (
          <div className="flex items-center gap-2 text-sm text-primary">
            <Clock className="h-4 w-4" />
            <span className="font-medium">Nästa tid: {formatNextAvailable()}</span>
          </div>
        )}

        {/* Bio */}
        {dietitian.bio && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {dietitian.bio}
          </p>
        )}

        {/* Specializations */}
        {matchingSpecializations.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {matchingSpecializations.map((spec) => (
              <Badge key={spec} variant="secondary" className="bg-primary/10 text-primary">
                {specializationLabels[spec] || spec}
              </Badge>
            ))}
          </div>
        )}

        {/* Languages */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="h-4 w-4" />
          <span>
            {dietitian.languages.map((lang) => languageLabels[lang] || lang).join(', ')}
          </span>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2">
          <Button 
            className="w-full" 
            size="lg"
            onClick={() => onSelect(dietitian)}
          >
            Boka möte
          </Button>
          {onViewTimes && (
            <Button 
              variant="ghost" 
              className="w-full text-primary"
              onClick={() => onViewTimes(dietitian)}
            >
              Visa lediga tider
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
