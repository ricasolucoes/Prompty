// Placeholder — substitua rodando: pnpm gen:types
// Requer: supabase link --project-ref ouoxxwbiqgecaysoybpv
//
// Minimal shape for type-safe development before gen:types is run.
// After running `pnpm gen:types` this file will be replaced with the full generated schema.

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          name: string | null
          avatar_url: string | null
          level: 'L1' | 'L2' | 'L3' | 'L4' | 'L5'
          points: number
          streak: number
          verified: boolean
          created_at: string
        }
        Insert: {
          id: string
          username?: string | null
          name?: string | null
          avatar_url?: string | null
          level?: 'L1' | 'L2' | 'L3' | 'L4' | 'L5'
          points?: number
          streak?: number
          verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          name?: string | null
          avatar_url?: string | null
          level?: 'L1' | 'L2' | 'L3' | 'L4' | 'L5'
          points?: number
          streak?: number
          verified?: boolean
          created_at?: string
        }
      }
      promptys: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          template: string
          inputs_schema: unknown
          status: 'draft' | 'published' | 'archived'
          category: string | null
          cover_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          template: string
          inputs_schema?: unknown
          status?: 'draft' | 'published' | 'archived'
          category?: string | null
          cover_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          template?: string
          inputs_schema?: unknown
          status?: 'draft' | 'published' | 'archived'
          category?: string | null
          cover_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      point_events: {
        Row: {
          id: string
          user_id: string
          event_type: string
          points: number
          ref_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_type: string
          points: number
          ref_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_type?: string
          points?: number
          ref_id?: string | null
          created_at?: string
        }
      }
      prompty_likes: {
        Row: {
          id: string
          user_id: string
          prompty_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          prompty_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          prompty_id?: string
          created_at?: string
        }
      }
      prompty_saves: {
        Row: {
          id: string
          user_id: string
          prompty_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          prompty_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          prompty_id?: string
          created_at?: string
        }
      }
      prompty_tests: {
        Row: {
          id: string
          user_id: string
          prompty_id: string
          rating: number
          notes: string | null
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          prompty_id: string
          rating: number
          notes?: string | null
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          prompty_id?: string
          rating?: number
          notes?: string | null
          image_url?: string | null
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
