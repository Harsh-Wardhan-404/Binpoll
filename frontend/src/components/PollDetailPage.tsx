import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccount, useChainId } from 'wagmi';
import { useSimplePoll } from '../hooks/useSimplePoll';
import { usePolls } from '../hooks/usePolls';
import { bscTestnet, hardhat } from 'wagmi/chains';
import type { PollDetail as PollDetailType } from '../types';
import PollDetail from './PollDetail';

const PollDetailPage: React.FC = () => {
  const { pollId } = useParams<{ pollId: string }>();
  const navigate = useNavigate();
  const { address } = useAccount();
  const chainId = useChainId();
  const isCorrectNetwork = chainId === bscTestnet.id || chainId === hardhat.id;

  // Get blockchain voting info if it's a blockchain poll
  const { 
    voteOnPoll: blockchainVote,
    getDynamicVotePrice
  } = useSimplePoll(chainId);

  // Get API voting function
  const { voteOnPoll: apiVote } = usePolls();

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleVote = useCallback(async (poll: PollDetailType, optionIndex: number) => {
    if (!address) {
      alert('Please connect your wallet to vote');
      return;
    }

    try {
      if (poll?.is_on_chain) {
        // For blockchain polls, we need to call the smart contract
        console.log('🔗 Blockchain poll detected - calling smart contract vote');
        
        if (!isCorrectNetwork) {
          alert('Please connect to the correct network (BSC Testnet or Hardhat)');
          return;
        }
        
        // Use the blockchain ID from the poll data
        const blockchainId = poll.blockchain_id;
        const blockchainIdNum = typeof blockchainId === 'string' ? parseInt(blockchainId) : Number(blockchainId);
        
        if (!blockchainIdNum || isNaN(blockchainIdNum)) {
          throw new Error('Invalid blockchain poll ID');
        }
        
        // Get the dynamic vote price for this poll
        const dynamicVotePrice = await getDynamicVotePrice(blockchainIdNum);
        console.log('💰 Dynamic vote price for poll:', blockchainIdNum, 'is:', dynamicVotePrice, 'BNB');
        
        // Call the blockchain voting function
        console.log('🎯 Voting on blockchain poll:', blockchainIdNum, 'option:', optionIndex);
        await blockchainVote(blockchainIdNum, optionIndex);
        const result = await apiVote(pollId, optionIndex);
        
        alert(`Please confirm the transaction in your wallet to submit your vote with ${dynamicVotePrice} BNB!`);
      } else {
        // For API polls, use the API voting flow
        console.log('🌐 API poll detected - calling API vote');
        
        if (!pollId) {
          throw new Error('Poll ID is missing');
        }
        
        // Call the API voting function
        console.log('🎯 Voting on API poll:', pollId, 'option:', optionIndex);
        const result = await apiVote(pollId, optionIndex);
        
        if (result) {
          alert('Vote submitted successfully!');
          // The poll data will be refreshed automatically by the usePolls hook
        } else {
          alert('Failed to submit vote. Please try again.');
        }
      }
    } catch (error) {
      console.error('Failed to vote:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to vote: ${errorMessage}`);
    }
  }, [address, isCorrectNetwork, blockchainVote, getDynamicVotePrice, apiVote, pollId]);

  if (!pollId) {
    return (
      <div className="min-h-screen bg-secondary-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Invalid Poll ID</h2>
          <p className="text-secondary-300 mb-4">The poll ID is missing from the URL.</p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-primary-500 text-secondary-900 font-semibold rounded-lg hover:bg-primary-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <PollDetail
      pollId={pollId}
      onBack={handleBack}
      onVote={handleVote}
    />
  );
};

export default PollDetailPage;
