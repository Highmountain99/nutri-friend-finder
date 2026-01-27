import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { IntakeFormData, PrimaryConcernCategory, CareSeekerType, RelationshipType, MotivationLevel, ActivityLevel } from '@/types/intake';
import { toast } from 'sonner';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

type IntakeProfileRow = Tables<'intake_profiles'>;
type IntakeProfileInsert = TablesInsert<'intake_profiles'>;

export function useIntakeProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<IntakeFormData & { currentStep: number; completedAt?: string } | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('intake_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching intake profile:', error);
        return;
      }

      if (data) {
        setProfile({
          careSeekerType: data.care_seeker_type as CareSeekerType | undefined,
          relationshipIfOther: data.relationship_if_other as RelationshipType | undefined,
          primaryConcernCategory: data.primary_concern_category as PrimaryConcernCategory | undefined,
          primaryConcernSubcategory: data.primary_concern_subcategory ?? undefined,
          concernTags: data.concern_tags || [],
          activityLevel: data.activity_level as ActivityLevel | undefined,
          motivationLevel: data.motivation_level as MotivationLevel | undefined,
          supportAreas: data.support_areas || [],
          aiFreeText: data.ai_free_text ?? undefined,
          aiParsedFields: data.ai_parsed_fields as IntakeFormData['aiParsedFields'],
          currentStep: data.current_step || 0,
          completedAt: data.completed_at ?? undefined,
        });
      }
    } catch (error) {
      console.error('Error fetching intake profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async (
    data: Partial<IntakeFormData> & { currentStep?: number },
    complete = false
  ) => {
    if (!user) return;

    setSaving(true);
    try {
      const updateData: IntakeProfileInsert = {
        user_id: user.id,
      };

      if (data.careSeekerType !== undefined) {
        updateData.care_seeker_type = data.careSeekerType;
      }
      if (data.relationshipIfOther !== undefined) {
        updateData.relationship_if_other = data.relationshipIfOther;
      }
      if (data.primaryConcernCategory !== undefined) {
        updateData.primary_concern_category = data.primaryConcernCategory;
      }
      if (data.primaryConcernSubcategory !== undefined) {
        updateData.primary_concern_subcategory = data.primaryConcernSubcategory;
      }
      if (data.concernTags !== undefined) {
        updateData.concern_tags = data.concernTags;
      }
      if (data.activityLevel !== undefined) {
        updateData.activity_level = data.activityLevel;
      }
      if (data.motivationLevel !== undefined) {
        updateData.motivation_level = data.motivationLevel;
      }
      if (data.supportAreas !== undefined) {
        updateData.support_areas = data.supportAreas;
      }
      if (data.aiFreeText !== undefined) {
        updateData.ai_free_text = data.aiFreeText;
      }
      if (data.aiParsedFields !== undefined) {
        updateData.ai_parsed_fields = data.aiParsedFields;
      }
      if (data.currentStep !== undefined) {
        updateData.current_step = data.currentStep;
      }
      if (complete) {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('intake_profiles')
        .upsert(updateData, { onConflict: 'user_id' });

      if (error) {
        console.error('Error saving intake profile:', error);
        toast.error('Kunde inte spara dina svar');
        return false;
      }

      await fetchProfile();
      return true;
    } catch (error) {
      console.error('Error saving intake profile:', error);
      toast.error('Något gick fel');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    profile,
    loading,
    saving,
    saveProfile,
    isCompleted: !!profile?.completedAt,
  };
}
