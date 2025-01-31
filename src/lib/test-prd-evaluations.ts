import { evaluateResponse } from './evaluation'
import { PRD_TEST_CASES, createTestResponse } from './prd-test-cases'

async function runPRDEvaluations() {
  console.log("Starting PRD evaluations test...")
  console.log(`Testing ${PRD_TEST_CASES.length} PRD test cases`)

  for (const testCase of PRD_TEST_CASES) {
    console.log(`\nTesting: ${testCase.title}`)
    
    try {
      // Create a sample response
      const response = createTestResponse(testCase)
      
      // Create a ticket from the test case
      const ticket = {
        title: testCase.title,
        description: testCase.description
      }

      console.log("Evaluating response...")
      const evaluation = await evaluateResponse(response, ticket)
      
      console.log("Evaluation results:", {
        title: testCase.title,
        metrics: evaluation.metrics,
        feedback: evaluation.feedback
      })
    } catch (error) {
      console.error(`Error evaluating ${testCase.title}:`, error)
    }
  }
}

// Run the tests
runPRDEvaluations().catch(console.error) 