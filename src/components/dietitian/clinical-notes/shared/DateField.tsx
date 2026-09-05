import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useId } from "react";

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  error?: string;
}

export function DateField({ label, value, onChange, required, error }: DateFieldProps) {
  const id = useId();
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <Input
        id={id}
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn("w-full sm:w-56", error && "border-destructive focus-visible:ring-destructive")}
      />
      {error && <p id={`${id}-error`} className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
