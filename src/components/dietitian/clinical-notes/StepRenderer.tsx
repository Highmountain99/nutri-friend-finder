import type { StepConfig } from "./types";
import { ChipSelect } from "./shared/ChipSelect";
import { RadioField } from "./shared/RadioField";
import { SliderField } from "./shared/SliderField";
import { NumericField } from "./shared/NumericField";
import { DropdownField } from "./shared/DropdownField";

interface StepRendererProps {
  step: StepConfig;
  data: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

export function StepRenderer({ step, data, onChange }: StepRendererProps) {
  return (
    <div className="space-y-5">
      <h3 className="text-base font-semibold">{step.title}</h3>
      {step.fields.map(field => {
        if (field.showIf && !field.showIf(data)) return null;

        switch (field.type) {
          case "chips":
            return (
              <ChipSelect
                key={field.key}
                label={field.label}
                options={field.options || []}
                value={Array.isArray(data[field.key]) ? data[field.key] : []}
                onChange={v => onChange(field.key, v)}
                multi={field.multi}
              />
            );
          case "radio":
            return (
              <RadioField
                key={field.key}
                label={field.label}
                options={field.options || []}
                value={data[field.key] || ""}
                onChange={v => onChange(field.key, v)}
              />
            );
          case "slider":
            return (
              <SliderField
                key={field.key}
                label={field.label}
                value={data[field.key] || field.min || 1}
                onChange={v => onChange(field.key, v)}
                min={field.min}
                max={field.max}
              />
            );
          case "numeric":
            return (
              <NumericField
                key={field.key}
                label={field.label}
                value={data[field.key] || ""}
                onChange={v => onChange(field.key, v)}
                unit={field.unit}
              />
            );
          case "dropdown":
            return (
              <DropdownField
                key={field.key}
                label={field.label}
                options={field.options || []}
                value={data[field.key] || ""}
                onChange={v => onChange(field.key, v)}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
