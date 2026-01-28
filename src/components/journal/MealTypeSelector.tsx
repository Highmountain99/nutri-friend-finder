import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MEAL_TYPES = [
  { value: "Frukost", label: "🌅 Frukost" },
  { value: "Förmiddagssnack", label: "☀️ Förmiddagssnack" },
  { value: "Lunch", label: "🍽️ Lunch" },
  { value: "Mellanmål", label: "🍎 Mellanmål" },
  { value: "Middag", label: "🌙 Middag" },
  { value: "Kvällssnack", label: "🌜 Kvällssnack" },
] as const;

interface MealTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function MealTypeSelector({ value, onChange }: MealTypeSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Välj måltidstyp" />
      </SelectTrigger>
      <SelectContent className="bg-background">
        {MEAL_TYPES.map((type) => (
          <SelectItem key={type.value} value={type.value}>
            {type.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { MEAL_TYPES };
