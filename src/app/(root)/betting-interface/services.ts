import { BettingPlayer, Team } from "./types"

export const getRoleColor = (role: string) => {
  switch (role.toLowerCase()) {
    case "bat":
      return "bg-sky-600/70"
    case "bowl":
      return "bg-red-600/50"
    case "all":
      return "bg-sky-600/70"
    case "wk":
      return "bg-green-600/70"
    default:
      return "bg-gray-600/70"
  }
}

export const formatMatchNotes = (notes: string[][]) => {
  return notes
    .flat()
    .filter((note) => typeof note === "string" && note.trim() !== "");
}

// New function to check player holdings
export const checkPlayerHoldings = async (matchId: string, playerId: string) => {
  try {
    const getTokenFromCookies = () => {
      if (typeof document === "undefined") return null;
      const cookies = document.cookie.split("; ");
      const tokenCookie = cookies.find((cookie) => cookie.startsWith("token="));
      return tokenCookie ? tokenCookie.split("=")[1] : null;
    };
    const token = getTokenFromCookies();

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/user/player-holdings/${matchId}/${playerId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
};

export const checkTeamHoldings = async (matchId: string, teamId: string) => {
  try {
    const getTokenFromCookies = () => {
      if (typeof document === "undefined") return null;
      const cookies = document.cookie.split("; ");
      const tokenCookie = cookies.find((cookie) => cookie.startsWith("token="));
      return tokenCookie ? tokenCookie.split("=")[1] : null;
    };
    const token = getTokenFromCookies();

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/user/team-holdings/${matchId}/${teamId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
};

export const buyPlayer = async (player: BettingPlayer, price: string, quantity: string, match_id: string) => {
  try {
    // First check current holdings to enforce ₹25,000 limit
    const holdingsResponse = await checkPlayerHoldings(match_id, player.batsman_id);
    
    if (!holdingsResponse.success) {
      return { success: false, message: "Failed to check current holdings" };
    }

    const { remainingInvestment, maxQuantity } = holdingsResponse.data;
    const requestedInvestment = Number(quantity) * Number(price);
    
    if (requestedInvestment > Number(remainingInvestment)) {
      return {
        success: false,
        message: `Investment limit exceeded. You can only invest ₹${remainingInvestment} more in this player (max ${maxQuantity} stocks at current price).`
      };
    }

    // Get token from cookies
    const getTokenFromCookies = () => {
      if (typeof document === "undefined") return null;
      const cookies = document.cookie.split("; ");
      const tokenCookie = cookies.find((cookie) => cookie.startsWith("token="));
      return tokenCookie ? tokenCookie.split("=")[1] : null;
    };
    const token = getTokenFromCookies();

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/portfolio/buy-player`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ player, price, quantity, match_id }),
      credentials: 'include',
    });
    const data = await response.json();
    return data
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
};
export const sellPlayer = async (player: BettingPlayer, price: string, quantity: string, match_id: string) => {
  try {
    // Get token from cookies
    const getTokenFromCookies = () => {
      if (typeof document === "undefined") return null;
      const cookies = document.cookie.split("; ");
      const tokenCookie = cookies.find((cookie) => cookie.startsWith("token="));
      return tokenCookie ? tokenCookie.split("=")[1] : null;
    };
    const token = getTokenFromCookies();

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/portfolio/sell-player`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ player, price, quantity, match_id }),
      credentials: 'include',
    });
    const data = await response.json();
    return data
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
};
export const buyTeam = async (team: any, price: string, quantity: string, matchId: string) => {
  try {
    // First check current holdings to enforce ₹25,000 limit
    const holdingsResponse = await checkTeamHoldings(matchId, team.team_id);
    
    if (!holdingsResponse.success) {
      return { success: false, message: "Failed to check current holdings" };
    }

    const { remainingInvestment } = holdingsResponse.data;
    const requestedInvestment = Number(quantity) * Number(price);
    
    if (requestedInvestment > Number(remainingInvestment)) {
      return {
        success: false,
        message: `Investment limit exceeded. You can only invest ₹${remainingInvestment} more in this team (max ₹25,000 total).`
      };
    }

    const getTokenFromCookies = () => {
      if (typeof document === "undefined") return null
      const cookies = document.cookie.split("; ")
      const tokenCookie = cookies.find((cookie) => cookie.startsWith("token="))
      return tokenCookie ? tokenCookie.split("=")[1] : null
    }
    const token = getTokenFromCookies()
    if (!token) {
      throw new Error("Authentication token not found")
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/portfolio/buy-team`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({
        team,
        price,
        quantity,
        match_id: matchId,
      }),
    })

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.message || "Failed to buy team stocks")
    }

    return result
  } catch (error: any) {
    console.error("Error buying team stocks:", error)
    throw new Error(error.message || "Failed to buy team stocks")
  }
}

export const sellTeam = async (team: any, price: string, quantity: string, matchId: string) => {
  try {
    const getTokenFromCookies = () => {
      if (typeof document === "undefined") return null
      const cookies = document.cookie.split("; ")
      const tokenCookie = cookies.find((cookie) => cookie.startsWith("token="))
      return tokenCookie ? tokenCookie.split("=")[1] : null
    }
    const token = getTokenFromCookies()
    if (!token) {
      throw new Error("Authentication token not found")
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/portfolio/sell-team`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({
        team,
        price,
        quantity,
        match_id: matchId,
      }),
    })

    const data = await response.json()
    return data
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export const updateTeamStockPrice = async (matchId: string, teamId: string, eventType: "runs_scored" | "player_out", runs?: number) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/cricket/update-team-stocks/${matchId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        teamId,
        eventType,
        runs: runs || 0,
      }),
    })

    const data = await response.json()
    return data
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export const initializeTeamStockPrices = async (matchId: string) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/cricket/initialize-team-stocks/${matchId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()
    return data
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// New function to calculate team stock price based on accumulated value
export const calculateTeamStockPrice = (innings: any[], battingTeamId: string) => {
  if (!innings || innings.length === 0) return 50; // Default launch price

  // Find the current inning where the team is batting
  const currentInning = innings.find(inning => inning.batting_team_id === battingTeamId);
  if (!currentInning || !currentInning.batsmen) return 50;

  let accumulatedPrice = 50; // Start with launch price
  const batsmen = currentInning.batsmen;

  // Sort batsmen by their batting order (assuming they come in order they played)
  // We'll use the array order as batting order since that's how they appear in the data
  batsmen.forEach((batsman: any, index: number) => {
    const runs = Number(batsman.runs) || 0;
    const isOut = batsman.how_out !== "Not out" && batsman.dismissal !== "";
    const isCurrentlyBatting = batsman.batting === "true" && batsman.dismissal === "";

    if (runs > 0) {
      // Add 20% of runs to accumulated price
      const runsContribution = runs * 0.2;
      accumulatedPrice += runsContribution;
    }

    // If player is out, subtract 10% from accumulated price
    if (isOut) {
      const outPenalty = accumulatedPrice * 0.1;
      accumulatedPrice -= outPenalty;
    }

    // For currently batting players, we still add their runs but don't apply out penalty yet
    if (isCurrentlyBatting && runs > 0) {
      // Runs are already added above, no additional penalty
    }
  });

  // Ensure price doesn't go below 0
  return Math.max(0, accumulatedPrice);
}

// Function to update team stock price using the new calculation method
export const updateTeamStockPriceNew = async (matchId: string, teamId: string, innings: any[]) => {
  try {
    const calculatedPrice = calculateTeamStockPrice(innings, teamId);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/cricket/update-team-stocks-calculated/${matchId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        teamId,
        calculatedPrice,
      }),
    })

    const data = await response.json()
    return data
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Function to auto-sell player portfolios when player gets out
export const autoSellPlayerPortfolios = async (matchId: string, playerId: string) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/portfolio/auto-sell-player-portfolios/${matchId}/${playerId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
};
