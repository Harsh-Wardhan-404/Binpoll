import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, type Address } from 'viem';
import { readContract } from '@wagmi/core';
import { config as wagmiConfig } from '../wagmi';
import { useMemo, useEffect, useCallback } from 'react';

// SimplePoll contract ABI
const SIMPLE_POLL_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "CREATOR_FEE_PCT",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "ENTRY_FEE",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MIN_CREATOR_DEPOSIT",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "PLATFORM_FEE_PCT",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "WINNER_POOL_PCT",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "_title", "type": "string"},
      {"internalType": "string", "name": "_description", "type": "string"},
      {"internalType": "string[]", "name": "_options", "type": "string[]"},
      {"internalType": "uint256", "name": "_durationInSeconds", "type": "uint256"},
      {"internalType": "uint256", "name": "_requiredCredibility", "type": "uint256"},
      {"internalType": "uint256", "name": "_pollPrice", "type": "uint256"},
      {"internalType": "uint256", "name": "_maxVotes", "type": "uint256"}
    ],
    "name": "createPoll",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_pollId", "type": "uint256"}],
    "name": "addCreatorDeposit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_pollId", "type": "uint256"}],
    "name": "getPoll",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "id", "type": "uint256"},
          {"internalType": "string", "name": "title", "type": "string"},
          {"internalType": "string", "name": "description", "type": "string"},
          {"internalType": "address", "name": "creator", "type": "address"},
          {"internalType": "string[]", "name": "options", "type": "string[]"},
          {"internalType": "uint256", "name": "endTime", "type": "uint256"},
          {"internalType": "bool", "name": "settled", "type": "bool"},
          {"internalType": "uint256", "name": "winningOption", "type": "uint256"},
          {"internalType": "uint256", "name": "totalPool", "type": "uint256"},
          {"internalType": "uint256", "name": "creatorDeposit", "type": "uint256"},
          {"internalType": "uint256", "name": "voterPool", "type": "uint256"},
          {"internalType": "bool", "name": "exists", "type": "bool"},
          {"internalType": "uint256", "name": "requiredCredibility", "type": "uint256"},
          {"internalType": "uint256", "name": "pollPrice", "type": "uint256"},
          {"internalType": "uint256", "name": "maxVotes", "type": "uint256"},
          {"internalType": "uint256", "name": "entryFee", "type": "uint256"},
          {"internalType": "uint256", "name": "currentVotes", "type": "uint256"},
          {"internalType": "uint256", "name": "voterBetAmount", "type": "uint256"},
          {"internalType": "bool", "name": "creatorRefillClaimed", "type": "bool"}
        ],
        "internalType": "struct SimplePoll.Poll",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_pollId", "type": "uint256"}],
    "name": "getPollRewardBreakdown",
    "outputs": [
      {"internalType": "uint256", "name": "totalPool", "type": "uint256"},
      {"internalType": "uint256", "name": "creatorDeposit", "type": "uint256"},
      {"internalType": "uint256", "name": "voterPool", "type": "uint256"},
      {"internalType": "uint256", "name": "projectedWinnerPool", "type": "uint256"},
      {"internalType": "uint256", "name": "projectedPlatformFee", "type": "uint256"},
      {"internalType": "uint256", "name": "projectedCreatorFee", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_pollId", "type": "uint256"},
      {"internalType": "uint256", "name": "_optionId", "type": "uint256"}
    ],
    "name": "getVoterCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_pollId", "type": "uint256"}],
    "name": "getTotalVoters",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "", "type": "uint256"},
      {"internalType": "address", "name": "", "type": "address"}
    ],
    "name": "hasVoted",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextPollId",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_pollId", "type": "uint256"},
      {"internalType": "uint256", "name": "_winningOption", "type": "uint256"}
    ],
    "name": "settlePoll",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_pollId", "type": "uint256"},
      {"internalType": "uint256", "name": "_optionId", "type": "uint256"}
    ],
    "name": "vote",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "pollId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "creator", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "title", "type": "string"},
      {"indexed": false, "internalType": "string[]", "name": "options", "type": "string[]"},
      {"indexed": false, "internalType": "uint256", "name": "endTime", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "creatorDeposit", "type": "uint256"}
    ],
    "name": "PollCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "pollId", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "winningOption", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "totalWinners", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "rewardPerWinner", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "totalRewardPool", "type": "uint256"}
    ],
    "name": "PollSettled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "pollId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "creator", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "newTotal", "type": "uint256"}
    ],
    "name": "CreatorDepositAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "pollId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "voter", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "optionId", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "VoteCast",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_pollId",
        "type": "uint256"
      }
    ],
    "name": "autoSettlePoll",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

