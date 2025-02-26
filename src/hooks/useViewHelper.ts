import { useState, useEffect, useMemo } from 'react';
import { useReadContract } from 'wagmi';
import { ViewHelper } from '../deployments/abis/ViewHelper';
import { erc20Abi } from '../deployments/abis/ERC20';
import addresses from '../deployments/addresses';
import { formatUnits } from 'viem';

// Get the ViewHelper contract address
const getViewHelperAddress = () => {
  return addresses.baseSepolia.viewHelper;
};

// Helper function to get token decimals
const useTokenDecimals = (tokenAddress: string | undefined) => {
  const [decimals, setDecimals] = useState<number>(18); // Default to 18 decimals (like ETH)
  
  const { data, isLoading, error } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: 'decimals',
  });
  
  useEffect(() => {
    if (!isLoading && data !== undefined && !error) {
      setDecimals(Number(data));
      console.log(`📏 Token ${tokenAddress} has ${data} decimals`);
    }
    
    if (error) {
      console.error(`❌ Error fetching decimals for ${tokenAddress}:`, error);
      // Keep default of 18 decimals
    }
  }, [tokenAddress, data, isLoading, error]);
  
  return decimals;
};

export const useTokenValues = (
  poolId: string | undefined, 
  yesTokenAddress: string | undefined,
  noTokenAddress: string | undefined,
  collateralAddress: string | undefined
) => {
  const [values, setValues] = useState({
    yesValue: '0',
    noValue: '0',
    probability: '0',
    isLoading: true,
    error: null as Error | null
  });
  
  // Get token decimals
  const yesDecimals = useTokenDecimals(yesTokenAddress);
  const noDecimals = useTokenDecimals(noTokenAddress);
  const collateralDecimals = useTokenDecimals(collateralAddress);

  // Format poolId correctly - ensure it's a proper bytes32 hex string
  const formattedPoolId = useMemo(() => {
    if (!poolId) return undefined;
    
    // Remove any non-hex characters and ensure it starts with 0x
    let cleaned = poolId.startsWith('0x') ? poolId : `0x${poolId}`;
    
    // If it has '0x' prefix, remove it for length calculation
    const hexPart = cleaned.startsWith('0x') ? cleaned.slice(2) : cleaned;
    
    // Ensure it's exactly 64 hex characters (32 bytes)
    if (hexPart.length < 64) {
      // Pad with zeros on the left to match Solidity bytes32 padding
      const paddingNeeded = 64 - hexPart.length;
      cleaned = '0x' + '0'.repeat(paddingNeeded) + hexPart;
    } else if (hexPart.length > 64) {
      // Truncate if too long - take the rightmost 64 characters
      cleaned = '0x' + hexPart.slice(-64);
    } else {
      // Already correct length, just ensure 0x prefix
      cleaned = '0x' + hexPart;
    }
    
    console.log(`📝 Final formatted poolId: ${cleaned} (length: ${cleaned.length})`);
    
    return cleaned as `0x${string}`;
  }, [poolId]);

  // Get market data
  const { data: marketData, isLoading: isLoadingMarket } = useReadContract({
    address: getViewHelperAddress() as `0x${string}`,
    abi: ViewHelper,
    functionName: 'getMarket',
    args: formattedPoolId ? [formattedPoolId] : undefined,
  });

  // Get token supplies
  const { data: tokenSupplies, isLoading: isLoadingSupplies } = useReadContract({
    address: getViewHelperAddress() as `0x${string}`,
    abi: ViewHelper,
    functionName: 'getTokenSupplies',
    args: formattedPoolId ? [formattedPoolId] : undefined,
  });

  // Try the direct getTokenValues call (this might fail)
  const { data, isLoading, error } = useReadContract({
    address: getViewHelperAddress() as `0x${string}`,
    abi: ViewHelper,
    functionName: 'getTokenValues',
    args: formattedPoolId ? [formattedPoolId] : undefined,
  });

  useEffect(() => {
    if (error) {
      console.error(`❌ Error fetching token values for ${poolId}:`, error);
      
      // If direct call fails, try to calculate values client-side
      if (marketData && tokenSupplies && !isLoadingMarket && !isLoadingSupplies) {
        try {
          console.log('Calculating token values client-side...');
          
          // Extract data
          const totalCollateral = marketData.totalCollateral;
          const yesSupply = tokenSupplies[0];
          const noSupply = tokenSupplies[1];
          
          console.log('Total collateral:', totalCollateral.toString());
          console.log('Yes supply:', yesSupply.toString());
          console.log('No supply:', noSupply.toString());
          
          // Skip calculation if supplies are zero
          if (yesSupply === BigInt(0) || noSupply === BigInt(0)) {
            console.log('Token supplies are zero, skipping calculation');
            setValues({
              yesValue: '0.5',
              noValue: '0.5',
              probability: '0.5',
              isLoading: false,
              error: null
            });
            return;
          }
          
          // Calculate values using the same logic as the contract
          const scaledCollateral = totalCollateral * BigInt(10 ** (18 - collateralDecimals));
          const yesValue = (scaledCollateral * BigInt(1e18)) / yesSupply;
          const noValue = (scaledCollateral * BigInt(1e18)) / noSupply;
          const probability = (yesValue * BigInt(1e18)) / (yesValue + noValue);
          
          console.log('Calculated yes value:', yesValue.toString());
          console.log('Calculated no value:', noValue.toString());
          console.log('Calculated probability:', probability.toString());
          
          setValues({
            yesValue: formatUnits(yesValue, 18),
            noValue: formatUnits(noValue, 18),
            probability: (Number(probability) / 1e18).toFixed(4),
            isLoading: false,
            error: null
          });
        } catch (calcError) {
          console.error('Error calculating values client-side:', calcError);
          setValues(prev => ({ ...prev, error: error as Error, isLoading: false }));
        }
      } else {
        setValues(prev => ({ ...prev, error: error as Error, isLoading: false }));
      }
      return;
    }

    if (!isLoading && data) {
      console.log(`💰 Token values for ${poolId}:`, data);
      const [yesValueRaw, noValueRaw, probabilityRaw] = data as [bigint, bigint, bigint];
      
      // Format values using the correct decimals
      const yesValue = formatUnits(yesValueRaw, collateralDecimals);
      const noValue = formatUnits(noValueRaw, collateralDecimals);
      
      // Probability is typically represented as a percentage (0-100%)
      // Assuming the contract returns a value in the range 0-1e18 (where 1e18 = 100%)
      const probability = (Number(probabilityRaw) / 1e18).toFixed(4);
      
      setValues({
        yesValue,
        noValue,
        probability,
        isLoading: false,
        error: null
      });
    }
  }, [poolId, data, isLoading, error, marketData, tokenSupplies, isLoadingMarket, isLoadingSupplies, collateralDecimals]);

  // Add this as a test
  const rawPoolId = poolId as `0x${string}`;
  console.log(`🔄 Using raw poolId without formatting: ${rawPoolId}`);

  const { data: testData, error: testError } = useReadContract({
    address: getViewHelperAddress() as `0x${string}`,
    abi: ViewHelper,
    functionName: 'getTokenValues',
    args: [rawPoolId]});

  useEffect(() => {
    if (testData) {
      console.log(`✅ Test with raw poolId succeeded:`, testData);
    }
    if (testError) {
      console.error(`❌ Test with raw poolId failed:`, testError);
    }
  }, [testData, testError]);

  // Keep only the useEffect that uses these variables
  useEffect(() => {
    if (marketData) {
      console.log('Market data:', marketData);
      console.log('Yes token:', marketData.yesToken);
      console.log('No token:', marketData.noToken);
      console.log('Collateral:', marketData.collateralAddress);
      console.log('Total collateral:', marketData.totalCollateral.toString());
    }
    
    if (tokenSupplies) {
      console.log('Yes supply:', tokenSupplies[0].toString());
      console.log('No supply:', tokenSupplies[1].toString());
    }
  }, [marketData, tokenSupplies]);

  return values;
};

