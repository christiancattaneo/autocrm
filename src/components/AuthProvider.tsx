import { useEffect, useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { AuthContext, UserRole } from '../contexts/auth'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<UserRole | null>(null)

  const createUserRole = useCallback(async (userId: string, email: string, requestedRole?: UserRole): Promise<UserRole> => {
    console.log('Creating user role for:', email, 'requested role:', requestedRole)
    const defaultRole: UserRole = requestedRole || (email.endsWith('@autocrm.com') ? 'staff' : 'customer')
    
    const { data, error } = await supabase
      .from('user_roles')
      .insert([
        { user_id: userId, role: defaultRole }
      ])
      .select('role')
      .single()

    if (error) {
      console.error('Error creating user role:', error)
      return defaultRole
    }

    console.log('Created role:', data.role)
    return data.role
  }, [])

  const fetchUserRole = useCallback(async (userId: string, email: string): Promise<UserRole | null> => {
    console.log('Fetching role for user:', userId)
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST116') { // Record not found
        return await createUserRole(userId, email)
      }
      console.error('Error fetching user role:', error)
      return null
    }

    console.log('Fetched role:', data?.role)
    return data?.role as UserRole
  }, [createUserRole])

  useEffect(() => {
    let mounted = true
    console.log('AuthProvider: Checking session...')
    
    async function initializeAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      
      console.log('Session check result:', session ? 'Found session' : 'No session', { 
        userId: session?.user?.id,
        userEmail: session?.user?.email 
      })
      
      if (!mounted) return

      setUser(session?.user ?? null)
      
      if (session?.user?.email) {
        console.log('Fetching role for session user:', session.user.id)
        const userRole = await fetchUserRole(session.user.id, session.user.email)
        console.log('Fetched role result:', userRole)
        if (!mounted) return
        setRole(userRole)
        console.log('Set role to:', userRole)
        console.log('Initial loading complete. State:', { 
          loading: false, 
          user: session?.user?.email, 
          role: userRole
        })
      } else {
        setRole(null)
        console.log('Initial loading complete. State:', { 
          loading: false, 
          user: null, 
          role: null
        })
      }
      
      if (!mounted) return
      setLoading(false)
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', _event, {
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email
      })
      
      if (!mounted) return

      setUser(session?.user ?? null)
      
      // Handle role creation/fetching on confirmed signup
      if (_event === 'SIGNED_IN' && session?.user?.email) {
        try {
          const userRole = await fetchUserRole(session.user.id, session.user.email)
          console.log('Auth change: fetched/created role:', userRole)
          if (!mounted) return
          setRole(userRole)
        } catch (err) {
          console.error('Error handling role after sign in:', err)
          setRole(null)
        }
      } else if (!session?.user) {
        setRole(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchUserRole])

  const signIn = async (email: string, password: string) => {
    console.log('Attempting sign in for:', email)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    console.log('Sign in successful')
  }

  const signUp = async (email: string, password: string, role: UserRole) => {
    console.log('Attempting sign up for:', email, 'with role:', role)
    
    // Check if this is the first user
    const { data: existingUsers } = await supabase
      .from('user_roles')
      .select('user_id')
    
    const isFirstUser = !existingUsers || existingUsers.length === 0
    
    // Only allow admin/staff registration if it's the first user or if an admin is creating the account
    if ((role === 'admin' || role === 'staff') && !isFirstUser) {
      throw new Error('Admin and staff accounts can only be created by administrators')
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          requested_role: role // Store the requested role in user metadata
        }
      }
    })
    
    if (error) {
      console.error('Signup error:', error)
      throw error
    }

    if (data.user) {
      // Create the user role immediately
      try {
        await createUserRole(data.user.id, email, role)
      } catch (err) {
        console.error('Error creating user role:', err)
        // Continue since the user is created, role can be assigned later
      }
    }

    console.log('Signup response:', data)
    // Return true if email confirmation is required
    return data.session === null
  }

  const signOut = async () => {
    console.log('Signing out...')
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    console.log('Sign out successful')
  }

  console.log('AuthProvider render state:', { 
    loading, 
    userEmail: user?.email, 
    role,
    isAuthenticated: !!user
  })

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        role,
        isStaffOrAdmin: role === 'staff' || role === 'admin',
        signIn, 
        signUp, 
        signOut 
      }}
    >
      {children}
    </AuthContext.Provider>
  )
} 