// Contract addresses (you'll need to deploy and update these)
const CONTRACT_ADDRESSES = {
  hardhat: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as Address, // Default Hardhat address
  bscTestnet: '0xC05904956996c4ec4cddD20B4719f93da636E717' as Address, // Updated with dynamic pricing system
};

export interface Poll {
  id: bigint;
  title: string;
  description: string;
  creator: Address;
  options: string[];
  endTime: bigint;
  settled: boolean;
  winningOption: bigint;
  totalPool: bigint;
  creatorDeposit: bigint;
  voterPool: number;
  requiredCredibility: number;
  pollPrice: bigint;
  maxVotes: bigint;
  currentVotes: bigint;
  voterBetAmount: bigint;
  entryFee: bigint;
}

export interface PollRewardBreakdown {
  totalPool: bigint;
  creatorDeposit: bigint;
  voterPool: bigint;
  projectedWinnerPool: bigint;
  projectedPlatformFee: bigint;
  projectedCreatorFee: bigint;
}

export const useSimplePoll = (chainId?: number) => {
  // BSC Testnet chain ID is 97, Hardhat is 31337
  const contractAddress = useMemo(() => 
    chainId === 31337 ? CONTRACT_ADDRESSES.hardhat : CONTRACT_ADDRESSES.bscTestnet,
    [chainId]
  );
  
  // Only log once when chainId changes
  useEffect(() => {
    console.log('🌐 useSimplePoll chainId:', chainId);
    console.log('📍 Selected contract address:', contractAddress);
  }, [chainId, contractAddress]);

  // Call ALL hooks at the top level
  const { data: entryFee } = useReadContract({
    address: contractAddress,
    abi: SIMPLE_POLL_ABI,
    functionName: 'ENTRY_FEE',
  });

  const { data: minCreatorDeposit } = useReadContract({
    address: contractAddress,
    abi: SIMPLE_POLL_ABI,
    functionName: 'MIN_CREATOR_DEPOSIT',
  });

  const { data: nextPollId } = useReadContract({
    address: contractAddress,
    abi: SIMPLE_POLL_ABI,
    functionName: 'nextPollId',
  });

  // For dynamic data, use a different approach
  // Removed unused state variables

  // Write functions
  const { writeContract: createPoll, data: createPollTxHash, isPending: isCreatingPoll, error: createPollError } = useWriteContract();
  const { writeContract: addDeposit, data: addDepositTxHash, isPending: isAddingDeposit, error: addDepositError } = useWriteContract();
  const { writeContract: vote, data: voteTxHash, isPending: isVoting, error: voteError } = useWriteContract();
  const { writeContract: settlePoll, data: settleTxHash, isPending: isSettling, error: settleError } = useWriteContract();

  // Transaction confirmations
  const { isLoading: isCreatingPollConfirming } = useWaitForTransactionReceipt({ hash: createPollTxHash });
  const { isLoading: isAddingDepositConfirming } = useWaitForTransactionReceipt({ hash: addDepositTxHash });
  const { isLoading: isVoteConfirming } = useWaitForTransactionReceipt({ hash: voteTxHash });
  const { isLoading: isSettleConfirming } = useWaitForTransactionReceipt({ hash: settleTxHash });

  // Helper functions
  const createNewPoll = (
    title: string, 
    description: string, 
    options: string[], 
    durationMinutes: number, 
    creatorDepositEth: string,
    requiredCredibility: number = 10,
    pollPrice: string = "0.01",
    maxVotes: number = 100
  ) => {
    console.log('🚀 Creating new poll:', { 
      title, 
      description, 
      options, 
      durationMinutes, 
      creatorDepositEth,
      requiredCredibility,
      pollPrice,
      maxVotes
    });
    console.log('📍 Contract address:', contractAddress);
    console.log('💰 Min creator deposit:', minCreatorDeposit);
    
    if (!minCreatorDeposit) {
      console.error('❌ Min creator deposit not loaded');
      throw new Error('Contract not ready. Please wait and try again.');
    }
    
    const depositAmount = parseEther(creatorDepositEth);
    const pollPriceAmount = parseEther(pollPrice);
    
    console.log('💵 Deposit amount (wei):', depositAmount.toString());
    console.log('💵 Poll price (wei):', pollPriceAmount.toString());
    console.log('💵 Min deposit (wei):', minCreatorDeposit.toString());
    
    if (depositAmount < minCreatorDeposit) {
      throw new Error(`Creator deposit must be at least ${formatEther(minCreatorDeposit)} BNB`);
    }
    
    // Convert minutes to seconds for the contract
    const durationInSeconds = Math.floor(durationMinutes * 60);
    console.log('⏰ Duration converted:', `${durationMinutes} minutes = ${durationInSeconds} seconds`);
    
    console.log('📞 Calling createPoll with:', {
      address: contractAddress,
      functionName: 'createPoll',
      args: [
        title, 
        description, 
        options, 
        BigInt(durationInSeconds),
        BigInt(requiredCredibility),
        pollPriceAmount,
        BigInt(maxVotes)
      ],
      value: depositAmount.toString(),
    });
    
    try {
      createPoll({
        address: contractAddress,
        abi: SIMPLE_POLL_ABI,
        functionName: 'createPoll',
        args: [
          title, 
          description, 
          options, 
          BigInt(durationInSeconds),
          BigInt(requiredCredibility),
          pollPriceAmount,
          BigInt(maxVotes)
        ],
        value: depositAmount,
      });
      console.log('✅ createPoll function called successfully');
    } catch (error) {
      console.error('❌ Error calling createPoll:', error);
      throw error;
    }
  };

  const addCreatorDeposit = (pollId: number, depositAmountEth: string) => {
    addDeposit({
      address: contractAddress,
      abi: SIMPLE_POLL_ABI,
      functionName: 'addCreatorDeposit',
      args: [BigInt(pollId)],
      value: parseEther(depositAmountEth),
    });
  };

  const voteOnPoll = async (pollId: number, optionId: number) => {
    try {
      // Get the dynamic vote price for this specific poll
      const dynamicVotePrice = await getDynamicVotePrice(pollId);
      if (!dynamicVotePrice) {
        throw new Error('Failed to get dynamic vote price');
      }
      
      console.log(`🎯 Voting on poll ${pollId}, option ${optionId} with dynamic price: ${dynamicVotePrice} BNB`);
      
      // Convert the dynamic price to wei
      const voteAmount = parseEther(dynamicVotePrice);
      
      vote({
        address: contractAddress,
        abi: SIMPLE_POLL_ABI,
        functionName: 'vote',
        args: [BigInt(pollId), BigInt(optionId)],
        value: voteAmount,
      });
    } catch (error) {
      console.error('❌ Error in voteOnPoll:', error);
      throw error;
    }
  };

  const settlePollById = (pollId: number, winningOptionId: number) => {
    settlePoll({
      address: contractAddress,
      abi: SIMPLE_POLL_ABI,
      functionName: 'settlePoll',
      args: [BigInt(pollId), BigInt(winningOptionId)],
    });
  };

  const autoSettlePollById = (pollId: number) => {
    settlePoll({
      address: contractAddress,
      abi: SIMPLE_POLL_ABI,
      functionName: 'autoSettlePoll',
      args: [BigInt(pollId)],
    });
  };

  // Helper functions that don't call hooks
  const getPollById = async (pollId: number) => {
    try {
      const result = await readContract(wagmiConfig, {
        address: contractAddress,
        abi: SIMPLE_POLL_ABI,
        functionName: 'getPoll',
        args: [BigInt(pollId)],
      });
      return result;
    } catch (error) {
      console.error('Error fetching poll:', error);
      return null;
    }
  };

  const getVoterCount = async (pollId: number, optionId: number) => {
    try {
      return await readContract(wagmiConfig, {
        address: contractAddress,
        abi: SIMPLE_POLL_ABI,
        functionName: 'getVoterCount',
        args: [BigInt(pollId), BigInt(optionId)],
      });
    } catch (error) {
      console.error('Error fetching voter count:', error);
      return null;
    }
  };

  const getTotalVoters = async (pollId: number) => {
    try {
      return await readContract(wagmiConfig, {
        address: contractAddress,
        abi: SIMPLE_POLL_ABI,
        functionName: 'getTotalVoters',
        args: [BigInt(pollId)],
      });
    } catch (error) {
      console.error('Error fetching total voters:', error);
      return null;
    }
  };

  const hasUserVoted = async (pollId: number, userAddress: Address) => {
    try {
      return await readContract(wagmiConfig, {
        address: contractAddress,
        abi: SIMPLE_POLL_ABI,
        functionName: 'hasVoted',
        args: [BigInt(pollId), userAddress],
      });
    } catch (error) {
      console.error('Error checking if user voted:', error);
      return false;
    }
  };

  const getPollRewardBreakdown = async (pollId: number) => {
    try {
      return await readContract(wagmiConfig, {
        address: contractAddress,
        abi: SIMPLE_POLL_ABI,
        functionName: 'getPollRewardBreakdown',
        args: [BigInt(pollId)],
      });
    } catch (error) {
      console.error('Error fetching poll reward breakdown:', error);
      return null;
    }
  };

  // Function to get all polls from the blockchain
  const getAllPolls = async (): Promise<Poll[]> => {
    console.log('📋 Fetching all blockchain polls...');
    const currentNextPollId = nextPollId ? Number(nextPollId) : 1;
    console.log('📌 Next poll ID:', currentNextPollId);
    
    if (!contractAddress || currentNextPollId <= 1) {
      console.log('⚠️ No polls to fetch or contract not available');
      return [];
    }

    const polls: Poll[] = [];
    
    // Fetch all polls from ID 1 to nextPollId - 1
    for (let i = 1; i < currentNextPollId; i++) {
      try {
        console.log(`🔍 Fetching poll ${i}...`);
        
        try {
          const pollData = await readContract(wagmiConfig, {
            address: contractAddress,
            abi: SIMPLE_POLL_ABI,
            functionName: 'getPoll',
            args: [BigInt(i)],
          });
          
          if (pollData) {
            const formattedPoll = formatPollData(pollData);
            if (formattedPoll) {
              console.log(`✅ Poll ${i} fetched:`, formattedPoll.title);
              polls.push(formattedPoll);
            }
          }
        } catch (pollError) {
          console.log(`⚠️ Poll ${i} doesn't exist or failed to fetch:`, pollError);
          // This is expected for non-existent polls, so we continue
        }
      } catch (error) {
        console.error(`❌ Error fetching poll ${i}:`, error);
      }
    }
    
    console.log('📋 Total blockchain polls created:', polls.length);
    return polls;
  };

  // Function to get dynamic vote price for a specific poll
  const getDynamicVotePrice = useCallback(async (pollId: number) => {
    try {
      console.log(`💰 Fetching dynamic vote price for poll ${pollId}...`);
      const pollData = await readContract(wagmiConfig, {
        address: contractAddress,
        abi: SIMPLE_POLL_ABI,
        functionName: 'getPoll',
        args: [BigInt(pollId)],
      });
      
      if (pollData) {
        // Calculate dynamic price using the same formula as the contract
        const basePrice = pollData.pollPrice;
        const currentVotes = pollData.currentVotes;
        const maxVotes = pollData.maxVotes;
        
        // Use the same calculation as the contract's calculateVotePrice function
        const multiplier = 1n + (currentVotes * 4n) / maxVotes;
        const dynamicPrice = basePrice * multiplier;
        
        const dynamicPriceFormatted = formatEther(dynamicPrice);
        console.log(`✅ Dynamic vote price for poll ${pollId}:`, dynamicPriceFormatted, 'BNB');
        console.log(`📊 Base price: ${formatEther(basePrice)}, Current votes: ${currentVotes}, Max votes: ${maxVotes}, Multiplier: ${multiplier}`);
        return dynamicPriceFormatted;
      }
      console.log(`⚠️ No poll data found for poll ${pollId}, using default`);
      return entryFee ? formatEther(entryFee) : '0';
    } catch (error) {
      console.error(`❌ Error fetching dynamic vote price for poll ${pollId}:`, error);
      return entryFee ? formatEther(entryFee) : '0';
    }
  }, [contractAddress, entryFee]);

  // Function to get entry fee for a specific poll (legacy - now uses dynamic pricing)
  const getPollEntryFee = useCallback(async (pollId: number) => {
    return getDynamicVotePrice(pollId);
  }, [getDynamicVotePrice]);

  // Debug logging for transaction states (only when they change)
  useEffect(() => {
    if (isCreatingPoll || isCreatingPollConfirming || createPollTxHash || createPollError) {
      console.log('🔄 Transaction states:', {
        isCreatingPoll,
        isCreatingPollConfirming,
        createPollTxHash,
        createPollError: createPollError?.message,
      });
    }
  }, [isCreatingPoll, isCreatingPollConfirming, createPollTxHash, createPollError]);

  return {
    // Contract data
    contractAddress,
    entryFee: entryFee ? formatEther(entryFee) : '0',
    entryFeeWei: entryFee,
    minCreatorDeposit: minCreatorDeposit ? formatEther(minCreatorDeposit) : '0',
    minCreatorDepositWei: minCreatorDeposit,
    nextPollId: nextPollId ? Number(nextPollId) : 1,

    // Write functions
    createNewPoll,
    addCreatorDeposit,
    voteOnPoll,
    settlePollById,
    autoSettlePollById,

    // Read functions
    getPollById,
    getAllPolls,
    getVoterCount,
    getTotalVoters,
    hasUserVoted,
    getPollRewardBreakdown,
    getPollEntryFee,
    getDynamicVotePrice,

    // Transaction states
    isCreatingPoll: isCreatingPoll || isCreatingPollConfirming,
    isAddingDeposit: isAddingDeposit || isAddingDepositConfirming,
    isVoting: isVoting || isVoteConfirming,
    isSettling: isSettling || isSettleConfirming,

    // Transaction hashes
    createPollTxHash,
    addDepositTxHash,
    voteTxHash,
    settleTxHash,

    // Errors
    createPollError,
    addDepositError,
    voteError,
    settleError,
  };
};

