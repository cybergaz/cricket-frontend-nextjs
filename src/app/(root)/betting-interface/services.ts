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
  return notes.flat().filter((note) => note && note.trim() !== "")
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
export const buyTeam = async (team: Team, price: string, quantity: string, match_id: string) => {
  try {
    // Get token from cookies
    const getTokenFromCookies = () => {
      if (typeof document === "undefined") return null;
      const cookies = document.cookie.split("; ");
      const tokenCookie = cookies.find((cookie) => cookie.startsWith("token="));
      return tokenCookie ? tokenCookie.split("=")[1] : null;
    };
    const token = getTokenFromCookies();

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/portfolio/buy-team`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ team, price, quantity, match_id }),
      credentials: 'include',
    });
    const data = await response.json();
    return data
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
};
export const sellTeam = async (team: Team, price: string, quantity: string, match_id: string) => {
  try {
    // Get token from cookies
    const getTokenFromCookies = () => {
      if (typeof document === "undefined") return null;
      const cookies = document.cookie.split("; ");
      const tokenCookie = cookies.find((cookie) => cookie.startsWith("token="));
      return tokenCookie ? tokenCookie.split("=")[1] : null;
    };
    const token = getTokenFromCookies();

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/portfolio/sell-team`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ team, price, quantity, match_id }),
      credentials: 'include',
    });
    const data = await response.json();
    return data
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
};
