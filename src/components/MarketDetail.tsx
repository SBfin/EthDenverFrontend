import React, { useState } from 'react';
import { Market } from '../types/market';
import styles from '../styles/MarketDetail.module.css';
import { useAccount } from 'wagmi';

interface MarketDetailProps {
  market: Market;
  onBuyShares: (marketId: string, outcome: 'YES' | 'NO', amount: string) => Promise<void>;
}

const MarketDetail: React.FC<MarketDetailProps> = ({ market, onBuyShares }) => {
  const [outcome, setOutcome] = useState<'YES' | 'NO'>('YES');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { isConnected } = useAccount();

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

  return (
    <div className={styles.marketDetail}>
      <h2>{market.question}</h2>
      <p className={styles.description}>{market.description}</p>
      
      <div className={styles.marketStats}>
        <div className={styles.statCard}>
          <h3>Market Info</h3>
          <div className={styles.stat}>
            <span>End Time:</span> {new Date(market.endTime * 1000).toLocaleString()}
          </div>
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
            <span>Probability:</span> {parseFloat(market.probability) * 100}%
          </div>
          <div className={styles.stat}>
            <span>Collateral Pool:</span> {market.collateralPoolSize}
          </div>
          <div className={styles.stat}>
            <span>YES Price:</span> {market.yesPrice}
          </div>
          <div className={styles.stat}>
            <span>NO Price:</span> {market.noPrice}
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