// Hook to get token supplies
export const useTokenSupplies = (
  poolId: string | undefined,
  yesTokenAddress: string | undefined,
  noTokenAddress: string | undefined
) => {
  const [supplies, setSupplies] = useState({
    yesSupply: '0',
    noSupply: '0',
    isLoading: true,
    error: null as Error | null
  });
  
  // Get token decimals
  const yesDecimals = useTokenDecimals(yesTokenAddress);
  const noDecimals = useTokenDecimals(noTokenAddress);

  const { data, isLoading, error } = useReadContract({
    address: getViewHelperAddress() as `0x${string}`,
    abi: ViewHelper,
    functionName: 'getTokenSupplies',
    args: poolId ? [poolId as `0x${string}`] : undefined,
  });

  useEffect(() => {
    if (error) {
      console.error(`❌ Error fetching token supplies for ${poolId}:`, error);
      setSupplies(prev => ({ ...prev, error: error as Error, isLoading: false }));
      return;
    }

    if (!isLoading && data) {
      console.log(`📊 Token supplies for ${poolId}:`, data);
      const [yesSupplyRaw, noSupplyRaw] = data as [bigint, bigint];
      
      // Format values using the correct decimals
      const yesSupply = formatUnits(yesSupplyRaw, yesDecimals);
      const noSupply = formatUnits(noSupplyRaw, noDecimals);
      
      setSupplies({
        yesSupply,
        noSupply,
        isLoading: false,
        error: null
      });
    }
  }, [poolId, data, isLoading, error, yesDecimals, noDecimals]);

  return supplies;
};

// Hook to get collateral amount with proper decimals
export const useCollateralAmount = (
  poolId: string | undefined,
  collateralAddress: string | undefined
) => {
  const [collateralAmount, setCollateralAmount] = useState({
    amount: '0',
    isLoading: true,
    error: null as Error | null
  });
  
  // Get collateral token decimals
  const collateralDecimals = useTokenDecimals(collateralAddress);

  const { data, isLoading, error } = useReadContract({
    address: getViewHelperAddress() as `0x${string}`,
    abi: ViewHelper,
    functionName: 'getMarket',
    args: poolId ? [poolId as `0x${string}`] : undefined,
  });

  useEffect(() => {
    if (error) {
      console.error(`❌ Error fetching market for ${poolId}:`, error);
      setCollateralAmount(prev => ({ ...prev, error: error as Error, isLoading: false }));
      return;
    }

    if (!isLoading && data) {
      const marketData = data as any;
      if (marketData.totalCollateral) {
        // Format collateral amount using the correct decimals
        const amount = formatUnits(marketData.totalCollateral, collateralDecimals);
        
        setCollateralAmount({
          amount,
          isLoading: false,
          error: null
        });
      }
    }
  }, [poolId, data, isLoading, error, collateralDecimals]);

  return collateralAmount;
}; 