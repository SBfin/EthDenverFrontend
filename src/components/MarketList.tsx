import React from 'react';
import Link from 'next/link';
import { Market } from '../types/market';
import { useTokenValues, useCollateralAmount } from '../hooks/useViewHelper';
import styles from '../styles/MarketList.module.css';

interface MarketCardProps {
  market: Market;
}

// Helper function to truncate addresses
const truncateAddress = (address: string) => {
  if (!address || address === "Not available") return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Format percentage for display
const formatPercentage = (value: string) => {
  return `${(parseFloat(value) * 100).toFixed(2)}%`;
};

// Create a separate MarketCard component to use the hook for each market
const MarketCard: React.FC<MarketCardProps> = ({ market }) => {
  const { probability, yesValue, noValue, isLoading } = useTokenValues(
    market.id,
    market.yesTokenAddress,
    market.noTokenAddress,
    market.collateralToken
  );
  
  const { amount: collateralAmount, isLoading: isLoadingCollateral } = useCollateralAmount(
    market.id,
    market.collateralToken
  );
  
  return (
    <Link href={`/market/${market.id}`}>
      <div className={styles.marketCard}>
        <h3>{market.question}</h3>
        <div className={styles.marketInfo}>
          <div className={styles.probability}>
            <span>Probability:</span> {isLoading ? 'Loading...' : formatPercentage(probability)}
          </div>
          <div className={styles.endTime}>
            <span>Ends:</span> {new Date(market.endTime * 1000).toLocaleDateString()}
          </div>
        </div>
        
        <div className={styles.tokenValues}>
          <div className={styles.tokenValue}>
            <span>YES Value:</span> {isLoading ? 'Loading...' : yesValue}
          </div>
          <div className={styles.tokenValue}>
            <span>NO Value:</span> {isLoading ? 'Loading...' : noValue}
          </div>
        </div>
        
        <div className={styles.technicalDetails}>
          <h4>Technical Details</h4>
          <div className={styles.detailRow}>
            <span>Pool ID:</span> {truncateAddress(market.id)}
          </div>
          <div className={styles.detailRow}>
            <span>YES Token:</span> {truncateAddress(market.yesTokenAddress)}
          </div>
          <div className={styles.detailRow}>
            <span>NO Token:</span> {truncateAddress(market.noTokenAddress)}
          </div>
          <div className={styles.detailRow}>
            <span>Hook:</span> {truncateAddress(market.hookAddress)}
          </div>
          <div className={styles.detailRow}>
            <span>Collateral:</span> {truncateAddress(market.collateralToken)}
          </div>
          <div className={styles.detailRow}>
            <span>Collateral Amount:</span> {isLoadingCollateral ? 'Loading...' : collateralAmount}
          </div>
          <div className={styles.detailRow}>
            <span>Oracle:</span> {truncateAddress(market.oracleAddress)}
          </div>
        </div>
      </div>
    </Link>
  );
};

interface MarketListProps {
  markets: Market[];
}

const MarketList: React.FC<MarketListProps> = ({ markets }) => {
  return (
    <div className={styles.marketList}>
      <h2>Available Markets</h2>
      {markets.length === 0 ? (
        <p className={styles.noMarkets}>No markets available</p>
      ) : (
        <div className={styles.markets}>
          {markets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MarketList; 