// Starknet provider configuration
import { sepolia, mainnet } from "@starknet-react/chains";
import { jsonRpcProvider } from "@starknet-react/core";

// JSON RPC provider setup
export const provider = jsonRpcProvider({
  rpc: (chain) => {
    switch (chain) {
      case mainnet:
        return {
          nodeUrl: import.meta.env.VITE_RPC_MAINNET || "https://api.cartridge.gg/x/starknet/mainnet"
        };
      case sepolia:
      default:
        return {
          nodeUrl: import.meta.env.VITE_RPC_SEPOLIA || "https://api.cartridge.gg/x/starknet/sepolia"
        };
    }
  },
});

// Supported chains
export const chains = [mainnet, sepolia];

// Default chain
export const defaultChainId = sepolia.id;
