import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, type Address } from 'viem';
import { readContract } from '@wagmi/core';
import { config as wagmiConfig } from '../wagmi';

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
      {"internalType": "uint256", "name": "_durationInHours", "type": "uint256"}
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
      {"internalType": "uint256", "name": "voterPool", "type": "uint256"}
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
  }
] as const;

// Contract addresses (you'll need to deploy and update these)
const CONTRACT_ADDRESSES = {
  hardhat: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as Address, // Default Hardhat address
  bscTestnet: '0x4EBE6679a99Fbf751D3E90784bA7d613015932B1' as Address, // Update after deployment
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
  voterPool: bigint;
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
  const contractAddress = chainId === 31337 ? CONTRACT_ADDRESSES.hardhat : CONTRACT_ADDRESSES.bscTestnet;
  
  console.log('🌐 useSimplePoll chainId:', chainId);
  console.log('📍 Selected contract address:', contractAddress);

  // Read functions
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
  const createNewPoll = (title: string, description: string, options: string[], durationMinutes: number, creatorDepositEth: string) => {
    console.log('🚀 Creating new poll:', { title, description, options, durationMinutes, creatorDepositEth });
    console.log('📍 Contract address:', contractAddress);
    console.log('💰 Min creator deposit:', minCreatorDeposit);
    
    if (!minCreatorDeposit) {
      console.error('❌ Min creator deposit not loaded');
      throw new Error('Contract not ready. Please wait and try again.');
    }
    
    const depositAmount = parseEther(creatorDepositEth);
    console.log('💵 Deposit amount (wei):', depositAmount.toString());
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
      args: [title, description, options, BigInt(durationInSeconds)],
      value: depositAmount.toString(),
    });
    
    try {
      createPoll({
        address: contractAddress,
        abi: SIMPLE_POLL_ABI,
        functionName: 'createPoll',
        args: [title, description, options, BigInt(durationInSeconds)],
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

  const voteOnPoll = (pollId: number, optionId: number) => {
    if (!entryFee) return;
    
    vote({
      address: contractAddress,
      abi: SIMPLE_POLL_ABI,
      functionName: 'vote',
      args: [BigInt(pollId), BigInt(optionId)],
      value: entryFee,
    });
  };

  const settlePollById = (pollId: number, winningOptionId: number) => {
    settlePoll({
      address: contractAddress,
      abi: SIMPLE_POLL_ABI,
      functionName: 'settlePoll',
      args: [BigInt(pollId), BigInt(winningOptionId)],
    });
  };

  const getPollById = (pollId: number) => {
    return useReadContract({
      address: contractAddress,
      abi: SIMPLE_POLL_ABI,
      functionName: 'getPoll',
      args: [BigInt(pollId)],
    });
  };

  const getVoterCount = (pollId: number, optionId: number) => {
    return useReadContract({
      address: contractAddress,
      abi: SIMPLE_POLL_ABI,
      functionName: 'getVoterCount',
      args: [BigInt(pollId), BigInt(optionId)],
    });
  };

  const getTotalVoters = (pollId: number) => {
    return useReadContract({
      address: contractAddress,
      abi: SIMPLE_POLL_ABI,
      functionName: 'getTotalVoters',
      args: [BigInt(pollId)],
    });
  };

  const hasUserVoted = (pollId: number, userAddress: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: SIMPLE_POLL_ABI,
      functionName: 'hasVoted',
      args: [BigInt(pollId), userAddress],
    });
  };

  const getPollRewardBreakdown = (pollId: number) => {
    return useReadContract({
      address: contractAddress,
      abi: SIMPLE_POLL_ABI,
      functionName: 'getPollRewardBreakdown',
      args: [BigInt(pollId)],
    });
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

  // Debug logging for transaction states
  console.log('🔄 Transaction states:', {
    isCreatingPoll,
    isCreatingPollConfirming,
    createPollTxHash,
    createPollError: createPollError?.message,
  });

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

    // Read functions
    getPollById,
    getAllPolls,
    getVoterCount,
    getTotalVoters,
    hasUserVoted,
    getPollRewardBreakdown,

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
export const formatPollData = (pollData: any): Poll | null => {
  if (!pollData || pollData.length < 11) return null;

  return {
    id: pollData[0],
    title: pollData[1],
    description: pollData[2],
    creator: pollData[3],
    options: pollData[4],
    endTime: pollData[5],
    settled: pollData[6],
    winningOption: pollData[7],
    totalPool: pollData[8],
    creatorDeposit: pollData[9],
    voterPool: pollData[10],
  };
};

// Helper function to format reward breakdown data from contract
export const formatRewardBreakdown = (breakdownData: any): PollRewardBreakdown | null => {
  if (!breakdownData || breakdownData.length < 6) return null;

  return {
    totalPool: breakdownData[0],
    creatorDeposit: breakdownData[1],
    voterPool: breakdownData[2],
    projectedWinnerPool: breakdownData[3],
    projectedPlatformFee: breakdownData[4],
    projectedCreatorFee: breakdownData[5],
  };
};
