"use client";

import { useEffect, useState } from "react";
import { FeaturedBanner } from "./featured-banner";
import { Match } from "@/types/match-schedule";
import { MatchCard } from "@/components/betting/match-card";
import { Loading } from "../betting-interface/components/Loading";

export default function LiveMatches() {
  const [today, setToday] = useState("");
  const [tommorow, setTommorow] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/cricket/today`);

      if (res.status === 404) {
        // Handle "No Matches Today" case - this is not an error
        setMatches([]);
        return;
      }

      if (!res.ok) throw new Error("API Error");

      const data = await res.json();
      const unwantedWords = ["won", "loss", "draw", "abandoned", "no result", "cancelled", "tie", "postponed", "completed", "finished"];
      const matches = data.data.filter(
        (match: any) =>
          typeof match.live === "string" &&
          !unwantedWords.some(word => match.live.toLowerCase().includes(word))
      );
      setMatches(matches);
      // Reset retry count when we successfully get matches
      setRetryCount(0);
    } catch (e) {
      console.error("Fetch error:", e);
      setIsError(true);
      setCountdown(3); // Start 3 second countdown for error retry
      setTimeout(() => { fetchData(); }, 3000); // Retry after 3 seconds
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRetryCount(0);
    fetchData();
  };

  // Auto-retry logic when no matches are found
  useEffect(() => {
    if (matches.length === 0 && !isLoading && !isError && retryCount < 3) {
      setCountdown(3); // Start 3 second countdown
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        fetchData();
      }, 3000); // Retry every 3 seconds

      return () => clearTimeout(timer);
    }
  }, [matches.length, isLoading, isError, retryCount]);

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    fetchData();
  }, []);

  // Re-fetch data when the page becomes visible (user navigates back)
  // useEffect(() => {
  //   const handleVisibilityChange = () => {
  //     if (!document.hidden) {
  //       fetchData();
  //     }
  //   };
  //
  //   const handleFocus = () => {
  //     fetchData();
  //   };
  //
  //   document.addEventListener('visibilitychange', handleVisibilityChange);
  //   window.addEventListener('focus', handleFocus);
  //
  //   return () => {
  //     document.removeEventListener('visibilitychange', handleVisibilityChange);
  //     window.removeEventListener('focus', handleFocus);
  //   };
  // }, []);

  useEffect(() => {
    const today = new Date();
    const day = today.getDate();
    const suffix =
      day % 10 === 1 && day !== 11
        ? "st"
        : day % 10 === 2 && day !== 12
          ? "nd"
          : day % 10 === 3 && day !== 13
            ? "rd"
            : "th";
    const month = today.toLocaleString("default", { month: "long" });
    const year = today.getFullYear();
    setToday(`${day}${suffix} ${month} ${year}`);
    setTommorow(`${day + 1}${suffix} ${month} ${year}`);
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return (
      <div className="min-h-full text-gray-100">
        <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="hidden sm:flex w-full flex-col sm:flex-row items-center justify-center gap-4">
              <span className="hidden sm:block px-4 py-2 rounded-full bg-[#19317b] text-blue-200 font-bold text-base sm:text-lg shadow-md">
                {today}
              </span>
              <span className="hidden sm:block flex-1 h-1 bg-gradient-to-r from-[#19317b] via-[#2c256c] to-[#4b1577] rounded-full" />
              <span className="hidden sm:block px-4 py-2 rounded-full bg-[#4b1577] text-purple-200 font-bold text-base sm:text-lg shadow-md">
                {tommorow}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-400 mb-4">Failed to load matches</h2>
              <p className="text-gray-400 mb-6">There was an error loading the live matches. Please try again.</p>
              <button
                onClick={fetchData}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Retry
              </button>
              <p className="text-gray-500 mb-6 text-sm">
                Auto-refresh in {countdown} seconds
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-full text-gray-100">
      {matches.length > 0 && <FeaturedBanner {...matches[Math.floor(Math.random() * matches.length)]} />}

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="hidden sm:flex w-full flex-col sm:flex-row items-center justify-center gap-4">
            <span className="hidden sm:block px-4 py-2 rounded-full bg-[#19317b] text-blue-200 font-bold text-base sm:text-lg shadow-md">
              {today}
            </span>
            <span className="hidden sm:block flex-1 h-1 bg-gradient-to-r from-[#19317b] via-[#2c256c] to-[#4b1577] rounded-full" />
            <span className="hidden sm:block px-4 py-2 rounded-full bg-[#4b1577] text-purple-200 font-bold text-base sm:text-lg shadow-md">
              {tommorow}
            </span>
          </div>
        </div>

        <div>
          {matches.length > 0 ? (
            <div className="relative">
              {/* Floating Refresh Button */}
              <div className="fixed bottom-6 right-6 z-50">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing || isLoading}
                  className="group relative inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-full shadow-xl transition-all duration-200 transform hover:scale-110 disabled:transform-none disabled:cursor-not-allowed"
                  title="Refresh Matches"
                >
                  <svg
                    className={`w-5 h-5 transition-transform duration-200 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span className="hidden sm:inline">
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                  </span>
                </button>
              </div>

              {matches.map((match) => (
                <MatchCard key={match._id} match={match} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-300 mb-4">No Live Matches</h2>
                <p className="text-gray-400 mb-2">There are currently no live matches available.</p>
                <p className="text-gray-500 mb-6 text-sm">
                  {retryCount > 0 && `Checking for new matches... (Attempt ${retryCount}/10)`}
                  {retryCount === 0 && `Auto-checking for new matches in ${countdown} seconds`}
                </p>

                {/* Prominent Refresh Button */}
                <div className="flex items-center justify-center gap-4 max-sm:flex-col">
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing || isLoading}
                    className="group relative mr-5 flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-lg shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                  >
                    <svg
                      className={`w-6 h-6 transition-transform duration-200 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span>
                      {isRefreshing ? 'Refreshing Matches...' : 'Refresh Matches'}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setRetryCount(0);
                      fetchData();
                    }}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Check Now
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
