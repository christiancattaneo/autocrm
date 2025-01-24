import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { user, role, isStaffOrAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const isAdmin = role === 'admin'

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header>
        <nav className="navbar bg-base-100 px-4 h-16">
          <div className="flex-1">
            <Link 
              to="/"
              className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
            >
              AutoCRM
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-base-content/70">
              {user?.email} ({role})
            </div>
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg text-base-content">
                    {user?.email?.[0].toUpperCase()}
                  </span>
                </div>
              </label>
              <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                <li>
                  <button onClick={handleSignOut} className="text-base-content">
                    Sign out
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </nav>
        <div className="h-px bg-base-300"></div>
      </header>
      <div className="flex flex-1">
        <aside className="w-[320px] bg-base-100 border-r border-base-300">
          {/* Show New Ticket button for customers and staff */}
          {(role === 'customer' || role === 'staff') && (
            <div className="p-4">
              <Link
                to="/new"
                className="btn btn-primary w-full"
              >
                New Ticket
              </Link>
            </div>
          )}
          <div className="px-4">
            <div className="h-px bg-base-300"></div>
          </div>
          <nav className="p-4">
            <ul className="menu menu-md">
              {/* Staff and Admin links */}
              {isStaffOrAdmin && (
                <>
                  <li>
                    <Link to="/" className="font-medium text-base-content hover:text-base-content">
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link to="/tickets" className="font-medium text-base-content hover:text-base-content">
                      All Tickets
                    </Link>
                  </li>
                  <li>
                    <Link to="/performance" className="font-medium text-base-content hover:text-base-content">
                      Performance
                    </Link>
                  </li>
                </>
              )}

              {/* Customer-only links */}
              {role === 'customer' && (
                <li>
                  <Link to="/my-tickets" className="font-medium text-base-content hover:text-base-content">
                    My Tickets
                  </Link>
                </li>
              )}

              {/* Admin-only links */}
              {isAdmin && (
                <>
                  <li>
                    <Link to="/admin/settings" className="font-medium text-base-content hover:text-base-content">
                      Admin Settings
                    </Link>
                  </li>
                  <li>
                    <Link to="/admin/users" className="font-medium text-base-content hover:text-base-content">
                      User Management
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </aside>
        <main className="flex-1 p-8 overflow-auto bg-base-200">
          {children}
        </main>
      </div>
    </div>
  )
} 