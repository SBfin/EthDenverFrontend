import { useReadContract, useChainId } from 'wagmi';
import { IMarketMakerHookAbi } from '../deployments/abis/IMarketMakerHook';
import addresses from '../deployments/addresses';
import { ViewHelper } from '../deployments/abis/ViewHelper';

export enum MarketState {
  Active = 0,
  Resolved = 1,
  Claimed = 2
}

export const useMarketState = (marketId: string | undefined) => {
  const chainId = useChainId();

  // Get the correct contract address for the current chain
  const getHookAddress = (chainId: number) => {
    const contractAddresses = {
      84532: addresses.baseSepolia.viewHelper,
      1301: addresses.unichainSepolia.viewHelper
    };
    return contractAddresses[chainId as keyof typeof contractAddresses];
  };

  const viewHelperAddress = getHookAddress(chainId);

  const { data: marketState, refetch: refetchMarketState } = useReadContract(
    marketId
      ? {
          address: viewHelperAddress as `0x${string}`,
          abi: ViewHelper,
          functionName: 'getMarket',
          args: [marketId as `0x${string}`],
        }
      : {
          address: viewHelperAddress as `0x${string}`,
          abi: ViewHelper,
          functionName: 'getMarket',
          args: [] as any, // or provide a valid default
        }
  );

  // Add debug logging
  console.log('Market State Data:', {
    marketId,
    rawState: marketState,
    state: marketState?.state,
    isResolved: marketState?.state === MarketState.Resolved || marketState?.state === MarketState.Claimed,
    isClaimed: marketState?.state === MarketState.Claimed,
    stateEnum: MarketState[marketState?.state as MarketState] || 'Unknown'
  });

  return {
    marketState: marketState ? Number(marketState.state) : undefined,
    isResolved: Number(marketState?.state) === MarketState.Resolved || Number(marketState?.state) === MarketState.Claimed,
    isClaimed: Number(marketState?.state) === MarketState.Claimed,
    refetchMarketState
  };
}; 