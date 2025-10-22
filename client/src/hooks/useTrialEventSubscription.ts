import { useMemo } from 'react';
import { useEventQuery, useModel, useEntityId } from '@dojoengine/sdk/react';
import { KeysClause, ToriiQueryBuilder } from '@dojoengine/sdk';
import { splitTokenIdToU256 } from '@/lib/utils';

/**
 * Custom hook to subscribe to trial completion events from the Dojo world
 *
 * @param tokenId - The NFT token ID to subscribe to events for
 * @param eventName - The name of the event (e.g., 'ChiCompleted', 'WazaCompleted', 'ShinCompleted')
 * @returns Object containing:
 *   - isCompleted: boolean indicating if the trial has been completed
 *   - event: the event data from the store (if available)
 */
export function useTrialEventSubscription(tokenId: string, eventName: string) {
  // Convert tokenId to u256 components (low: u128, high: u128)
  // In Cairo, u256 is stored as two u128 values
  const { tokenIdLow, tokenIdHigh } = useMemo(() => {
    if (!tokenId) return { tokenIdLow: '0x0', tokenIdHigh: '0x0' };

    const { low, high } = splitTokenIdToU256(tokenId);

    return {
      tokenIdLow: `0x${BigInt(low).toString(16)}`,
      tokenIdHigh: `0x${BigInt(high).toString(16)}`,
    };
  }, [tokenId]);

  // Subscribe to events with u256 token_id key
  // u256 keys are represented as TWO key components in Dojo (low, high)
  useEventQuery(
    new ToriiQueryBuilder()
      .withClause(
        KeysClause(
          [`ronin_quest-${eventName}`],
          [tokenIdLow, tokenIdHigh],
          'FixedLen'  // We have exactly 2 key components for u256
        ).build()
      )
      .includeHashedKeys()
  );

  // Compute entity ID from the u256 key components
  // Pass both low and high parts to useEntityId for u256 keys
  const eventEntityId = useEntityId(tokenIdLow, tokenIdHigh);

  // Retrieve the event from the Dojo store
  const event = useModel(eventEntityId, `ronin_quest-${eventName}`);

  // The presence of the event confirms completion
  const isCompleted = !!event;

  return {
    isCompleted,
    event,
  };
}
