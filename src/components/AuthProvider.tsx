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
    
    // Try up to 3 times to create the role
    for (let i = 0; i < 3; i++) {
      const { data, error } = await supabase
        .from('user_roles')
        .insert([
          { user_id: userId, role: defaultRole }
        ])
        .select('role')
        .single()

      if (!error) {
        console.log('Created role:', data.role)
        return data.role
      }

      console.error(`Error creating user role (attempt ${i + 1}):`, error)
      // Wait a short time before retrying
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // If we get here, we failed to create the role after retries
    throw new Error('Failed to create user role after multiple attempts')
  }, [])

  const fetchUserRole = useCallback(async (userId: string, email: string): Promise<UserRole | null> => {
    console.log('Fetching role for user:', userId)
    try {
      // First try to get the role directly without RLS
      const { data: roleData, error: roleError } = await supabase.rpc('get_user_role', {
        user_id_param: userId
      })

      if (!roleError && roleData) {
        console.log('Fetched existing role:', roleData)
        return roleData as UserRole
      }

      console.log('No role found or error:', roleError)
      console.log('Checking if first user...')
      
      // Check if this is the first user
      const { count, error: countError } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })

      if (countError) {
        console.error('Error checking user count:', countError)
        return null
      }

      // If this is the first user, make them an admin
      if (count === 0) {
        console.log('First user - creating as admin')
        return await createUserRole(userId, email, 'admin')
      }

      // Otherwise, create as customer
      console.log('Creating as customer')
      return await createUserRole(userId, email, 'customer')
    } catch (err) {
      console.error('Unexpected error in fetchUserRole:', err)
      return null
    }
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
    const { data: existingUsers, error: queryError } = await supabase
      .from('user_roles')
      .select('user_id')
    
    if (queryError) {
      console.error('Error checking existing users:', queryError)
      throw queryError
    }
    
    const isFirstUser = !existingUsers || existingUsers.length === 0
    console.log('Is first user?', isFirstUser, 'Existing users count:', existingUsers?.length)
    
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

    if (!data.user) {
      throw new Error('User creation failed')
    }

    // Create the user role immediately and don't swallow errors
    const userRole = await createUserRole(data.user.id, email, role)
    console.log('Successfully created user and role:', { email, role: userRole })

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