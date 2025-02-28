import { useWriteContract, useReadContract, useChainId, usePublicClient } from 'wagmi';
import { IMarketMakerHookAbi } from '../deployments/abis/IMarketMakerHook';
import addresses from '../deployments/addresses';

export const useClaim = (marketId: string | undefined, userAddress: string | undefined) => {
  const chainId = useChainId();
  const publicClient = usePublicClient();

  // Get the correct contract address for the current chain
  const getHookAddress = (chainId: number) => {
    const contractAddresses = {
      84532: addresses.baseSepolia.marketMakerHook,
      1301: addresses.unichainSepolia.marketMakerHook
    };
    return contractAddresses[chainId as keyof typeof contractAddresses];
  };

  const hookAddress = getHookAddress(chainId);

  // Check if user has already claimed
  const { data: hasClaimed, refetch: refetchHasClaimed } = useReadContract({
    address: hookAddress as `0x${string}`,
    abi: IMarketMakerHookAbi,
    functionName: 'hasClaimed',
    args: marketId ? [
      marketId as `0x${string}`,
      userAddress as `0x${string}`
    ] : undefined,
  });

  // Setup the claim transaction
  const { writeContractAsync: claimWinnings, isPending } = useWriteContract({
    mutation: {
      onError: (error) => {
        console.error('Claim error:', error);
      },
      onSuccess: (data) => {
        console.log('Claim success:', data);
      }
    }
  });

  // Function to execute the claim
  const claim = async () => {
    if (!marketId || !hookAddress) {
      throw new Error('Missing market ID or contract address');
    }

    try {
      const hash = await claimWinnings({
        address: hookAddress as `0x${string}`,
        abi: IMarketMakerHookAbi,
        functionName: 'claimWinnings',
        args: [marketId as `0x${string}`],
      });

      await publicClient?.waitForTransactionReceipt({ hash });
      await refetchHasClaimed();
      
      return hash;
    } catch (error) {
      console.error('Error claiming winnings:', error);
      throw error;
    }
  };

  return {
    claim,
    hasClaimed,
    isPending,
  };
};
