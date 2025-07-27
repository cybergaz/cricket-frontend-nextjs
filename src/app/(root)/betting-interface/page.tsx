"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { CricketMatchData } from "./types";
import MatchScorecard from "./match-scorecard";
import { Loading } from "./components/Loading";
import YetToStart from "./components/yet-to-start";
// import sample from "./sample.json"

export default function BettingPage() {
  const [matchData, setMatchData] = useState<CricketMatchData | null>(null);
  const [matchFound, setMatchFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const matchId = searchParams.get("id");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/cricket/scorecard/${matchId}`
        );
        const resJson = await res.json();
        const apiData = resJson.data
        if (!isMounted) return;
        if (apiData) {
          setMatchData(apiData);
          setMatchFound(true);
        } else {
          setMatchData(null);
          setMatchFound(false);
        }
        setLoading(false);
      } catch {
        if (!isMounted) return;
        setMatchData(null);
        setMatchFound(false);
        setLoading(false);
      }
    };

    if (matchId) {
      setLoading(true);
      fetchData();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(fetchData, 2000);
    } else {
      setLoading(true);
      setMatchFound(false);
      setMatchData(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      isMounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [matchId]);

  if (loading) {
    return <Loading />;
  }

  if (!matchFound) {
    return <YetToStart matchId={matchId!} />;
  }

  if (matchFound)
    return <MatchScorecard matchData={matchData!} />;
}
