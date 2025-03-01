import { useState, useEffect, useRef } from 'react';
import { getMarketData } from '../lib/walrus'; // Update this path to match your project structure

interface WalrusMarketData {
  description: string;
  poolId: string;
}

interface UseMarketDataResult {
  data: WalrusMarketData[] | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * React hook to fetch market data using the getMarketData function
 * @param blobId - The ID of the blob to retrieve
 * @param options - Additional options for the hook
 * @returns Object containing the fetched data, loading state, error state, and refetch function
 */
export function useWalrusMarketData(
  blobId: string, 
  options: { 
    enabled?: boolean;
    onSuccess?: (data: any) => void;
    onError?: (error: Error) => void;
  } = {}
): UseMarketDataResult {
  const { enabled = true, onSuccess, onError } = options;
  
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Use refs to store the latest callback values without triggering re-renders
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  
  // Update refs when callbacks change
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  // Store blobId in a ref to access latest value without dependency
  const blobIdRef = useRef(blobId);
  useEffect(() => {
    blobIdRef.current = blobId;
  }, [blobId]);

  // Define fetchData outside of any effects
  const fetchData = async () => {
    if (!blobIdRef.current) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getMarketData(blobIdRef.current);
      setData(result);
      if (onSuccessRef.current) onSuccessRef.current(result);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      if (onErrorRef.current) onErrorRef.current(errorObj);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a stable refetch function
  const refetchRef = useRef(fetchData);
  
  // Use a stable effect that doesn't depend on functions
  useEffect(() => {
    // Only fetch when enabled changes to true or when blobId changes while enabled
    if (enabled) {
      fetchData();
    }
  }, [blobId, enabled]); // Only depend on primitive values

  return { 
    data, 
    isLoading, 
    error, 
    refetch: fetchData  // Using the same function instance
  };
}

/**
 * Example usage
import React from 'react';
import { useMarketData } from './path-to-your-hook'; // Update this path

interface MarketDataDisplayProps {
  blobId: string;
}

const MarketDataDisplay: React.FC<MarketDataDisplayProps> = ({ blobId }) => {
  const { data, isLoading, error, refetch } = useMarketData(blobId, {
    onSuccess: (data) => {
      console.log('Successfully fetched market data:', data);
    },
    onError: (error) => {
      console.error('Failed to fetch market data:', error);
    }
  });

  if (isLoading) {
    return <div>Loading market data...</div>;
  }

  if (error) {
    return (
      <div>
        <p>Error loading market data: {error.message}</p>
        <button onClick={refetch}>Try Again</button>
      </div>
    );
  }

  if (!data) {
    return <div>No market data available</div>;
  }

  return (
    <div>
      <h2>Market Data</h2>
      <button onClick={refetch}>Refresh Data</button>
      <div>
        {data.map((item: any, index: number) => (
          <div key={index}>
            <h3>Market {index + 1}</h3>
            <p><strong>Description:</strong> {item.description}</p>
            <p><strong>Pool ID:</strong> {item.poolId}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketDataDisplay;
 */