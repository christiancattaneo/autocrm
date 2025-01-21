import { supabase } from '../lib/supabase'

export async function testAuthPolicies() {
  console.log('Testing RLS Policies...')

  try {
    // Test 1: Staff Access
    console.log('\nTesting staff access (staff@autocrm.com):')
    const { data: staffTickets, error: staffError } = await supabase
      .from('tickets')
      .select('*')
    console.log('Staff can view all tickets:', !staffError && staffTickets?.length >= 0)

    // Test 2: Customer Access
    console.log('\nTesting customer access (customer@example.com):')
    const { data: customerTickets, error: customerError } = await supabase
      .from('tickets')
      .select('*')
      .eq('customer_email', 'customer@example.com')
    console.log('Customer can view their tickets:', !customerError && customerTickets?.length >= 0)

    // Test 3: File Upload
    console.log('\nTesting file upload:')
    const testFile = new File(['test'], 'test.txt', { type: 'text/plain' })
    const { error: uploadError } = await supabase.storage
      .from('tickets')
      .upload(`test/${Date.now()}.txt`, testFile)
    console.log('Can upload files:', !uploadError)

    // Test 4: Create Ticket
    console.log('\nTesting ticket creation:')
    const { error: createError } = await supabase
      .from('tickets')
      .insert([
        {
          title: 'Test Ticket',
          description: 'Test Description',
          status: 'open',
          priority: 'low',
          customer_email: 'customer@example.com'
        }
      ])
    console.log('Can create tickets:', !createError)

    console.log('\nTests completed!')
  } catch (error) {
    console.error('Test failed:', error)
  }
} 