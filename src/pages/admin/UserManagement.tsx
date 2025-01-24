import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

interface User {
  id: string
  email: string
  role: string
  created_at: string
}

export function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [newStaffEmail, setNewStaffEmail] = useState('')
  const [error, setError] = useState('')
  const { isStaffOrAdmin } = useAuth()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      // First get the roles using our get_user_role function to avoid recursion
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false })

      if (roleError) {
        console.error('Supabase error:', roleError)
        throw roleError
      }
      if (!roleData) throw new Error('No data returned from query')

      // Then get the user emails in a separate query
      const { data: userData, error: userError } = await supabase
        .from('auth.users')
        .select('id, email')

      if (userError) {
        console.error('Error fetching user data:', userError)
        throw userError
      }

      // Combine the data
      const formattedUsers = roleData.map(userRole => {
        const user = userData?.find(u => u.id === userRole.user_id)
        return {
          id: userRole.user_id,
          email: user?.email || 'Unknown',
          role: userRole.role,
          created_at: userRole.created_at
        }
      })

      setUsers(formattedUsers)
    } catch (error) {
      console.error('Error fetching users:', error)
      setError('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const createStaffAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!newStaffEmail.endsWith('@autocrm.com')) {
      setError('Staff emails must end with @autocrm.com')
      return
    }

    try {
      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-12)
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newStaffEmail,
        password: tempPassword,
        email_confirm: true
      })

      if (authError) throw authError

      // Create user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([
          {
            user_id: authData.user.id,
            role: 'staff'
          }
        ])

      if (roleError) throw roleError

      // Send email with temporary password (in production, use proper email service)
      alert(`Staff account created! Temporary password: ${tempPassword}`)
      
      setNewStaffEmail('')
      fetchUsers()
    } catch (error) {
      console.error('Error creating staff account:', error)
      setError('Failed to create staff account')
    }
  }

  const updateUserRole = async (userId: string, newRole: 'customer' | 'staff' | 'admin') => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId)

      if (error) throw error

      fetchUsers()
    } catch (error) {
      console.error('Error updating user role:', error)
      setError('Failed to update user role')
    }
  }

  if (!isStaffOrAdmin) {
    return <div className="p-8">You don't have permission to view this page.</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-base-content mb-8">User Management</h1>

      {/* Create Staff Account Form */}
      <div className="card bg-base-100 shadow-xl mb-8">
        <div className="card-body">
          <h2 className="card-title">Create Staff Account</h2>
          <form onSubmit={createStaffAccount} className="flex gap-4">
            <input
              type="email"
              value={newStaffEmail}
              onChange={(e) => setNewStaffEmail(e.target.value)}
              placeholder="staff@autocrm.com"
              className="input input-bordered flex-1"
            />
            <button type="submit" className="btn btn-primary">
              Create Staff Account
            </button>
          </form>
          {error && <p className="text-error mt-2">{error}</p>}
        </div>
      </div>

      {/* Users List */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title mb-4">Users</h2>
          {loading ? (
            <div className="flex justify-center">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.email}</td>
                      <td>
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user.id, e.target.value as 'customer' | 'staff' | 'admin')}
                          className="select select-bordered select-sm"
                        >
                          <option value="customer">Customer</option>
                          <option value="staff">Staff</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        <button 
                          className="btn btn-sm btn-ghost"
                          onClick={() => {/* Add password reset functionality */}}
                        >
                          Reset Password
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 