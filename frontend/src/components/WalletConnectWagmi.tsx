import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi'
import { hardhat, bscTestnet } from 'wagmi/chains'

export function WalletConnectWagmi() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  const handleConnect = () => {
    const injectedConnector = connectors.find(
      (connector) => connector.id === 'injected' || connector.id === 'metaMask'
    )
    if (injectedConnector) {
      connect({ connector: injectedConnector })
    }
  }

  const handleSwitchToBSC = () => {
    switchChain({ chainId: bscTestnet.id })
  }

  const handleSwitchToHardhat = () => {
    switchChain({ chainId: hardhat.id })
  }

  if (isConnected && address) {
    return (
      <div className="wallet-info">
        <div className="account-info">
          <span className="account">👤 {address.slice(0, 6)}...{address.slice(-4)}</span>
          <span className="chain">⛓️ Chain: {chainId === bscTestnet.id ? 'BSC Testnet' : chainId === hardhat.id ? 'Hardhat' : chainId}</span>
          {chainId !== bscTestnet.id && chainId !== hardhat.id && (
            <>
              <button onClick={handleSwitchToBSC} className="switch-btn">
                Switch to BSC Testnet
              </button>
              <button onClick={handleSwitchToHardhat} className="switch-btn">
                Switch to Hardhat
              </button>
            </>
          )}
        </div>
        <button onClick={() => disconnect()} className="disconnect-btn">
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="wallet-connect">
      <button onClick={handleConnect} className="connect-btn">
        Connect Wallet
      </button>
    </div>
  )
}
