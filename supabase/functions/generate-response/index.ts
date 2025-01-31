// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import OpenAI from "npm:openai@4.28.0"

console.log("Hello from Functions!")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { ticket } = await req.json()

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    })

    const prompt = `Generate a detailed Product Requirements Document (PRD) for the following request:

TICKET DETAILS:
Title: ${ticket.title}
Description: ${ticket.description}

Format the response as a structured PRD with the following sections:

1. Overview
[Brief description of the product/platform]

2. Target Audience
[Define the primary user base]

3. Core Functionality
[Main purpose and functionality]

4. Key Features
[List 4-5 essential features]

5. Technical Requirements
- Scalable architecture
- Security measures
- Platform support
- Data synchronization
- API integrations

6. User Experience Requirements
- Navigation design
- Performance targets
- Responsive design
- Accessibility
- Error handling

7. Security Requirements
- Authentication
- Data privacy
- Compliance needs
- Security monitoring
- Payment security (if applicable)

8. Performance Metrics
- Uptime targets
- Load times
- User capacity
- Caching strategy
- Monitoring needs

9. Success Criteria
[List measurable success metrics]

10. Timeline and Phases
- Phase 1: Core Development
- Phase 2: Beta Testing
- Phase 3: Public Launch
- Phase 4: Enhancements

11. Risks and Mitigation
[List potential risks and mitigation strategies]

12. Future Considerations
[List potential future enhancements]

Generate a comprehensive PRD following this structure, ensuring all sections are detailed and specific to the requested platform/product.`

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a senior product manager who writes clear, comprehensive, and technically accurate PRDs."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    const response = completion.choices[0].message?.content

    return new Response(
      JSON.stringify({ generatedResponse: response }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/generate-response' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
