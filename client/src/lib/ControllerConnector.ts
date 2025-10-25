import { ControllerConnector } from "@cartridge/connector";
import { SessionPolicies } from "@cartridge/controller";

import {
  QUEST_MANAGER_ADDRESS,
  DEFAULT_CHAIN_ID,
  KATANA_URL,
  SEPOLIA_URL,
  MAINNET_URL,
} from "./config";

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

// Create controller connector instance with multi-chain support
// Chain IDs are automatically derived from the RPC URLs by the Controller
const controller = new ControllerConnector({
  policies,
  chains: [
    { rpcUrl: KATANA_URL },
    { rpcUrl: SEPOLIA_URL },
    { rpcUrl: MAINNET_URL }
  ],
  defaultChainId: DEFAULT_CHAIN_ID,
});

export default controller;
