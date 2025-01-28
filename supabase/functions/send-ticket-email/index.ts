// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { Resend } from 'https://esm.sh/resend@1.1.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject: string
  content: string
  ticketId: string
  customerName?: string
}

// Log environment variables (without exposing sensitive values)
console.log('Environment check:', {
  hasResendKey: !!Deno.env.get('RESEND_API_KEY'),
  hasAppUrl: !!Deno.env.get('APP_URL'),
  appUrl: Deno.env.get('APP_URL'),
})

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, content, ticketId, customerName } = await req.json() as EmailRequest

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'AutoCRM <onboarding@resend.dev>', // We'll change this once we have a domain
      to,
      subject,
      html: `
        <div>
          <p>Dear ${customerName || 'Valued Customer'},</p>
          ${content}
          <p>
            You can view your ticket and respond here: 
            <a href="${Deno.env.get('APP_URL')}/tickets/${ticketId}">View Ticket</a>
          </p>
          <p>Best regards,<br/>The Support Team</p>
        </div>
      `
    })

    if (error) {
      console.error('Resend error:', error)
      throw error
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message, details: error }),
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

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-ticket-email' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{
      "to": "recipient@example.com",
      "subject": "Test Ticket Response",
      "content": "This is a test response.",
      "ticketId": "123",
      "customerName": "John Doe"
    }'

*/
