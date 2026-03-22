import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DropdownFieldProps {
  label: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
}

export function DropdownField({ label, options, value, onChange }: DropdownFieldProps) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Välj..." />
        </SelectTrigger>
        <SelectContent>
          {options.map(opt => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
