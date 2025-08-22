import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface Web3State {
  account: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  chainId: number | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useWeb3() {
  const [state, setState] = useState<Web3State>({
    account: null,
    provider: null,
    signer: null,
    chainId: null,
    isConnected: false,
    isLoading: false,
    error: null,
  });

  const connectWallet = async () => {
    if (!window.ethereum) {
      setState(prev => ({ ...prev, error: 'MetaMask not installed!' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();

      setState({
        account: accounts[0],
        provider,
        signer,
        chainId: Number(network.chainId),
        isConnected: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to connect wallet',
      }));
    }
  };

  const disconnect = () => {
    setState({
      account: null,
      provider: null,
      signer: null,
      chainId: null,
      isConnected: false,
      isLoading: false,
      error: null,
    });
  };

  const switchToHardhat = async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x539' }], // 1337 in hex
      });
    } catch (error: any) {
      // If the chain doesn't exist, add it
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x539',
                chainName: 'Hardhat Local',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['http://127.0.0.1:8545'],
              },
            ],
          });
        } catch (addError) {
          console.error('Failed to add Hardhat network:', addError);
        }
      }
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          setState(prev => ({ ...prev, account: accounts[0] }));
        }
      });

      window.ethereum.on('chainChanged', (chainId: string) => {
        setState(prev => ({ ...prev, chainId: parseInt(chainId, 16) }));
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  return {
    ...state,
    connectWallet,
    disconnect,
    switchToHardhat,
  };
}
