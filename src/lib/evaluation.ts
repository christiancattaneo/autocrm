import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { TicketResponse } from '../types/ticket'

// Evaluation criteria for responses
export interface ResponseEvaluation {
  responseId: number
  metrics: {
    relevance: number // 0-1: How relevant was the response to the ticket
    accuracy: number // 0-1: How accurate was the information provided
    completeness: number // 0-1: Did it address all aspects of the query
    actionability: number // 0-1: Were next steps clear
    tone: number // 0-1: Was the tone appropriate
  }
  feedback?: string
  evaluatedAt: string
}

// Test cases for common scenarios
export const TEST_CASES = [
  {
    scenario: "Technical Issue Resolution",
    input: {
      title: "Cannot access my account",
      description: "I've been trying to log in but keep getting an error message",
      priority: "high",
      status: "open"
    },
    expectedResponse: {
      mustInclude: [
        "verification steps",
        "password reset",
        "specific error message",
        "contact information"
      ],
      mustNotInclude: [
        "billing information",
        "subscription details"
      ],
      tone: "helpful and urgent",
      requiredActions: [
        "Clear troubleshooting steps",
        "Alternative login methods",
        "Support contact details"
      ]
    }
  },
  {
    scenario: "Billing Query",
    input: {
      title: "Double charged for subscription",
      description: "I noticed two charges on my statement for this month",
      priority: "high",
      status: "open"
    },
    expectedResponse: {
      mustInclude: [
        "refund process",
        "billing cycle",
        "transaction details"
      ],
      mustNotInclude: [
        "technical troubleshooting",
        "password reset"
      ],
      tone: "apologetic and professional",
      requiredActions: [
        "Refund timeline",
        "Prevention measures",
        "Billing support contact"
      ]
    }
  }
]

// Evaluation chain for automated assessment
export async function evaluateResponse(
  response: TicketResponse,
  ticket: { title: string; description: string }
): Promise<ResponseEvaluation> {
  const model = new ChatOpenAI({ 
    temperature: 0,
    tags: ["response_evaluation"],
    metadata: {
      ticketId: response.ticket_id,
      responseId: response.id
    }
  })
  
  const promptTemplate = PromptTemplate.fromTemplate(`
    Evaluate this customer support response based on the following criteria:
    
    TICKET:
    Title: {title}
    Description: {description}
    
    RESPONSE:
    {response}
    
    Evaluate each criterion and provide a score from 0-1:
    - Relevance: How well does the response address the specific issue?
    - Accuracy: Is the information provided correct and reliable?
    - Completeness: Does it address all aspects of the query?
    - Actionability: Are the next steps or resolution clear?
    - Tone: Is the tone appropriate for the situation?
    
    Return your evaluation in strict JSON format with these exact fields:
    - metrics.relevance (number 0-1)
    - metrics.accuracy (number 0-1)
    - metrics.completeness (number 0-1)
    - metrics.actionability (number 0-1)
    - metrics.tone (number 0-1)
    - feedback (string with detailed improvement suggestions)
  `)

  try {
    const formattedPrompt = await promptTemplate.format({
      title: ticket.title,
      description: ticket.description,
      response: response.content
    })
    
    console.log("Sending prompt to OpenAI:", formattedPrompt)
    const result = await model.invoke(formattedPrompt)
    console.log("Received response from OpenAI:", result.text)
    
    const evaluation = JSON.parse(result.text)
    console.log("Parsed evaluation:", evaluation)
    
    return {
      responseId: response.id,
      metrics: evaluation.metrics,
      feedback: evaluation.feedback,
      evaluatedAt: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error evaluating response:', error)
    throw error
  }
}

// ... rest of the existing code ...