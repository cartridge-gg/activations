import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { init } from "@dojoengine/sdk";
import { createDojoConfig } from "@dojoengine/core";
import { DojoSdkProvider } from '@dojoengine/sdk/react'

import { StarknetProvider } from '@/components/StarknetProvider'

import {
  manifest,
  setupWorld,
  WORLD_ADDRESS,
  TORII_URL,
  RELAY_URL,
  KATANA_URL,
  KATANA_CHAIN_ID,
  type SchemaType
} from '@/lib/config'

import App from '@/App'
import '@/index.css'

async function main() {
  const sdk = await init<SchemaType>(
    {
      client: {
        worldAddress: WORLD_ADDRESS,
        rpcUrl: KATANA_URL,
        toriiUrl: TORII_URL,
        relayUrl: RELAY_URL,
      },
      domain: {
        name: "Ronin Pact",
        version: "1.0",
        chainId: KATANA_CHAIN_ID,
        revision: "1",
      },
    },
  );

  const dojoConfig = createDojoConfig({
    manifest,
    rpcUrl: KATANA_URL,
    toriiUrl: TORII_URL,
  });

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
