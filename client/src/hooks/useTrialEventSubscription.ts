import { useEffect, useMemo } from 'react';
import { useEventQuery, useModel, useEntityId } from '@dojoengine/sdk/react';
import { KeysClause, ToriiQueryBuilder } from '@dojoengine/sdk';

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

    const tokenIdBigInt = BigInt(tokenId);
    const low = tokenIdBigInt & ((1n << 128n) - 1n);
    const high = tokenIdBigInt >> 128n;

    return {
      tokenIdLow: `0x${low.toString(16)}`,
      tokenIdHigh: `0x${high.toString(16)}`,
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

  // Debug logging
  useEffect(() => {
    console.log(`=== ${eventName} Event Subscription ===`);
    console.log('Token ID:', tokenId);
    console.log('Token ID Low:', tokenIdLow);
    console.log('Token ID High:', tokenIdHigh);
    console.log('Entity ID:', eventEntityId);
    console.log('Event:', event);
    console.log('Is Completed:', isCompleted);
  }, [tokenId, tokenIdLow, tokenIdHigh, eventEntityId, event, isCompleted, eventName]);

  return {
    isCompleted,
    event,
  };
}
