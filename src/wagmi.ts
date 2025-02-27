import { http, createConfig } from 'wagmi';
import { baseSepolia, localhost, unichainSepolia } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

// Use localhost for development with anvil
const localChain = {
  ...localhost,
  id: 31337,
  name: 'Anvil',
};
/*
const unichainSepolia = {
  ...unichainSepolia,
  id: 1301,
  name: 'Unichain Sepolia',
};*/

export const config = getDefaultConfig({
  appName: 'Prediction Market',
  projectId: 'YOUR_PROJECT_ID', // Replace with your WalletConnect project ID if needed
  chains: [baseSepolia, localChain, unichainSepolia],
  transports: {
    [baseSepolia.id]: http(),
    [localChain.id]: http('http://localhost:8545'),
    [unichainSepolia.id]: http('https://sepolia.unichain.org'),
  },
});
