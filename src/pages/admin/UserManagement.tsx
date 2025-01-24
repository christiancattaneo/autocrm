import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { supabaseAdmin } from '../../lib/supabaseAdmin'
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

      // Use the admin client to get user data
      const { data: { users: userData }, error: userError } = await supabaseAdmin.auth.admin.listUsers()

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
    
    try {
      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-12)
      
      // Create auth user using admin client
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
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
      <h1 className="text-2xl font-bold text-black mb-8">User Management</h1>

      {/* Create Staff Account Form */}
      <div className="card bg-base-100 shadow-xl mb-8">
        <div className="card-body">
          <h2 className="card-title text-black">Create Staff Account</h2>
          <form onSubmit={createStaffAccount} className="flex gap-4">
            <input
              type="email"
              value={newStaffEmail}
              onChange={(e) => setNewStaffEmail(e.target.value)}
              placeholder="staff@example.com"
              className="input input-bordered flex-1 text-black"
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
          <h2 className="card-title text-black mb-4">Users</h2>
          {loading ? (
            <div className="flex justify-center">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="text-black">Email</th>
                    <th className="text-black">Role</th>
                    <th className="text-black">Created</th>
                    <th className="text-black">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="text-black">{user.email}</td>
                      <td>
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user.id, e.target.value as 'customer' | 'staff' | 'admin')}
                          className="select select-bordered select-sm text-black"
                        >
                          <option value="customer" className="text-black">Customer</option>
                          <option value="staff" className="text-black">Staff</option>
                          <option value="admin" className="text-black">Admin</option>
                        </select>
                      </td>
                      <td className="text-black">{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        <button 
                          className="btn btn-sm btn-ghost text-black"
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