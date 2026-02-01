import { PrimaryConcernCategory } from './intake';

export type MetricType = 
  | 'weight'
  | 'blood_sugar_fasting'
  | 'blood_sugar_post_meal'
  | 'hba1c'
  | 'blood_pressure_systolic'
  | 'blood_pressure_diastolic'
  | 'cholesterol_total'
  | 'cholesterol_ldl'
  | 'cholesterol_hdl'
  | 'triglycerides'
  | 'waist_circumference';

export interface HealthEntry {
  id: string;
  user_id: string;
  entry_date: string;
  metric_type: MetricType;
  value: number;
  unit: string | null;
  notes: string | null;
  created_at: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  progress?: number;
  targetValue?: number;
  currentValue?: number;
}

export interface WeeklyStats {
  activeDays: number;
  totalDays: number;
  caloriesAvg?: number;
  caloriesGoal?: number;
  symptomFreeDays?: number;
  mealsLogged?: number;
}

export interface TreatmentPhase {
  name: string;
  currentPhase: number;
  totalPhases: number;
  startDate?: string;
  weeksInPhase?: number;
}

export interface ProgressData {
  concernCategory: PrimaryConcernCategory | null;
  healthEntries: HealthEntry[];
  milestones: Milestone[];
  weeklyStats: WeeklyStats;
  treatmentPhase: TreatmentPhase | null;
  loading: boolean;
}

// Metric configurations per condition
export const METRIC_CONFIGS: Record<PrimaryConcernCategory, MetricType[]> = {
  weight_loss: ['weight', 'waist_circumference'],
  diabetes: ['blood_sugar_fasting', 'blood_sugar_post_meal', 'hba1c'],
  gut_health: [], // Uses symptom_entries instead
  general_health: ['weight'],
  womens_health: ['weight', 'waist_circumference'],
  emotional_eating: [], // No weight/calorie tracking
  eating_disorder: [], // No weight/calorie tracking - focus on meal regularity
  heart_health: ['blood_pressure_systolic', 'blood_pressure_diastolic', 'cholesterol_total', 'cholesterol_ldl', 'cholesterol_hdl'],
  other: ['weight'],
};

export const METRIC_LABELS: Record<MetricType, { label: string; unit: string }> = {
  weight: { label: 'Vikt', unit: 'kg' },
  blood_sugar_fasting: { label: 'Fasteblodsocker', unit: 'mmol/L' },
  blood_sugar_post_meal: { label: 'Blodsocker efter mat', unit: 'mmol/L' },
  hba1c: { label: 'HbA1c', unit: '%' },
  blood_pressure_systolic: { label: 'Systoliskt blodtryck', unit: 'mmHg' },
  blood_pressure_diastolic: { label: 'Diastoliskt blodtryck', unit: 'mmHg' },
  cholesterol_total: { label: 'Totalkolesterol', unit: 'mmol/L' },
  cholesterol_ldl: { label: 'LDL-kolesterol', unit: 'mmol/L' },
  cholesterol_hdl: { label: 'HDL-kolesterol', unit: 'mmol/L' },
  triglycerides: { label: 'Triglycerider', unit: 'mmol/L' },
  waist_circumference: { label: 'Midjemått', unit: 'cm' },
};
