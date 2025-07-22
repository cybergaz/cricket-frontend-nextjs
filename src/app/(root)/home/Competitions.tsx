"use client";
import { Calendar, Trophy, Users } from "lucide-react";
import { formatDate } from "@/lib/helper";
import { format, parseISO, isValid } from "date-fns";

export interface Competition {
  cid: string;
  category: string;
  country: string;
  dateend: string;
  datestart: string;
  match_format: string;
  season: string;
  short_title: string;
  status: string;
  title: string;
  total_matches: string;
  total_teams: string;
  type: string;
}

export interface CompetitionsProps {
  matches: Competition[];
  isLoading: boolean;
}

export default function Competitions({ matches, isLoading }: CompetitionsProps) {
  // Group competitions by month and then by date, with robust date handling
  const competitionsByMonth: Record<string, Record<string, Competition[]>> = {};
  matches.forEach((match) => {
    let dateObj: Date | null = null;
    try {
      dateObj = parseISO(match.datestart);
    } catch {
      dateObj = null;
    }
    if (!dateObj || !isValid(dateObj)) return; // skip invalid dates
    const monthKey = format(dateObj, "yyyy-MM");
    const dateKey = format(dateObj, "yyyy-MM-dd");
    if (!competitionsByMonth[monthKey]) competitionsByMonth[monthKey] = {};
    if (!competitionsByMonth[monthKey][dateKey]) competitionsByMonth[monthKey][dateKey] = [];
    competitionsByMonth[monthKey][dateKey].push(match);
  });
  // Sort months and dates ascending
  const sortedMonthKeys = Object.keys(competitionsByMonth).sort();

  return (
    <section className="relative max-w-[100rem] mx-auto z-10 py-16 px-2 md:px-8 w-full">
      {isLoading ? (
        <p className="text-gray-400 text-center">Loading Competitions...</p>
      ) : (
        <div className="flex flex-col gap-12 w-full">
          {sortedMonthKeys.map((monthKey) => (
            <div key={monthKey} className="w-full">
              {/* Month Heading */}
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="w-6 h-6 text-sky-400" />
                <h2 className="text-2xl md:text-3xl font-bold text-sky-200 tracking-wide">
                  {isValid(parseISO(monthKey + "-01")) ? format(parseISO(monthKey + "-01"), "MMMM yyyy") : monthKey}
                </h2>
              </div>
              {/* Dates in this month */}
              <div className="flex flex-col gap-5 w-full">
                {Object.keys(competitionsByMonth[monthKey]).sort().map((dateKey) => (
                  <div key={dateKey} className="w-full">
                    {/* Competitions for this date */}
                    <div className="flex flex-col gap-6 w-full  bg-white/5 rounded-xl">
                      {competitionsByMonth[monthKey][dateKey].map((match) => (
                        <div
                          key={match.cid}
                          className="relative bg-gradient-to-br from-transparent via-transparent to-gray-900/20 rounded-3xl transition-all duration-300 w-full min-h-[140px] flex flex-col justify-between overflow-hidden px-8 py-0"
                        >
                          {/* Title and Status */}
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between pt-8 pb-6">
                            <h3 className="text-2xl font-extrabold text-white leading-tight tracking-tight z-10 relative drop-shadow-lg mb-2 md:mb-0">
                              {match.title}
                            </h3>
                            <span className="text-yellow-300 font-extrabold tracking-wider text-sm px-3 py-1 rounded-full z-10 relative animate-pulse">
                              {match.status}
                            </span>
                          </div>
                          {/* Timeline */}
                          <div className="flex flex-col items-center z-10 relative mb-4 w-full">
                            <div className="flex items-center w-full justify-between gap-0 relative">
                              {/* Start Date */}
                              <div className="flex flex-col items-center">
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-900/80 text-xs text-sky-200 font-mono font-bold shadow">
                                  <Calendar className="w-3 h-3 text-sky-200 mb-0.5" />
                                  {isValid(parseISO(match.datestart)) ? formatDate(match.datestart) : "Invalid date"}
                                </span>
                              </div>
                              {/* Timeline Line (edge-to-edge) */}
                              <div className="h-1 flex-1 mx-2 rounded-full relative z-0" style={{ minWidth: 0 }}>
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-2 w-full bg-gradient-to-r from-sky-900/80 via-gray-900/90 to-purple-900/80 rounded-full" style={{ zIndex: 0 }}></span>
                              </div>
                              {/* End Date */}
                              <div className="flex flex-col items-center">
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-900/80 text-xs text-purple-200 font-mono font-bold shadow">
                                  <Calendar className="w-3 h-3 text-purple-200 mb-0.5" />
                                  {isValid(parseISO(match.dateend)) ? formatDate(match.dateend) : "Invalid date"}
                                </span>
                              </div>
                            </div>
                          </div>
                          {/* Info Badges */}
                          <div className="flex flex-wrap items-center gap-2 mb-2 z-10 relative">
                            <span className="text-gray-600 px-3 py-1 rounded-full text-xs font-bold uppercase shadow">
                              {match.match_format.toUpperCase()}
                            </span>
                            <span className="text-purple-700 px-3 py-1 rounded-full text-xs font-bold uppercase shadow">
                              {match.category}
                            </span>
                            <span className="text-blue-500/50 px-3 py-1 rounded-full text-xs font-bold uppercase shadow">
                              Season {match.season}
                            </span>
                            <span className="text-pink-500/50 px-3 py-1 rounded-full text-xs font-bold uppercase shadow">
                              {match.type}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
