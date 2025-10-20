// Starknet provider configuration
import { sepolia, mainnet } from "@starknet-react/chains";
import { jsonRpcProvider } from "@starknet-react/core";
import { katana } from "./chains";
import { getEnvironment, getEnvironmentConfig } from "./dojo";

// JSON RPC provider setup with environment awareness
export const provider = jsonRpcProvider({
  rpc: (chain) => {
    const config = getEnvironmentConfig();

    switch (chain) {
      case mainnet:
        return {
          nodeUrl: import.meta.env.VITE_RPC_MAINNET || "https://api.cartridge.gg/x/starknet/mainnet"
        };
      case sepolia:
        return {
          nodeUrl: import.meta.env.VITE_RPC_SEPOLIA || "https://api.cartridge.gg/x/starknet/sepolia"
        };
      case katana:
        return {
          nodeUrl: config.rpcUrl
        };
      default:
        return {
          nodeUrl: config.rpcUrl
        };
    }
  },
});

// Get chains based on environment
function getChains() {
  const env = getEnvironment();
  switch (env) {
    case "local":
      return [katana];
    case "sepolia":
      return [sepolia];
    case "mainnet":
      return [mainnet];
    default:
      return [sepolia];
  }
}

// Get default chain ID based on environment
function getDefaultChainId() {
  const env = getEnvironment();
  switch (env) {
    case "local":
      return katana.id;
    case "sepolia":
      return sepolia.id;
    case "mainnet":
      return mainnet.id;
    default:
      return sepolia.id;
  }
}

// Supported chains - dynamically determined by environment
export const chains = getChains();

// Default chain - dynamically determined by environment
export const defaultChainId = getDefaultChainId();
