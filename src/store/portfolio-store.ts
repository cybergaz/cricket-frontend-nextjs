import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { PlayerPortfolio, TeamPortfolio } from "@/app/(root)/positions/types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const BACKEND_SOCKET = process.env.NEXT_PUBLIC_BACKEND_SOCKET || (BACKEND_URL ? BACKEND_URL.replace(/:\d+/, ':3001') : 'http://localhost:3001');

interface PortfolioSocketState {
  socket: Socket | null;
  playerPortfolios: PlayerPortfolio[];
  teamPortfolios: TeamPortfolio[];
  playerPortfoliosHistory: PlayerPortfolio[];
  teamPortfoliosHistory: TeamPortfolio[];
  availableBalance: number;
  totalProfit: number;
  isConnected: boolean;
  isLoading: boolean;
  isReconnecting: boolean;
  reconnectAttempts: number;
  maxReconnectAttempts: number;

  // Match data for calculating prices
  matchDataById: Record<string, any>;

  // Actions
  connectSocket: () => void;
  disconnectSocket: () => void;
  subscribeToPortfolioUpdates: () => void;
  unsubscribeFromPortfolioUpdates: () => void;

  // Data setters
  setPlayerPortfolios: (data: PlayerPortfolio[]) => void;
  setTeamPortfolios: (data: TeamPortfolio[]) => void;
  setPlayerPortfoliosHistory: (data: PlayerPortfolio[]) => void;
  setTeamPortfoliosHistory: (data: TeamPortfolio[]) => void;
  setAvailableBalance: (balance: number) => void;
  setTotalProfit: (profit: number) => void;
  setMatchDataById: (data: Record<string, any>) => void;

  // Initial data fetch
  fetchInitialData: (page?: number, limit?: number) => Promise<void>;
}

