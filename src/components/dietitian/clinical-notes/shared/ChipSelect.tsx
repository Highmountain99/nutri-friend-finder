import { cn } from "@/lib/utils";

interface ChipSelectProps {
  label: string;
  options: string[];
  value: string[];
  onChange: (val: string[]) => void;
  multi?: boolean;
}

export function ChipSelect({ label, options, value, onChange, multi = true }: ChipSelectProps) {
  const toggle = (opt: string) => {
    if (multi) {
      onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt]);
    } else {
      onChange(value.includes(opt) ? [] : [opt]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm border transition-colors",
              value.includes(opt)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-foreground border-border hover:bg-muted"
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
