import React from 'react';
import Link from 'next/link';
import { Market } from '../types/market';
import { useTokenValues, useCollateralAmount } from '../hooks/useViewHelper';
import styles from '../styles/MarketList.module.css';
import { formatUnits } from 'viem';

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
  const { probability, isLoading } = useTokenValues(
    market.id,
    market.yesTokenAddress,
    market.noTokenAddress,
    market.collateralToken
  );
  
  const shortenedAddress = market.collateralToken 
    ? `${market.collateralToken.slice(0, 6)}...${market.collateralToken.slice(-4)}`
    : '';

  // Format pool size to a readable number with max 4 decimals
  const formattedPoolSize = market.collateralPoolSize 


  return (
    <Link href={`/market/${market.id}`}>
      <div className={styles.marketCard}>
        <h3>{market.description}</h3>
        <div className={styles.marketInfo}>
          <div className={styles.infoRow}>
            <span className={styles.label}>Probability:</span>
            <span className={styles.value}>
              {isLoading ? 'Loading...' : `${(Number(probability) * 100).toFixed(2)}%`}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Pool Size:</span>
            <span className={styles.value}>{formattedPoolSize} USDC</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Oracle:</span>
            <span className={styles.value}>{truncateAddress(market.oracleAddress)}</span>
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