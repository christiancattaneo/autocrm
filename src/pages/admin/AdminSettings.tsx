import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { supabaseAdmin } from '../../lib/supabaseAdmin'

interface Team {
  id: string
  name: string
  description: string | null
  created_at: string
}

interface TeamMember {
  id: string
  email: string
  role: string
}

export function AdminSettingsPage() {
  const { isStaffOrAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState<'teams' | 'routing' | 'data'>('teams')
  const [teamName, setTeamName] = useState('')
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [editingTeam, setEditingTeam] = useState<{name: string, description: string | null}>({ name: '', description: null })
  const [availableStaff, setAvailableStaff] = useState<TeamMember[]>([])

  useEffect(() => {
    fetchTeams()
  }, [])

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamMembers(selectedTeam.id)
      fetchAvailableStaff()
      setEditingTeam({
        name: selectedTeam.name,
        description: selectedTeam.description
      })
    }
  }, [selectedTeam])

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTeams(data || [])
    } catch (err) {
      console.error('Error fetching teams:', err)
      setError('Failed to fetch teams')
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamMembers = async (teamId: string) => {
    try {
      // Get user_roles with this team_id
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('team_id', teamId)

      if (roleError) throw roleError

      // Get user details using admin client
      const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (userError) throw userError

      const members = roleData
        .map(role => {
          const user = users.find(u => u.id === role.user_id)
          return user ? {
            id: user.id,
            email: user.email || '',
            role: role.role
          } : null
        })
        .filter((member): member is TeamMember => member !== null)

      setTeamMembers(members)
    } catch (err) {
      console.error('Error fetching team members:', err)
      setError('Failed to fetch team members')
    }
  }

  const fetchAvailableStaff = async () => {
    try {
      // Get all staff/admin users
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['staff', 'admin'])
        .is('team_id', null)

      if (roleError) throw roleError

      // Get user details using admin client
      const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (userError) throw userError

      const staff = roleData
        .map(role => {
          const user = users.find(u => u.id === role.user_id)
          return user ? {
            id: user.id,
            email: user.email || '',
            role: role.role
          } : null
        })
        .filter((member): member is TeamMember => member !== null)

      setAvailableStaff(staff)
    } catch (err) {
      console.error('Error fetching available staff:', err)
      setError('Failed to fetch available staff')
    }
  }

  const createTeam = async () => {
    if (!teamName.trim()) {
      setError('Team name is required')
      return
    }

    try {
      const { error } = await supabase
        .from('teams')
        .insert([{ name: teamName.trim() }])

      if (error) throw error

      setTeamName('')
      fetchTeams()
    } catch (err) {
      console.error('Error creating team:', err)
      setError('Failed to create team')
    }
  }

  const updateTeam = async () => {
    if (!selectedTeam || !editingTeam.name.trim()) {
      setError('Team name is required')
      return
    }

    try {
      const { error } = await supabase
        .from('teams')
        .update({
          name: editingTeam.name.trim(),
          description: editingTeam.description
        })
        .eq('id', selectedTeam.id)

      if (error) throw error

      setSelectedTeam(null)
      fetchTeams()
    } catch (err) {
      console.error('Error updating team:', err)
      setError('Failed to update team')
    }
  }

  const addTeamMember = async (userId: string) => {
    if (!selectedTeam) return

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ team_id: selectedTeam.id })
        .eq('user_id', userId)

      if (error) throw error

      fetchTeamMembers(selectedTeam.id)
      fetchAvailableStaff()
    } catch (err) {
      console.error('Error adding team member:', err)
      setError('Failed to add team member')
    }
  }

  const removeTeamMember = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ team_id: null })
        .eq('user_id', userId)

      if (error) throw error

      if (selectedTeam) {
        fetchTeamMembers(selectedTeam.id)
        fetchAvailableStaff()
      }
    } catch (err) {
      console.error('Error removing team member:', err)
      setError('Failed to remove team member')
    }
  }

  if (!isStaffOrAdmin) {
    return <div className="p-8">You don't have permission to view this page.</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-base-content mb-8">Admin Settings</h1>

      {/* Tabs */}
      <div className="tabs tabs-boxed mb-8">
        <button 
          className={`tab h-16 px-8 ${activeTab === 'teams' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('teams')}
        >
          Team Management
        </button>
        <button 
          className={`tab h-16 px-8 ${activeTab === 'routing' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('routing')}
        >
          Routing Intelligence
        </button>
        <button 
          className={`tab h-16 px-8 ${activeTab === 'data' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('data')}
        >
          Data Management
        </button>
      </div>

      {/* Content based on active tab */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {activeTab === 'teams' && (
            <div>
              <h2 className="card-title mb-4 text-black">Team Management</h2>
              {error && <div className="alert alert-error mb-4">{error}</div>}
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-black">Create Teams</span>
                  </label>
                  <div className="flex gap-4">
                    <input 
                      type="text" 
                      placeholder="Team name" 
                      className="input input-bordered flex-1 text-black"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                    />
                    <button 
                      className="btn btn-primary"
                      onClick={createTeam}
                    >
                      Create Team
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-black">Existing Teams</h3>
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th className="text-black">Team Name</th>
                          <th className="text-black">Created</th>
                          <th className="text-black">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan={3} className="text-center text-black">Loading teams...</td>
                          </tr>
                        ) : teams.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="text-center text-black">No teams created yet</td>
                          </tr>
                        ) : (
                          teams.map(team => (
                            <tr key={team.id}>
                              <td className="text-black">{team.name}</td>
                              <td className="text-black">{new Date(team.created_at).toLocaleDateString()}</td>
                              <td>
                                <button 
                                  className="btn btn-sm btn-ghost text-black"
                                  onClick={() => setSelectedTeam(team)}
                                >
                                  Manage
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Team Management Dialog */}
          {selectedTeam && (
            <dialog className="modal modal-open">
              <div className="modal-box">
                <h3 className="font-bold text-lg text-black mb-4">Manage Team: {selectedTeam.name}</h3>
                
                {/* Team Settings */}
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text text-black">Team Name</span>
                  </label>
                  <input 
                    type="text"
                    className="input input-bordered text-black"
                    value={editingTeam.name}
                    onChange={(e) => setEditingTeam(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text text-black">Description</span>
                  </label>
                  <textarea 
                    className="textarea textarea-bordered text-black"
                    value={editingTeam.description || ''}
                    onChange={(e) => setEditingTeam(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                {/* Team Members */}
                <div className="mb-4">
                  <h4 className="font-semibold text-black mb-2">Team Members</h4>
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th className="text-black">Email</th>
                          <th className="text-black">Role</th>
                          <th className="text-black">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamMembers.map(member => (
                          <tr key={member.id}>
                            <td className="text-black">{member.email}</td>
                            <td className="text-black">{member.role}</td>
                            <td>
                              <button 
                                className="btn btn-sm btn-ghost text-black"
                                onClick={() => removeTeamMember(member.id)}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Available Staff */}
                {availableStaff.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-black mb-2">Add Team Member</h4>
                    <div className="overflow-x-auto">
                      <table className="table">
                        <thead>
                          <tr>
                            <th className="text-black">Email</th>
                            <th className="text-black">Role</th>
                            <th className="text-black">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {availableStaff.map(staff => (
                            <tr key={staff.id}>
                              <td className="text-black">{staff.email}</td>
                              <td className="text-black">{staff.role}</td>
                              <td>
                                <button 
                                  className="btn btn-sm btn-ghost text-black"
                                  onClick={() => addTeamMember(staff.id)}
                                >
                                  Add
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="modal-action">
                  <button 
                    className="btn btn-primary"
                    onClick={updateTeam}
                  >
                    Save Changes
                  </button>
                  <button 
                    className="btn"
                    onClick={() => setSelectedTeam(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
              <form method="dialog" className="modal-backdrop">
                <button onClick={() => setSelectedTeam(null)}>close</button>
              </form>
            </dialog>
          )}

          {activeTab === 'routing' && (
            <div>
              <h2 className="card-title mb-4">Routing Intelligence</h2>
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Rule-Based Assignment</span>
                  </label>
                  <select className="select select-bordered w-full">
                    <option>Based on ticket priority</option>
                    <option>Based on team expertise</option>
                    <option>Round-robin assignment</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Load Balancing</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="number" 
                      placeholder="Max tickets per agent" 
                      className="input input-bordered w-full" 
                    />
                    <button className="btn btn-primary">Save</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div>
              <h2 className="card-title mb-4">Data Management</h2>
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Schema Management</span>
                  </label>
                  <div className="flex gap-4">
                    <button className="btn btn-outline">Add Custom Field</button>
                    <button className="btn btn-outline">Manage Fields</button>
                  </div>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Data Maintenance</span>
                  </label>
                  <div className="flex gap-4">
                    <button className="btn btn-outline">Export Data</button>
                    <button className="btn btn-outline">Archive Old Tickets</button>
                    <button className="btn btn-outline">View Audit Logs</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 