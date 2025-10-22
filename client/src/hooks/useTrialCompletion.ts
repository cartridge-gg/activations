import { useEffect } from 'react';

/**
 * Custom hook to handle trial completion logic
 * Automatically calls onComplete when success state changes to true
 */
export function useTrialCompletion(success: boolean, onComplete: () => void) {
  useEffect(() => {
    if (success) {
      console.log('=== Trial Completion Detected ===');
      console.log('Calling onComplete callback to refetch progress...');
      onComplete();
    }
  }, [success, onComplete]);
}
