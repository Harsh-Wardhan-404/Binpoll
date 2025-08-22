import { useState } from 'react'
import { useAccount, useWriteContract, useReadContract, useWalletClient } from 'wagmi'
import { parseEther } from 'viem'
import type { Poll, VoteInfo } from '../types'

const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3' as const

// Simplified ABI - just the functions we need
const CONTRACT_ABI = [
  {
    "inputs": [{"internalType": "string", "name": "_title", "type": "string"}, {"internalType": "string", "name": "_description", "type": "string"}, {"internalType": "string[]", "name": "_options", "type": "string[]"}, {"internalType": "uint256", "name": "_durationInHours", "type": "uint256"}],
    "name": "createPoll",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_pollId", "type": "uint256"}, {"internalType": "uint256", "name": "_optionId", "type": "uint256"}],
    "name": "vote",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_pollId", "type": "uint256"}, {"internalType": "uint256", "name": "_winningOption", "type": "uint256"}],
    "name": "settlePoll",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_pollId", "type": "uint256"}],
    "name": "getPoll",
    "outputs": [{"internalType": "uint256", "name": "id", "type": "uint256"}, {"internalType": "string", "name": "title", "type": "string"}, {"internalType": "string", "name": "description", "type": "string"}, {"internalType": "address", "name": "creator", "type": "address"}, {"internalType": "string[]", "name": "options", "type": "string[]"}, {"internalType": "uint256", "name": "endTime", "type": "uint256"}, {"internalType": "bool", "name": "settled", "type": "bool"}, {"internalType": "uint256", "name": "winningOption", "type": "uint256"}, {"internalType": "uint256", "name": "totalPool", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_pollId", "type": "uint256"}, {"internalType": "address", "name": "_user", "type": "address"}],
    "name": "getUserVote",
    "outputs": [{"internalType": "bool", "name": "voted", "type": "bool"}, {"internalType": "uint256", "name": "optionId", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_pollId", "type": "uint256"}, {"internalType": "uint256", "name": "_optionId", "type": "uint256"}],
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
  }
] as const

export function useContractWagmi() {
  const { address, isConnected } = useAccount()
  const { writeContract, isPending: isWritePending } = useWriteContract()
  const [error, setError] = useState<string | null>(null)

  const createPoll = async (
    title: string,
    description: string,
    options: string[],
    durationInHours: number
  ): Promise<boolean> => {
    if (!isConnected) return false

    try {
      setError(null)
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'createPoll',
        args: [title, description, options, BigInt(durationInHours)],
      })
      return true
    } catch (err: any) {
      setError(err.message || 'Failed to create poll')
      return false
    }
  }

  const vote = async (pollId: number, optionId: number): Promise<boolean> => {
    if (!isConnected) return false

    try {
      setError(null)
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'vote',
        args: [BigInt(pollId), BigInt(optionId)],
        value: parseEther('0.001'),
      })
      return true
    } catch (err: any) {
      setError(err.message || 'Failed to vote')
      return false
    }
  }

  const settlePoll = async (pollId: number, winningOption: number): Promise<boolean> => {
    if (!isConnected) return false

    try {
      setError(null)
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'settlePoll',
        args: [BigInt(pollId), BigInt(winningOption)],
      })
      return true
    } catch (err: any) {
      setError(err.message || 'Failed to settle poll')
      return false
    }
  }

  // Read functions using useReadContract
  const getPoll = (pollId: number) => {
    return useReadContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'getPoll',
      args: [BigInt(pollId)],
    })
  }

  const getUserVote = (pollId: number, userAddress: `0x${string}`) => {
    return useReadContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'getUserVote',
      args: [BigInt(pollId), userAddress],
    })
  }

  const getVoterCount = (pollId: number, optionId: number) => {
    return useReadContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'getVoterCount',
      args: [BigInt(pollId), BigInt(optionId)],
    })
  }

  const getTotalVoters = (pollId: number) => {
    return useReadContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'getTotalVoters',
      args: [BigInt(pollId)],
    })
  }

  return {
    isConnected,
    loading: isWritePending,
    error,
    createPoll,
    vote,
    settlePoll,
    getPoll,
    getUserVote,
    getVoterCount,
    getTotalVoters,
  }
}
