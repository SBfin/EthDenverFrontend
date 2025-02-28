import { useState, useEffect, useRef } from 'react';
import { useReadContract, useReadContracts, useAccount, useChainId } from 'wagmi';
import { IMarketMakerHookAbi } from '../deployments/abis/IMarketMakerHook';
import { ViewHelper } from '../deployments/abis/ViewHelper';
import addresses from '../deployments/addresses';
import { Market } from '../types/market';
import { formatEther } from 'viem';
import { useWalrusMarketData } from './useWalrusMarketData';

// Get the contract address based on the current chain by chainId
const getContractAddress = (chainId: number) => {
  // For local development with anvil, use this address
  // In a real app, you would determine this based on the connected chain
  const addressSepoliaBase = addresses.baseSepolia.marketMakerHook;
  // TODO: add unichainSepolia.marketMakerHook
  const addressSepoliaUnichain = addresses.unichainSepolia.marketMakerHook;
  console.log('chainId', chainId);
  return chainId === 84532 ? addressSepoliaBase : addressSepoliaUnichain;
};

export const useMarketCount = () => {
  const chainId = useChainId();
  
  const contractAddress = getContractAddress(chainId) as `0x${string}`;
  console.log('contractAddress for marketCount', contractAddress);
  
  // Add a state to handle the case when the hook is called before the provider is ready
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [hookError, setHookError] = useState<Error | null>(null);

  const result = useReadContract({
    address: contractAddress,
    abi: IMarketMakerHookAbi,
    functionName: 'marketCount',
  });

  useEffect(() => {
    if (result.data !== undefined) {
      setCount(Number(result.data));
      setLoading(false);
    }
    if (result.error) {
      setHookError(result.error as Error);
      setLoading(false);
    }
  }, [result.data, result.error]);

  return {
    marketCount: count,
    isLoading: loading,
    error: hookError,
  };
};

export const useMarketPoolIds = (count: number) => {
  const chainId = useChainId();
  const contractAddress = getContractAddress(chainId) as `0x${string}`;

  const calls = Array.from({ length: count }, (_, i) => ({
    address: contractAddress,
    abi: IMarketMakerHookAbi,
    functionName: 'marketPoolIds',
    args: [BigInt(i)],
  }));

  const { data, isLoading, error } = useReadContracts({
    contracts: calls,
  });

  // Only log when we get results or errors
  useEffect(() => {
    if (data && data.length > 0) {
      const validPoolIds = data
        .map(result => result.result ? 
          (result.result.toString().startsWith('0x') ? 
            result.result.toString() : 
            `0x${result.result.toString(16)}`) : 
          null)
        .filter(Boolean);
    
    }
    if (error) {
      console.error('❌ Error fetching market pool IDs:', error);
    }
  }, [data, error]);

  return {
    poolIds: data?.map(result => {
      if (!result.result) return undefined;
      const resultStr = result.result.toString();
      return resultStr.startsWith('0x') ? resultStr as `0x${string}` : `0x${result.result.toString(16)}` as `0x${string}`;
    }).filter(Boolean) as `0x${string}`[] || [],
    isLoading,
    error,
  };
};

