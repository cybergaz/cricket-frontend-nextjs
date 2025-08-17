"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Loading } from "./components/Loading";
import { MatchInfoApiResponse } from "./types-updated";
import { toast } from "sonner";
import MatchDashboard from "./match-dashboard";

export default function BettingPage() {
  const matchId = useSearchParams().get("id");

  const [matchData, setMatchData] = useState<MatchInfoApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/cricket/match/${matchId}`);
        const resJson = await res.json();
        const resData = resJson.data.response as MatchInfoApiResponse

        if (!isMounted) return;
        if (resData) {
          setMatchData(resData);
          toast.success("Match data loaded successfully!");
        } else {
          setMatchData(null);
          toast.error("Match data not found or match has not started yet.");
        }

        setLoading(false);

      } catch {
        if (!isMounted) return;
        setMatchData(null);
        toast.error("Something went wrong while fetching match data.");
        setLoading(false);
      }
    };

    // Setup WebSocket connection
    const setupWebSocket = () => {
      // Use the WebSocket server URL from environment
      const ws = new WebSocket(process.env.NEXT_PUBLIC_BACKEND_SOCKET || 'ws://localhost:3001');

      ws.onopen = () => {
        console.log('Connected to WebSocket server');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'match_update') {
            const data = message.data;
            // Check if the update is for the current match
            if (data && data.match_id && data.match_id.toString() === matchId) {
              // Update match data with the new data
              setMatchData(prevData => {
                if (!prevData) return data;
                // Merge the new data with the existing data
                return { ...prevData, ...data };
              });
              toast.info("Match data updated");
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = (event) => {
        console.log('Disconnected from WebSocket server:', event.code, event.reason);
      };

      wsRef.current = ws;
    };

    if (matchId) {
      setLoading(true);
      fetchData();
      setupWebSocket();
    } else {
      setLoading(true);
      setMatchData(null);
      toast.error("No match ID provided.");
    }

    return () => {
      isMounted = false;
      // Disconnect WebSocket when component unmounts
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
      }
    };
  }, [matchId]);

  return (
    <>
      {
        loading
          ? <Loading />
          : matchData
            ? <MatchDashboard matchData={matchData} />
            : <div className="text-xl font-bold text-center pt-20"> no match data, please report this to developers </div>
      }
    </>
  )
}
