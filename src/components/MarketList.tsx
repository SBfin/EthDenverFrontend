import React from 'react';
import Link from 'next/link';
import { Market } from '../types/market';
import styles from '../styles/MarketList.module.css';

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
            <Link href={`/market/${market.id}`} key={market.id}>
              <div className={styles.marketCard}>
                <h3>{market.question}</h3>
                <div className={styles.marketInfo}>
                  <div className={styles.probability}>
                    <span>Probability:</span> {parseFloat(market.probability) * 100}%
                  </div>
                  <div className={styles.endTime}>
                    <span>Ends:</span> {new Date(market.endTime * 1000).toLocaleDateString()}
                  </div>
                </div>
                <div className={styles.poolSize}>
                  <span>Pool Size:</span> {market.collateralPoolSize}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MarketList; 