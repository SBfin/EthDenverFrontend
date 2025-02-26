import type { NextPage } from 'next';
import { useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import MarketList from '../components/MarketList';
import { useAllMarkets } from '../hooks/useMarkets';
import styles from '../styles/Home.module.css';

const Home: NextPage = () => {
  const { markets, isLoading, error } = useAllMarkets();
  const initialRender = useRef(true);

  // Only log when markets change after initial render
  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    
    if (!isLoading) {
      if (markets.length > 0) {
        console.log(`🏠 Home page: ${markets.length} markets loaded`);
      }
      if (error) {
        console.error('🏠 Home page error:', error);
      }
    }
  }, [markets, isLoading, error]);

  return (
    <Layout title="Prediction Markets">
      <div className={styles.container}>
        {error && (
          <div className={styles.error}>
            Error loading markets: {error.message}
          </div>
        )}
        
        {isLoading ? (
          <div className={styles.loading}>Loading markets...</div>
        ) : (
          <MarketList markets={markets} />
        )}
      </div>
    </Layout>
  );
};

export default Home;
