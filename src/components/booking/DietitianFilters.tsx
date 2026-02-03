import { useState } from "react";
import { X, ChevronDown, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { specializationLabels, languageLabels } from "@/types/dietitian";
import { sv } from "date-fns/locale";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";

export interface FilterState {
  specializations: string[];
  languages: string[];
  date?: Date;
}

interface DietitianFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

const SPECIALIZATION_OPTIONS = Object.entries(specializationLabels);
const LANGUAGE_OPTIONS = Object.entries(languageLabels);

export function DietitianFilters({ filters, onChange }: DietitianFiltersProps) {
  const [specOpen, setSpecOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const hasActiveFilters = 
    filters.specializations.length > 0 || 
    filters.languages.length > 0 || 
    filters.date !== undefined;

  const toggleSpecialization = (spec: string) => {
    const newSpecs = filters.specializations.includes(spec)
      ? filters.specializations.filter((s) => s !== spec)
      : [...filters.specializations, spec];
    onChange({ ...filters, specializations: newSpecs });
  };

  const toggleLanguage = (lang: string) => {
    const newLangs = filters.languages.includes(lang)
      ? filters.languages.filter((l) => l !== lang)
      : [...filters.languages, lang];
    onChange({ ...filters, languages: newLangs });
  };

  const setDate = (date: Date | undefined) => {
    onChange({ ...filters, date });
    setDateOpen(false);
  };

  const clearFilters = () => {
    onChange({ specializations: [], languages: [], date: undefined });
  };

  return (
    <div className="space-y-3">
      <ScrollArea className="w-full">
        <div className="flex items-center gap-2 pb-1">
          {/* Symptom/Specialization Filter */}
          <Popover open={specOpen} onOpenChange={setSpecOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "shrink-0",
                  filters.specializations.length > 0 && "border-primary bg-primary/5"
                )}
              >
                Symptom
                {filters.specializations.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-primary text-primary-foreground">
                    {filters.specializations.length}
                  </Badge>
                )}
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="start">
              <div className="space-y-2">
                {SPECIALIZATION_OPTIONS.map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => toggleSpecialization(value)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                      filters.specializations.includes(value)
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Date Filter */}
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "shrink-0",
                  filters.date && "border-primary bg-primary/5"
                )}
              >
                <CalendarIcon className="h-4 w-4 mr-1" />
                {filters.date 
                  ? format(filters.date, "d MMM", { locale: sv })
                  : "Datum"
                }
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.date}
                onSelect={setDate}
                disabled={(date) => date < new Date() || date > addDays(new Date(), 30)}
                locale={sv}
              />
            </PopoverContent>
          </Popover>

          {/* Language Filter */}
          <Popover open={langOpen} onOpenChange={setLangOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "shrink-0",
                  filters.languages.length > 0 && "border-primary bg-primary/5"
                )}
              >
                Språk
                {filters.languages.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-primary text-primary-foreground">
                    {filters.languages.length}
                  </Badge>
                )}
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-3" align="start">
              <div className="space-y-2">
                {LANGUAGE_OPTIONS.map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => toggleLanguage(value)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                      filters.languages.includes(value)
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Rensa
            </Button>
          )}
        </div>
      </ScrollArea>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.specializations.map((spec) => (
            <Badge
              key={spec}
              variant="secondary"
              className="bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
              onClick={() => toggleSpecialization(spec)}
            >
              {specializationLabels[spec]}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
          {filters.languages.map((lang) => (
            <Badge
              key={lang}
              variant="secondary"
              className="bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
              onClick={() => toggleLanguage(lang)}
            >
              {languageLabels[lang]}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
          {filters.date && (
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
              onClick={() => setDate(undefined)}
            >
              {format(filters.date, "d MMMM", { locale: sv })}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
