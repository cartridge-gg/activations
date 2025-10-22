import { PropsWithChildren } from "react";

import { Chain, sepolia, mainnet } from "@starknet-react/chains";
import { StarknetConfig, jsonRpcProvider, cartridge } from "@starknet-react/core";

import { KATANA_URL, KATANA_CHAIN_ID } from "@/lib/config";
import controller from "@/lib/ControllerConnector";

// Starknet provider and connector configuration
// Simplified for local Katana development
export function StarknetProvider({ children }: PropsWithChildren) {
  // Katana chain definition for Starknet React
  const katana: Chain = {
    id: BigInt(KATANA_CHAIN_ID),
    name: "Katana",
    network: "katana",
    testnet: true,
    nativeCurrency: {
      address: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
      name: "Stark",
      symbol: "STRK",
      decimals: 18,
    },
    rpcUrls: {
      default: { http: [KATANA_URL] },
      public: { http: [KATANA_URL] },
    },
    paymasterRpcUrls: {
      avnu: { http: [KATANA_URL] },
    },
  };

  // Configure RPC provider
  const provider = jsonRpcProvider({
    rpc: (chain: Chain) => {
      switch (chain) {
        case katana:
          return { nodeUrl: KATANA_URL };
        case mainnet:
          return { nodeUrl: 'https://api.cartridge.gg/x/starknet/mainnet' };
        case sepolia:
          return { nodeUrl: 'https://api.cartridge.gg/x/starknet/sepolia' }
        default:
          return { nodeUrl: KATANA_URL };
      }
    },
  })

  return (
    <StarknetConfig
      autoConnect
      defaultChainId={katana.id}
      chains={[katana]}
      connectors={[controller]}
      explorer={cartridge}
      provider={provider}
    >
        {children}
    </StarknetConfig>
  );
}
