import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { NextPage } from 'next';
import Layout from '../../components/Layout';
import MarketDetail from '../../components/MarketDetail';
import { useMarket } from '../../hooks/useMarkets';
import { useMarketActions } from '../../hooks/useMarketActions';
import styles from '../../styles/MarketPage.module.css';
import { formatEther } from 'viem';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { parseEther } from 'viem';
import { ERC20Abi } from '../../deployments/abis/ERC20';
import { ViewHelper } from '../../deployments/abis/ViewHelper';
import { UniHelper } from '../../deployments/abis/UniHelper';
import addresses from '../../deployments/addresses';
import { IMarketMakerHookAbi } from '../../deployments/abis/IMarketMakerHook';

const MarketPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const initialRender = useRef(true);
  const idRef = useRef(id);
  
  // Only log when id changes
  useEffect(() => {
    if (id && id !== idRef.current) {
      console.log('🎯 Market page loaded with ID:', id);
      idRef.current = id;
    }
  }, [id]);
  
  const { market, isLoading, error } = useMarket(id as string);
  const { buyShares, isLoading: isActionLoading } = useMarketActions();
  const { address: userAddress } = useAccount();
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [yesAmount, setYesAmount] = useState('');
  const [noAmount, setNoAmount] = useState('');
  const [needsApproval, setNeedsApproval] = useState(false);
  const [collateralNeeded, setCollateralNeeded] = useState<string>('0');

  // Separate allowance checks for collateral and outcome tokens
  const { data: collateralAllowance } = useReadContract({
    address: market?.collateralToken as `0x${string}`,
    abi: ERC20Abi,
    functionName: 'allowance',
    args: userAddress && market?.hookAddress ? [userAddress, market.hookAddress] : undefined,
  });

  const { data: yesTokenAllowance } = useReadContract({
    address: market?.yesTokenAddress as `0x${string}`,
    abi: ERC20Abi,
    functionName: 'allowance',
    args: userAddress && market?.hookAddress ? [userAddress, market.hookAddress] : undefined,
  });

  const { data: noTokenAllowance } = useReadContract({
    address: market?.noTokenAddress as `0x${string}`,
    abi: ERC20Abi,
    functionName: 'allowance',
    args: userAddress && market?.hookAddress ? [userAddress, market.hookAddress] : undefined,
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

  // Check if approval is needed based on trade type
  useEffect(() => {
    if (!market) return;
    
    const amount = parseEther(yesAmount || noAmount || '0');
    
    if (tradeType === 'buy') {
      // For buys, check collateral token allowance
      const collateralAllowanceBigInt = typeof collateralAllowance === 'bigint' ? collateralAllowance : BigInt(0);
      setNeedsApproval(amount > collateralAllowanceBigInt);
    } else {
      // For sells, check the relevant outcome token allowance
      const tokenAllowance = yesAmount 
        ? yesTokenAllowance 
        : noTokenAllowance;
      const tokenAllowanceBigInt = typeof tokenAllowance === 'bigint' ? tokenAllowance : BigInt(0);
      setNeedsApproval(amount > tokenAllowanceBigInt);
    }
  }, [collateralAllowance, yesTokenAllowance, noTokenAllowance, yesAmount, noAmount, tradeType, market]);

  // Modify handleApprove to handle both cases
  const handleApprove = async () => {
    if (!market?.hookAddress) return;
    
    try {
      console.log('Approving token...');
      const tokenToApprove = tradeType === 'buy' 
        ? market.collateralToken
        : yesAmount 
          ? market.yesTokenAddress 
          : market.noTokenAddress;

      const hash = await writeContractAsync({
        address: tokenToApprove as `0x${string}`,
        abi: ERC20Abi,
        functionName: 'approve',
        args: [market.hookAddress as `0x${string}`, parseEther('1000000')],
      });
      console.log('✅ Approval transaction hash:', hash);
    } catch (error) {
      console.error('❌ Error approving token:', error);
      alert(`Error: ${(error as Error).message}`);
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

    console.log('🎯 handleTrade called:', { outcome, amount, marketId: market.id });

    try {
      // Execute the swap using writeContractAsync
      const hash = await executeSwap({
        address: addresses.baseSepolia.marketMakerHook as `0x${string}`,
        abi: IMarketMakerHookAbi,
        functionName: 'executeSwap',
        args: [
          market.id as `0x${string}`,
          outcome === 'YES', // zeroForOne - true for YES
          tradeType === 'sell' 
            ? -parseEther(amount) // Negative for sells
            : parseEther(amount), // Positive for buys
        ],
      });

      console.log('Transaction submitted:', hash);
      // log inputs
      console.log('Inputs:', {
        address: addresses.baseSepolia.marketMakerHook,
        abi: IMarketMakerHookAbi,
        functionName: 'executeSwap',
        args: [market.id, outcome === 'YES', tradeType === 'sell' ? -parseEther(amount) : parseEther(amount)],
        gas: BigInt(1000000)
      });
      alert('Transaction submitted! Please wait for confirmation.');
      
      // Don't show success message or reload until we confirm the transaction succeeded
      // We should ideally wait for confirmation here
      
    } catch (error: any) {
      console.error('Transaction failed:', error);
      
      // Extract revert reason if available
      const revertReason = error.cause?.reason || error.message;
      console.error('Revert reason:', revertReason);
      
      alert(`Transaction failed: ${revertReason}`);
      return;
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

  const formatTokenAmount = (amount: bigint | undefined, decimals: number | undefined): string => {
    if (!amount) return '0.0000';
    try {
      const formatted = formatEther(amount);
      return Number(formatted).toFixed(4);
    } catch (error) {
      console.error('Error formatting token amount:', error);
      return '0.0000';
    }
  };

  // Quote collateral needed for trade
  const { data: quotedCollateral, error: quoteError } = useReadContract({
    address: addresses.baseSepolia.viewHelper as `0x${string}`,
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
  });

  // Log contract call details
  useEffect(() => {
    console.log('ViewHelper contract address:', addresses.baseSepolia.viewHelper);
    console.log('Quote contract call config:', {
      hasMarketId: !!market?.id,
      hasAmount: !!(yesAmount || noAmount),
      args: market?.id && (yesAmount || noAmount) ? [
        market.id,
        tradeType === 'buy',
        parseEther(yesAmount || noAmount || '0').toString()
      ] : 'no args'
    });
    if (quoteError) {
      console.error('Quote error:', quoteError);
    }
  }, [market?.id, yesAmount, noAmount, tradeType, quoteError]);

  // Update collateral needed when quote changes
  useEffect(() => {
    console.log('Raw quoted collateral:', quotedCollateral);
    if (quotedCollateral) {
      const collateralAmount = formatEther(BigInt(Number(quotedCollateral)));
      console.log('Formatted collateral amount:', collateralAmount);
      setCollateralNeeded(collateralAmount);
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

  // Add this near your other useReadContract hooks
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
    if (!balance || decimals === undefined) return '0.0000';
    
    // Convert balance to a string and format based on decimals
    const formatted = (Number(balance) / Math.pow(10, decimals)).toFixed(decimals);
    return formatted;
  };

  // Add these hooks to get token balances with error handling
  const { data: yesTokenBalance, error: yesBalanceError } = useReadContract({
    address: market?.yesTokenAddress as `0x${string}`,
    abi: ERC20Abi,
    functionName: 'balanceOf',
    args: [userAddress ?? '0x0000000000000000000000000000000000000000'],
  });

  const { data: noTokenBalance, error: noBalanceError } = useReadContract({
    address: market?.noTokenAddress as `0x${string}`,
    abi: ERC20Abi,
    functionName: 'balanceOf',
    args: [userAddress ?? '0x0000000000000000000000000000000000000000'],
  });

  // Add error logging
  useEffect(() => {
    if (yesBalanceError) console.error('Yes token balance error:', yesBalanceError);
    if (noBalanceError) console.error('No token balance error:', noBalanceError);
  }, [yesBalanceError, noBalanceError]);

  // Update the logging to show more details
  useEffect(() => {
    console.log('Token Balance Debug:', {
      yesTokenAddress: market?.yesTokenAddress,
      noTokenAddress: market?.noTokenAddress,
      userAddress,
      yesTokenBalance: yesTokenBalance?.toString(),
      noTokenBalance: noTokenBalance?.toString(),
      isYesBalanceUndefined: yesTokenBalance === undefined,
      isNoBalanceUndefined: noTokenBalance === undefined
    });
  }, [market?.yesTokenAddress, market?.noTokenAddress, userAddress, yesTokenBalance, noTokenBalance]);

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
    if (amount === undefined || decimals === undefined) return '0.0000';

    // Convert amount to a number and take absolute value
    const absoluteAmount = Math.abs(Number(amount));
    // Convert amount to a string and format based on decimals
    const formatted = (absoluteAmount / Math.pow(10, decimals)).toFixed(4);
    return formatted;
  };

  const formattedCollateralNeeded = formatCollateralNeeded(collateralNeeded, collateralDecimals);

  // Log collateralNeeded to check its value
  useEffect(() => {
    console.log('Collateral Needed:', collateralNeeded);
  }, [collateralNeeded]);

  return (
    <Layout title={market?.question || 'Loading Market...'}>
      <div className={styles.marketPage}>
        <div className={styles.leftPanel}>
          <div className={styles.chartContainer}>
            <h2>Probability Chart</h2>
            {/* Chart component will go here */}
          </div>
          
          <div className={styles.transactionsContainer}>
            <h2>Transactions</h2>
            <div className={styles.transactionsList}>
              {/* Example transaction list - replace with real data */}
              <div className={styles.transaction}>
                <span>Buy 100 YES shares</span>
                <span>0.5 ETH</span>
                <span>2 hours ago</span>
              </div>
              {/* Add more transactions */}
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
                    disabled={isActionLoading}
                  >
                    {tradeType === 'buy' ? 'Buy YES' : 'Sell YES'}
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
                    disabled={isActionLoading}
                  >
                    {tradeType === 'buy' ? 'Buy NO' : 'Sell NO'}
                  </button>
                </div>
                {(yesAmount || noAmount) && (
                  <div className={styles.collateralInfo}>
                    <div className={styles.collateralNeeded}>
                      {Number(collateralNeeded) >= 0 
                        ? `Collateral needed: ${formatCollateralNeeded(collateralNeeded, collateralDecimals)} USDC`
                        : `Collateral received: ${formatCollateralNeeded(collateralNeeded, collateralDecimals)} USDC`
                      }
                    </div>
                    <div className={styles.collateralBalance}>
                      Available balance: {collateralBalanceFormatted} {market?.collateralTokenSymbol}
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

          <div className={styles.marketDetailsContainer}>
            <details className={styles.marketDetails}>
              <summary>Market Details</summary>
              <div className={styles.detailsContent}>
                <div className={styles.detailRow}>
                  <span>Question:</span>
                  <span>{market?.question}</span>
                </div>
                <div className={styles.detailRow}>
                  <span>Description:</span>
                  <span>{market?.description}</span>
                </div>
                <div className={styles.detailRow}>
                  <span>End Time:</span>
                  <span>{new Date(market?.endTime || 0 * 1000).toLocaleString()}</span>
                </div>
                <div className={styles.detailRow}>
                  <span>Collateral Pool:</span>
                  <span>{market?.collateralPoolSize} USDC</span>
                </div>
                <div className={styles.detailRow}>
                  <span>Status:</span>
                  <span>{market?.resolved ? 'Resolved' : 'Active'}</span>
                </div>
                {market?.resolved && (
                  <div className={styles.detailRow}>
                    <span>Outcome:</span>
                    <span>{market.outcome ? 'YES' : 'NO'}</span>
                  </div>
                )}
              </div>
            </details>
          </div>

          {market?.resolved ? (
            <button className={styles.claimButton}>
              Claim Winnings
            </button>
          ) : (
            <button className={styles.resolveButton}>
              Resolve Market
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MarketPage; 