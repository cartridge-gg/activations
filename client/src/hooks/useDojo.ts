import { useDojoSDK } from "@dojoengine/sdk/react";
import { useAccount } from "@starknet-react/core";

/**
 * Custom hook to access the Dojo SDK and account
 *
 * @returns Object containing:
 *   - setup: The Dojo client setup with all contract actions
 *   - account: The connected Starknet account
 *   - sdk: The full Dojo SDK instance
 */
export function useDojo() {
  const dojoContext = useDojoSDK();
  const { account } = useAccount();

  return {
    setup: dojoContext.client,
    account,
    sdk: dojoContext.sdk,
  };
}
