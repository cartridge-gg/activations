import { PropsWithChildren } from "react";
import { StarknetConfig, cartridge } from "@starknet-react/core";
import { controller, provider, chains, defaultChainId } from "../../lib/controller";

export function StarknetProvider({ children }: PropsWithChildren) {
  return (
    <StarknetConfig
      autoConnect
      defaultChainId={defaultChainId}
      chains={chains}
      connectors={[controller]}
      explorer={cartridge}
      provider={provider}
    >
        {children}
    </StarknetConfig>
  );
}