// Helper function to format poll data from contract
export const formatPollData = (pollData: Record<string, unknown>): Poll | null => {
  if (!pollData) return null;

  return {
    id: pollData.id as bigint,
    title: pollData.title as string,
    description: pollData.description as string,
    creator: pollData.creator as Address,
    options: pollData.options as string[],
    endTime: pollData.endTime as bigint,
    settled: pollData.settled as boolean,
    winningOption: pollData.winningOption as bigint,
    totalPool: pollData.totalPool as bigint,
    creatorDeposit: pollData.creatorDeposit as bigint,
    voterPool: pollData.voterPool as number,
    requiredCredibility: pollData.requiredCredibility as number,
    pollPrice: pollData.pollPrice as bigint,
    maxVotes: pollData.maxVotes as bigint,
    currentVotes: pollData.currentVotes as bigint,
    voterBetAmount: pollData.voterBetAmount as bigint,
    entryFee: pollData.entryFee as bigint,
  };
};

// Helper function to format reward breakdown data from contract
export const formatRewardBreakdown = (breakdownData: unknown): PollRewardBreakdown | null => {
  if (!breakdownData || !Array.isArray(breakdownData) || breakdownData.length < 6) return null;

  return {
    totalPool: breakdownData[0] as bigint,
    creatorDeposit: breakdownData[1] as bigint,
    voterPool: breakdownData[2] as bigint,
    projectedWinnerPool: breakdownData[3] as bigint,
    projectedPlatformFee: breakdownData[4] as bigint,
    projectedCreatorFee: breakdownData[5] as bigint,
  };
};
