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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      invites: {
        Row: {
          code: string
          completed_at: string | null
          created_at: string
          email: string | null
          expires_at: string
          id: string
          journey_id: string
        }
        Insert: {
          code?: string
          completed_at?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          journey_id: string
        }
        Update: {
          code?: string
          completed_at?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          journey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      journeys: {
        Row: {
          created_at: string
          creator_id: string
          id: string
          invite_code: string
          invite_url: string | null
          participant_type: Database["public"]["Enums"]["participant_type"]
          recipient_email: string | null
          status: Database["public"]["Enums"]["journey_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          id?: string
          invite_code?: string
          invite_url?: string | null
          participant_type?: Database["public"]["Enums"]["participant_type"]
          recipient_email?: string | null
          status?: Database["public"]["Enums"]["journey_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          id?: string
          invite_code?: string
          invite_url?: string | null
          participant_type?: Database["public"]["Enums"]["participant_type"]
          recipient_email?: string | null
          status?: Database["public"]["Enums"]["journey_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      question_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          active: boolean
          answer_options: Json
          category_id: string
          created_at: string
          id: string
          question: string
          question_type: Database["public"]["Enums"]["question_type"]
          risk_level: Database["public"]["Enums"]["risk_level"]
          weight: number
        }
        Insert: {
          active?: boolean
          answer_options?: Json
          category_id: string
          created_at?: string
          id?: string
          question: string
          question_type?: Database["public"]["Enums"]["question_type"]
          risk_level?: Database["public"]["Enums"]["risk_level"]
          weight?: number
        }
        Update: {
          active?: boolean
          answer_options?: Json
          category_id?: string
          created_at?: string
          id?: string
          question?: string
          question_type?: Database["public"]["Enums"]["question_type"]
          risk_level?: Database["public"]["Enums"]["risk_level"]
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "questions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "question_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      responses: {
        Row: {
          answer: Json
          created_at: string
          id: string
          journey_id: string
          question_id: string
          score: number | null
        }
        Insert: {
          answer: Json
          created_at?: string
          id?: string
          journey_id: string
          question_id: string
          score?: number | null
        }
        Update: {
          answer?: Json
          created_at?: string
          id?: string
          journey_id?: string
          question_id?: string
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "responses_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      results: {
        Row: {
          ai_summary: string | null
          compatibility_score: number | null
          created_at: string
          experience_score: number | null
          green_flag_score: number | null
          id: string
          journey_id: string
          red_flag_score: number | null
          safety_score: number | null
          updated_at: string
        }
        Insert: {
          ai_summary?: string | null
          compatibility_score?: number | null
          created_at?: string
          experience_score?: number | null
          green_flag_score?: number | null
          id?: string
          journey_id: string
          red_flag_score?: number | null
          safety_score?: number | null
          updated_at?: string
        }
        Update: {
          ai_summary?: string | null
          compatibility_score?: number | null
          created_at?: string
          experience_score?: number | null
          green_flag_score?: number | null
          id?: string
          journey_id?: string
          red_flag_score?: number | null
          safety_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "results_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: true
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      journey_status:
        | "draft"
        | "pending"
        | "in_progress"
        | "completed"
        | "expired"
      participant_type: "Dominant" | "submissive" | "switch" | "any"
      question_type:
        | "single_choice"
        | "multi_choice"
        | "scale"
        | "boolean"
        | "text"
      risk_level: "low" | "medium" | "high" | "critical"
      user_role: "Dominant" | "submissive" | "switch"
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
      journey_status: [
        "draft",
        "pending",
        "in_progress",
        "completed",
        "expired",
      ],
      participant_type: ["Dominant", "submissive", "switch", "any"],
      question_type: [
        "single_choice",
        "multi_choice",
        "scale",
        "boolean",
        "text",
      ],
      risk_level: ["low", "medium", "high", "critical"],
      user_role: ["Dominant", "submissive", "switch"],
    },
  },
} as const
