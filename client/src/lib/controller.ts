// Cartridge Controller connector setup for The Rōnin's Pact
import { ControllerConnector } from "@cartridge/connector";
import { SessionPolicies } from "@cartridge/controller";
import { RONIN_PACT_ADDRESS } from "./constants";
import { getEnvironment, getEnvironmentConfig } from "./dojo";

// Define session policies for gasless transactions
const policies: SessionPolicies = {
  contracts: {
    [RONIN_PACT_ADDRESS]: {
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

// Get configuration based on environment
function getControllerConfig() {
  const env = getEnvironment();
  const config = getEnvironmentConfig(env);

  // Return both chains array and defaultChainId
  // The chains array tells Controller which chains are available
  // The defaultChainId tells it which one to use
  return {
    chains: [{ rpcUrl: config.rpcUrl }],
    defaultChainId: config.chainId,
  };
}

// Create controller connector instance
export const controller = new ControllerConnector({
  policies,
  signupOptions: [
    "webauthn",
    "discord",
  ],
  ...getControllerConfig(),
});
