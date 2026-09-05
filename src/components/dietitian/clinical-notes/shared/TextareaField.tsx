import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useId } from "react";

interface TextareaFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  rows?: number;
}

export function TextareaField({ label, value, onChange, placeholder, required, error, rows = 3 }: TextareaFieldProps) {
  const id = useId();
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <Textarea
        id={id}
        rows={rows}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(error && "border-destructive focus-visible:ring-destructive")}
      />
      {error && <p id={`${id}-error`} className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
