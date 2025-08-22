import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useContractWagmi } from '../hooks/useContractWagmi';
import type { Poll } from '../types';

export function PollViewerWagmi() {
  const { address } = useAccount();
  const { vote, settlePoll, loading, error } = useContractWagmi();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<{ [pollId: number]: number }>({});
  const [winningOptions, setWinningOptions] = useState<{ [pollId: number]: number }>({});

  // Mock polls data for now - in real app, you'd fetch from contract
  useEffect(() => {
    // For demo purposes, let's show some example polls
    // In a real app, you'd fetch this from the contract by calling getPoll for each poll ID
    const mockPolls: Poll[] = [
      {
        id: 1,
        title: "Will BNB hit $1000 this year?",
        description: "Prediction market for BNB reaching $1000 by end of 2024",
        creator: "0x1234567890123456789012345678901234567890",
        options: ["Yes", "No"],
        endTime: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
        settled: false,
        winningOption: 0,
        totalPool: "0.005"
      },
      {
        id: 2,
        title: "Which crypto will perform better?",
        description: "Compare performance of major cryptocurrencies",
        creator: "0x1234567890123456789012345678901234567890",
        options: ["BNB", "ETH", "BTC"],
        endTime: Math.floor(Date.now() / 1000) + 172800, // 48 hours from now
        settled: false,
        winningOption: 0,
        totalPool: "0.012"
      }
    ];
    setPolls(mockPolls);
  }, []);

  const handleVote = async (pollId: number) => {
    const optionId = selectedOptions[pollId];
    if (optionId === undefined) {
      alert('Please select an option');
      return;
    }

    const success = await vote(pollId, optionId);
    if (success) {
      alert('Vote cast successfully!');
      // In a real app, refresh the poll data here
    }
  };

  const handleSettle = async (pollId: number) => {
    const winningOption = winningOptions[pollId];
    if (winningOption === undefined) {
      alert('Please select the winning option');
      return;
    }

    const success = await settlePoll(pollId, winningOption);
    if (success) {
      alert('Poll settled successfully!');
      // In a real app, refresh the poll data here
    }
  };

  const formatTimeRemaining = (endTime: number) => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = endTime - now;
    
    if (remaining <= 0) return 'Ended';
    
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  const isCreator = (poll: Poll) => {
    return address && poll.creator.toLowerCase() === address.toLowerCase();
  };

  const isPollEnded = (poll: Poll) => {
    return Math.floor(Date.now() / 1000) >= poll.endTime;
  };

  return (
    <div className="poll-viewer">
      <h2>📊 Active Polls</h2>
      
      {polls.length === 0 ? (
        <div className="no-polls">
          <p>No polls available yet.</p>
          <p>Create the first poll using the "Create Poll" tab!</p>
        </div>
      ) : (
        <div className="polls-list">
          {polls.map((poll) => (
            <div key={poll.id} className="poll-card">
              <div className="poll-header">
                <h3>{poll.title}</h3>
                <div className="poll-meta">
                  <span className="poll-id">Poll #{poll.id}</span>
                  <span className="poll-status">
                    {poll.settled ? '✅ Settled' : isPollEnded(poll) ? '⏰ Ended' : '🟢 Active'}
                  </span>
                </div>
              </div>

              <p className="poll-description">{poll.description}</p>

              <div className="poll-info">
                <div className="info-item">
                  <span>📅 {formatTimeRemaining(poll.endTime)}</span>
                </div>
                <div className="info-item">
                  <span>💰 Pool: {poll.totalPool} BNB</span>
                </div>
                <div className="info-item">
                  <span>👤 Creator: {poll.creator.slice(0, 6)}...{poll.creator.slice(-4)}</span>
                </div>
              </div>

              <div className="poll-options">
                <h4>Options:</h4>
                {poll.options.map((option, index) => {
                  const isWinning = poll.settled && poll.winningOption === index;
                  
                  return (
                    <div 
                      key={index} 
                      className={`option ${isWinning ? 'winning-option' : ''}`}
                    >
                      <div className="option-content">
                        {!poll.settled && !isPollEnded(poll) && (
                          <input
                            type="radio"
                            name={`poll-${poll.id}`}
                            value={index}
                            checked={selectedOptions[poll.id] === index}
                            onChange={() => setSelectedOptions(prev => ({ ...prev, [poll.id]: index }))}
                          />
                        )}
                        <span className="option-text">{option}</span>
                        {isWinning && <span className="winner-badge">🏆 Winner!</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Voting Section */}
              {!poll.settled && !isPollEnded(poll) && (
                <div className="voting-section">
                  <p className="voting-cost">💡 Cost: 0.001 BNB per vote</p>
                  <button 
                    onClick={() => handleVote(poll.id)}
                    disabled={loading || selectedOptions[poll.id] === undefined}
                    className="vote-btn"
                  >
                    {loading ? 'Voting...' : 'Cast Vote (0.001 BNB)'}
                  </button>
                </div>
              )}

              {/* Settlement Section for Creator */}
              {isCreator(poll) && !poll.settled && isPollEnded(poll) && (
                <div className="settle-section">
                  <h4>Settle Poll (Creator Only)</h4>
                  <div className="settle-options">
                    {poll.options.map((option, index) => (
                      <label key={index} className="settle-option">
                        <input
                          type="radio"
                          name={`winner-${poll.id}`}
                          value={index}
                          checked={winningOptions[poll.id] === index}
                          onChange={() => setWinningOptions(prev => ({ ...prev, [poll.id]: index }))}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                  <button 
                    onClick={() => handleSettle(poll.id)}
                    disabled={loading || winningOptions[poll.id] === undefined}
                    className="settle-btn"
                  >
                    {loading ? 'Settling...' : 'Settle Poll'}
                  </button>
                </div>
              )}

              {error && <div className="error">❌ {error}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
