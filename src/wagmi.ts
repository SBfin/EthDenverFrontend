import { http, createConfig } from 'wagmi';
import { baseSepolia, unichainSepolia } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

/*
const unichainSepolia = {
  ...unichainSepolia,
  id: 1301,
  name: 'Unichain Sepolia',
};*/

export const config = getDefaultConfig({
  appName: 'Prediction Market',
  projectId: 'YOUR_PROJECT_ID', // Replace with your WalletConnect project ID if needed
  chains: [baseSepolia, unichainSepolia],
  transports: {
    [baseSepolia.id]: http(),
    [unichainSepolia.id]: http(),
  },
});
