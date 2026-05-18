export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      point_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          points: number
          ref_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          points: number
          ref_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          points?: number
          ref_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'point_events_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          is_admin: boolean
          last_active_at: string | null
          level: string
          name: string | null
          points: number
          streak: number
          username: string | null
          verified: boolean
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id: string
          is_admin?: boolean
          last_active_at?: string | null
          level?: string
          name?: string | null
          points?: number
          streak?: number
          username?: string | null
          verified?: boolean
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          is_admin?: boolean
          last_active_at?: string | null
          level?: string
          name?: string | null
          points?: number
          streak?: number
          username?: string | null
          verified?: boolean
        }
        Relationships: []
      }
      prompty_likes: {
        Row: {
          created_at: string
          prompty_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          prompty_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          prompty_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'prompty_likes_prompty_id_fkey'
            columns: ['prompty_id']
            isOneToOne: false
            referencedRelation: 'promptys'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'prompty_likes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      prompty_ratings: {
        Row: {
          created_at: string
          id: string
          model_compat: number | null
          originality: number | null
          prompt_accuracy: number | null
          prompty_id: string
          reproducibility: number | null
          user_id: string
          visual_quality: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          model_compat?: number | null
          originality?: number | null
          prompt_accuracy?: number | null
          prompty_id: string
          reproducibility?: number | null
          user_id: string
          visual_quality?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          model_compat?: number | null
          originality?: number | null
          prompt_accuracy?: number | null
          prompty_id?: string
          reproducibility?: number | null
          user_id?: string
          visual_quality?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'prompty_ratings_prompty_id_fkey'
            columns: ['prompty_id']
            isOneToOne: false
            referencedRelation: 'promptys'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'prompty_ratings_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      prompty_remixes: {
        Row: {
          created_at: string
          id: string
          original_id: string
          remix_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          original_id: string
          remix_id: string
        }
        Update: {
          created_at?: string
          id?: string
          original_id?: string
          remix_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'prompty_remixes_original_id_fkey'
            columns: ['original_id']
            isOneToOne: false
            referencedRelation: 'promptys'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'prompty_remixes_remix_id_fkey'
            columns: ['remix_id']
            isOneToOne: false
            referencedRelation: 'promptys'
            referencedColumns: ['id']
          },
        ]
      }
      prompty_saves: {
        Row: {
          created_at: string
          prompty_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          prompty_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          prompty_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'prompty_saves_prompty_id_fkey'
            columns: ['prompty_id']
            isOneToOne: false
            referencedRelation: 'promptys'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'prompty_saves_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      prompty_tests: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          model: string | null
          notes: string | null
          prompty_id: string
          rating: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          model?: string | null
          notes?: string | null
          prompty_id: string
          rating?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          model?: string | null
          notes?: string | null
          prompty_id?: string
          rating?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'prompty_tests_prompty_id_fkey'
            columns: ['prompty_id']
            isOneToOne: false
            referencedRelation: 'promptys'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'prompty_tests_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      prompty_versions: {
        Row: {
          created_at: string
          id: string
          inputs_schema: Json
          negative: string | null
          prompty_id: string
          template: string
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          inputs_schema?: Json
          negative?: string | null
          prompty_id: string
          template: string
          version: number
        }
        Update: {
          created_at?: string
          id?: string
          inputs_schema?: Json
          negative?: string | null
          prompty_id?: string
          template?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: 'prompty_versions_prompty_id_fkey'
            columns: ['prompty_id']
            isOneToOne: false
            referencedRelation: 'promptys'
            referencedColumns: ['id']
          },
        ]
      }
      promptys: {
        Row: {
          author_id: string
          category: string | null
          cover_gradient: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          difficulty: string | null
          fts: unknown
          id: string
          inputs_schema: Json
          license: string
          models: string[]
          negative: string | null
          parent_id: string | null
          slug: string
          status: string
          style_tags: string[]
          template: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          author_id: string
          category?: string | null
          cover_gradient?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          fts?: unknown
          id?: string
          inputs_schema?: Json
          license?: string
          models?: string[]
          negative?: string | null
          parent_id?: string | null
          slug: string
          status?: string
          style_tags?: string[]
          template: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          author_id?: string
          category?: string | null
          cover_gradient?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          fts?: unknown
          id?: string
          inputs_schema?: Json
          license?: string
          models?: string[]
          negative?: string | null
          parent_id?: string | null
          slug?: string
          status?: string
          style_tags?: string[]
          template?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: 'promptys_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          prompty_id: string
          reason: string
          reporter_id: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          prompty_id: string
          reason: string
          reporter_id: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          prompty_id?: string
          reason?: string
          reporter_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: 'reports_prompty_id_fkey'
            columns: ['prompty_id']
            isOneToOne: false
            referencedRelation: 'promptys'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reports_reporter_id_fkey'
            columns: ['reporter_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      unlock_events: {
        Row: {
          created_at: string
          id: string
          new_level: string
          previous_level: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          new_level: string
          previous_level: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          new_level?: string
          previous_level?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'unlock_events_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      level_from_points: { Args: { p: number }; Returns: string }
      record_copy: { Args: { p_prompty_id: string }; Returns: undefined }
      tags_to_text: { Args: { tags: string[] }; Returns: string }
      update_profile_points: {
        Args: { target_user: string }
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
