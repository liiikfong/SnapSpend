export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      records: {
        Row: {
          id: string
          user_id: string
          amount: number
          currency: string
          merchant: string | null
          category: string | null
          date: string
          note: string | null
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          currency?: string
          merchant?: string | null
          category?: string | null
          date: string
          note?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          currency?: string
          merchant?: string | null
          category?: string | null
          date?: string
          note?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type RecordRow = Database['public']['Tables']['records']['Row']
export type RecordInsert = Database['public']['Tables']['records']['Insert']
export type RecordUpdate = Database['public']['Tables']['records']['Update']
