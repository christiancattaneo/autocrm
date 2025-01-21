import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './components/AuthProvider'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/login'
import { Layout } from './components/Layout'
import { TicketForm } from './components/TicketForm'
import { TicketList } from './components/TicketList'
import { DashboardPage } from './pages/dashboard'
import { TicketPage } from './pages/ticket'
import { CustomerTicketsPage } from './pages/customer-tickets'
import { PerformancePage } from './pages/performance'
import { UserManagementPage } from './pages/admin/UserManagement'
import { AdminSettingsPage } from './pages/admin/AdminSettings'

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <ProtectedRoute requireAuth={false}>
                <LoginPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['staff', 'admin']}>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/tickets"
            element={
              <ProtectedRoute allowedRoles={['staff', 'admin']}>
                <Layout>
                  <TicketList />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/my-tickets"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Layout>
                  <CustomerTicketsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/tickets/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <TicketPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <TicketForm />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/performance"
            element={
              <ProtectedRoute allowedRoles={['staff', 'admin']}>
                <Layout>
                  <PerformancePage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <UserManagementPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <AdminSettingsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  )
}
