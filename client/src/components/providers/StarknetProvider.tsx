import { PropsWithChildren, useEffect, useState } from "react";
import { StarknetConfig, cartridge } from "@starknet-react/core";
import { DojoSdkProvider } from "@dojoengine/sdk/react";
import { controller } from "@/lib/controller";
import { provider, chains, defaultChainId } from "@/lib/starknet";
import { initDojoSdk } from "@/lib/dojo";
import { dojoConfig } from "@/lib/dojoConfig";
import { setupWorld } from "../../../../contracts/bindings/typescript/contracts.gen";

export function StarknetProvider({ children }: PropsWithChildren) {
  const [sdk, setSdk] = useState<Awaited<ReturnType<typeof initDojoSdk>> | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize Dojo SDK once on mount
    initDojoSdk()
      .then((initializedSdk) => {
        setSdk(initializedSdk);
        setIsInitialized(true);
      })
      .catch((err) => {
        console.error("Failed to initialize Dojo SDK:", err);
        setError(err.message || "Failed to initialize Dojo SDK");
        setIsInitialized(true); // Still set to true to show error message
      });
  }, []);

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-ronin-dark via-slate-900 to-ronin-dark">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-ronin-accent border-t-transparent mb-4"></div>
          <div className="text-ronin-secondary text-lg font-semibold">Initializing Dojo...</div>
        </div>
      </div>
    );
  }

  // Show error state if initialization failed
  if (error || !sdk) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-ronin-dark via-slate-900 to-ronin-dark">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-900/20 border-2 border-ronin-primary rounded-lg p-6">
            <svg className="w-16 h-16 text-ronin-primary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-ronin-secondary text-xl font-bold mb-2">Failed to initialize Dojo SDK</div>
            {error && <div className="text-ronin-accent text-sm">{error}</div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <StarknetConfig
      autoConnect
      defaultChainId={defaultChainId}
      chains={chains}
      connectors={[controller]}
      explorer={cartridge}
      provider={provider}
    >
      <DojoSdkProvider sdk={sdk} dojoConfig={dojoConfig} clientFn={setupWorld}>
        {children}
      </DojoSdkProvider>
    </StarknetConfig>
  );
}
