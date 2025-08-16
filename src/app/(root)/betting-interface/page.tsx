"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Loading } from "./components/Loading";
import { MatchInfoApiResponse } from "./types-updated";
import { toast } from "sonner";
import MatchDashboard from "./match-dashboard";
import { io } from "socket.io-client";

export default function BettingPage() {
  const matchId = useSearchParams().get("id");

  const [matchData, setMatchData] = useState<MatchInfoApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<any>(null);

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
    const setupSocket = () => {
      // Use the WebSocket server URL from environment
      const socket = io(process.env.NEXT_PUBLIC_BACKEND_SOCKET || 'http://localhost:3001');

      socket.on('connect', () => {
        console.log('Connected to WebSocket server');
      });

      socket.on('match_update', (data) => {
        // Check if the update is for the current match
        if (data && data.match_id && data.match_id.toString() === matchId) {
          // console.log('Match update received for current match:', data);
          // Update match data with the new data
          setMatchData(prevData => {
            if (!prevData) return data;
            // Merge the new data with the existing data
            return { ...prevData, ...data };
          });
          toast.info("Match data updated");
        }
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      socket.on('disconnect', (reason) => {
        console.log('Disconnected from WebSocket server:', reason);
      });

      socketRef.current = socket;
    };

    if (matchId) {
      setLoading(true);
      fetchData();
      setupSocket();
    } else {
      setLoading(true);
      setMatchData(null);
      toast.error("No match ID provided.");
    }

    return () => {
      isMounted = false;
      // Disconnect socket when component unmounts
      if (socketRef.current) {
        socketRef.current.disconnect();
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
