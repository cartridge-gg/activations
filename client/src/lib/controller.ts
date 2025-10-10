// Cartridge Controller connector setup for The Rōnin's Pact
import { ControllerConnector } from "@cartridge/connector";
import { SessionPolicies } from "@cartridge/controller";
import { RONIN_PACT_ADDRESS } from "./constants";

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

// Create controller connector instance
export const controller = new ControllerConnector({
  policies,
  // Signup options for users
  signupOptions: [
    "google",
    "webauthn",
    "discord",
    "walletconnect",
    "metamask",
    "password",
  ],
  // App configuration
  slot: "ronins-pact",
  namespace: "ronins-pact",
  // Token support
  tokens: {
    erc20: ["eth", "strk"],
  },
});