export const useMarketDetails = (poolIds: string[]) => {
  const chainId = useChainId();
  const contractAddress = getContractAddress(chainId) as `0x${string}`;
  
  // Only log when poolIds change
  useEffect(() => {
    if (poolIds.length > 0) {
      console.log(`🏪 Fetching details for ${poolIds.length} markets`);
    }
  }, [poolIds.length]);
  
  const calls = poolIds.map(poolId => ({
    address: contractAddress,
    abi: IMarketMakerHookAbi,
    functionName: 'markets',
    args: [poolId],
  }));

  const { data, isLoading, error } = useReadContracts({
    contracts: calls,
  });

  // Only log when we get results or errors
  useEffect(() => {
    if (data && data.length > 0 && data.some(d => d.result)) {
      console.log(`📝 Received data for ${data.filter(d => d.result).length} markets`);
    }
    if (error) {
      console.error('❌ Error fetching market details:', error);
    }
  }, [data, error]);

  // Transform contract data to our Market type
  const marketDetails = data?.map((result, index) => {
    if (!result.result) return null;
    
    const marketData = result.result as any;
    const poolId = poolIds[index];
    
    console.log(`Market data for ${poolId}:`, marketData);
    
    // Extract token addresses - they might be objects with an address property
    const yesTokenAddress = typeof marketData.yesToken === 'object' && marketData.yesToken !== null
      ? marketData.yesToken.address || "Not available"
      : marketData.yesToken || "Not available";
      
    const noTokenAddress = typeof marketData.noToken === 'object' && marketData.noToken !== null
      ? marketData.noToken.address || "Not available"
      : marketData.noToken || "Not available";
    
    return {
      id: poolId,
      question: `Market for ${poolId.slice(0, 10)}...`, // This would come from an external source or IPFS
      description: `This is a prediction market with ID ${poolId.slice(0, 10)}...`, // This would come from an external source or IPFS
      endTime: Date.now() / 1000 + 86400 * 30, // Placeholder - would come from oracle or external source
      resolved: marketData.state === 2, // Assuming state 2 is resolved
      outcome: marketData.outcome,
      collateralToken: marketData.collateralAddress,
      collateralPoolSize: formatEther(marketData.totalCollateral),
      yesPrice: '0.5', // This would be calculated from pool data
      noPrice: '0.5', // This would be calculated from pool data
      probability: '0.5', // This would be calculated from pool data
      yesShares: '0', // This would come from user balance of yes tokens
      noShares: '0', // This would come from user balance of no tokens
      // Add token addresses
      yesTokenAddress: yesTokenAddress,
      noTokenAddress: noTokenAddress,
      // Add pool key currencies if available
      currency0Address: marketData.poolKey?.currency0 || "Not available",
      currency1Address: marketData.poolKey?.currency1 || "Not available",
      hookAddress: addresses.baseSepolia.marketMakerHook,
      oracleAddress: marketData.oracle || "Not available",
    } as Market;
  }).filter(Boolean) as Market[];

  return {
    marketDetails: marketDetails || [],
    isLoading,
    error,
  };
};

export const useAllMarkets = () => {
  const chainId = useChainId();
  
  // Log current chain for debugging
  console.log('Current chain:', {
    id: chainId
  });

  // Get the correct contract addresses based on chain
  const contractAddresses = {
    // Base Sepolia
    84532: {
      viewHelper: addresses.baseSepolia.viewHelper,
      // other addresses...
    },
    // Unichain Sepolia
    1301: {
      viewHelper: addresses.unichainSepolia.viewHelper,
      // other addresses...
    }
  };

  const currentChainAddresses = contractAddresses[chainId as keyof typeof contractAddresses];

  const { data: marketsData, isLoading, error: marketsError } = useReadContract({
    address: currentChainAddresses?.viewHelper as `0x${string}`,
    abi: ViewHelper,
    functionName: 'getMarkets',
  });

  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoadingState, setIsLoadingState] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const hasSetError = useRef(false);
  const hasSetMarkets = useRef(false);

  const { marketCount, isLoading: isLoadingMarketsCount, error: countError } = useMarketCount();  
  const { poolIds, isLoading: isLoadingIds, error: idsError } = useMarketPoolIds(marketCount);
  const { marketDetails, isLoading: isLoadingDetails, error: detailsError } = useMarketDetails(poolIds);

  // Only log significant state changes
  useEffect(() => {
    // Only set error once to prevent infinite loops
    if (!hasSetError.current) {
      if (countError) {
        console.error('❌ Market count error:', countError);
        hasSetError.current = true;
        return;
      }
      if (idsError) {
        console.error('❌ Pool IDs error:', idsError);
        setError(idsError as Error);
        hasSetError.current = true;
        return;
      }
      if (detailsError) {
        console.error('❌ Market details error:', detailsError);
        setError(detailsError as Error);
        hasSetError.current = true;
        return;
      }
    }
    
    // Log when loading completes and update state only once
    if (!isLoadingMarketsCount && !isLoadingIds && !isLoadingDetails && !hasSetMarkets.current) {
      if (marketDetails && marketDetails.length > 0) {
        console.log(`✅ Loaded ${marketDetails.length} markets successfully`);
        setMarkets(marketDetails);
      } else if (!countError && !idsError && !detailsError) {
        console.log('ℹ️ No markets found');
      }
      setIsLoadingState(false);
      hasSetMarkets.current = true;
    }
  }, [
    isLoadingMarketsCount, isLoadingIds, isLoadingDetails, 
    countError, idsError, detailsError, 
    marketDetails
  ]);

  // Reset refs when dependencies change
  useEffect(() => {
    hasSetError.current = false;
    hasSetMarkets.current = false;
  }, [marketCount, poolIds.length]);

  return { markets, isLoading: isLoadingState, error };
};

