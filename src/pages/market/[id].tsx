import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { NextPage } from 'next';
import Layout from '../../components/Layout';
import MarketDetail from '../../components/MarketDetail';
import { Market } from '../../types/market';
import styles from '../../styles/MarketPage.module.css';

// Mock data (same as in index.tsx)
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

const MarketPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    // In a real application, you would fetch the specific market from your API or smart contract
    const fetchMarket = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        const foundMarket = mockMarkets.find(m => m.id === id);
        
        if (foundMarket) {
          setMarket(foundMarket);
        } else {
          // Market not found
          router.push('/');
        }
      } catch (error) {
        console.error('Error fetching market:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarket();
  }, [id, router]);

  const handleBuyShares = async (marketId: string, outcome: 'YES' | 'NO', amount: string) => {
    // In a real application, this would interact with your smart contract
    console.log(`Buying ${amount} of ${outcome} shares for market ${marketId}`);
    
    // Simulate transaction
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Update local state to reflect the purchase
    if (market) {
      const updatedMarket = { ...market };
      if (outcome === 'YES') {
        updatedMarket.yesShares = (parseFloat(market.yesShares) + parseFloat(amount)).toString();
      } else {
        updatedMarket.noShares = (parseFloat(market.noShares) + parseFloat(amount)).toString();
      }
      setMarket(updatedMarket);
    }
    
    // In a real app, you would show a success notification here
    alert(`Successfully purchased ${amount} ${outcome} shares!`);
  };

  return (
    <Layout title={market ? `${market.question} | Prediction Market` : 'Loading Market'}>
      <div className={styles.container}>
        {loading ? (
          <div className={styles.loading}>Loading market details...</div>
        ) : market ? (
          <>
            <button className={styles.backButton} onClick={() => router.push('/')}>
              &larr; Back to Markets
            </button>
            <MarketDetail market={market} onBuyShares={handleBuyShares} />
          </>
        ) : (
          <div className={styles.notFound}>Market not found</div>
        )}
      </div>
    </Layout>
  );
};

export default MarketPage; 