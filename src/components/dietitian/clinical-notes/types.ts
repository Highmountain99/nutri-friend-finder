export type FieldType = 'chips' | 'radio' | 'slider' | 'numeric' | 'dropdown';

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
  showIf?: (data: Record<string, any>) => boolean;
}

export interface StepConfig {
  title: string;
  fields: FieldConfig[];
}

export interface AreaConfig {
  id: string;
  title: string;
  icon: string;
  description: string;
  steps: StepConfig[];
  generateJournalText: (data: Record<string, any>) => {
    anamnesis: string;
    assessment: string;
    action: string;
    next_steps: string;
  };
}

export interface AISuggestion {
  summary: string;
  focusAreas: string[];
  actions: string[];
  followUp: string;
}
