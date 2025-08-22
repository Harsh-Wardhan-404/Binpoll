import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
})

// Types for our database
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          wallet_address: string
          username: string | null
          avatar_url: string | null
          total_polls_created: number
          total_votes_cast: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wallet_address: string
          username?: string | null
          avatar_url?: string | null
          total_polls_created?: number
          total_votes_cast?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          wallet_address?: string
          username?: string | null
          avatar_url?: string | null
          total_polls_created?: number
          total_votes_cast?: number
          created_at?: string
          updated_at?: string
        }
      }
      polls: {
        Row: {
          id: string
          title: string
          description: string
          creator_id: string
          creator_address: string
          options: string[]
          category: string
          duration_hours: number
          end_time: string
          created_at: string
          updated_at: string
          is_active: boolean
          total_votes: number
          total_pool: string
          contract_poll_id: number | null
          is_on_chain: boolean
        }
        Insert: {
          id?: string
          title: string
          description: string
          creator_id: string
          creator_address: string
          options: string[]
          category?: string
          duration_hours: number
          end_time: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
          total_votes?: number
          total_pool?: string
          contract_poll_id?: number | null
          is_on_chain?: boolean
        }
        Update: {
          id?: string
          title?: string
          description?: string
          creator_id?: string
          creator_address?: string
          options?: string[]
          category?: string
          duration_hours?: number
          end_time?: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
          total_votes?: number
          total_pool?: string
          contract_poll_id?: number | null
          is_on_chain?: boolean
        }
      }
      votes: {
        Row: {
          id: string
          poll_id: string
          voter_id: string
          voter_address: string
          option_index: number
          amount: string
          tx_hash: string | null
          created_at: string
          is_on_chain: boolean
        }
        Insert: {
          id?: string
          poll_id: string
          voter_id: string
          voter_address: string
          option_index: number
          amount: string
          tx_hash?: string | null
          created_at?: string
          is_on_chain?: boolean
        }
        Update: {
          id?: string
          poll_id?: string
          voter_id?: string
          voter_address?: string
          option_index?: number
          amount?: string
          tx_hash?: string | null
          created_at?: string
          is_on_chain?: boolean
        }
      }
    }
  }
}
