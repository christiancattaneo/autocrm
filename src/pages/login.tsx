import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import type { UserRole } from '../contexts/auth'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address')
    }
    
    // Check if trying to register as staff
    if (isSignUp && email.endsWith('@autocrm.com')) {
      throw new Error('Staff accounts can only be created by administrators')
    }
  }

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate inputs
      validateEmail(email)
      validatePassword(password)

      if (isSignUp) {
        console.log('Attempting signup for:', email, 'with role:', selectedRole)
        const needsEmailConfirmation = await signUp(email, password, selectedRole)
        if (needsEmailConfirmation) {
          setError('Please check your email to confirm your account')
        } else {
          setError('Account created successfully! You can now sign in.')
          setIsSignUp(false)
        }
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      console.error('Auth error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="max-w-md w-full p-8 bg-base-100 rounded-lg shadow-xl">
        {/* Logo and Welcome */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            AutoCRM
          </h1>
          <h2 className="text-2xl font-bold text-base-content">
            {isSignUp ? 'Create an Account' : 'Welcome Back'}
          </h2>
          <p className="text-base-content/70 mt-2">
            {isSignUp 
              ? 'Create your customer account to get started with support'
              : 'Sign in to manage your support tickets'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text text-base-content/80">Email</span>
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input input-bordered w-full text-base-content"
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text text-base-content/80">Password</span>
            </label>
            <input
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input input-bordered w-full text-base-content"
              required
            />
            {isSignUp && (
              <label className="label">
                <span className="label-text-alt text-base-content/60">
                  Must be at least 6 characters long
                </span>
              </label>
            )}
          </div>

          {isSignUp && (
            <div className="form-control">
              <label className="label">
                <span className="label-text text-base-content/80">Account Type</span>
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="select select-bordered w-full text-base-content"
                required
              >
                <option value="customer">Customer</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
              <label className="label">
                <span className="label-text-alt text-base-content/60">
                  Note: The first user can be an admin. After that, only admins can create staff and admin accounts.
                </span>
              </label>
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>

          <div className="text-center mt-4">
            <button
              type="button"
              className="btn btn-link text-base-content/70 hover:text-base-content"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
                setSelectedRole('customer') // Reset role when toggling
              }}
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 