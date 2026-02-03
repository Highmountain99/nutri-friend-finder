import { RedFlagSymptom } from '@/types/intake';

export interface ScreeningOption {
  value: RedFlagSymptom;
  label: string;
  description?: string;
}

// Screening options - now informational, not gate-keeping
export const screeningOptions: ScreeningOption[] = [
  {
    value: 'medical_diagnosis',
    label: 'Jag har fått en medicinsk diagnos som kan påverka kosten',
    description: 't.ex. diabetes, celiaki, IBD, hjärt-kärlsjukdom',
  },
  {
    value: 'pregnancy',
    label: 'Jag är gravid eller har nyligen varit gravid',
  },
  {
    value: 'involuntary_weight_loss',
    label: 'Jag har symptom som oroar mig',
    description: 't.ex. ofrivillig viktminskning, kraftiga magsymtom',
  },
  {
    value: 'eating_disorder_risk',
    label: 'Jag har eller misstänker en ätstörning',
  },
  {
    value: 'medication_risk',
    label: 'Jag tar mediciner som kan påverka kosten',
    description: 'Osäker? Välj detta alternativ så hjälper vi dig.',
  },
];

// Special option to force dietist path
export const wantDietistOption = {
  value: 'want_dietist' as const,
  label: 'Jag vill träffa en dietist oavsett',
};

export const noneOfTheAboveOption = {
  value: 'none' as const,
  label: 'Inget av ovanstående / osäker',
};
