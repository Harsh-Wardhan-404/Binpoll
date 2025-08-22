import { createConfig, http } from 'wagmi'
import { hardhat, bscTestnet } from 'wagmi/chains'
import { injected, metaMask } from 'wagmi/connectors'

// Singleton pattern to ensure config is only created once
let _config: ReturnType<typeof createConfig> | undefined;

if (!_config) {
  _config = createConfig({
    chains: [bscTestnet, hardhat], // BSC Testnet first, then Hardhat for local testing
    connectors: [
      injected(),
      metaMask(),
    ],
    transports: {
      [bscTestnet.id]: http('https://data-seed-prebsc-1-s1.binance.org:8545'),
      [hardhat.id]: http('http://127.0.0.1:8545'),
    },
  });
}

export const config = _config;

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
