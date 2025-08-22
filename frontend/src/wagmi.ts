import { createConfig, http } from 'wagmi'
import { hardhat, bscTestnet } from 'wagmi/chains'
import { injected, metaMask } from 'wagmi/connectors'

export const config = createConfig({
  chains: [bscTestnet, hardhat], // BSC Testnet first, then Hardhat for local testing
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [bscTestnet.id]: http('https://data-seed-prebsc-1-s1.binance.org:8545'),
    [hardhat.id]: http('http://127.0.0.1:8545'),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
