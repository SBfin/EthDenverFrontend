import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';
import { NextPage } from 'next';
import Layout from '../../components/Layout';
import MarketDetail from '../../components/MarketDetail';
import { useMarket } from '../../hooks/useMarkets';
import { useMarketActions } from '../../hooks/useMarketActions';
import styles from '../../styles/MarketPage.module.css';

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

  const handleBuyShares = async (marketId: string, outcome: 'YES' | 'NO', amount: string) => {
    console.log(`🛒 Attempting to buy ${amount} ${outcome} shares for market ${marketId}`);
    
    try {
      await buyShares(marketId, outcome, amount);
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

  return (
    <Layout title={market ? `${market.question} | Prediction Market` : 'Loading Market'}>
      <div className={styles.container}>
        {error && (
          <div className={styles.error}>
            Error loading market: {error.message}
          </div>
        )}
        
        {isLoading ? (
          <div className={styles.loading}>Loading market details...</div>
        ) : market ? (
          <>
            <button className={styles.backButton} onClick={() => router.push('/')}>
              &larr; Back to Markets
            </button>
            <MarketDetail 
              market={market} 
              onBuyShares={handleBuyShares} 
            />
          </>
        ) : (
          <div className={styles.notFound}>Market not found</div>
        )}
      </div>
    </Layout>
  );
};

export default MarketPage; 