export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      cash_withdrawals: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string
          user_id: string
          username: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reason: string
          user_id: string
          username: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      confirmations: {
        Row: {
          confirmed_at: string
          game_id: string
          id: string
          user_id: string
          username: string
        }
        Insert: {
          confirmed_at?: string
          game_id: string
          id?: string
          user_id: string
          username: string
        }
        Update: {
          confirmed_at?: string
          game_id?: string
          id?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "confirmations_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confirmations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_confirmations: {
        Row: {
          confirmed_at: string
          event_id: string
          event_payed: boolean | null
          id: string
          user_id: string
          username: string
        }
        Insert: {
          confirmed_at?: string
          event_id: string
          event_payed?: boolean | null
          id?: string
          user_id: string
          username: string
        }
        Update: {
          confirmed_at?: string
          event_id?: string
          event_payed?: boolean | null
          id?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_confirmations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string
          date: string
          description: string
          event_description: string | null
          id: string
          is_active: boolean | null
          location: string
          map_location: string | null
          time: string
          value: number
        }
        Insert: {
          created_at?: string
          created_by: string
          date: string
          description: string
          event_description?: string | null
          id?: string
          is_active?: boolean | null
          location: string
          map_location?: string | null
          time: string
          value: number
        }
        Update: {
          created_at?: string
          created_by?: string
          date?: string
          description?: string
          event_description?: string | null
          id?: string
          is_active?: boolean | null
          location?: string
          map_location?: string | null
          time?: string
          value?: number
        }
        Relationships: []
      }
      finance_settings: {
        Row: {
          id: string
          monthly_fee: number
          monthly_goal: number
          pix_qrcode: string | null
          weekly_fee: number
        }
        Insert: {
          id?: string
          monthly_fee?: number
          monthly_goal?: number
          pix_qrcode?: string | null
          weekly_fee?: number
        }
        Update: {
          id?: string
          monthly_fee?: number
          monthly_goal?: number
          pix_qrcode?: string | null
          weekly_fee?: number
        }
        Relationships: []
      }
      games: {
        Row: {
          created_at: string
          created_by: string
          date: string
          id: string
          location: string
          map_location: string | null
          max_players: number
          time: string
        }
        Insert: {
          created_at?: string
          created_by: string
          date: string
          id?: string
          location: string
          map_location?: string | null
          max_players: number
          time: string
        }
        Update: {
          created_at?: string
          created_by?: string
          date?: string
          id?: string
          location?: string
          map_location?: string | null
          max_players?: number
          time?: string
        }
        Relationships: [
          {
            foreignKeyName: "games_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_balance: {
        Row: {
          balance_amount: number
          collected_amount: number
          created_at: string
          id: string
          month: string
          target_amount: number
        }
        Insert: {
          balance_amount: number
          collected_amount: number
          created_at?: string
          id?: string
          month: string
          target_amount: number
        }
        Update: {
          balance_amount?: number
          collected_amount?: number
          created_at?: string
          id?: string
          month?: string
          target_amount?: number
        }
        Relationships: []
      }
      mvp_votes: {
        Row: {
          created_at: string
          game_id: string
          id: string
          player_id: string
          rank: number
          username: string
          voter_id: string
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          player_id: string
          rank: number
          username: string
          voter_id: string
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          player_id?: string
          rank?: number
          username?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mvp_votes_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_type: string
          receipt_url: string | null
          status: string
          user_id: string
          username: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payment_type: string
          receipt_url?: string | null
          status: string
          user_id: string
          username: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_type?: string
          receipt_url?: string | null
          status?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          attributes: Json
          average_rating: number
          id: string
          user_id: string
          username: string
        }
        Insert: {
          attributes?: Json
          average_rating?: number
          id?: string
          user_id: string
          username: string
        }
        Update: {
          attributes?: Json
          average_rating?: number
          id?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          banned: boolean | null
          created_at: string
          email: string
          id: string
          is_admin: boolean
          is_approved: boolean | null
          monthly_payer: boolean | null
          username: string
        }
        Insert: {
          banned?: boolean | null
          created_at?: string
          email: string
          id: string
          is_admin?: boolean
          is_approved?: boolean | null
          monthly_payer?: boolean | null
          username: string
        }
        Update: {
          banned?: boolean | null
          created_at?: string
          email?: string
          id?: string
          is_admin?: boolean
          is_approved?: boolean | null
          monthly_payer?: boolean | null
          username?: string
        }
        Relationships: []
      }
      scoreboard_settings: {
        Row: {
          created_at: string | null
          id: string
          team_a_color: string
          team_a_name: string | null
          team_b_color: string
          team_b_name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          team_a_color?: string
          team_a_name?: string | null
          team_b_color?: string
          team_b_name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          team_a_color?: string
          team_a_name?: string | null
          team_b_color?: string
          team_b_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          reference_id: string
          type: string
          user_id: string
          username: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          reference_id: string
          type: string
          user_id: string
          username: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          reference_id?: string
          type?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_balance: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      update_monthly_balance: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
