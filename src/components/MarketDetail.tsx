import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useTokenValues, useTokenSupplies, useCollateralAmount } from '../hooks/useViewHelper';
import { Market } from '../types/market';
import styles from '../styles/MarketDetail.module.css';

interface MarketDetailProps {
  market: Market;
  onBuyShares: (marketId: string, outcome: 'YES' | 'NO', amount: string) => Promise<void>;
}

const MarketDetail: React.FC<MarketDetailProps> = ({ market, onBuyShares }) => {
  const [outcome, setOutcome] = useState<'YES' | 'NO'>('YES');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { isConnected } = useAccount();
  
  // Get token values and probability from ViewHelper with proper decimals
  const { yesValue, noValue, probability, isLoading: isLoadingValues } = useTokenValues(
    market.id,
    market.yesTokenAddress,
    market.noTokenAddress,
    market.collateralToken
  );
  
  // Get token supplies from ViewHelper with proper decimals
  const { yesSupply, noSupply, isLoading: isLoadingSupplies } = useTokenSupplies(
    market.id,
    market.yesTokenAddress,
    market.noTokenAddress
  );
  
  // Get collateral amount with proper decimals
  const { amount: collateralAmount, isLoading: isLoadingCollateral } = useCollateralAmount(
    market.id,
    market.collateralToken
  );

  const handleBuyShares = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    setIsLoading(true);
    try {
      await onBuyShares(market.id, outcome, amount);
      setAmount('');
    } catch (error) {
      console.error('Error buying shares:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to truncate addresses
  const truncateAddress = (address: string) => {
    if (!address || address === "Not available") return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format percentage for display
  const formatPercentage = (value: string) => {
    return `${(parseFloat(value) * 100).toFixed(2)}%`;
  };

  return (
    <div className={styles.marketDetail}>
      <h2>{market.question}</h2>
      <p className={styles.description}>{market.description}</p>
      
      <div className={styles.marketStats}>
        <div className={styles.statCard}>
          <h3>Market Info</h3>
          <div className={styles.stat}>
            <span>Status:</span> {market.resolved ? 'Resolved' : 'Active'}
          </div>
          {market.resolved && (
            <div className={styles.stat}>
              <span>Outcome:</span> {market.outcome ? 'YES' : 'NO'}
            </div>
          )}
        </div>
        
        <div className={styles.statCard}>
          <h3>Market Metrics</h3>
          <div className={styles.stat}>
            <span>Probability:</span> {isLoadingValues ? 'Loading...' : formatPercentage(probability)}
          </div>
          <div className={styles.stat}>
            <span>Collateral Pool:</span> {isLoadingCollateral ? 'Loading...' : collateralAmount}
          </div>
          <div className={styles.stat}>
            <span>YES Value:</span> {isLoadingValues ? 'Loading...' : yesValue}
          </div>
          <div className={styles.stat}>
            <span>NO Value:</span> {isLoadingValues ? 'Loading...' : noValue}
          </div>
        </div>
        
        <div className={styles.statCard}>
          <h3>Your Position</h3>
          <div className={styles.stat}>
            <span>YES Shares:</span> {market.yesShares}
          </div>
          <div className={styles.stat}>
            <span>NO Shares:</span> {market.noShares}
          </div>
        </div>
      </div>
      
      <div className={styles.statCard}>
        <h3>Technical Details</h3>
        <div className={styles.stat}>
          <span>Pool ID:</span> {truncateAddress(market.id)}
        </div>
        <div className={styles.stat}>
          <span>YES Token:</span> {truncateAddress(market.yesTokenAddress)}
        </div>
        <div className={styles.stat}>
          <span>NO Token:</span> {truncateAddress(market.noTokenAddress)}
        </div>
        <div className={styles.stat}>
          <span>Hook Contract:</span> {truncateAddress(market.hookAddress)}
        </div>
        <div className={styles.stat}>
          <span>Collateral Token:</span> {truncateAddress(market.collateralToken)}
        </div>
        <div className={styles.stat}>
          <span>Collateral Amount:</span> {isLoadingCollateral ? 'Loading...' : collateralAmount}
        </div>
        <div className={styles.stat}>
          <span>Oracle:</span> {truncateAddress(market.oracleAddress)}
        </div>
        <div className={styles.stat}>
          <span>YES Supply:</span> {isLoadingSupplies ? 'Loading...' : yesSupply}
        </div>
        <div className={styles.stat}>
          <span>NO Supply:</span> {isLoadingSupplies ? 'Loading...' : noSupply}
        </div>
      </div>
      
      {!market.resolved && (
        <div className={styles.tradeSection}>
          <h3>Trade Shares</h3>
          <div className={styles.tradeForm}>
            <div className={styles.outcomeSelector}>
              <button 
                className={`${styles.outcomeButton} ${outcome === 'YES' ? styles.selected : ''}`}
                onClick={() => setOutcome('YES')}
              >
                YES
              </button>
              <button 
                className={`${styles.outcomeButton} ${outcome === 'NO' ? styles.selected : ''}`}
                onClick={() => setOutcome('NO')}
              >
                NO
              </button>
            </div>
            
            <div className={styles.amountInput}>
              <label htmlFor="amount">Amount:</label>
              <input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                min="0"
                step="0.01"
              />
            </div>
            
            <button 
              className={styles.buyButton}
              onClick={handleBuyShares}
              disabled={!isConnected || isLoading || !amount || parseFloat(amount) <= 0}
            >
              {isLoading ? 'Processing...' : `Buy ${outcome} Shares`}
            </button>
            
            {!isConnected && (
              <p className={styles.connectWallet}>Please connect your wallet to trade</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketDetail; 