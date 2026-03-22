import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import {
  DietitianAvailability,
  DbDietitianAvailability,
  mapDbToDietitianAvailability,
  TimeSlot,
} from '@/types/dietitian';

export function useDietitianAvailability(dietitianId?: string, date?: Date) {
  const [availability, setAvailability] = useState<DietitianAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (dietitianId && date) {
      fetchAvailability();
    } else {
      setAvailability(null);
      setLoading(false);
    }
  }, [dietitianId, date?.toISOString()]);

  const fetchAvailability = async () => {
    if (!dietitianId || !date) return;

    try {
      setLoading(true);
      const dateStr = format(date, 'yyyy-MM-dd');

      const { data, error: queryError } = await supabase
        .from('dietitian_availability')
        .select('*')
        .eq('dietitian_id', dietitianId)
        .eq('available_date', dateStr)
        .single();

      if (queryError && queryError.code !== 'PGRST116') {
        throw queryError;
      }

      if (data) {
        const dbAvail: DbDietitianAvailability = {
          ...data,
          time_slots: data.time_slots as unknown as TimeSlot[],
        };
        setAvailability(mapDbToDietitianAvailability(dbAvail));
      } else {
        setAvailability(null);
      }
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch availability'));
    } finally {
      setLoading(false);
    }
  };

  const getAvailableTimeSlots = (): TimeSlot[] => {
    if (!availability) return [];
    return availability.timeSlots.filter((slot) => !slot.booked);
  };

  return {
    availability,
    loading,
    error,
    getAvailableTimeSlots,
    refetch: fetchAvailability,
  };
}

export function useDietitianAvailabilityRange(dietitianId?: string, startDate?: Date, endDate?: Date) {
  const [availabilities, setAvailabilities] = useState<DietitianAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (dietitianId && startDate && endDate) {
      fetchAvailabilityRange();
    }
  }, [dietitianId, startDate?.toISOString(), endDate?.toISOString()]);

  const fetchAvailabilityRange = async () => {
    if (!dietitianId || !startDate || !endDate) return;

    try {
      setLoading(true);
      const startStr = format(startDate, 'yyyy-MM-dd');
      const endStr = format(endDate, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('dietitian_availability')
        .select('*')
        .eq('dietitian_id', dietitianId)
        .gte('available_date', startStr)
        .lte('available_date', endStr)
        .order('available_date');

      if (error) throw error;

      const mapped = (data || []).map((d) => {
        const dbAvail: DbDietitianAvailability = {
          ...d,
          time_slots: d.time_slots as unknown as TimeSlot[],
        };
        return mapDbToDietitianAvailability(dbAvail);
      });
      setAvailabilities(mapped);
    } catch (err) {
      console.error('Error fetching availability range:', err);
    } finally {
      setLoading(false);
    }
  };

  const getNextAvailableSlot = (): { date: Date; slot: TimeSlot } | null => {
    for (const avail of availabilities) {
      const freeSlot = avail.timeSlots.find((s) => !s.booked);
      if (freeSlot) {
        return { date: avail.availableDate, slot: freeSlot };
      }
    }
    return null;
  };

  return {
    availabilities,
    loading,
    getNextAvailableSlot,
    refetch: fetchAvailabilityRange,
  };
}
