import { evaluateResponse } from './evaluation'
import type { TicketResponse } from '../types/ticket'

// Log environment variables (without sensitive values)
console.log("Environment check:", {
  LANGCHAIN_TRACING_V2: process.env.LANGCHAIN_TRACING_V2,
  LANGCHAIN_ENDPOINT: process.env.LANGCHAIN_ENDPOINT,
  LANGCHAIN_PROJECT: process.env.LANGCHAIN_PROJECT,
  LANGCHAIN_API_KEY: process.env.LANGCHAIN_API_KEY ? "Set" : "Not set",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "Set" : "Not set"
})

// Sample test data
const sampleTicket = {
  title: "Cannot access my account",
  description: "I've been trying to log in but keep getting an error message"
}

const sampleResponse: TicketResponse = {
  id: 1,
  ticket_id: 1,
  content: `Hello! I understand you're having trouble accessing your account. Let me help you with that.

1. First, please try clearing your browser cache and cookies
2. If that doesn't work, you can reset your password by clicking the "Forgot Password" link
3. Make sure you're using the correct email address associated with your account

If you continue to experience issues, please let me know the specific error message you're seeing and I'll help you further.

Best regards,
Support Team`,
  author_id: "test-author",
  author_email: "test@example.com",
  response_type: "ai_generated",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

// Run the test
export async function testEvaluation() {
  console.log("Starting evaluation test...")
  console.log("Test data:", { sampleTicket, sampleResponse })
  
  try {
    console.log("Calling evaluateResponse...")
    const evaluation = await evaluateResponse(sampleResponse, sampleTicket)
    console.log("Evaluation completed successfully:", evaluation)
    return evaluation
  } catch (error) {
    console.error("Evaluation failed:", error)
    throw error
  }
}

// Immediately run the test when this module is executed
testEvaluation().catch(console.error) 