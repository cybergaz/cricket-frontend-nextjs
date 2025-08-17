import { create } from "zustand";
import { toast } from "sonner";
import { PlayerPortfolio, TeamPortfolio } from "@/app/(root)/positions/types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const BACKEND_SOCKET = process.env.NEXT_PUBLIC_BACKEND_SOCKET || (BACKEND_URL ? BACKEND_URL.replace(/:\d+/, ':3001') : 'ws://localhost:3001');

interface PortfolioSocketState {
  socket: WebSocket | null;
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
    if (get().socket?.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connected");
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
      console.error("No authentication token found. Cannot connect to portfolio WebSocket.");
      toast.error("Authentication required. Please log in again.");
      return;
    }

    // Create WebSocket connection
    const ws = new WebSocket(BACKEND_SOCKET);

    ws.onopen = () => {
      console.log("Portfolio WebSocket connected");
      set({
        isConnected: true,
        isReconnecting: false,
        reconnectAttempts: 0
      });

      // Authenticate first
      ws.send(JSON.stringify({
        type: 'authenticate',
        token: token
      }));

      // Show toast only if we were reconnecting
      if (get().isReconnecting) {
        toast.success("Reconnected to portfolio updates");
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = (event) => {
      console.log("Portfolio WebSocket disconnected:", event.code, event.reason);
      set({ isConnected: false });

      // Handle reconnection
      if (event.code !== 1000) { // Not a normal closure
        handleReconnect();
      }
    };

    ws.onerror = (error) => {
      console.error("Portfolio WebSocket error:", error);
      set({ isConnected: false });
      handleReconnect();
    };

    set({ socket: ws });

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

      console.log(`Scheduling portfolio WebSocket reconnect in ${delay}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);

      // Schedule reconnection
      setTimeout(() => {
        // Only attempt to reconnect if we're still disconnected
        if (!get().isConnected) {
          console.log(`Attempting to reconnect portfolio WebSocket (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          get().connectSocket();
        }
      }, delay);
    };
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      get().unsubscribeFromPortfolioUpdates();
      socket.close(1000, 'User disconnected');
      set({
        socket: null,
        isConnected: false,
        isReconnecting: false,
        reconnectAttempts: 0
      });
    }
  },

  subscribeToPortfolioUpdates: () => {
    const socket = get().socket;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'subscribePortfolio' }));
      console.log("Subscribed to portfolio updates");
    } else {
      console.warn("Cannot subscribe to portfolio updates: WebSocket not connected");
      // Try to reconnect if WebSocket is not connected
      if (!get().isReconnecting && !get().isConnected) {
        get().connectSocket();
      }
    }
  },

  unsubscribeFromPortfolioUpdates: () => {
    const socket = get().socket;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'unsubscribePortfolio' }));
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

// Handle WebSocket messages
const handleWebSocketMessage = (message: any) => {
  const store = usePortfolioSocketStore.getState();

  switch (message.type) {
    case 'auth_success':
      console.log('Authentication successful');
      // Auto-subscribe to portfolio updates after authentication
      store.subscribeToPortfolioUpdates();
      break;

    case 'auth_error':
      console.error('Authentication failed:', message.message);
      toast.error('Authentication failed. Please log in again.');
      break;

    case 'portfolio_update':
      console.log("Portfolio update received:", message.data);
      const data = message.data;

      if (data.playerPortfolios) {
        store.setPlayerPortfolios(data.playerPortfolios);
      }

      if (data.teamPortfolios) {
        store.setTeamPortfolios(data.teamPortfolios);
      }

      if (data.playerHistory) {
        store.setPlayerPortfoliosHistory(data.playerHistory);
      }

      if (data.teamHistory) {
        store.setTeamPortfoliosHistory(data.teamHistory);
      }

      if (data.availableBalance !== undefined) {
        store.setAvailableBalance(data.availableBalance);
      }

      if (data.totalProfit !== undefined) {
        store.setTotalProfit(data.totalProfit);
      }

      // Update match data if provided
      if (data.matchData) {
        store.setMatchDataById({
          ...store.matchDataById,
          ...data.matchData
        });
      }
      break;

    case 'match_update':
      console.log('Match update received:', message.data);
      if (message.data && message.data.match_id) {
        store.setMatchDataById({
          ...store.matchDataById,
          [message.data.match_id]: message.data
        });
      }
      break;

    default:
      console.log('Unknown message type:', message.type);
  }
};
