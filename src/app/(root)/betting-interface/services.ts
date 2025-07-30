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

export const buyPlayer = async (player: BettingPlayer, price: string, quantity: string, match_id: string) => {
  try {
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
