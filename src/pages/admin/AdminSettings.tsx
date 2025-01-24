import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

export function AdminSettingsPage() {
  const { isStaffOrAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState<'teams' | 'routing' | 'data'>('teams')

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
              <h2 className="card-title mb-4">Team Management</h2>
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Create Teams</span>
                  </label>
                  <div className="flex gap-4">
                    <input 
                      type="text" 
                      placeholder="Team name" 
                      className="input input-bordered flex-1" 
                    />
                    <button className="btn btn-primary">Create Team</button>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Existing Teams</h3>
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Team Name</th>
                          <th>Members</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Add team rows here */}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
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