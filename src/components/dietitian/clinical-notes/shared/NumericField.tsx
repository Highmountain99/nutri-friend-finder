import { Input } from "@/components/ui/input";

interface NumericFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  unit?: string;
}

export function NumericField({ label, value, onChange, unit }: NumericFieldProps) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-28"
          placeholder="—"
        />
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}
