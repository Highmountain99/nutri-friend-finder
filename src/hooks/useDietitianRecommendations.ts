import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  DietitianProfile,
  DbDietitianProfile,
  mapDbToDietitianProfile,
  concernToSpecializationMap,
} from '@/types/dietitian';
import { useIntakeProfile } from './useIntakeProfile';

interface RecommendationResult {
  dietitian: DietitianProfile;
  matchScore: number;
  matchingSpecializations: string[];
}

export function useDietitianRecommendations(selectedDate?: Date, limit: number = 5) {
  const { profile } = useIntakeProfile();
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (selectedDate) {
      fetchRecommendations();
    }
  }, [selectedDate?.toISOString(), profile?.unifiedConcernCategory]);

  const fetchRecommendations = async () => {
    if (!selectedDate) return;

    try {
      setLoading(true);

      // Get dietitians available on selected date
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      const { data: availData } = await supabase
        .from('dietitian_availability')
        .select('dietitian_id, time_slots')
        .eq('available_date', dateStr);

      const availableDietitianIds = (availData || [])
        .filter((a) => {
          const slots = a.time_slots as unknown as Array<{ booked: boolean }>;
          return Array.isArray(slots) && slots.some((slot) => !slot.booked);
        })
        .map((a) => a.dietitian_id);

      if (availableDietitianIds.length === 0) {
        setRecommendations([]);
        setLoading(false);
        return;
      }

      // Fetch dietitian profiles
      const { data: dietitianData, error: queryError } = await supabase
        .from('dietitian_profiles')
        .select('*')
        .eq('is_available', true)
        .in('id', availableDietitianIds);

      if (queryError) throw queryError;

      const dietitians = (dietitianData as DbDietitianProfile[] || []).map(mapDbToDietitianProfile);

      // Calculate match scores based on user's intake profile
      const userConcern = profile?.unifiedConcernCategory || 'general_health';
      const targetSpecs = concernToSpecializationMap[userConcern] || ['general_health'];

      // Also consider pregnancy status
      const additionalSpecs: string[] = [];
      if (profile?.pregnancyStatus && !['not_pregnant', 'none'].includes(profile.pregnancyStatus)) {
        additionalSpecs.push('womens_health');
      }

      const allTargetSpecs = [...new Set([...targetSpecs, ...additionalSpecs])];

      const scored: RecommendationResult[] = dietitians.map((d) => {
        const matchingSpecs = d.specializations.filter((s) => allTargetSpecs.includes(s));
        const matchScore = matchingSpecs.length / allTargetSpecs.length;
        
        return {
          dietitian: d,
          matchScore,
          matchingSpecializations: matchingSpecs,
        };
      });

      // Sort by match score (highest first), then by name
      scored.sort((a, b) => {
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore;
        }
        return a.dietitian.firstName.localeCompare(b.dietitian.firstName);
      });

      setRecommendations(scored.slice(0, limit));
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch recommendations'));
    } finally {
      setLoading(false);
    }
  };

  return {
    recommendations,
    loading,
    error,
    refetch: fetchRecommendations,
  };
}
