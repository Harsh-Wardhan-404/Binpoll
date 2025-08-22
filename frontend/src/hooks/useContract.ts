import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from './useWeb3';
import type { Poll, VoteInfo } from '../types';

// Re-export for convenience
export type { Poll, VoteInfo };

const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // From your deployment

// Contract ABI - extracted from the compiled artifact
const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "pollId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string[]",
        "name": "options",
        "type": "string[]"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "endTime",
        "type": "uint256"
      }
    ],
    "name": "PollCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "pollId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "winningOption",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalWinners",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "rewardPerWinner",
        "type": "uint256"
      }
    ],
    "name": "PollSettled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "pollId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "voter",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "optionId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "VoteCast",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "CREATOR_FEE_PCT",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "ENTRY_FEE",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "PLATFORM_FEE_PCT",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_description",
        "type": "string"
      },
      {
        "internalType": "string[]",
        "name": "_options",
        "type": "string[]"
      },
      {
        "internalType": "uint256",
        "name": "_durationInHours",
        "type": "uint256"
      }
    ],
    "name": "createPoll",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_pollId",
        "type": "uint256"
      }
    ],
    "name": "getActivePollsCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_pollId",
        "type": "uint256"
      }
    ],
    "name": "getPoll",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "internalType": "string[]",
        "name": "options",
        "type": "string[]"
      },
      {
        "internalType": "uint256",
        "name": "endTime",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "settled",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "winningOption",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalPool",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_pollId",
        "type": "uint256"
      }
    ],
    "name": "getTotalVoters",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_pollId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_user",
        "type": "address"
      }
    ],
    "name": "getUserVote",
    "outputs": [
      {
        "internalType": "bool",
        "name": "voted",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "optionId",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_pollId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_optionId",
        "type": "uint256"
      }
    ],
    "name": "getVoterCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_pollId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_optionId",
        "type": "uint256"
      }
    ],
    "name": "getVotersForOption",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "hasVoted",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextPollId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "platform",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "pollVoters",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "polls",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "endTime",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "settled",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "winningOption",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalPool",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "exists",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_pollId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_winningOption",
        "type": "uint256"
      }
    ],
    "name": "settlePoll",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "userVotes",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_pollId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_optionId",
        "type": "uint256"
      }
    ],
    "name": "vote",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];



export function useContract() {
  const { signer, isConnected } = useWeb3();
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (signer) {
      const contractInstance = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );
      setContract(contractInstance);
    } else {
      setContract(null);
    }
  }, [signer]);

  const createPoll = async (
    title: string,
    description: string,
    options: string[],
    durationInHours: number
  ): Promise<number | null> => {
    if (!contract) return null;

    try {
      setLoading(true);
      setError(null);

      const tx = await contract.createPoll(title, description, options, durationInHours);
      const receipt = await tx.wait();
      
      // Get the poll ID from the event
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'PollCreated';
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsed = contract.interface.parseLog(event);
        return Number(parsed?.args[0]);
      }
      
      return null;
    } catch (err: any) {
      setError(err.message || 'Failed to create poll');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const vote = async (pollId: number, optionId: number): Promise<boolean> => {
    if (!contract) return false;

    try {
      setLoading(true);
      setError(null);

      const tx = await contract.vote(pollId, optionId, {
        value: ethers.parseEther('0.001'), // 0.001 ETH
      });
      await tx.wait();
      
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to vote');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const settlePoll = async (pollId: number, winningOption: number): Promise<boolean> => {
    if (!contract) return false;

    try {
      setLoading(true);
      setError(null);

      const tx = await contract.settlePoll(pollId, winningOption);
      await tx.wait();
      
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to settle poll');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getPoll = async (pollId: number): Promise<Poll | null> => {
    if (!contract) return null;

    try {
      const result = await contract.getPoll(pollId);
      
      return {
        id: Number(result[0]),
        title: result[1],
        description: result[2],
        creator: result[3],
        options: result[4],
        endTime: Number(result[5]),
        settled: result[6],
        winningOption: Number(result[7]),
        totalPool: ethers.formatEther(result[8]),
      };
    } catch (err: any) {
      setError(err.message || 'Failed to get poll');
      return null;
    }
  };

  const getUserVote = async (pollId: number, userAddress: string): Promise<VoteInfo | null> => {
    if (!contract) return null;

    try {
      const result = await contract.getUserVote(pollId, userAddress);
      
      return {
        voted: result[0],
        optionId: Number(result[1]),
      };
    } catch (err: any) {
      setError(err.message || 'Failed to get user vote');
      return null;
    }
  };

  const getVoterCount = async (pollId: number, optionId: number): Promise<number> => {
    if (!contract) return 0;

    try {
      const count = await contract.getVoterCount(pollId, optionId);
      return Number(count);
    } catch (err: any) {
      setError(err.message || 'Failed to get voter count');
      return 0;
    }
  };

  const getTotalVoters = async (pollId: number): Promise<number> => {
    if (!contract) return 0;

    try {
      const count = await contract.getTotalVoters(pollId);
      return Number(count);
    } catch (err: any) {
      setError(err.message || 'Failed to get total voters');
      return 0;
    }
  };

  return {
    contract,
    loading,
    error,
    createPoll,
    vote,
    settlePoll,
    getPoll,
    getUserVote,
    getVoterCount,
    getTotalVoters,
    isConnected,
  };
}
