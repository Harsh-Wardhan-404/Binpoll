import { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { hardhat, bscTestnet } from 'wagmi/chains';
import { WalletConnectWagmi } from './components/WalletConnectWagmi';
import { CreatePollWagmi } from './components/CreatePollWagmi';
import { PollViewerWagmi } from './components/PollViewerWagmi';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<'view' | 'create'>('view');
  const { isConnected } = useAccount();
  const chainId = useChainId();

  const isValidNetwork = chainId === bscTestnet.id || chainId === hardhat.id;
  const networkName = chainId === bscTestnet.id ? 'BSC Testnet' : chainId === hardhat.id ? 'Hardhat Local' : 'Unknown';

  return (
    <div className="app">
      <header className="header">
        <h1>🗳️ BinPoll - Prediction Market</h1>
        <p>Decentralized prediction market on {networkName}</p>
        <WalletConnectWagmi />
      </header>

      {isConnected && !isValidNetwork && (
        <div className="network-warning">
          ⚠️ Please switch to BSC Testnet (Chain ID: 97) or Hardhat Local (Chain ID: 1337) to interact with the contract
        </div>
      )}

      {isConnected && isValidNetwork && (
        <main className="main">
          <nav className="tabs">
            <button 
              className={`tab ${activeTab === 'view' ? 'active' : ''}`}
              onClick={() => setActiveTab('view')}
            >
              📊 View Polls
            </button>
            <button 
              className={`tab ${activeTab === 'create' ? 'active' : ''}`}
              onClick={() => setActiveTab('create')}
            >
              ➕ Create Poll
            </button>
          </nav>

          <div className="tab-content">
            {activeTab === 'view' && <PollViewerWagmi />}
            {activeTab === 'create' && <CreatePollWagmi />}
          </div>
        </main>
      )}

      {!isConnected && (
        <div className="welcome">
          <h2>Welcome to BinPoll!</h2>
          <p>Connect your wallet to start creating and voting on prediction markets.</p>
          <div className="features">
            <div className="feature">🎯 Create prediction markets with multiple options</div>
            <div className="feature">💰 Stake 0.001 ETH per vote</div>
            <div className="feature">🏆 Winners share 85% of the total pool</div>
            <div className="feature">⚡ Fast, low-cost transactions on local network</div>
          </div>
        </div>
      )}

      <footer className="footer">
        <p>Built for BNB Hackathon • Test locally before mainnet deployment</p>
      </footer>
    </div>
  );
}

export default App;