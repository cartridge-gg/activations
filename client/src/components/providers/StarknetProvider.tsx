import { PropsWithChildren } from "react";
import { StarknetConfig, cartridge } from "@starknet-react/core";
import { controller } from "@/lib/controller";
import { provider, chains, defaultChainId } from "@/lib/starknet";

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