export const useMarket = (id: string | undefined) => {
  const [market, setMarket] = useState<Market | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const chainId = useChainId();
  const contractAddress = getContractAddress(chainId) as `0x${string}`;

    const blobId = process.env.NEXT_PUBLIC_BLOB_ID || '';
    // if (blobId == '') throw 'blobId not added'
    const { data:walrusData, refetch}  = useWalrusMarketData(blobId, {
      onSuccess: (data) => {
        console.log('Successfully fetched market data:', blobId, data);
      },
      onError: (error) => {
        console.error('Failed to fetch market data:', blobId, error);
      }
    });
  
  // Only log when id changes
  useEffect(() => {
    if (id) {
      console.log(`🔍 Fetching market: ${id}`);
    }
  }, [id]);

  const { data, isLoading: isLoadingMarket, error: marketError } = useReadContract({
    address: contractAddress,
    abi: IMarketMakerHookAbi,
    functionName: 'markets',
    args: [id as `0x${string}`]
  });

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    if (marketError) {
      console.error(`❌ Error fetching market ${id}:`, marketError);
      setError(marketError as Error);
      setIsLoading(false);
      return;
    }

    if (!isLoadingMarket && data) {
      console.log(`✅ Market data received for ${id}`);
      const marketData = data as any;
      
      // Extract token addresses - they might be objects with an address property
      const yesTokenAddress = typeof marketData.yesToken === 'object' && marketData.yesToken !== null
        ? marketData.yesToken.address || "Not available"
        : marketData.yesToken || "Not available";
        
      const noTokenAddress = typeof marketData.noToken === 'object' && marketData.noToken !== null
        ? marketData.noToken.address || "Not available"
        : marketData.noToken || "Not available";
      
      // Transform contract data to our Market type
      const transformedMarket: Market = {
        id,
        creator: marketData.creator || "Not available",
        question: `Market for ${id.slice(0, 10)}...`, // This would come from an external source or IPFS
        description: `This is a prediction market with ID ${id.slice(0, 10)}...`, // This would come from an external source or IPFS
        endTime: Date.now() / 1000 + 86400 * 30, // Placeholder - would come from oracle or external source
        resolved: marketData.state === 2, // Assuming state 2 is resolved
        outcome: marketData.outcome,
        collateralToken: marketData.collateralAddress,
        collateralPoolSize: formatEther(marketData.totalCollateral),
        yesPrice: '0.5', // This would be calculated from pool data
        noPrice: '0.5', // This would be calculated from pool data
        probability: '0.5', // This would be calculated from pool data
        yesShares: '0', // This would come from user balance of yes tokens
        noShares: '0', // This would come from user balance of no tokens
        // Add token addresses
        yesTokenAddress: yesTokenAddress,
        noTokenAddress: noTokenAddress,
        // Add pool key currencies if available
        currency0Address: marketData.poolKey?.currency0 || "Not available",
        currency1Address: marketData.poolKey?.currency1 || "Not available",
        hookAddress: addresses.baseSepolia.marketMakerHook,
        oracleAddress: marketData.oracle || "Not available",
      };

      console.log('walrusdata', walrusData)
      if (walrusData) {
        // Your data change logic here
        for (const x of walrusData) {
          if ("0x"+x.poolId == id || x.poolId == id) {
            transformedMarket.description = x.description;
            transformedMarket.question = x.description;
          } 
        }
      }

      setMarket(transformedMarket);
      setIsLoading(false);
    }
  }, [id, data, isLoadingMarket, marketError, walrusData]);

  return { market, isLoading, error };
}; 