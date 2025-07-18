"use client";

import { useEffect, useState } from "react";
import { FeaturedBanner } from "./featured-banner";
import { Match } from "@/types/match-schedule";
import { MatchCard } from "@/components/betting/match-card";

export default function LiveMatches() {
  const [today, setToday] = useState("");
  const [tommorow, setTommorow] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/cricket/today`);
        if (!res.ok) throw new Error("API Error");
        const data = await res.json();
        setMatches(data.data);
      } catch (e) {
        console.error("Fetch error:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

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

  return (
    <div className="min-h-full text-gray-100">
      {matches.length > 0 && <FeaturedBanner {...matches[Math.floor(Math.random() * matches.length)]} />}
      {/* {matches.length > 0 && <FeaturedBanner {...matches[0]} />} */}

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

        {/* Matches Grid */}
        <div>
          {matches.map((match: Match) => (
            <MatchCard key={match._id} match={match} />
          ))}
        </div>
      </main>
    </div>
  );
}