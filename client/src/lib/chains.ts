import { Chain } from "@starknet-react/chains";

// Katana local development chain
export const katana: Chain = {
  id: BigInt("0x4b4154414e41"), // "KATANA" in hex
  name: "Katana",
  network: "katana",
  nativeCurrency: {
    address: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  testnet: true,
  rpcUrls: {
    default: {
      http: [],
    },
    public: {
      http: ["http://localhost:5050"],
    },
  },
  paymasterRpcUrls: {
    avnu: {
      http: ["http://localhost:5050"],
    },
  },
};
