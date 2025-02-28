import type { NextPage } from 'next';
import { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout';
import MarketList from '../components/MarketList';
import { useAllMarkets } from '../hooks/useMarkets';
import { useWalrusMarketData } from '../hooks/useWalrusMarketData';
import styles from '../styles/Home.module.css';

const Home: NextPage = () => {
  const { markets, isLoading, error } = useAllMarkets();
  const initialRender = useRef(true);
  // const [blobId, setBlobId] = useState('');
  // const [tempInputValue, setTempInputValue] = useState('');
  const blobId = process.env.NEXT_PUBLIC_BLOB_ID || '';
  const { data:walrusData, refetch}  = useWalrusMarketData(blobId, {
    onSuccess: (data) => {
      console.log('Successfully fetched market data:', blobId, data);
    },
    onError: (error) => {
      console.error('Failed to fetch market data:', blobId, error);
    }
  });

  useEffect(() => {
    // Skip the first render when data is undefined
    if (walrusData) {
      // console.log('Data has changed:', walrusData);
      // Your data change logic here
      for (const x of walrusData) {
        const m = markets.find(i => i.id == '0x'+x.poolId)
        if (m) {
          m.description = x.description;
          m.question = x.description;
          // console.log(`saved ${m.id}`)
        } 
      }
    }
  }, [walrusData, markets]); // This dependency array ensures the effect runs only when data changes


    // // Handle input changes (only updates temporary state)
    // const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //   setTempInputValue(e.target.value);
    // };
    
    // // Handle form submission
    // const handleSubmit = (e: React.FormEvent) => {
    //   e.preventDefault();
    //   // Update the displayed value only on submit
    //   setBlobId(tempInputValue);
    // };

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
    <Layout title="Vista Markets">
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
