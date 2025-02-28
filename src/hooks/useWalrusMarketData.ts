import { useState, useEffect } from 'react';
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

  const fetchData = async () => {
    if (!blobId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getMarketData(blobId);
      setData(result);
      if (onSuccess) onSuccess(result);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      if (onError) onError(errorObj);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [blobId, enabled, fetchData]);

  const refetch = async () => {
    await fetchData();
  };

  return { data, isLoading, error, refetch };
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