export interface DietitianProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  title: string;
  bio: string | null;
  avatarUrl: string | null;
  specializations: string[];
  languages: string[];
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeSlot {
  hour: number;
  minute: number;
  booked: boolean;
}

export interface DietitianAvailability {
  id: string;
  dietitianId: string;
  availableDate: Date;
  timeSlots: TimeSlot[];
  createdAt: Date;
}

export interface DbDietitianProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  title: string;
  bio: string | null;
  avatar_url: string | null;
  specializations: string[];
  languages: string[];
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbDietitianAvailability {
  id: string;
  dietitian_id: string;
  available_date: string;
  time_slots: TimeSlot[];
  created_at: string;
}

export function mapDbToDietitianProfile(db: DbDietitianProfile): DietitianProfile {
  return {
    id: db.id,
    userId: db.user_id,
    firstName: db.first_name,
    lastName: db.last_name,
    title: db.title,
    bio: db.bio,
    avatarUrl: db.avatar_url,
    specializations: db.specializations || [],
    languages: db.languages || [],
    isAvailable: db.is_available,
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
}

export function mapDbToDietitianAvailability(db: DbDietitianAvailability): DietitianAvailability {
  const rawSlots = db.time_slots || [];
  const timeSlots: TimeSlot[] = rawSlots.map((slot: any) => {
    // Handle string format "HH:MM" from dietitian schedule
    if (typeof slot === 'string') {
      const [h, m] = slot.split(':').map(Number);
      return { hour: h, minute: m || 0, booked: false };
    }
    // Already a TimeSlot object
    return {
      hour: Number(slot.hour),
      minute: Number(slot.minute) || 0,
      booked: Boolean(slot.booked),
    };
  });

  return {
    id: db.id,
    dietitianId: db.dietitian_id,
    availableDate: new Date(db.available_date),
    timeSlots,
    createdAt: new Date(db.created_at),
  };
}

// Mapping from intake concern categories to dietitian specializations
export const concernToSpecializationMap: Record<string, string[]> = {
  weight_loss: ['weight_loss'],
  diabetes: ['diabetes'],
  gut_health: ['gut_health'],
  general_health: ['general_health'],
  womens_health: ['womens_health'],
  emotional_eating: ['emotional_eating', 'eating_disorder'],
  eating_disorder: ['eating_disorder', 'emotional_eating'],
  heart_health: ['heart_health'],
  other: ['general_health'],
};

export const specializationLabels: Record<string, string> = {
  diabetes: 'Diabetes',
  weight_loss: 'Viktminskning',
  heart_health: 'Hjärthälsa',
  gut_health: 'Maghälsa',
  general_health: 'Allmän hälsa',
  eating_disorder: 'Ätstörningar',
  emotional_eating: 'Emotionellt ätande',
  womens_health: 'Kvinnohälsa',
};

export const languageLabels: Record<string, string> = {
  svenska: 'Svenska',
  engelska: 'Engelska',
  spanska: 'Spanska',
  finska: 'Finska',
  norska: 'Norska',
};
