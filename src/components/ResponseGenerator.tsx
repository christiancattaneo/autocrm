import { useResponseGeneration } from '../hooks/useResponseGeneration';
import type { Ticket } from '../types/ticket';
import type { CustomerHistory } from '../lib/api';

interface ResponseGeneratorProps {
  ticket: Ticket;
  customerHistory: CustomerHistory[];
  onResponseGenerated: (response: string) => void;
}

export function ResponseGenerator({ ticket, customerHistory, onResponseGenerated }: ResponseGeneratorProps) {
  const {
    generatedResponse,
    isGenerating,
    error,
    generateResponse,
    clearResponse,
  } = useResponseGeneration();

  const handleGenerateClick = async () => {
    await generateResponse({
      ticket: {
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
      },
      customerHistory,
      averageRating: 4.5, // TODO: Calculate from actual customer ratings
    });
  };

  const handleUseResponse = () => {
    if (generatedResponse) {
      onResponseGenerated(generatedResponse);
      clearResponse();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          className="btn btn-primary"
          onClick={handleGenerateClick}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Generating...
            </>
          ) : (
            'Generate Response'
          )}
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error.message}</span>
        </div>
      )}

      {generatedResponse && (
        <div className="bg-base-200 rounded-lg p-4 space-y-4">
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: generatedResponse }} />
          </div>
          <div className="flex justify-end gap-2">
            <button
              className="btn btn-ghost"
              onClick={clearResponse}
            >
              Discard
            </button>
            <button
              className="btn btn-primary"
              onClick={handleUseResponse}
            >
              Use Response
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 