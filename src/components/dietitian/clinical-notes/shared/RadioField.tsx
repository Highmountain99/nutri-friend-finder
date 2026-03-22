import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface RadioFieldProps {
  label: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
}

export function RadioField({ label, options, value, onChange }: RadioFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <RadioGroup value={value} onValueChange={onChange} className="flex flex-wrap gap-3">
        {options.map(opt => (
          <div key={opt} className="flex items-center space-x-2">
            <RadioGroupItem value={opt} id={`${label}-${opt}`} />
            <Label htmlFor={`${label}-${opt}`} className="text-sm cursor-pointer">{opt}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
