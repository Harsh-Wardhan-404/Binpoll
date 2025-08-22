import React from 'react';
import { useAccount, useChainId } from 'wagmi';
import { bscTestnet, hardhat } from 'wagmi/chains';

const DebugInfo: React.FC = () => {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const isCorrectNetwork = chainId === bscTestnet.id || chainId === hardhat.id;

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-xs">
      <div className="mb-2 font-bold">Debug Info:</div>
      <div>Connected: {isConnected ? '✅' : '❌'}</div>
      <div>Address: {address || 'None'}</div>
      <div>Chain ID: {chainId || 'None'}</div>
      <div>BSC Testnet ID: {bscTestnet.id}</div>
      <div>Hardhat ID: {hardhat.id}</div>
      <div>Correct Network: {isCorrectNetwork ? '✅' : '❌'}</div>
      <div>Button Enabled: {isConnected && isCorrectNetwork ? '✅' : '❌'}</div>
    </div>
  );
};

export default DebugInfo;
