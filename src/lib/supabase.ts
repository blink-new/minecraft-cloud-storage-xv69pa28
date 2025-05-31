import { createClient } from '@supabase/supabase-js'

// Using the connected Supabase project details
const supabaseUrl = 'https://lczhrvayqjwvgtchrypg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjemhydmF5cWp3dmd0Y2hyeXBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMTUwOTksImV4cCI6MjA1NzU5MTA5OX0.g1KSWMk1U_7KJLTYqkgXUhrzRrXbvDheI1tRCfCZ-yc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our application
export interface FileItem {
  id: string
  name: string
  size: number
  type: 'file' | 'folder'
  mime_type?: string
  created_at: string
  updated_at: string
  user_id: string
  parent_id?: string
  path: string
}

export interface User {
  id: string
  email: string
  created_at: string
}