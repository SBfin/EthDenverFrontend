import { useState } from 'react';
import { useWriteContract, useAccount, useChainId } from 'wagmi';
import { IMarketMakerHookAbi } from '../deployments/abis/IMarketMakerHook';
import addresses from '../deployments/addresses';
import { parseEther } from 'viem';

// Get the contract address based on the current chain
const getContractAddress = (chainId: number) => {
  const contractAddresses = {
    // Base Sepolia
    84532: addresses.baseSepolia.marketMakerHook,
    // Unichain Sepolia
    1301: addresses.unichainSepolia.marketMakerHook
  };

  const address = contractAddresses[chainId as keyof typeof contractAddresses];
  if (!address) {
    throw new Error(`No contract address for chain ID ${chainId}`);
  }

  console.log(`Using contract address for chain ${chainId}:`, address);
  return address;
};

export const useMarketActions = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { writeContractAsync } = useWriteContract();

  const executeSwap = async (
    marketId: string,
    outcome: 'YES' | 'NO',
    amount: string,
    tradeType: 'buy' | 'sell'
  ) => {
    if (!address) throw new Error('Wallet not connected');

    setIsLoading(true);
    setError(null);

    try {
      const contractAddress = getContractAddress(chainId);
      const zeroForOne = outcome === 'YES';
      const amountBigInt = tradeType === 'sell' 
        ? -parseEther(amount) 
        : parseEther(amount);
      
      const tx = await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: IMarketMakerHookAbi,
        functionName: 'executeSwap',
        args: [marketId as `0x${string}`, zeroForOne, amountBigInt],
      });

      console.log('✅ Swap transaction submitted:', tx);
      return tx;
    } catch (err) {
      console.error('❌ Error executing swap:', err);
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const claimWinnings = async (marketId: string) => {
    if (!address) throw new Error('Wallet not connected');

    setIsLoading(true);
    setError(null);

    try {
      const contractAddress = getContractAddress(chainId);
      
      const tx = await writeContractAsync({
        address: contractAddress as `0x${string}`,
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
    executeSwap,
    claimWinnings,
    isLoading,
    error,
  };
}; 