export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      apple_health_settings: {
        Row: {
          connected: boolean | null
          created_at: string | null
          id: string
          last_sync_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          connected?: boolean | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          connected?: boolean | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_type: string
          created_at: string
          dietitian_id: string | null
          id: string
          notes: string | null
          payment_method_saved: boolean | null
          status: string
          stripe_customer_id: string | null
          stripe_setup_intent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_date: string
          appointment_type?: string
          created_at?: string
          dietitian_id?: string | null
          id?: string
          notes?: string | null
          payment_method_saved?: boolean | null
          status?: string
          stripe_customer_id?: string | null
          stripe_setup_intent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_date?: string
          appointment_type?: string
          created_at?: string
          dietitian_id?: string | null
          id?: string
          notes?: string | null
          payment_method_saved?: boolean | null
          status?: string
          stripe_customer_id?: string | null
          stripe_setup_intent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_dietitian_id_fkey"
            columns: ["dietitian_id"]
            isOneToOne: false
            referencedRelation: "dietitian_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_type: string
          created_at: string
          escalated: boolean | null
          escalation_reason: string | null
          id: string
          sender: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_type?: string
          created_at?: string
          escalated?: boolean | null
          escalation_reason?: string | null
          id?: string
          sender: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_type?: string
          created_at?: string
          escalated?: boolean | null
          escalation_reason?: string | null
          id?: string
          sender?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_health_metrics: {
        Row: {
          active_energy_kcal: number | null
          created_at: string | null
          id: string
          metric_date: string
          steps: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_energy_kcal?: number | null
          created_at?: string | null
          id?: string
          metric_date?: string
          steps?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_energy_kcal?: number | null
          created_at?: string | null
          id?: string
          metric_date?: string
          steps?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      dietist_patient_assignments: {
        Row: {
          created_at: string | null
          dietist_id: string
          id: string
          patient_id: string
        }
        Insert: {
          created_at?: string | null
          dietist_id: string
          id?: string
          patient_id: string
        }
        Update: {
          created_at?: string | null
          dietist_id?: string
          id?: string
          patient_id?: string
        }
        Relationships: []
      }
      dietitian_availability: {
        Row: {
          available_date: string
          created_at: string
          dietitian_id: string
          id: string
          time_slots: Json
        }
        Insert: {
          available_date: string
          created_at?: string
          dietitian_id: string
          id?: string
          time_slots?: Json
        }
        Update: {
          available_date?: string
          created_at?: string
          dietitian_id?: string
          id?: string
          time_slots?: Json
        }
        Relationships: [
          {
            foreignKeyName: "dietitian_availability_dietitian_id_fkey"
            columns: ["dietitian_id"]
            isOneToOne: false
            referencedRelation: "dietitian_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dietitian_journal_entries: {
        Row: {
          action: string | null
          anamnesis: string | null
          appointment_id: string | null
          assessment: string | null
          created_at: string
          dietitian_id: string
          id: string
          next_steps: string | null
          patient_id: string
          updated_at: string
        }
        Insert: {
          action?: string | null
          anamnesis?: string | null
          appointment_id?: string | null
          assessment?: string | null
          created_at?: string
          dietitian_id: string
          id?: string
          next_steps?: string | null
          patient_id: string
          updated_at?: string
        }
        Update: {
          action?: string | null
          anamnesis?: string | null
          appointment_id?: string | null
          assessment?: string | null
          created_at?: string
          dietitian_id?: string
          id?: string
          next_steps?: string | null
          patient_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dietitian_journal_entries_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      dietitian_notes: {
        Row: {
          content: string
          created_at: string
          dietitian_id: string
          id: string
          patient_id: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          dietitian_id: string
          id?: string
          patient_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          dietitian_id?: string
          id?: string
          patient_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      dietitian_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          first_name: string
          id: string
          is_available: boolean | null
          languages: string[] | null
          last_name: string
          specializations: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          first_name: string
          id?: string
          is_available?: boolean | null
          languages?: string[] | null
          last_name: string
          specializations?: string[] | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          first_name?: string
          id?: string
          is_available?: boolean | null
          languages?: string[] | null
          last_name?: string
          specializations?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      health_tracking_entries: {
        Row: {
          created_at: string
          entry_date: string
          id: string
          metric_type: string
          notes: string | null
          unit: string | null
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          entry_date?: string
          id?: string
          metric_type: string
          notes?: string | null
          unit?: string | null
          updated_at?: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          entry_date?: string
          id?: string
          metric_type?: string
          notes?: string | null
          unit?: string | null
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      intake_profiles: {
        Row: {
          activity_level: Database["public"]["Enums"]["activity_level"] | null
          ai_free_text: string | null
          ai_parsed_fields: Json | null
          care_seeker_type:
            | Database["public"]["Enums"]["care_seeker_type"]
            | null
          coach_concern_category: string | null
          coach_concern_subcategory: string | null
          completed_at: string | null
          concern_tags: string[] | null
          created_at: string
          current_step: number | null
          id: string
          motivation_level:
            | Database["public"]["Enums"]["motivation_level"]
            | null
          preference_tags: string[] | null
          pregnancy_referred_by_care: boolean | null
          pregnancy_status: string | null
          pregnancy_triage_reason: string | null
          primary_concern_category:
            | Database["public"]["Enums"]["primary_concern_category"]
            | null
          primary_concern_subcategory: string | null
          provider_category: string | null
          red_flag_symptoms: string[] | null
          relationship_if_other:
            | Database["public"]["Enums"]["relationship_type"]
            | null
          support_areas: string[] | null
          triage_reason_code: string | null
          triage_result: string | null
          unified_concern_category: string | null
          updated_at: string
          user_id: string
          wants_dietist: boolean | null
        }
        Insert: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          ai_free_text?: string | null
          ai_parsed_fields?: Json | null
          care_seeker_type?:
            | Database["public"]["Enums"]["care_seeker_type"]
            | null
          coach_concern_category?: string | null
          coach_concern_subcategory?: string | null
          completed_at?: string | null
          concern_tags?: string[] | null
          created_at?: string
          current_step?: number | null
          id?: string
          motivation_level?:
            | Database["public"]["Enums"]["motivation_level"]
            | null
          preference_tags?: string[] | null
          pregnancy_referred_by_care?: boolean | null
          pregnancy_status?: string | null
          pregnancy_triage_reason?: string | null
          primary_concern_category?:
            | Database["public"]["Enums"]["primary_concern_category"]
            | null
          primary_concern_subcategory?: string | null
          provider_category?: string | null
          red_flag_symptoms?: string[] | null
          relationship_if_other?:
            | Database["public"]["Enums"]["relationship_type"]
            | null
          support_areas?: string[] | null
          triage_reason_code?: string | null
          triage_result?: string | null
          unified_concern_category?: string | null
          updated_at?: string
          user_id: string
          wants_dietist?: boolean | null
        }
        Update: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          ai_free_text?: string | null
          ai_parsed_fields?: Json | null
          care_seeker_type?:
            | Database["public"]["Enums"]["care_seeker_type"]
            | null
          coach_concern_category?: string | null
          coach_concern_subcategory?: string | null
          completed_at?: string | null
          concern_tags?: string[] | null
          created_at?: string
          current_step?: number | null
          id?: string
          motivation_level?:
            | Database["public"]["Enums"]["motivation_level"]
            | null
          preference_tags?: string[] | null
          pregnancy_referred_by_care?: boolean | null
          pregnancy_status?: string | null
          pregnancy_triage_reason?: string | null
          primary_concern_category?:
            | Database["public"]["Enums"]["primary_concern_category"]
            | null
          primary_concern_subcategory?: string | null
          provider_category?: string | null
          red_flag_symptoms?: string[] | null
          relationship_if_other?:
            | Database["public"]["Enums"]["relationship_type"]
            | null
          support_areas?: string[] | null
          triage_reason_code?: string | null
          triage_result?: string | null
          unified_concern_category?: string | null
          updated_at?: string
          user_id?: string
          wants_dietist?: boolean | null
        }
        Relationships: []
      }
      nutrition_entries: {
        Row: {
          calories: number | null
          carbs: number | null
          created_at: string | null
          entry_date: string
          fat: number | null
          id: string
          image_url: string | null
          is_ai_estimated: boolean | null
          meal_name: string | null
          meal_type: string | null
          protein: number | null
          user_id: string
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          created_at?: string | null
          entry_date?: string
          fat?: number | null
          id?: string
          image_url?: string | null
          is_ai_estimated?: boolean | null
          meal_name?: string | null
          meal_type?: string | null
          protein?: number | null
          user_id: string
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          created_at?: string | null
          entry_date?: string
          fat?: number | null
          id?: string
          image_url?: string | null
          is_ai_estimated?: boolean | null
          meal_name?: string | null
          meal_type?: string | null
          protein?: number | null
          user_id?: string
        }
        Relationships: []
      }
      patient_documents: {
        Row: {
          created_at: string
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          patient_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          patient_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          patient_id?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      patient_progress_config: {
        Row: {
          concern_category_override: string | null
          created_at: string | null
          dietitian_id: string
          id: string
          patient_id: string
          updated_at: string | null
          visible_metrics: string[] | null
        }
        Insert: {
          concern_category_override?: string | null
          created_at?: string | null
          dietitian_id: string
          id?: string
          patient_id: string
          updated_at?: string | null
          visible_metrics?: string[] | null
        }
        Update: {
          concern_category_override?: string | null
          created_at?: string | null
          dietitian_id?: string
          id?: string
          patient_id?: string
          updated_at?: string | null
          visible_metrics?: string[] | null
        }
        Relationships: []
      }
      recipe_import_queue: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          parsed_data: Json | null
          processed_at: string | null
          scraped_data: Json | null
          source_url: string
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          parsed_data?: Json | null
          processed_at?: string | null
          scraped_data?: Json | null
          source_url: string
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          parsed_data?: Json | null
          processed_at?: string | null
          scraped_data?: Json | null
          source_url?: string
          status?: string
        }
        Relationships: []
      }
      recipe_ratings: {
        Row: {
          created_at: string | null
          id: string
          rating: number
          recipe_id: string
          review_text: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          rating: number
          recipe_id: string
          review_text?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          rating?: number
          recipe_id?: string
          review_text?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ratings_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          allergen_free: string[] | null
          calories_per_serving: number | null
          carbs_per_serving: number | null
          category: string | null
          created_at: string | null
          created_by: string | null
          cuisine_types: string[] | null
          description: string | null
          dietary_needs: string[] | null
          difficulty: string | null
          fat_per_serving: number | null
          health_plans: string[] | null
          id: string
          image_url: string | null
          ingredients: Json | null
          instructions: Json | null
          is_climate_smart: boolean | null
          is_featured: boolean | null
          meal_types: string[] | null
          nutrition_details: Json | null
          protein_per_serving: number | null
          rating: number | null
          rating_count: number | null
          servings: number | null
          similar_recipe_ids: string[] | null
          source_url: string | null
          tags: string[] | null
          time_minutes: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          allergen_free?: string[] | null
          calories_per_serving?: number | null
          carbs_per_serving?: number | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          cuisine_types?: string[] | null
          description?: string | null
          dietary_needs?: string[] | null
          difficulty?: string | null
          fat_per_serving?: number | null
          health_plans?: string[] | null
          id?: string
          image_url?: string | null
          ingredients?: Json | null
          instructions?: Json | null
          is_climate_smart?: boolean | null
          is_featured?: boolean | null
          meal_types?: string[] | null
          nutrition_details?: Json | null
          protein_per_serving?: number | null
          rating?: number | null
          rating_count?: number | null
          servings?: number | null
          similar_recipe_ids?: string[] | null
          source_url?: string | null
          tags?: string[] | null
          time_minutes?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          allergen_free?: string[] | null
          calories_per_serving?: number | null
          carbs_per_serving?: number | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          cuisine_types?: string[] | null
          description?: string | null
          dietary_needs?: string[] | null
          difficulty?: string | null
          fat_per_serving?: number | null
          health_plans?: string[] | null
          id?: string
          image_url?: string | null
          ingredients?: Json | null
          instructions?: Json | null
          is_climate_smart?: boolean | null
          is_featured?: boolean | null
          meal_types?: string[] | null
          nutrition_details?: Json | null
          protein_per_serving?: number | null
          rating?: number | null
          rating_count?: number | null
          servings?: number | null
          similar_recipe_ids?: string[] | null
          source_url?: string | null
          tags?: string[] | null
          time_minutes?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      symptom_entries: {
        Row: {
          created_at: string | null
          description: string
          entry_date: string
          id: string
          meal_id: string | null
          symptom_time: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          entry_date?: string
          id?: string
          meal_id?: string | null
          symptom_time?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          entry_date?: string
          id?: string
          meal_id?: string | null
          symptom_time?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "symptom_entries_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "nutrition_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorite_recipes: {
        Row: {
          created_at: string | null
          id: string
          recipe_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          recipe_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          recipe_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorite_recipes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_nutrition_goals: {
        Row: {
          calories_goal: number | null
          carbs_goal: number | null
          created_at: string | null
          dietist_id: string | null
          fat_goal: number | null
          id: string
          protein_goal: number | null
          set_by_dietist: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          calories_goal?: number | null
          carbs_goal?: number | null
          created_at?: string | null
          dietist_id?: string | null
          fat_goal?: number | null
          id?: string
          protein_goal?: number | null
          set_by_dietist?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          calories_goal?: number | null
          carbs_goal?: number | null
          created_at?: string | null
          dietist_id?: string | null
          fat_goal?: number | null
          id?: string
          protein_goal?: number | null
          set_by_dietist?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_nutrition_settings: {
        Row: {
          activity_level: Database["public"]["Enums"]["activity_level"] | null
          ai_tracking_enabled: boolean | null
          ai_tracking_onboarding_completed: boolean | null
          calorie_tracking_enabled: boolean | null
          created_at: string | null
          gender: Database["public"]["Enums"]["gender"] | null
          height_cm: number | null
          id: string
          show_calories: boolean | null
          show_carbs: boolean | null
          show_fat: boolean | null
          show_protein: boolean | null
          updated_at: string | null
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          ai_tracking_enabled?: boolean | null
          ai_tracking_onboarding_completed?: boolean | null
          calorie_tracking_enabled?: boolean | null
          created_at?: string | null
          gender?: Database["public"]["Enums"]["gender"] | null
          height_cm?: number | null
          id?: string
          show_calories?: boolean | null
          show_carbs?: boolean | null
          show_fat?: boolean | null
          show_protein?: boolean | null
          updated_at?: string | null
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          ai_tracking_enabled?: boolean | null
          ai_tracking_onboarding_completed?: boolean | null
          calorie_tracking_enabled?: boolean | null
          created_at?: string | null
          gender?: Database["public"]["Enums"]["gender"] | null
          height_cm?: number | null
          id?: string
          show_calories?: boolean | null
          show_carbs?: boolean | null
          show_fat?: boolean | null
          show_protein?: boolean | null
          updated_at?: string | null
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      user_recipe_interactions: {
        Row: {
          created_at: string | null
          dietitian_id: string | null
          id: string
          recipe_id: string
          source: string
          status: string
          suggested_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dietitian_id?: string | null
          id?: string
          recipe_id: string
          source?: string
          status: string
          suggested_date?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dietitian_id?: string | null
          id?: string
          recipe_id?: string
          source?: string
          status?: string
          suggested_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_recipe_interactions_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_assigned_dietist: { Args: { _patient_id: string }; Returns: boolean }
    }
    Enums: {
      activity_level:
        | "sedentary"
        | "lightly_active"
        | "moderately_active"
        | "active"
        | "very_active"
      app_role: "admin" | "dietist" | "user"
      care_seeker_type: "self" | "other"
      gender: "male" | "female" | "other"
      motivation_level: "excited" | "curious" | "hesitant" | "not_ready"
      primary_concern_category:
        | "weight_loss"
        | "diabetes"
        | "gut_health"
        | "general_health"
        | "womens_health"
        | "emotional_eating"
        | "eating_disorder"
        | "heart_health"
        | "other"
      relationship_type: "guardian" | "trustee" | "relative"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_level: [
        "sedentary",
        "lightly_active",
        "moderately_active",
        "active",
        "very_active",
      ],
      app_role: ["admin", "dietist", "user"],
      care_seeker_type: ["self", "other"],
      gender: ["male", "female", "other"],
      motivation_level: ["excited", "curious", "hesitant", "not_ready"],
      primary_concern_category: [
        "weight_loss",
        "diabetes",
        "gut_health",
        "general_health",
        "womens_health",
        "emotional_eating",
        "eating_disorder",
        "heart_health",
        "other",
      ],
      relationship_type: ["guardian", "trustee", "relative"],
    },
  },
} as const
