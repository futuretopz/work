import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          username: string
          is_admin: boolean
          created_at: string
        }
        Insert: {
          id: string
          email: string
          username: string
          is_admin?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          is_admin?: boolean
          created_at?: string
        }
      }
      tickets: {
        Row: {
          id: string
          user_id: string
          subject: string
          category: string
          status: 'open' | 'resolved'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subject: string
          category: string
          status?: 'open' | 'resolved'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject?: string
          category?: string
          status?: 'open' | 'resolved'
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          ticket_id: string
          sender_id: string
          sender_type: 'user' | 'admin'
          text: string
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          sender_id: string
          sender_type: 'user' | 'admin'
          text: string
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          sender_id?: string
          sender_type?: 'user' | 'admin'
          text?: string
          created_at?: string
        }
      }
    }
  }
}
