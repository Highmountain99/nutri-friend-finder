import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIntakeProfile } from './useIntakeProfile';
import { supabase } from '@/integrations/supabase/client';
import { ProgressData, HealthEntry, WeeklyStats, METRIC_CONFIGS, MetricType, ProgressConcernCategory } from '@/types/progress';
import { startOfWeek, endOfWeek, subDays, format } from 'date-fns';

export function useProgressData(): ProgressData {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useIntakeProfile();
  const [healthEntries, setHealthEntries] = useState<HealthEntry[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    activeDays: 0,
    totalDays: 7,
  });
  const [loading, setLoading] = useState(true);

  // Use unifiedConcernCategory first, fallback to primaryConcernCategory for legacy profiles
  const concernCategory: ProgressConcernCategory | null = 
    profile?.unifiedConcernCategory || profile?.primaryConcernCategory || null;

  useEffect(() => {
    if (!user || profileLoading) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Get relevant metrics for this condition
        const metricsToFetch = concernCategory 
          ? METRIC_CONFIGS[concernCategory] 
          : ['weight'];

        // Fetch health entries from last 30 days
        const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
        
        if (metricsToFetch.length > 0) {
          const { data: entries, error } = await supabase
            .from('health_tracking_entries')
            .select('*')
            .eq('user_id', user.id)
            .in('metric_type', metricsToFetch)
            .gte('entry_date', thirtyDaysAgo)
            .order('entry_date', { ascending: false });

          if (!error && entries) {
            setHealthEntries(entries as HealthEntry[]);
          }
        }

        // Fetch weekly nutrition stats
        const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
        const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

        const { data: nutritionEntries, error: nutritionError } = await supabase
          .from('nutrition_entries')
          .select('entry_date, calories')
          .eq('user_id', user.id)
          .gte('entry_date', weekStart)
          .lte('entry_date', weekEnd);

        if (!nutritionError && nutritionEntries) {
          const uniqueDays = new Set(nutritionEntries.map(e => e.entry_date));
          const totalCalories = nutritionEntries.reduce((sum, e) => sum + (e.calories || 0), 0);
          
          setWeeklyStats(prev => ({
            ...prev,
            activeDays: uniqueDays.size,
            mealsLogged: nutritionEntries.length,
            caloriesAvg: uniqueDays.size > 0 ? Math.round(totalCalories / uniqueDays.size) : 0,
          }));
        }

        // For gut health, fetch symptom-free days
        if (concernCategory === 'gut_health') {
          const { data: symptoms, error: symptomError } = await supabase
            .from('symptom_entries')
            .select('entry_date')
            .eq('user_id', user.id)
            .gte('entry_date', weekStart)
            .lte('entry_date', weekEnd);

          if (!symptomError) {
            const symptomDays = new Set(symptoms?.map(s => s.entry_date) || []);
            setWeeklyStats(prev => ({
              ...prev,
              symptomFreeDays: 7 - symptomDays.size,
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching progress data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, concernCategory, profileLoading]);

  // Calculate treatment phase based on intake profile completion date
  const calculateTreatmentPhase = () => {
    if (!profile?.completedAt) return null;

    const startDate = new Date(profile.completedAt);
    const now = new Date();
    const weeksPassed = Math.floor((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

    switch (concernCategory) {
      case 'weight_loss':
        return {
          name: weeksPassed < 4 ? 'Startfas' : weeksPassed < 8 ? 'Aktiv fas' : 'Underhållsfas',
          currentPhase: Math.min(Math.floor(weeksPassed / 4) + 1, 3),
          totalPhases: 3,
          startDate: profile.completedAt,
          weeksInPhase: weeksPassed,
        };
      case 'gut_health':
        return {
          name: weeksPassed < 2 ? 'Eliminering' : weeksPassed < 6 ? 'Återintroduktion' : 'Personalisering',
          currentPhase: weeksPassed < 2 ? 1 : weeksPassed < 6 ? 2 : 3,
          totalPhases: 3,
          startDate: profile.completedAt,
          weeksInPhase: weeksPassed,
        };
      default:
        return {
          name: 'Pågående',
          currentPhase: 1,
          totalPhases: 1,
          startDate: profile.completedAt,
          weeksInPhase: weeksPassed,
        };
    }
  };

  // Generate milestones based on condition
  const generateMilestones = () => {
    const weightEntries = healthEntries.filter(e => e.metric_type === 'weight');
    const latestWeight = weightEntries[0]?.value;
    const firstWeight = weightEntries[weightEntries.length - 1]?.value;

    switch (concernCategory) {
      case 'weight_loss':
        const weightLost = firstWeight && latestWeight ? firstWeight - latestWeight : 0;
        return [
          { id: '1', title: 'Första kilon', description: 'Tappa ditt första kilo', completed: weightLost >= 1 },
          { id: '2', title: '5 kg milstolpe', description: 'Nå 5 kg viktminskning', completed: weightLost >= 5, progress: Math.min((weightLost / 5) * 100, 100) },
          { id: '3', title: '7 dagars svit', description: 'Logga 7 dagar i rad', completed: weeklyStats.activeDays >= 7 },
        ];
      case 'diabetes':
        return [
          { id: '1', title: 'Första loggningen', description: 'Logga ditt första blodsocker', completed: healthEntries.length > 0 },
          { id: '2', title: 'Veckorutin', description: 'Logga varje dag i en vecka', completed: weeklyStats.activeDays >= 7 },
          { id: '3', title: 'I målintervall', description: 'Håll blodsockret stabilt en hel dag', completed: false },
        ];
      default:
        return [
          { id: '1', title: '7 dagars svit', description: 'Logga 7 dagar i rad', completed: weeklyStats.activeDays >= 7 },
          { id: '2', title: 'Första samtalet', description: 'Genomför ditt första samtal', completed: false },
        ];
    }
  };

  return {
    concernCategory,
    healthEntries,
    milestones: generateMilestones(),
    weeklyStats,
    treatmentPhase: calculateTreatmentPhase(),
    loading: loading || profileLoading,
  };
}
