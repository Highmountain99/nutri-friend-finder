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
      intake_profiles: {
        Row: {
          activity_level: Database["public"]["Enums"]["activity_level"] | null
          ai_free_text: string | null
          ai_parsed_fields: Json | null
          care_seeker_type:
            | Database["public"]["Enums"]["care_seeker_type"]
            | null
          completed_at: string | null
          concern_tags: string[] | null
          created_at: string
          current_step: number | null
          id: string
          motivation_level:
            | Database["public"]["Enums"]["motivation_level"]
            | null
          primary_concern_category:
            | Database["public"]["Enums"]["primary_concern_category"]
            | null
          primary_concern_subcategory: string | null
          relationship_if_other:
            | Database["public"]["Enums"]["relationship_type"]
            | null
          support_areas: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          ai_free_text?: string | null
          ai_parsed_fields?: Json | null
          care_seeker_type?:
            | Database["public"]["Enums"]["care_seeker_type"]
            | null
          completed_at?: string | null
          concern_tags?: string[] | null
          created_at?: string
          current_step?: number | null
          id?: string
          motivation_level?:
            | Database["public"]["Enums"]["motivation_level"]
            | null
          primary_concern_category?:
            | Database["public"]["Enums"]["primary_concern_category"]
            | null
          primary_concern_subcategory?: string | null
          relationship_if_other?:
            | Database["public"]["Enums"]["relationship_type"]
            | null
          support_areas?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          ai_free_text?: string | null
          ai_parsed_fields?: Json | null
          care_seeker_type?:
            | Database["public"]["Enums"]["care_seeker_type"]
            | null
          completed_at?: string | null
          concern_tags?: string[] | null
          created_at?: string
          current_step?: number | null
          id?: string
          motivation_level?:
            | Database["public"]["Enums"]["motivation_level"]
            | null
          primary_concern_category?:
            | Database["public"]["Enums"]["primary_concern_category"]
            | null
          primary_concern_subcategory?: string | null
          relationship_if_other?:
            | Database["public"]["Enums"]["relationship_type"]
            | null
          support_areas?: string[] | null
          updated_at?: string
          user_id?: string
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
          protein?: number | null
          user_id?: string
        }
        Relationships: []
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
          updated_at?: string | null
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
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
