export type TransactionStatus = "PENDING" | "SUCCESS" | "FAILED";
export type Role = "marketing" | "financial" | "super_admin" | "user";

export interface Transaction {
  tID: string;
  oID: string;
  amount: number;
  status: string;
  type: string;
  method: string;
  txnDate: string;
  _id: string;
}

export interface PlayerPortfolio {
  matchId: string;
  playerId: string;
  playerName: string;
  quantity: string;
  boughtPrice: string;
  soldPrice: string;
  profit: string;
  profitPercentage: string;
  status: string;
  reason: string;
  timestamp: string;
  _id: string;
}

export interface TeamPortfolio {
  // Define fields as per your teamPortfolios structure if needed
}

export interface UserV2 {
  _id: string;
  name: string;
  mobile: string;
  isVerified: boolean;
  isAdmin: boolean;
  role: string;
  referralAmount: number
  email: string;
  lastSeen: string;
  amount: number;
  referralCodes: string[];
  playerPortfolios: PlayerPortfolio[];
  teamPortfolios: TeamPortfolio[];
  transactions: {
    tID: string;
    oID: string;
    amount: number;
    status: string;
    type: string;
    method: string;
    txnDate: string;
    _id: string;
  }[];
}

export interface PortfolioTransaction {
  type: "buy" | "sell";
  quantity: number;
  price: number;
  timestamp: Date;
  autoSold: boolean;
  reason?: string;
}

export interface PlayerHolding {
  matchId: string;
  playerId: string;
  playerName: string;
  team: string;
  initialPrice: string;
  transactions: PortfolioTransaction[];
  currentHoldings: number;
}

export interface TeamHolding {
  matchId: string;
  teamId: string;
  teamName: string;
  initialPrice: string;
  transactions: PortfolioTransaction[];
  currentHoldings: number;
}

export interface User {
  name: string;
  mobile: string;
  isVerified: boolean;
  password: string;

  isAdmin: boolean;
  role: Role;

  googleId?: string;
  email?: string;

  lastSeen: Date;

  profileImage?: string;
  amount: number;
  referralAmount: number;
  referralCode?: string;
  referredBy?: string;

  transactions: Transaction[];
  portfolio: PlayerHolding[];
  teamPortfolio: TeamHolding[];

}