export const usePortfolioSocketStore = create<PortfolioSocketState>((set, get) => ({
  socket: null,
  playerPortfolios: [],
  teamPortfolios: [],
  playerPortfoliosHistory: [],
  teamPortfoliosHistory: [],
  availableBalance: 0,
  totalProfit: 0,
  isConnected: false,
  isLoading: false,
  isReconnecting: false,
  reconnectAttempts: 0,
  maxReconnectAttempts: 10,
  matchDataById: {},

  connectSocket: () => {
    // Don't create a new socket if one already exists
    if (get().socket?.connected) {
      console.log("Socket already connected");
      return;
    }

    // If we're already at max reconnect attempts, reset and try again
    if (get().reconnectAttempts >= get().maxReconnectAttempts) {
      set({ reconnectAttempts: 0 });
    }

    // If we're reconnecting, increment the attempt counter
    if (get().isReconnecting) {
      set(state => ({ reconnectAttempts: state.reconnectAttempts + 1 }));
    }

    set({ isReconnecting: false });

    const getTokenFromCookies = () => {
      if (typeof document === "undefined") return null;
      const cookies = document.cookie.split("; ");
      const tokenCookie = cookies.find((cookie) => cookie.startsWith("token="));
      return tokenCookie ? tokenCookie.split("=")[1] : null;
    };

    const token = getTokenFromCookies();
    
    if (!token) {
      console.error("No authentication token found. Cannot connect to portfolio socket.");
      toast.error("Authentication required. Please log in again.");
      return;
    }

    const socket = io(`${BACKEND_SOCKET}/portfolio`, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ["websocket", "polling"],
      withCredentials: true,
      timeout: 20000,
      auth: {
        token: token
      }
    });

    socket.on("connect", () => {
      console.log("Portfolio socket connected");
      set({
        isConnected: true,
        isReconnecting: false,
        reconnectAttempts: 0 // Reset reconnect attempts on successful connection
      });

      // Auto-subscribe to portfolio updates
      get().subscribeToPortfolioUpdates();

      // Show toast only if we were reconnecting
      if (get().isReconnecting) {
        toast.success("Reconnected to portfolio updates");
      }
    });

    socket.on("connect_error", (error) => {
      console.error("Portfolio socket connection error:", error);
      set({ isConnected: false });

      // Don't reconnect if it's an authentication error
      if (error.message === 'Authentication failed' || error.message === 'Authentication token not provided') {
        console.error("Authentication failed for portfolio socket. Please log in again.");
        toast.error("Authentication failed. Please log in again.");
        return;
      }

      // Start reconnection process for other errors
      handleReconnect();
    });

    socket.on("reconnect_attempt", (attempt) => {
      console.log(`Attempting to reconnect to portfolio socket: attempt ${attempt}`);
      set({ isReconnecting: true });
    });

    socket.on("reconnect", () => {
      console.log("Portfolio socket reconnected");
      set({
        isConnected: true,
        isReconnecting: false,
        reconnectAttempts: 0
      });
      toast.success("Reconnected to portfolio updates");

      // Re-subscribe after reconnection
      get().subscribeToPortfolioUpdates();
    });

    socket.on("reconnect_error", (error) => {
      console.error("Portfolio socket reconnection error:", error);
      // Continue with manual reconnection strategy
      handleReconnect();
    });

    socket.on("reconnect_failed", () => {
      console.error("Portfolio socket reconnection failed after all attempts");
      // Continue with manual reconnection strategy
      handleReconnect();
    });

    socket.on("disconnect", (reason) => {
      console.log("Portfolio socket disconnected:", reason);
      set({ isConnected: false });

      // If the server disconnected us, we need to manually reconnect
      if (reason === "io server disconnect" || reason === "transport close") {
        handleReconnect();
      }
    });

    // Handle portfolio updates
    socket.on("portfolio_update", (data) => {
      console.log("Portfolio update received:", data);

      if (data.playerPortfolios) {
        set({ playerPortfolios: data.playerPortfolios });
      }

      if (data.teamPortfolios) {
        set({ teamPortfolios: data.teamPortfolios });
      }

      if (data.playerHistory) {
        set({ playerPortfoliosHistory: data.playerHistory });
      }

      if (data.teamHistory) {
        set({ teamPortfoliosHistory: data.teamHistory });
      }

      if (data.availableBalance !== undefined) {
        set({ availableBalance: data.availableBalance });
      }

      if (data.totalProfit !== undefined) {
        set({ totalProfit: data.totalProfit });
      }

      // Update match data if provided
      if (data.matchData) {
        set((state) => ({
          matchDataById: {
            ...state.matchDataById,
            ...data.matchData
          }
        }));
      }
    });

    // Handle match data updates (for price calculations)
    socket.on("match_update", (data) => {
      console.log(data)
      if (data && data.match_id) {
        set((state) => ({
          matchDataById: {
            ...state.matchDataById,
            [data.match_id]: data
          }
        }));
      }
    });

    set({ socket });

    // Helper function for manual reconnection with exponential backoff
    const handleReconnect = () => {
      const { reconnectAttempts, maxReconnectAttempts, isReconnecting } = get();

      // If we're already reconnecting or have exceeded max attempts, don't start another attempt
      if (isReconnecting || reconnectAttempts >= maxReconnectAttempts) {
        return;
      }

      set({ isReconnecting: true });

      // Calculate delay with exponential backoff (1s, 2s, 4s, 8s, etc.)
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);

      console.log(`Scheduling portfolio socket reconnect in ${delay}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);

      // Schedule reconnection
      setTimeout(() => {
        // Only attempt to reconnect if we're still disconnected
        if (!get().isConnected) {
          console.log(`Attempting to reconnect portfolio socket (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          get().connectSocket();
        }
      }, delay);
    };
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      get().unsubscribeFromPortfolioUpdates();
      socket.disconnect();
      set({
        socket: null,
        isConnected: false,
        isReconnecting: false,
        reconnectAttempts: 0 // Reset reconnect attempts
      });
    }
  },

  subscribeToPortfolioUpdates: () => {
    const socket = get().socket;
    if (socket && socket.connected) {
      socket.emit("subscribePortfolio");
      console.log("Subscribed to portfolio updates");
    } else {
      console.warn("Cannot subscribe to portfolio updates: socket not connected");
      // Try to reconnect if socket is not connected
      if (!get().isReconnecting && !get().isConnected) {
        get().connectSocket();
      }
    }
  },

  unsubscribeFromPortfolioUpdates: () => {
    const socket = get().socket;
    if (socket && socket.connected) {
      socket.emit("unsubscribePortfolio");
      console.log("Unsubscribed from portfolio updates");
    }
  },

  setPlayerPortfolios: (data) => set({ playerPortfolios: data }),
  setTeamPortfolios: (data) => set({ teamPortfolios: data }),
  setPlayerPortfoliosHistory: (data) => set({ playerPortfoliosHistory: data }),
  setTeamPortfoliosHistory: (data) => set({ teamPortfoliosHistory: data }),
  setAvailableBalance: (balance) => set({ availableBalance: balance }),
  setTotalProfit: (profit) => set({ totalProfit: profit }),
  setMatchDataById: (data) => set({ matchDataById: data }),

  fetchInitialData: async (page = 1, limit = 10) => {
    set({ isLoading: true });

    try {
      const getTokenFromCookies = () => {
        if (typeof document === "undefined") return null;
        const cookies = document.cookie.split("; ");
        const tokenCookie = cookies.find((cookie) => cookie.startsWith("token="));
        return tokenCookie ? tokenCookie.split("=")[1] : null;
      };

      const token = getTokenFromCookies();
      if (!token) {
        console.error("Authentication token not found. Please log in.");
        set({ isLoading: false });
        return;
      }

      const res = await fetch(`${BACKEND_URL}/portfolio/all?page=${page}&limit=${limit}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      const apiData = await res.json();
      if (!apiData.success) {
        console.log(apiData.message);
        set({ isLoading: false });
        return;
      }

      // Update state with API data
      set({
        availableBalance: apiData.value,
        totalProfit: apiData.totalPortfolioProfit,
        playerPortfolios: apiData.playerPortfolios || [],
        teamPortfolios: apiData.teamPortfolios || [],
        playerPortfoliosHistory: apiData.playerHistory || [],
        teamPortfoliosHistory: apiData.teamHistory || []
      });

      // Fetch match data for all unique match IDs
      const uniqueMatchIds = Array.from(new Set([
        ...(apiData.playerPortfolios || []).map((p: PlayerPortfolio) => p.matchId),
        ...(apiData.teamPortfolios || []).map((p: TeamPortfolio) => p.matchId)
      ]));

      const newMatchData: Record<string, any> = {};
      if (uniqueMatchIds.length > 0) {
        await Promise.all(
          uniqueMatchIds.map(async (matchId) => {
            try {
              const matchRes = await fetch(`${BACKEND_URL}/cricket/scorecard/${matchId}`);
              const matchResJson = await matchRes.json();
              if (matchResJson.success) {
                newMatchData[matchId] = matchResJson.data;
              }
            } catch (e) {
              console.error(`Failed to fetch match data for ${matchId}`, e);
            }
          }),
        );
      }

      set((state) => ({
        matchDataById: { ...state.matchDataById, ...newMatchData }
      }));

    } catch (e: any) {
      console.error("Fetch error: " + (e?.message || "Unknown error"));
    } finally {
      set({ isLoading: false });
    }
  },
}));
