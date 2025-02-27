import axios from 'axios';

const PUBLISHER = process.env.WALRUS_PUBLISHER || '';
if (PUBLISHER == '') throw 'missing publisher';

interface WalrusMarketData {
    description: string;
    poolId: string;
}

async function storeMarketData(marketData: WalrusMarketData[]) {
  try {
    const stringifiedJson = JSON.stringify(marketData)
    const response = await axios.put(
      `${PUBLISHER}/v1/blobs?epochs=5`,
      stringifiedJson,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Blob stored successfully:');
    console.log(response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios error:', error.response?.data || error.message);
    } else {
      console.error('Error storing blob:', error);
    }
    throw error;
  }
}

const AGGREGATOR = process.env.WALRUS_AGGREGATOR || 'https://aggregator-url.example.com';
if (AGGREGATOR == '') throw 'missing aggregator';

async function getMarketData(blobId: string) {
  try {
    const response = await axios.get(
      `${AGGREGATOR}/v1/blobs/${blobId}`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    
    console.log('Blob retrieved successfully:');
    console.log(response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios error:', error.response?.data || error.message);
    } else {
      console.error('Error retrieving blob:', error);
    }
    throw error;
  }
}

export { getMarketData, storeMarketData };