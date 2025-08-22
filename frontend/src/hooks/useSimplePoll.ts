import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, type Address } from 'viem';

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
    "name": "PLATFORM_FEE_PCT",
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
    "stateMutability": "nonpayable",
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
      {"internalType": "uint256", "name": "totalPool", "type": "uint256"}
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
      {"indexed": false, "internalType": "uint256", "name": "endTime", "type": "uint256"}
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
      {"indexed": false, "internalType": "uint256", "name": "rewardPerWinner", "type": "uint256"}
    ],
    "name": "PollSettled",
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
  bscTestnet: '0x0000000000000000000000000000000000000000' as Address, // Update after deployment
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
}

export const useSimplePoll = (chainId?: number) => {
  const contractAddress = chainId === 31337 ? CONTRACT_ADDRESSES.hardhat : CONTRACT_ADDRESSES.bscTestnet;

  // Read functions
  const { data: entryFee } = useReadContract({
    address: contractAddress,
    abi: SIMPLE_POLL_ABI,
    functionName: 'ENTRY_FEE',
  });

  const { data: nextPollId } = useReadContract({
    address: contractAddress,
    abi: SIMPLE_POLL_ABI,
    functionName: 'nextPollId',
  });

  // Write functions
  const { writeContract: createPoll, data: createPollTxHash, isPending: isCreatingPoll, error: createPollError } = useWriteContract();
  const { writeContract: vote, data: voteTxHash, isPending: isVoting, error: voteError } = useWriteContract();
  const { writeContract: settlePoll, data: settleTxHash, isPending: isSettling, error: settleError } = useWriteContract();

  // Transaction confirmations
  const { isLoading: isCreatingPollConfirming } = useWaitForTransactionReceipt({ hash: createPollTxHash });
  const { isLoading: isVoteConfirming } = useWaitForTransactionReceipt({ hash: voteTxHash });
  const { isLoading: isSettleConfirming } = useWaitForTransactionReceipt({ hash: settleTxHash });

  // Helper functions
  const createNewPoll = (title: string, description: string, options: string[], durationHours: number) => {
    createPoll({
      address: contractAddress,
      abi: SIMPLE_POLL_ABI,
      functionName: 'createPoll',
      args: [title, description, options, BigInt(durationHours)],
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

  return {
    // Contract data
    contractAddress,
    entryFee: entryFee ? formatEther(entryFee) : '0',
    entryFeeWei: entryFee,
    nextPollId: nextPollId ? Number(nextPollId) : 1,

    // Write functions
    createNewPoll,
    voteOnPoll,
    settlePollById,

    // Read functions
    getPollById,
    getVoterCount,
    getTotalVoters,
    hasUserVoted,

    // Transaction states
    isCreatingPoll: isCreatingPoll || isCreatingPollConfirming,
    isVoting: isVoting || isVoteConfirming,
    isSettling: isSettling || isSettleConfirming,

    // Transaction hashes
    createPollTxHash,
    voteTxHash,
    settleTxHash,

    // Errors
    createPollError,
    voteError,
    settleError,
  };
};

// Helper function to format poll data from contract
export const formatPollData = (pollData: any): Poll | null => {
  if (!pollData || pollData.length < 9) return null;

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
  };
};
