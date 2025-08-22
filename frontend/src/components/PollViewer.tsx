import { useState, useEffect } from 'react';
import { useContract } from '../hooks/useContract';
import { useWeb3 } from '../hooks/useWeb3';
import type { Poll } from '../types';

export function PollViewer() {
  const { getPoll, getUserVote, vote, settlePoll, getVoterCount, getTotalVoters, loading, error } = useContract();
  const { account } = useWeb3();
  const [pollId, setPollId] = useState(1);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [userVote, setUserVote] = useState<{voted: boolean; optionId: number} | null>(null);
  const [voterCounts, setVoterCounts] = useState<number[]>([]);
  const [totalVoters, setTotalVoters] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [winningOption, setWinningOption] = useState<number | null>(null);

  const loadPoll = async () => {
    const pollData = await getPoll(pollId);
    setPoll(pollData);

    if (pollData && account) {
      const voteData = await getUserVote(pollId, account);
      setUserVote(voteData);

      // Load voter counts for each option
      const counts = await Promise.all(
        pollData.options.map((_, index) => getVoterCount(pollId, index))
      );
      setVoterCounts(counts);

      const total = await getTotalVoters(pollId);
      setTotalVoters(total);
    }
  };

  useEffect(() => {
    loadPoll();
  }, [pollId, account]);

  const handleVote = async () => {
    if (selectedOption === null) {
      alert('Please select an option');
      return;
    }

    const success = await vote(pollId, selectedOption);
    if (success) {
      alert('Vote cast successfully!');
      loadPoll(); // Refresh data
    }
  };

  const handleSettle = async () => {
    if (winningOption === null) {
      alert('Please select the winning option');
      return;
    }

    const success = await settlePoll(pollId, winningOption);
    if (success) {
      alert('Poll settled successfully!');
      loadPoll(); // Refresh data
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

  const getVotePercentage = (optionIndex: number) => {
    if (totalVoters === 0) return 0;
    return Math.round((voterCounts[optionIndex] / totalVoters) * 100);
  };

  if (!poll) {
    return (
      <div className="poll-viewer">
        <div className="poll-selector">
          <label>Poll ID:</label>
          <input
            type="number"
            value={pollId}
            onChange={(e) => setPollId(Number(e.target.value))}
            min={1}
          />
          <button onClick={loadPoll}>Load Poll</button>
        </div>
        {error && <div className="error">❌ Poll not found or error: {error}</div>}
      </div>
    );
  }

  const isEnded = Math.floor(Date.now() / 1000) >= poll.endTime;
  const canVote = !poll.settled && !isEnded && !userVote?.voted;
  const canSettle = !poll.settled && isEnded && account === poll.creator;

  return (
    <div className="poll-viewer">
      <div className="poll-selector">
        <label>Poll ID:</label>
        <input
          type="number"
          value={pollId}
          onChange={(e) => setPollId(Number(e.target.value))}
          min={1}
        />
        <button onClick={loadPoll}>Load Poll</button>
      </div>

      <div className="poll-details">
        <h2>{poll.title}</h2>
        <p className="description">{poll.description}</p>
        
        <div className="poll-meta">
          <div>📅 {formatTimeRemaining(poll.endTime)}</div>
          <div>💰 Pool: {poll.totalPool} ETH</div>
          <div>👥 Total Voters: {totalVoters}</div>
          <div>📊 Status: {poll.settled ? '✅ Settled' : isEnded ? '⏰ Ended' : '🟢 Active'}</div>
        </div>

        <div className="options">
          <h3>Options:</h3>
          {poll.options.map((option, index) => {
            const isUserChoice = userVote?.voted && userVote.optionId === index;
            const isWinning = poll.settled && poll.winningOption === index;
            
            return (
              <div 
                key={index} 
                className={`option ${isUserChoice ? 'user-choice' : ''} ${isWinning ? 'winning' : ''}`}
              >
                <div className="option-header">
                  {canVote && (
                    <input
                      type="radio"
                      name="vote"
                      value={index}
                      checked={selectedOption === index}
                      onChange={() => setSelectedOption(index)}
                    />
                  )}
                  <span className="option-text">{option}</span>
                  {isUserChoice && <span className="badge">Your Vote</span>}
                  {isWinning && <span className="badge winning">Winner!</span>}
                </div>
                
                <div className="option-stats">
                  <div className="vote-count">{voterCounts[index]} votes ({getVotePercentage(index)}%)</div>
                  <div className="vote-bar">
                    <div 
                      className="vote-fill" 
                      style={{ width: `${getVotePercentage(index)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {canVote && (
          <div className="voting-section">
            <p>💡 Cost: 0.001 ETH per vote</p>
            <button 
              onClick={handleVote} 
              disabled={loading || selectedOption === null}
              className="vote-btn"
            >
              {loading ? 'Voting...' : 'Cast Vote (0.001 ETH)'}
            </button>
          </div>
        )}

        {canSettle && (
          <div className="settle-section">
            <h3>Settle Poll (Creator Only)</h3>
            <div className="settle-options">
              {poll.options.map((option, index) => (
                <label key={index}>
                  <input
                    type="radio"
                    name="winner"
                    value={index}
                    checked={winningOption === index}
                    onChange={() => setWinningOption(index)}
                  />
                  {option}
                </label>
              ))}
            </div>
            <button 
              onClick={handleSettle} 
              disabled={loading || winningOption === null}
              className="settle-btn"
            >
              {loading ? 'Settling...' : 'Settle Poll'}
            </button>
          </div>
        )}

        {userVote?.voted && !poll.settled && (
          <div className="vote-status">
            ✅ You voted for: <strong>{poll.options[userVote.optionId]}</strong>
            <p>You'll receive rewards if this option wins!</p>
          </div>
        )}

        {error && <div className="error">❌ {error}</div>}
      </div>
    </div>
  );
}
