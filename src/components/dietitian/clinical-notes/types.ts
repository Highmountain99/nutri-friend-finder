import type { LucideIcon } from "lucide-react";

export type FieldType =
  | 'chips'
  | 'radio'
  | 'slider'
  | 'numeric'
  | 'dropdown'
  | 'text'
  | 'textarea'
  | 'date';

export interface FieldConfig {
  type: FieldType;
  key: string;
  label: string;
  options?: string[];
  multi?: boolean;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
  required?: boolean;
  showIf?: (data: Record<string, any>) => boolean;
}

export interface StepConfig {
  title: string;
  fields: FieldConfig[];
}

export interface JournalText {
  anamnesis: string;
  assessment: string;
  action: string;
  next_steps: string;
}

export interface AreaConfig {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
  steps: StepConfig[];
  generateJournalText: (data: Record<string, any>) => JournalText;
}

/** Legacy (dietitian) configs kept for backwards compatibility with saved notes. */
export interface LegacyAreaConfig extends Omit<AreaConfig, 'icon'> {
  icon: string;
}

export interface AISuggestion {
  summary: string;
  focusAreas: string[];
  actions: string[];
  followUp: string;
}
