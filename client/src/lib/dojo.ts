import { init } from "@dojoengine/sdk";
import { dojoConfig } from "./dojoConfig";
import { SchemaType } from "../../../contracts/bindings/typescript/models.gen";

// Environment configuration
export type Environment = "local" | "sepolia" | "mainnet";

interface EnvironmentConfig {
  toriiUrl: string;
  relayUrl: string;
  chainId: string;
  rpcUrl: string;
}

const ENVIRONMENT_CONFIGS: Record<Environment, EnvironmentConfig> = {
  local: {
    toriiUrl: "http://localhost:8080",
    relayUrl: "/ip4/127.0.0.1/tcp/9090",
    chainId: "0x4b4154414e41", // "KATANA" hex-encoded
    rpcUrl: "http://localhost:5050",
  },
  sepolia: {
    toriiUrl: import.meta.env.VITE_TORII_URL_SEPOLIA || "https://api.cartridge.gg/x/ronin-pact/torii",
    relayUrl: import.meta.env.VITE_RELAY_URL_SEPOLIA || "",
    chainId: "0x534e5f5345504f4c4941", // "SN_SEPOLIA" hex-encoded
    rpcUrl: "https://api.cartridge.gg/x/starknet/sepolia",
  },
  mainnet: {
    toriiUrl: import.meta.env.VITE_TORII_URL_MAINNET || "",
    relayUrl: import.meta.env.VITE_RELAY_URL_MAINNET || "",
    chainId: "0x534e5f4d41494e", // "SN_MAIN" hex-encoded
    rpcUrl: "https://api.cartridge.gg/x/starknet/mainnet",
  },
};

/**
 * Get the current environment based on VITE_ENVIRONMENT env var
 * Defaults to 'sepolia' if not set
 */
export function getEnvironment(): Environment {
  const env = import.meta.env.VITE_ENVIRONMENT?.toLowerCase() || "sepolia";
  if (env === "local" || env === "sepolia" || env === "mainnet") {
    return env;
  }
  console.warn(`Unknown environment "${env}", defaulting to sepolia`);
  return "sepolia";
}

/**
 * Get configuration for the specified environment
 */
export function getEnvironmentConfig(env?: Environment): EnvironmentConfig {
  const environment = env || getEnvironment();
  return ENVIRONMENT_CONFIGS[environment];
}

/**
 * Initialize the Dojo SDK with the appropriate environment configuration
 *
 * IMPORTANT: Call this function only ONCE to avoid creating multiple Torii clients
 *
 * @param environment - Optional environment override (defaults to VITE_ENVIRONMENT)
 * @returns Initialized Dojo SDK instance
 */
export async function initDojoSdk(environment?: Environment) {
  const env = environment || getEnvironment();
  const config = getEnvironmentConfig(env);

  console.log(`Initializing Dojo SDK for environment: ${env}`);
  console.log(`Torii URL: ${config.toriiUrl}`);
  console.log(`RPC URL: ${config.rpcUrl}`);
  console.log(`World Address: ${dojoConfig.manifest.world.address}`);

  try {
    const sdk = await init<SchemaType>(
      {
        client: {
          worldAddress: dojoConfig.manifest.world.address,
          toriiUrl: config.toriiUrl,
          relayUrl: config.relayUrl,
          rpcUrl: config.rpcUrl,
        },
        domain: {
          name: "Ronin Pact",
          version: "1.0",
          chainId: config.chainId,
          revision: "1",
        },
      },
      // Pass the schema type for type safety
      {} as SchemaType
    );

    console.log("Dojo SDK initialized successfully");
    return sdk;
  } catch (error) {
    console.error("Failed to initialize Dojo SDK:", error);
    throw error;
  }
}
