import { supabase } from './supabaseClient';

export interface TicketData {
  title: string;
  description: string;
  status: string;
  priority: string;
}

export interface CustomerHistory {
  title: string;
  status: string;
}

export interface GenerateResponseParams {
  ticket: TicketData;
  customerHistory: CustomerHistory[];
  averageRating: number;
}

export interface GenerateResponseResult {
  generatedResponse: string;
}

export const generateTicketResponse = async (
  params: GenerateResponseParams
): Promise<GenerateResponseResult> => {
  const { data, error } = await supabase.functions.invoke<GenerateResponseResult>(
    'generate-response',
    {
      body: params,
    }
  );

  if (error) {
    throw new Error(`Failed to generate response: ${error.message}`);
  }

  if (!data) {
    throw new Error('No response generated');
  }

  return data;
}; 