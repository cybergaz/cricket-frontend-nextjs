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
  const [ballEvent, setBallEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/cricket/match_from_api/${matchId}`);
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
      // Dynamically determine WebSocket protocol based on current page protocol
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = process.env.NEXT_PUBLIC_BACKEND_SOCKET || window.location.hostname + ':3001';

      // Ensure we have the correct protocol
      const wsUrl = host.startsWith('ws://') || host.startsWith('wss://')
        ? host
        : `${protocol}//${host}`;

      let ws: WebSocket;

      try {
        ws = new WebSocket(wsUrl);
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        return; // Exit early if WebSocket creation fails
      }

      ws.onopen = () => {
        console.log('Connected to WebSocket server:', wsUrl);
        ws.send(JSON.stringify({ type: 'subscribe_match', match_id: matchId }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'match_subscription_success') {
            console.log('Successfully subscribed to match:', matchId);
          }

          if (message.type === 'match_update') {
            const data = message.data;
            // Check if the update is for the current match
            if (data && data.match_id && data.match_id.toString() === matchId) {
              // Update match data with the new data
              setBallEvent(null);
              setMatchData(prevData => {
                if (!prevData) return data;
                // Merge the new data with the existing data
                return { ...prevData, ...data };
              });
              toast.info("Match data updated");
            }
          }

          if (message.type === 'ball_update') {
            const data = message.data;
            // Check if the update is for the current match
            if (data && data.ball_event && data.match_id.toString() === matchId) {
              console.log('Received ball event:', data.ball_event);
              setBallEvent(data);
              setTimeout(() => { setBallEvent(null) }, 1000);
              toast.info("Ball Event updated");
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        console.error('Failed to connect to:', wsUrl);
        // Don't show error toast to user as WebSocket is not critical for basic functionality
      };

      ws.onclose = (event) => {
        console.log('Disconnected from WebSocket server:', event.code, event.reason);
        // Attempt to reconnect after a delay if it wasn't a clean close
        if (event.code !== 1000 && isMounted) {
          setTimeout(() => {
            if (isMounted) {
              console.log('Attempting to reconnect WebSocket...');
              setupWebSocket();
            }
          }, 5000);
        }
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
            ? <MatchDashboard matchData={matchData} ballEvent={ballEvent} />
            : <div className="text-xl font-bold text-center pt-20"> no match data, please report this to developers </div>
      }
    </>
  )
}
