export interface PlayerPortfolio {
    matchId: string;
    team: string;
    playerId: string;
    playerName: string;
    quantity: string;
    boughtPrice: string;
    currentPrice: string;
    soldPrice: string;
    profit: string;
    profitPercentage: string;
    status: string;
    reason: string;
    timestamp: Date;
}

export interface TeamPortfolio {
    matchId: string;
    team: string;
    teamName: string;
    quantity: string;
    boughtPrice: string;
    currentPrice: string;
    soldPrice: string;
    profit: string;
    profitPercentage: string;
    status: string;
    reason: string;
    timestamp: Date;
}
