import { useState } from 'react';
import { useWriteContract, useAccount } from 'wagmi';
import { IMarketMakerHookAbi } from '../deployments/abis/IMarketMakerHook';
import addresses from '../deployments/addresses';
import { parseEther } from 'viem';

// Get the contract address based on the current chain
const getContractAddress = () => {
  // For local development with anvil, use this address
  return addresses.baseSepolia.marketMakerHook;
};

export const useMarketActions = () => {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { writeContractAsync } = useWriteContract();

  const buyShares = async (marketId: string, outcome: 'YES' | 'NO', amount: string) => {
    console.log(`🛒 Buying ${amount} ${outcome} shares for market ${marketId}`);
    
    if (!address) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      // The zeroForOne parameter determines if we're buying YES or NO tokens
      // true for YES, false for NO (this might be reversed depending on your contract implementation)
      const zeroForOne = outcome === 'YES';
      
      // Convert amount to the appropriate format
      const amountBigInt = parseEther(amount);
      
      // Call the executeSwap function
      const tx = await writeContractAsync({
        address: getContractAddress() as `0x${string}`,
        abi: IMarketMakerHookAbi,
        functionName: 'executeSwap',
        args: [marketId as `0x${string}`, zeroForOne, amountBigInt],
      });

      console.log('✅ Transaction submitted:', tx);
      return tx;
    } catch (err) {
      console.error('❌ Error buying shares:', err);
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const claimWinnings = async (marketId: string) => {
    console.log(`💰 Claiming winnings for market ${marketId}`);
    
    if (!address) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const tx = await writeContractAsync({
        address: getContractAddress() as `0x${string}`,
        abi: IMarketMakerHookAbi,
        functionName: 'claimWinnings',
        args: [marketId as `0x${string}`],
      });

      console.log('✅ Claim transaction submitted:', tx);
      return tx;
    } catch (err) {
      console.error('❌ Error claiming winnings:', err);
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    buyShares,
    claimWinnings,
    isLoading,
    error,
  };
}; 