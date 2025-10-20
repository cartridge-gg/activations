import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { init } from "@dojoengine/sdk";
import { DojoSdkProvider } from '@dojoengine/sdk/react'
import { StarknetProvider } from './components/providers/StarknetProvider.tsx'

import {
  dojoConfig,
  WORLD_ADDRESS,
  KATANA_TORII_URL,
  KATANA_RELAY_URL,
  KATANA_RPC_URL,
  KATANA_CHAIN_ID
} from './lib/config.ts'

import { setupWorld } from "../../contracts/bindings/typescript/contracts.gen";
import { SchemaType } from "../../contracts/bindings/typescript/models.gen";

async function main() {
  const sdk = await init<SchemaType>(
    {
      client: {
        worldAddress: WORLD_ADDRESS,
        toriiUrl: KATANA_TORII_URL,
        relayUrl: KATANA_RELAY_URL,
        rpcUrl: KATANA_RPC_URL,
      },
      domain: {
        name: "Ronin Pact",
        version: "1.0",
        chainId: KATANA_CHAIN_ID,
        revision: "1",
      },
    },
  );

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <DojoSdkProvider sdk={sdk} dojoConfig={dojoConfig} clientFn={setupWorld}>
        <StarknetProvider>
          <App />
        </StarknetProvider>
      </DojoSdkProvider>
    </StrictMode>,
  )
}

main();
