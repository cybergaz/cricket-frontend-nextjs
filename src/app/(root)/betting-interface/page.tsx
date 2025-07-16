"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { CricketMatchData } from "./types";
import MatchScorecard from "./match-scorecard";
import { Loading } from "./components/Loading";
import { Error } from "./components/Error";
import YetToStart from "./components/yet-to-start";

export default function BettingPage() {
  const [matchData, setMatchData] = useState<CricketMatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams()
  const matchId = searchParams.get("id")

  useEffect(() => {
    const isValidMatchData = (data: any): data is CricketMatchData => {
      return (
        typeof data === 'object' &&
        data !== null &&
        'competition' in data &&
        'teama' in data &&
        'teamb' in data &&
        'venue' in data &&
        'innings' in data &&
        Array.isArray(data.innings)
      );
    };

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/cricket/scorecard/${matchId}`
        );
        const apiData = await res.json();
        if (apiData.message && apiData.data === null) {
          setMatchData(null);
          setError('No such match found');
        } else if (apiData.message && apiData.data && isValidMatchData(apiData.data)) {
          setMatchData(apiData.data);
        } else if (isValidMatchData(apiData)) {
          setMatchData(apiData);
        } else {
          setMatchData(null);
          setError('No match data available');
        }
      } catch (e: any) {
        setError("Fetch error: " + (e?.message || e));
        setMatchData(null);
      } finally {
        setLoading(false);
      }
    };

    if (matchId) {
      fetchData();
    } else {
      setError('Match ID is required');
      setLoading(false);
    }
  }, [matchId]);

  if (loading) {
    return <Loading />;
  }


  if (!matchData) {
    if (!matchId) {
      return <Error message="No match data available" />;
    } else {
      return <YetToStart matchId={matchId} />;
    }
  }

  if (matchData) {
    return <MatchScorecard matchData={matchData} />;
  }

  return null;
}