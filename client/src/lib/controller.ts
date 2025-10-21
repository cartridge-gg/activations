// Starknet provider and connector configuration
// Simplified for local Katana development

import { jsonRpcProvider } from "@starknet-react/core";

import { ControllerConnector } from "@cartridge/connector";
import { SessionPolicies } from "@cartridge/controller";

import { katana, KATANA_URL, KATANA_CHAIN_ID, QUEST_MANAGER_ADDRESS } from "./config";

// ============================================================================
// CONTROLLER CONNECTOR
// ============================================================================

// Define session policies for gasless transactions
const policies: SessionPolicies = {
  contracts: {
    [QUEST_MANAGER_ADDRESS]: {
      methods: [
        {
          name: "mint",
          entrypoint: "mint",
          description: "Mint your Rōnin's Pact NFT",
        },
        {
          name: "complete_waza",
          entrypoint: "complete_waza",
          description: "Complete the Waza (Technique) trial",
        },
        {
          name: "complete_chi",
          entrypoint: "complete_chi",
          description: "Complete the Chi (Wisdom) trial",
        },
        {
          name: "complete_shin",
          entrypoint: "complete_shin",
          description: "Complete the Shin (Spirit) trial",
        },
      ],
    },
  },
};

// Create controller connector instance for local Katana
export const controller = new ControllerConnector({
  // policies,
  signupOptions: ["webauthn", "discord"],
  chains: [{ rpcUrl: KATANA_URL }],
  defaultChainId: KATANA_CHAIN_ID,
});

// ============================================================================
// PROVIDER CONFIGURATION
// ============================================================================

// JSON RPC provider setup for local Katana
export const provider = jsonRpcProvider({
  rpc: () => ({
    nodeUrl: KATANA_URL
  }),
});

// ============================================================================
// CHAIN CONFIGURATION
// ============================================================================

// Supported chains - only Katana for local development
export const chains = [katana];

// Default chain - Katana
export const defaultChainId = katana.id;
