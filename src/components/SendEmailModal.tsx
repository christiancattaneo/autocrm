import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  customerEmail: string;
  customerName?: string;
  content: string;
  onSuccess: () => void;
}

export function SendEmailModal({
  isOpen,
  onClose,
  ticketId,
  customerEmail,
  customerName,
  content,
  onSuccess,
}: SendEmailModalProps) {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    try {
      setIsSending(true);
      setError(null);

      const { error: sendError } = await supabase.functions.invoke('send-ticket-email', {
        body: {
          to: customerEmail,
          subject: `Re: Your Ticket #${ticketId}`,
          content,
          ticketId,
          customerName,
        },
      });

      if (sendError) throw sendError;

      // Update ticket status
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ status: 'waiting_for_customer' })
        .eq('id', ticketId);

      if (updateError) throw updateError;

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full space-y-4">
        <h3 className="text-lg font-bold">Send Response to Customer</h3>
        
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            This will send the response to {customerEmail} and update the ticket status.
          </p>
          
          <div className="bg-gray-50 rounded p-4 max-h-60 overflow-y-auto">
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            className="btn btn-ghost"
            onClick={onClose}
            disabled={isSending}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSend}
            disabled={isSending}
          >
            {isSending ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Sending...
              </>
            ) : (
              'Send Response'
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 