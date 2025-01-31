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

Format the response as a structured PRD with HTML formatting using <h1>, <h2>, <p>, <ul>, and <li> tags for better readability. Follow this structure:

<h1>Product Requirements Document (PRD): [Product Name]</h1>

<h2>1. Overview</h2>
<p>[Brief description of the product/platform]</p>

<h2>2. Target Audience</h2>
<p>[Define the primary user base]</p>

<h2>3. Core Functionality</h2>
<p>[Main purpose and functionality]</p>

<h2>4. Key Features</h2>
<ul>
<li>[Feature 1]</li>
<li>[Feature 2]</li>
<li>[Feature 3]</li>
<li>[Feature 4]</li>
<li>[Feature 5]</li>
</ul>

<h2>5. Technical Requirements</h2>
<ul>
<li>Scalable architecture</li>
<li>Security measures</li>
<li>Platform support</li>
<li>Data synchronization</li>
<li>API integrations</li>
</ul>

<h2>6. User Experience Requirements</h2>
<ul>
<li>Navigation design</li>
<li>Performance targets</li>
<li>Responsive design</li>
<li>Accessibility</li>
<li>Error handling</li>
</ul>

<h2>7. Security Requirements</h2>
<ul>
<li>Authentication</li>
<li>Data privacy</li>
<li>Compliance needs</li>
<li>Security monitoring</li>
<li>Payment security (if applicable)</li>
</ul>

<h2>8. Performance Metrics</h2>
<ul>
<li>Uptime targets</li>
<li>Load times</li>
<li>User capacity</li>
<li>Caching strategy</li>
<li>Monitoring needs</li>
</ul>

<h2>9. Success Criteria</h2>
<ul>
<li>[Measurable metric 1]</li>
<li>[Measurable metric 2]</li>
<li>[Measurable metric 3]</li>
<li>[Measurable metric 4]</li>
</ul>

<h2>10. Timeline and Phases</h2>
<ul>
<li>Phase 1: Core Development</li>
<li>Phase 2: Beta Testing</li>
<li>Phase 3: Public Launch</li>
<li>Phase 4: Enhancements</li>
</ul>

<h2>11. Risks and Mitigation</h2>
<ul>
<li>Risk: [Risk 1] - Mitigation: [Strategy 1]</li>
<li>Risk: [Risk 2] - Mitigation: [Strategy 2]</li>
<li>Risk: [Risk 3] - Mitigation: [Strategy 3]</li>
</ul>

<h2>12. Future Considerations</h2>
<ul>
<li>[Future enhancement 1]</li>
<li>[Future enhancement 2]</li>
<li>[Future enhancement 3]</li>
<li>[Future enhancement 4]</li>
</ul>

Generate a comprehensive PRD following this structure, ensuring all sections are detailed and specific to the requested platform/product. Use proper HTML formatting for better readability.`

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
