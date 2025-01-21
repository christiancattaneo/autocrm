import { createContext } from 'react'
import type { User } from '@supabase/supabase-js'

export type UserRole = 'customer' | 'staff' | 'admin'

interface AuthContextType {
  user: User | null
  loading: boolean
  role: UserRole | null
  isStaffOrAdmin: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined) 