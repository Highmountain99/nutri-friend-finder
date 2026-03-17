import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  DietitianProfile,
  DbDietitianProfile,
  mapDbToDietitianProfile,
} from '@/types/dietitian';

export interface DietitianFilters {
  specializations?: string[];
  languages?: string[];
  date?: Date;
}

export function useDietitians(filters?: DietitianFilters) {
  const [dietitians, setDietitians] = useState<DietitianProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchDietitians();
  }, [filters?.specializations?.join(','), filters?.languages?.join(','), filters?.date?.toISOString()]);

  const fetchDietitians = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('dietitian_profiles')
        .select('id, user_id, first_name, last_name, title, bio, avatar_url, specializations, languages, is_available, created_at, updated_at')
        .eq('is_available', true);

      // Filter by specializations if provided
      if (filters?.specializations && filters.specializations.length > 0) {
        query = query.overlaps('specializations', filters.specializations);
      }

      // Filter by languages if provided
      if (filters?.languages && filters.languages.length > 0) {
        query = query.overlaps('languages', filters.languages);
      }

      const { data, error: queryError } = await query.order('first_name');

      if (queryError) throw queryError;

      let profiles = (data as DbDietitianProfile[] || []).map(mapDbToDietitianProfile);

      // If date filter is provided, filter by availability
      if (filters?.date) {
        const dateStr = filters.date.toISOString().split('T')[0];
        const { data: availData } = await supabase
          .from('dietitian_availability')
          .select('dietitian_id')
          .eq('available_date', dateStr)
          .gt('time_slots', '[]');

        if (availData) {
          const availableIds = new Set(availData.map((a: { dietitian_id: string }) => a.dietitian_id));
          profiles = profiles.filter((d) => availableIds.has(d.id));
        }
      }

      setDietitians(profiles);
    } catch (err) {
      console.error('Error fetching dietitians:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch dietitians'));
    } finally {
      setLoading(false);
    }
  };

  return {
    dietitians,
    loading,
    error,
    refetch: fetchDietitians,
  };
}
