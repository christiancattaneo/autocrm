import { useState } from 'react'
import { testAuthPolicies } from '../utils/test-auth'
import { useAuth } from '../hooks/useAuth'

export function TestPage() {
  const [results, setResults] = useState<string[]>([])
  const { user } = useAuth()

  const runTests = async () => {
    const originalLog = console.log
    const originalError = console.error
    const logs: string[] = []

    // Override console.log to capture output
    console.log = (...args) => {
      logs.push(args.join(' '))
      originalLog.apply(console, args)
    }
    console.error = (...args) => {
      logs.push('ERROR: ' + args.join(' '))
      originalError.apply(console, args)
    }

    await testAuthPolicies()
    setResults(logs)

    // Restore console
    console.log = originalLog
    console.error = originalError
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">RLS Policy Tests</h1>
        <div className="text-sm opacity-75 mb-4">
          Current user: {user?.email || 'Not logged in'}
        </div>
        <button 
          onClick={runTests}
          className="btn btn-primary"
        >
          Run Tests
        </button>
      </div>

      {results.length > 0 && (
        <div className="bg-base-100 p-4 rounded-lg shadow">
          <h2 className="font-bold mb-4">Test Results:</h2>
          <pre className="whitespace-pre-wrap font-mono text-sm">
            {results.join('\n')}
          </pre>
        </div>
      )}
    </div>
  )
} 