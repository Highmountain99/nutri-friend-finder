import { RedFlagSymptom } from '@/types/intake';

export interface ScreeningOption {
  value: RedFlagSymptom;
  label: string;
  description?: string;
  routesToDietist: boolean;
  opensPregnancyTriage?: boolean;
}

export const screeningOptions: ScreeningOption[] = [
  {
    value: 'medical_diagnosis',
    label: 'Jag har fått en medicinsk diagnos som påverkar kosten',
    description: 't.ex. diabetes, celiaki, IBD, hjärt-kärlsjukdom',
    routesToDietist: true,
  },
  {
    value: 'pregnancy',
    label: 'Jag är gravid eller har nyligen varit gravid',
    routesToDietist: false, // Opens pregnancy triage instead
    opensPregnancyTriage: true,
  },
  {
    value: 'involuntary_weight_loss',
    label: 'Jag har ofrivillig viktminskning eller kraftiga magsymtom',
    routesToDietist: true,
  },
  {
    value: 'eating_disorder_risk',
    label: 'Jag har eller misstänker en ätstörning',
    routesToDietist: true,
  },
  {
    value: 'medication_risk',
    label: 'Jag tar mediciner där kosten kan påverka behandling',
    description: 'Osäker? Välj detta alternativ så hjälper vi dig.',
    routesToDietist: true,
  },
];

export const noneOfTheAboveOption = {
  value: 'none' as const,
  label: 'Inget av ovanstående',
  routesToDietist: false,
};
