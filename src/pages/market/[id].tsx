import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { NextPage } from 'next';
import Layout from '../../components/Layout';
import MarketDetail from '../../components/MarketDetail';
import { useMarket } from '../../hooks/useMarkets';
import { useMarketActions } from '../../hooks/useMarketActions';
import styles from '../../styles/MarketPage.module.css';
import { formatEther, formatUnits } from 'viem';
import { useAccount, useReadContract, useWriteContract, useChainId, usePublicClient } from 'wagmi';
import { parseEther, parseUnits } from 'viem';
import { ERC20Abi } from '../../deployments/abis/ERC20';
import { ViewHelper } from '../../deployments/abis/ViewHelper';
import { UniHelper } from '../../deployments/abis/UniHelper';
import addresses from '../../deployments/addresses';
import { IMarketMakerHookAbi } from '../../deployments/abis/IMarketMakerHook';
import { Market } from '../../types/market';
import { useWalrusMarketData } from '../../hooks/useWalrusMarketData';
import { useTokenValues } from '../../hooks/useViewHelper';
import { useClaim } from '../../hooks/useClaim';
import { useMarketState, MarketState } from '../../hooks/useMarketState';
type TransactionStatus = 'idle' | 'waitingConfirmation' | 'waitingExecution' | 'success' | 'error';

const MarketPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const chainId = useChainId();
  const initialRender = useRef(true);
  const idRef = useRef(id);
  const publicClient = usePublicClient();
  const [isSwapPending, setIsSwapPending] = useState(false);
  
  // Only log when id changes
  useEffect(() => {
    if (id && id !== idRef.current) {
      console.log('🎯 Market page loaded with ID:', id);
      idRef.current = id;
    }
  }, [id]);
  
  const { market, isLoading, error } = useMarket(id as string);
  const { isLoading: isActionLoading } = useMarketActions();
  const { address: userAddress } = useAccount();
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [yesAmount, setYesAmount] = useState('');
  const [noAmount, setNoAmount] = useState('');
  const [needsApproval, setNeedsApproval] = useState(false);
  const [collateralNeeded, setCollateralNeeded] = useState<string>('0');
  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [txError, setTxError] = useState<string | null>(null);

  // Add this helper to get the correct hook address for the current chain
  const getHookAddress = (chainId: number) => {
    const contractAddresses = {
      84532: addresses.baseSepolia.marketMakerHook,
      1301: addresses.unichainSepolia.marketMakerHook
    };

    const address = contractAddresses[chainId as keyof typeof contractAddresses];
    if (!address) {
      throw new Error(`No hook address for chain ID ${chainId}`);
    }
    return address;
  };

  // Update the allowance checks to use the chain-specific hook address
  const { data: collateralAllowance } = useReadContract({
    address: market?.collateralToken as `0x${string}`,
    abi: ERC20Abi,
    functionName: 'allowance',
    args: userAddress ? [
      userAddress as `0x${string}`, 
      getHookAddress(chainId) as `0x${string}`
    ] : undefined,
  });

  const { data: yesTokenAllowance } = useReadContract({
    address: market?.yesTokenAddress as `0x${string}`,
    abi: ERC20Abi,
    functionName: 'allowance',
    args: userAddress ? [
      userAddress as `0x${string}`, 
      getHookAddress(chainId) as `0x${string}`
    ] : undefined,
    chainId,
  });

  const { data: noTokenAllowance } = useReadContract({
    address: market?.noTokenAddress as `0x${string}`,
    abi: ERC20Abi,
    functionName: 'allowance',
    args: userAddress ? [
      userAddress as `0x${string}`, 
      getHookAddress(chainId) as `0x${string}`
    ] : undefined,
    chainId,
  });

  // Approve contract
  const { writeContractAsync, isPending } = useWriteContract({
    mutation: {
      onError: (error) => {
        console.error('Contract write error:', error);
      },
      onSuccess: (data) => {
        console.log('Contract write success:', data);
      }
    }
  });  

  // Add this debug effect at the top level of your component
  useEffect(() => {
    console.log('Debug Allowances:', {
      tradeType,
      amount: yesAmount || noAmount,
      collateralAllowance: collateralAllowance ? formatUnits(collateralAllowance, 6) : 'undefined',
      yesTokenAllowance: yesTokenAllowance ? formatEther(yesTokenAllowance) : 'undefined',
      noTokenAllowance: noTokenAllowance ? formatEther(noTokenAllowance) : 'undefined',
      hookAddress: market?.hookAddress,
      tokenAddresses: {
        collateral: market?.collateralToken,
        yes: market?.yesTokenAddress,
        no: market?.noTokenAddress
      }
    });
  }, [
    tradeType, 
    yesAmount, 
    noAmount, 
    collateralAllowance, 
    yesTokenAllowance, 
    noTokenAllowance, 
    market
  ]);

  // Update the allowance check useEffect
  useEffect(() => {
    if (!market || !userAddress) {
      console.log('Skipping approval check - no market or user');
      return;
    }
    
    if (!yesAmount && !noAmount) {
      console.log('Skipping approval check - no amount entered');
      setNeedsApproval(false);
      return;
    }

    try {
      if (tradeType === 'buy') {
        // For buys, check collateral token allowance
        const collateralAllowanceBigInt = typeof collateralAllowance === 'bigint' ? collateralAllowance : BigInt(0);
        const amountToCheck = parseUnits(yesAmount || noAmount || '0', 6);
        
        // Debug log the exact values being compared
        console.log('Buy Approval Check Details:', {
          allowanceRaw: collateralAllowance?.toString(),
          allowanceFormatted: formatUnits(collateralAllowanceBigInt, 6),
          amountToCheckRaw: amountToCheck.toString(),
          amountToCheckFormatted: formatUnits(amountToCheck, 6),
          comparison: {
            allowanceBigInt: collateralAllowanceBigInt.toString(),
            amountBigInt: amountToCheck.toString(),
            needsApproval: amountToCheck > collateralAllowanceBigInt
          }
        });
        
        setNeedsApproval(amountToCheck > collateralAllowanceBigInt);
      } else {
        // For sells, check the relevant outcome token allowance
        const tokenAllowance = yesAmount ? yesTokenAllowance : noTokenAllowance;
        const tokenAllowanceBigInt = typeof tokenAllowance === 'bigint' ? tokenAllowance : BigInt(0);
        const amountToCheck = parseEther(yesAmount || noAmount || '0');
        
        // Debug log the exact values being compared
        console.log('Sell Approval Check Details:', {
          token: yesAmount ? 'YES' : 'NO',
          allowanceRaw: tokenAllowance?.toString(),
          allowanceFormatted: formatEther(tokenAllowanceBigInt),
          amountToCheckRaw: amountToCheck.toString(),
          amountToCheckFormatted: formatEther(amountToCheck),
          comparison: {
            allowanceBigInt: tokenAllowanceBigInt.toString(),
            amountBigInt: amountToCheck.toString(),
            needsApproval: amountToCheck > tokenAllowanceBigInt
          }
        });
        
        setNeedsApproval(amountToCheck > tokenAllowanceBigInt);
      }
    } catch (error) {
      console.error('Error in approval check:', error);
      setNeedsApproval(true);
    }
  }, [
    collateralAllowance, 
    yesTokenAllowance, 
    noTokenAllowance, 
    yesAmount, 
    noAmount, 
    tradeType, 
    market,
    userAddress
  ]);

  // Add this helper function at the top level
  const getTokenToApprove = (
    chainId: number,
    market: Market | null,
    tradeType: 'buy' | 'sell',
    yesAmount: string,
    noAmount: string
  ) => {
    const contractAddresses = {
      84532: addresses.baseSepolia,
      1301: addresses.unichainSepolia
    };

    const chainAddresses = contractAddresses[chainId as keyof typeof contractAddresses];
    if (!chainAddresses || !market) {
      throw new Error(`No addresses for chain ID ${chainId}`);
    }

    return {
      token: tradeType === 'buy' 
        ? market.collateralToken
        : yesAmount 
          ? market.yesTokenAddress 
          : market.noTokenAddress,
      spender: chainAddresses.marketMakerHook
    };
  };

  // Update handleApprove to include more logging
  const handleApprove = async () => {
    try {
      setTxStatus('waitingConfirmation');
      const { token: tokenToApprove, spender } = getTokenToApprove(
        chainId,
        market,
        tradeType,
        yesAmount,
        noAmount
      );

      const hash = await writeContractAsync({
        address: tokenToApprove as `0x${string}`,
        abi: ERC20Abi,
        functionName: 'approve',
        args: [spender as `0x${string}`, parseEther('1000000')],
      });

      setTxStatus('waitingExecution');
      await publicClient?.waitForTransactionReceipt({ hash });
      
      setTxStatus('success');
      setTimeout(() => setTxStatus('idle'), 500);
    } catch (error) {
      console.error('Approval Error:', error);
      setTxStatus('error');
      setTxError((error as Error).message);
      setTimeout(() => {
        setTxStatus('idle');
        setTxError(null);
      }, 500);
    }
  };

  // Only log when market data changes after initial render
  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    
    if (!isLoading && market) {
      console.log('🎯 Market data loaded successfully');
    }
    if (error) {
      console.error('🎯 Market error:', error);
    }
  }, [market, isLoading, error]);

  const handleTrade = async (outcome: 'YES' | 'NO') => {
    const amount = outcome === 'YES' ? yesAmount : noAmount;
    if (!amount || !market?.id) return;

    setIsSwapPending(true);
    setTxStatus('waitingConfirmation');
    try {
      const contractAddresses = {
        84532: addresses.baseSepolia.marketMakerHook,
        1301: addresses.unichainSepolia.marketMakerHook
      };

      const hookAddress = contractAddresses[chainId as keyof typeof contractAddresses];
      if (!hookAddress) {
        throw new Error(`No hook address for chain ID ${chainId}`);
      }

      const hash = await executeSwap({
        address: hookAddress as `0x${string}`,
        abi: IMarketMakerHookAbi,
        functionName: 'executeSwap',
        args: [
          market.id as `0x${string}`,
          outcome === 'YES',
          tradeType === 'buy'
            ? parseEther(amount)
            : -parseEther(amount),
        ],
      });

      setTxStatus('waitingExecution');

      // Wait for transaction to be mined
      await publicClient?.waitForTransactionReceipt({ hash });
      
      // Reset input fields
      setYesAmount('');
      setNoAmount('');
      
      // Refresh all relevant data
      await Promise.all([
        refetchYesBalance(),
        refetchNoBalance(),
        refetchTokenValues(),
      ]);

      setTxStatus('success');
      setTimeout(() => {
        setTxStatus('idle');
      }, 2000);

    } catch (error: any) {
      console.error('Transaction failed:', error);
      const revertReason = error.cause?.reason || error.message;
      console.error('Revert reason:', revertReason);
      setTxStatus('error');
      setTxError(revertReason);
      setTimeout(() => {
        setTxStatus('idle');
        setTxError(null);
      }, 3000);
    } finally {
      setIsSwapPending(false);
    }
  };

  // Update the hook to use writeContractAsync
  const { writeContractAsync: executeSwap } = useWriteContract();

  // Add this useEffect to monitor the address
  useEffect(() => {
    console.log('Current user address:', userAddress);
  }, [userAddress]);

  const handleBuyShares = async (marketId: string, outcome: 'YES' | 'NO', amount: string) => {
    console.log('handleBuyShares called with address:', userAddress);
    if (!market?.collateralToken || !userAddress) {
      console.error('Missing market data or user not connected:', {
        hasCollateralToken: !!market?.collateralToken,
        hasUserAddress: !!userAddress
      });
      return;
    }

    try {
      console.log('Starting handleBuyShares...');
      console.log('WriteContract instance:', !!executeSwap); // Check if the hook is defined
      
      // Check if approval is needed
      if (needsApproval) {
        console.log('🔓 Need approval first');
        alert('Please approve the contract to spend your collateral tokens first');
        return;
      }

      console.log(`🛒 Attempting to buy ${amount} ${outcome} shares for market ${marketId}`);
      
      // Execute the swap using writeContractAsync
      const hash = await executeSwap({
        address: addresses.baseSepolia.marketMakerHook as `0x${string}`,
        abi: IMarketMakerHookAbi,
        functionName: 'executeSwap',
        args: [
          marketId as `0x${string}`,
          outcome === 'YES', // zeroForOne - true for YES
          parseEther(amount), // amountSpecified
        ],
        gas: BigInt(1000000)
      });

      console.log('Transaction hash:', hash);
      alert('Transaction submitted! Please wait for confirmation.');
      
      console.log('✅ Purchase successful');
      alert(`Successfully purchased ${amount} ${outcome} shares!`);
      
      // Refresh the market data
      console.log('🔄 Reloading page to refresh data');
      router.reload();
    } catch (error) {
      console.error('❌ Error buying shares:', error);
      alert(`Error: ${(error as Error).message}`);
    }
  };

  // Get decimals for collateral token
  const { data: collateralDecimals } = useReadContract({
    address: market?.collateralToken as `0x${string}`,
    abi: ERC20Abi,
    functionName: 'decimals',
  });

  // Log the decimals to check if they are fetched correctly
  useEffect(() => {
    console.log('Collateral Decimals:', collateralDecimals);
  }, [collateralDecimals]);

  // Get decimals for YES token
  const { data: yesTokenDecimals } = useReadContract({
    address: market?.yesTokenAddress as `0x${string}`,
    abi: ERC20Abi,
    functionName: 'decimals',
  });

  // Get decimals for NO token
  const { data: noTokenDecimals } = useReadContract({
    address: market?.noTokenAddress as `0x${string}`,
    abi: ERC20Abi,
    functionName: 'decimals',
  });

  const formatTokenAmount = (amount: bigint | undefined, decimals: number): string => {
    if (!amount) return '0';
    return formatUnits(amount, decimals);
  };

  // Quote collateral needed for trade

  // Move the useReadContract hook to component level
  const { data: quotedCollateral, error: quoteError } = useReadContract({
    address: (chainId === 84532 
      ? addresses.baseSepolia.viewHelper 
      : addresses.unichainSepolia.viewHelper) as `0x${string}`,
    abi: ViewHelper,
    functionName: 'quoteCollateralNeededForTrade',
    args: [
      market?.id as `0x${string}` ?? '0x0000000000000000000000000000000000000000000000000000000000000000',
      tradeType === 'sell'
        ? parseEther('100') + parseEther(yesAmount || noAmount || '0')
        : parseEther('100') - parseEther(yesAmount || noAmount || '0'),
      parseEther('100'), // amountOld (current supply)
      parseEther(market?.collateralPoolSize || '0'), // collateralAmount
      market?.collateralToken as `0x${string}` ?? '0x0000000000000000000000000000000000000000'
    ],
    chainId,
  });

  // Update collateralNeeded when quotedCollateral changes
  useEffect(() => {
    if (quotedCollateral) {
      const formattedQuote = formatUnits(quotedCollateral, 6);
      setCollateralNeeded(formattedQuote);
      console.log('Quote updated:', {
        raw: quotedCollateral.toString(),
        formatted: formattedQuote
      });
    }
  }, [quotedCollateral]);

  // Also log when amounts change
  useEffect(() => {
    console.log('Trade inputs changed:', {
      marketId: market?.id,
      tradeType,
      yesAmount,
      noAmount,
      args: market?.id && (yesAmount || noAmount) ? [
        market.id,
        tradeType === 'buy',
        parseEther(yesAmount || noAmount || '0').toString()
      ] : 'no args'
    });
  }, [market?.id, tradeType, yesAmount, noAmount]);

  // Add this near other useReadContract hooks
  const { data: collateralBalance } = useReadContract({
    address: market?.collateralToken as `0x${string}`,
    abi: ERC20Abi,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined
  });

  // Log the collateral balance whenever it changes
  useEffect(() => {
    if (collateralBalance !== undefined && collateralBalance !== null) {
      console.log('Collateral Balance:', collateralBalance.toString());
    }
  }, [collateralBalance]);

  // Update the formatCollateralBalance function to handle decimals
  const formatCollateralBalance = (balance: bigint | undefined, decimals: number | undefined): string => {
    if (!balance || decimals === undefined) return '0';
    
    // Convert balance to a string and format based on decimals
    const formatted = (Number(balance) / Math.pow(10, decimals)).toFixed(decimals);
    return formatted;
  };

  // Add these hooks to get token balances with error handling
  const { data: yesTokenBalance, refetch: refetchYesBalance } = useReadContract({
    address: market?.yesTokenAddress as `0x${string}`,
    abi: ERC20Abi,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
  });

  const { data: noTokenBalance, refetch: refetchNoBalance } = useReadContract({
    address: market?.noTokenAddress as `0x${string}`,
    abi: ERC20Abi,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
  });

  // Add debug logging
  useEffect(() => {
    console.log('Token Balance Debug:', {
      chainId,
      yesTokenAddress: market?.yesTokenAddress,
      noTokenAddress: market?.noTokenAddress,
      userAddress,
      yesBalance: yesTokenBalance?.toString(),
      noBalance: noTokenBalance?.toString()
    });
  }, [chainId, market, userAddress, yesTokenBalance, noTokenBalance]);

  // Add this useEffect to log token addresses
  useEffect(() => {
    if (market) {
      console.log('YES Token Address:', market.yesTokenAddress);
      console.log('NO Token Address:', market.noTokenAddress);
    }
  }, [market]);

  // Keep existing balance logging
  useEffect(() => {
    if (yesTokenBalance !== undefined && yesTokenBalance !== null) {
      console.log('YES Token Balance:', formatEther(yesTokenBalance));
    }
    if (noTokenBalance !== undefined && noTokenBalance !== null) {
      console.log('NO Token Balance:', formatEther(noTokenBalance));
    }
  }, [yesTokenBalance, noTokenBalance]);

  // Add this effect to log all allowances
  useEffect(() => {
    console.log('Token Allowances:', {
      collateral: {
        token: market?.collateralToken,
        spender: market?.hookAddress,
        amount: collateralAllowance ? formatEther(collateralAllowance) : 'undefined',
        raw: collateralAllowance?.toString()
      },
      yes: {
        token: market?.yesTokenAddress,
        spender: market?.hookAddress,
        amount: yesTokenAllowance ? formatEther(yesTokenAllowance) : 'undefined',
        raw: yesTokenAllowance?.toString()
      },
      no: {
        token: market?.noTokenAddress,
        spender: market?.hookAddress,
        amount: noTokenAllowance ? formatEther(noTokenAllowance) : 'undefined',
        raw: noTokenAllowance?.toString()
      }
    });
  }, [
    market?.collateralToken, 
    market?.yesTokenAddress, 
    market?.noTokenAddress, 
    market?.hookAddress,
    collateralAllowance,
    yesTokenAllowance,
    noTokenAllowance
  ]);

  const collateralBalanceFormatted = formatCollateralBalance(collateralBalance, collateralDecimals);

  // Format the collateral needed based on decimals
  const formatCollateralNeeded = (amount: string | number | undefined, decimals: number | undefined): string => {
    if (!amount || decimals === undefined) return '0.0000';
    return Number(amount).toFixed(4);
  };

  const formattedCollateralNeeded = formatCollateralNeeded(collateralNeeded, collateralDecimals);
  
  
  // Log collateralNeeded to check its value
  useEffect(() => {
    console.log('Collateral Needed:', collateralNeeded);
  }, [collateralNeeded]);

  // Add debug logging
  useEffect(() => {
    console.log('Quote Request Debug:', {
      marketId: market?.id,
      tradeType,
      amount: yesAmount || noAmount,
      chainId,
      viewHelperAddress: chainId === 84532 
        ? addresses.baseSepolia.viewHelper 
        : addresses.unichainSepolia.viewHelper,
      quotedCollateral: quotedCollateral?.toString(),
      quoteError: quoteError?.message
    });
  }, [market?.id, tradeType, yesAmount, noAmount, chainId, quotedCollateral, quoteError]);

  // Add the status component
  const TransactionStatusOverlay = () => {
    if (txStatus === 'idle') return null;

    return (
      <div className={styles.overlay}>
        <div className={styles.statusBox}>
          {txStatus === 'waitingConfirmation' && (
            <>
              <div className={styles.spinner} />
              <p>Waiting for wallet confirmation...</p>
            </>
          )}
          {txStatus === 'waitingExecution' && (
            <>
              <div className={styles.spinner} />
              <p>Waiting for transaction to complete...</p>
            </>
          )}
          {txStatus === 'success' && (
            <>
              <div className={styles.successIcon}>✓</div>
              <p>Transaction successful!</p>
            </>
          )}
          {txStatus === 'error' && (
            <>
              <div className={styles.errorIcon}>✗</div>
              <p>{txError || 'Transaction failed'}</p>
            </>
          )}
        </div>
      </div>
    );
  };

  // Add useTokenValues hook
  const { 
    yesValue, 
    noValue, 
    probability, 
    isLoading: isProbabilityLoading,
    refetch: refetchTokenValues 
  } = useTokenValues(
    market?.id,
    market?.yesTokenAddress,
    market?.noTokenAddress,
    market?.collateralToken
  );

  // Format probability for display
  const formattedProbability = probability ? 
    `${(Number(probability) * 100).toFixed(1)}` : 
    '50.0';

  const { claim, hasClaimed, isPending: isClaimPending } = useClaim(market?.id, userAddress);

  const handleClaim = async () => {
    try {
      // Show waiting for confirmation
      setTxStatus('waitingConfirmation');
      const hash = await claim();
      
      // Show waiting for transaction
      setTxStatus('waitingExecution');
      await publicClient?.waitForTransactionReceipt({ hash });
      
      // Show success and auto-hide after 2 seconds
      setTxStatus('success');
      setTimeout(() => {
        setTxStatus('idle');
      }, 2000);
      
      // Refresh market state
      await refetchMarketState();
    } catch (error: any) {
      console.error('Claim error:', error);
      setTxStatus('error');
      setTxError(error.message);
      // Auto-hide error after 3 seconds
      setTimeout(() => {
        setTxStatus('idle');
        setTxError(null);
      }, 3000);
    }
  };

  const { 
    marketState, 
    isResolved, 
    isClaimed, 
    refetchMarketState 
  } = useMarketState(market?.id);

  return (
    <Layout title={market?.question || 'Loading Market...'}>
      <div className={styles.marketPage}>
        <div className={styles.leftPanel}>
          <div className={styles.chartContainer}>
            <h2>Probability</h2>
            <div className={styles.probabilityDisplay}>
              {isProbabilityLoading ? (
                <span className={styles.loading}>Loading...</span>
              ) : (
                <span className={styles.probabilityValue}>{formattedProbability}%</span>
              )}
            </div>
          </div>

          <div className={styles.marketDetailsContainer}>
            <h2>Market Info</h2>
            <div className={styles.detailsContent}>
              <div className={styles.detailRow}>
                <span className={styles.label}>Total Collateral:</span>
                <span>{market ? parseUnits(market.collateralPoolSize.toString(),6) : '0'} USDC</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>YES Value:</span>
                <span>{yesValue || '0'} USDC</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>NO Value:</span>
                <span>{noValue || '0'} USDC</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Creator:</span>
                <span>{market?.creator?.slice(0, 6)}...{market?.creator?.slice(-4)}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Oracle:</span>
                <span>{market?.oracleAddress?.slice(0, 6)}...{market?.oracleAddress?.slice(-4)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.tradingContainer}>
            <h2>Trade Shares</h2>
            
            <div className={styles.tradeTypeSelector}>
              <button 
                className={`${styles.tradeTypeButton} ${tradeType === 'buy' ? styles.active : ''}`}
                onClick={() => setTradeType('buy')}
              >
                Buy
              </button>
              <button 
                className={`${styles.tradeTypeButton} ${tradeType === 'sell' ? styles.active : ''}`}
                onClick={() => setTradeType('sell')}
              >
                Sell
              </button>
            </div>
            
            {needsApproval ? (
              <div className={styles.approvalContainer}>
                <p className={styles.approvalMessage}>
                  You need to approve the contract to spend your {
                    tradeType === 'buy' ? 'collateral' : (yesAmount ? 'YES' : 'NO')
                  } tokens
                </p>
                <button
                  className={styles.approveButton}
                  onClick={handleApprove}
                  disabled={isPending}
                >
                  {isPending ? 'Approving...' : `Approve ${
                    tradeType === 'buy' ? 'Collateral' : (yesAmount ? 'YES' : 'NO')
                  } Token`}
                </button>
              </div>
            ) : (
              <div className={styles.tradingOptions}>
                <div className={styles.option}>
                  <div className={styles.optionHeader}>
                    <span>YES</span>
                  </div>
                  <input 
                    type="number" 
                    placeholder="Amount" 
                    value={yesAmount}
                    onChange={(e) => setYesAmount(e.target.value)}
                  />
                  <button 
                    className={styles.tradeButton}
                    onClick={() => handleTrade('YES')}
                    disabled={isActionLoading || isSwapPending}
                  >
                    {isSwapPending ? 'Processing...' : tradeType === 'buy' ? 'Buy YES' : 'Sell YES'}
                  </button>
                </div>
                <div className={styles.option}>
                  <div className={styles.optionHeader}>
                    <span>NO</span>
                  </div>
                  <input 
                    type="number" 
                    placeholder="Amount" 
                    value={noAmount}
                    onChange={(e) => setNoAmount(e.target.value)}
                  >
                  </input>
                  <button 
                    className={styles.tradeButton}
                    onClick={() => handleTrade('NO')}
                    disabled={isActionLoading || isSwapPending}
                  >
                    {isSwapPending ? 'Processing...' : tradeType === 'buy' ? 'Buy NO' : 'Sell NO'}
                  </button>
                </div>
                {(yesAmount || noAmount) && (
                  <div className={styles.collateralInfo}>
                    <div className={styles.collateralNeeded}>
                      {Number(collateralNeeded) >= 0 
                        ? `Collateral needed: ${collateralNeeded} USDC`
                        : `Collateral received: ${Math.abs(Number(collateralNeeded)).toFixed(4)} USDC`
                      }
                    </div>
                    <div className={styles.collateralBalance}>
                      Available balance: {collateralBalanceFormatted} USDC
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={styles.sharesContainer}>
            <h2>Your Shares</h2>
            <div className={styles.shareDetails}>
              <div className={styles.shareRow}>
                <span>YES Shares:</span>
                <span>{formatTokenAmount(
                  typeof yesTokenBalance === 'bigint' ? yesTokenBalance : undefined,
                  Number(yesTokenDecimals)
                )}</span>
              </div>
              <div className={styles.shareRow}>
                <span>NO Shares:</span>
                <span>{formatTokenAmount(
                  typeof noTokenBalance === 'bigint' ? noTokenBalance : undefined,
                  Number(noTokenDecimals)
                )}</span>
              </div>
            </div>
          </div>

          <div className={styles.resolutionContainer}>
            <h2>Market Resolution</h2>
            <div className={styles.resolutionContent}>
              <div className={styles.stateInfo}>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Status:</span>
                  <span className={styles.statusValue}>
                    {marketState === MarketState.Active ? 'Active' : 
                     marketState === MarketState.Resolved ? 'Resolved' :
                     marketState === MarketState.Claimed ? 'Claimed' : 'Unknown'}
                  </span>
                </div>
                {isResolved && (
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Outcome:</span>
                    <span className={styles.outcomeValue}>
                      {market?.outcome ? 'YES' : 'NO'}
                    </span>
                  </div>
                )}
              </div>
              
              <div className={styles.resolutionActions}>
                {marketState === MarketState.Active && (
                  <button className={styles.resolveButton}>
                    Resolve Market
                  </button>
                )}
                
                {(marketState === MarketState.Resolved || marketState === MarketState.Claimed) && (
                  <button 
                    className={styles.claimButton}
                    onClick={handleClaim}
                  >
                    {hasClaimed || marketState === MarketState.Claimed ? 'Already Claimed' : 
                     isClaimPending ? 'Claiming...' : 
                     'Claim Winnings'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        <TransactionStatusOverlay />
      </div>
    </Layout>
  );
};

export default MarketPage; 
