import type { NextPage } from 'next';
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import MarketList from '../components/MarketList';
import { Market } from '../types/market';
import styles from '../styles/Home.module.css';

// Mock data for demonstration
const mockMarkets: Market[] = [
  {
    id: '1',
    question: 'Will ETH price exceed $5000 by the end of 2023?',
    description: 'This market resolves to YES if the price of Ethereum exceeds $5000 USD at any point before December 31, 2023, 23:59:59 UTC.',
    endTime: new Date('2023-12-31').getTime() / 1000,
    resolved: false,
    collateralToken: 'USDC',
    collateralPoolSize: '250000',
    yesPrice: '0.65',
    noPrice: '0.35',
    probability: '0.65',
    yesShares: '0',
    noShares: '0',
  },
  {
    id: '2',
    question: 'Will the US Federal Reserve cut interest rates in Q3 2023?',
    description: 'This market resolves to YES if the Federal Reserve announces a cut to the federal funds rate during Q3 2023 (July 1 - September 30).',
    endTime: new Date('2023-09-30').getTime() / 1000,
    resolved: false,
    collateralToken: 'USDC',
    collateralPoolSize: '180000',
    yesPrice: '0.28',
    noPrice: '0.72',
    probability: '0.28',
    yesShares: '0',
    noShares: '0',
  },
  {
    id: '3',
    question: 'Will Bitcoin reach a new all-time high in 2023?',
    description: 'This market resolves to YES if Bitcoin reaches a price higher than $69,000 USD at any point in 2023.',
    endTime: new Date('2023-12-31').getTime() / 1000,
    resolved: false,
    collateralToken: 'USDC',
    collateralPoolSize: '320000',
    yesPrice: '0.42',
    noPrice: '0.58',
    probability: '0.42',
    yesShares: '0',
    noShares: '0',
  },
];

const Home: NextPage = () => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real application, you would fetch markets from your API or smart contract
    // For now, we'll use the mock data
    const fetchMarkets = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setMarkets(mockMarkets);
      } catch (error) {
        console.error('Error fetching markets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarkets();
  }, []);

  return (
    <Layout title="Prediction Markets">
      <div className={styles.container}>
        {loading ? (
          <div className={styles.loading}>Loading markets...</div>
        ) : (
          <MarketList markets={markets} />
        )}
      </div>
    </Layout>
  );
};

export default Home;
