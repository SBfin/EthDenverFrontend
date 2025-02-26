export interface Market {
  id: string;
  question: string;
  description: string;
  endTime: number;
  resolved: boolean;
  outcome?: boolean;
  collateralToken: string;
  collateralPoolSize: string;
  yesPrice: string;
  noPrice: string;
  probability: string;
  yesShares: string;
  noShares: string;
} 