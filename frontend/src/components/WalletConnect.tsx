import { useWeb3 } from '../hooks/useWeb3';

export function WalletConnect() {
  const { account, chainId, isConnected, isLoading, error, connectWallet, disconnect, switchToHardhat } = useWeb3();

  if (isConnected) {
    return (
      <div className="wallet-info">
        <div className="account-info">
          <span className="account">👤 {account?.slice(0, 6)}...{account?.slice(-4)}</span>
          <span className="chain">⛓️ Chain: {chainId}</span>
          {chainId !== 1337 && (
            <button onClick={switchToHardhat} className="switch-btn">
              Switch to Hardhat
            </button>
          )}
        </div>
        <button onClick={disconnect} className="disconnect-btn">
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-connect">
      <button 
        onClick={connectWallet} 
        disabled={isLoading}
        className="connect-btn"
      >
        {isLoading ? 'Connecting...' : 'Connect Wallet'}
      </button>
      {error && <div className="error">❌ {error}</div>}
    </div>
  );
}
