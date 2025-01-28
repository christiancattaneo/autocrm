import { useState } from 'react';
import { generateTicketResponse, GenerateResponseParams } from '../lib/api';

interface UseResponseGenerationReturn {
  generatedResponse: string | null;
  isGenerating: boolean;
  error: Error | null;
  generateResponse: (params: GenerateResponseParams) => Promise<void>;
  clearResponse: () => void;
}

export const useResponseGeneration = (): UseResponseGenerationReturn => {
  const [generatedResponse, setGeneratedResponse] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generateResponse = async (params: GenerateResponseParams) => {
    try {
      setIsGenerating(true);
      setError(null);
      const result = await generateTicketResponse(params);
      setGeneratedResponse(result.generatedResponse);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to generate response'));
    } finally {
      setIsGenerating(false);
    }
  };

  const clearResponse = () => {
    setGeneratedResponse(null);
    setError(null);
  };

  return {
    generatedResponse,
    isGenerating,
    error,
    generateResponse,
    clearResponse,
  };
}; 