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
import { ERC20Abi } from '../../deployments/abis/ERC20'; // Changed from erc20Abi to ERC20Abi
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

  // Read allowance
  const { data: allowance } = useReadContract({
    address: market?.collateralToken as `0x${string}`,
    abi: ERC20Abi,
    functionName: 'allowance',
    args: userAddress && market?.hookAddress ? [userAddress, market.hookAddress] : undefined,
  });

  // Approve contract
  const { writeContractAsync, isPending: isApproving } = useWriteContract();

  // Check if approval is needed when amount changes
  useEffect(() => {
    if (!allowance || !market) return;
    
    const amount = parseEther(yesAmount || noAmount || '0');
    // Ensure allowance is a bigint before comparison
    const allowanceBigInt = typeof allowance === 'bigint' ? allowance : BigInt(0);
    setNeedsApproval(amount > allowanceBigInt);
  }, [allowance, yesAmount, noAmount, market]);

  const handleApprove = async () => {
    if (!market?.hookAddress || !market?.collateralToken) return;
    
    try {
      console.log('🔓 Approving collateral token...');
      const hash = await writeContractAsync({
        address: market.collateralToken as `0x${string}`,
        abi: ERC20Abi,
        functionName: 'approve',
        args: [market.hookAddress, parseEther('1000000')], // Approve a large amount
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

    if (tradeType === 'buy') {
      await handleBuyShares(market.id, outcome, amount);
    } else {
      // TODO: Implement sell shares functionality
      console.log('Sell shares not implemented yet');
    }
  };

  // Update the hook to use writeContractAsync
  const { writeContractAsync: executeSwap } = useWriteContract();

  const handleBuyShares = async (marketId: string, outcome: 'YES' | 'NO', amount: string) => {
    if (!market?.collateralToken || !userAddress) {
      console.error('Missing market data or user not connected');
      return;
    }

    try {
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

  const formatTokenAmount = (amount: string | number | undefined, decimals: number | undefined): string => {
    if (!amount) return '0';
    try {
      const value = typeof amount === 'string' ? amount : amount.toString();
      const decimalPlaces = decimals || 18; // Default to 18 if decimals not available
      const formattedValue = formatEther(parseEther(value));
      // Show all decimal places up to the token's decimals
      return Number(formattedValue).toFixed(decimalPlaces);
    } catch (error) {
      console.error('Error formatting token amount:', error);
      return '0';
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
            
            {needsApproval && tradeType === 'buy' ? (
              <div className={styles.approvalContainer}>
                <p className={styles.approvalMessage}>
                  You need to approve the contract to spend your collateral tokens
                </p>
                <button
                  className={styles.approveButton}
                  onClick={handleApprove}
                  disabled={isApproving}
                >
                  {isApproving ? 'Approving...' : 'Approve Collateral'}
                </button>
              </div>
            ) : (
              <div className={styles.tradingOptions}>
                <div className={styles.option}>
                  <span>YES</span>
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
                  <span>NO</span>
                  <input 
                    type="number" 
                    placeholder="Amount" 
                    value={noAmount}
                    onChange={(e) => setNoAmount(e.target.value)}
                  />
                  <button 
                    className={styles.tradeButton}
                    onClick={() => handleTrade('NO')}
                    disabled={isActionLoading}
                  >
                    {tradeType === 'buy' ? 'Buy NO' : 'Sell NO'}
                  </button>
                </div>
                {(yesAmount || noAmount) && (
                  <div className={styles.collateralNeeded}>
                    Collateral needed: {collateralNeeded} ETH
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
                <span>{formatTokenAmount(market?.yesShares, Number(yesTokenDecimals))}</span>
              </div>
              <div className={styles.shareRow}>
                <span>NO Shares:</span>
                <span>{formatTokenAmount(market?.noShares, Number(noTokenDecimals))}</span>
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
                  <span>{market?.collateralPoolSize} ETH</span>
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