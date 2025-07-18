"use client"
import React from "react";
import { Match } from "@/types/match-schedule";
import { useRouter } from "next/navigation";
import { BadgePoundSterling, Cloud, Grid3X3, Hotel, PoundSterling } from "lucide-react";
import MatchStartTimer from "@/app/(root)/betting-interface/components/match-start-timer";
import { MatchInfoMarquee } from "@/components/betting/MatchInfoMarquee";

interface MatchCardProps {
  match: Match;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  const [timerCompleted, setTimerCompleted] = React.useState(false);
  const router = useRouter();

  // Determine if the match should be considered live (timer or fallback to status_str)
  const isLive = timerCompleted || (match.status_str && match.status_str.toLowerCase() === 'live');
  return (
    <div className={`relative flex flex-col rounded-4xl overflow-hidden bg-gradient-to-tl from-transparent via-transparent to-sky- shadow-lg hover:shadow-2xl transition-all duration-300 animate-fade-in my-4 ${!isLive && "from-transparent via-transparent shadow-none hover:shadow-none"} w-full max-w-2xl mx-auto sm:my-2 sm:rounded-2xl sm:max-w-full`}>
      {/* Header */}
      <div className="px-4 sm:px-2 pt-5 pb-3 flex flex-row items-center justify-between gap-2 ">
        {match.competition?.abbr && (
          <span className="text-center mx-auto px-3 py-1 rounded-full text-xl sm:text-xl md:text-2xl lg:text-4xl xl:text-4xl bg-gradient-to-r from-gray-100 via-gray-100/50 to-gray-100/40 bg-clip-text text-transparent font-bold uppercase tracking-wide w-full max-w-full break-words">
            {match.competition.title || ''}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between px-4 sm:px-2 pt-6 pb-8 sm:pt-4 sm:pb-6 gap-4">
        <div className="flex flex-col items-center justify-center w-full md:w-1/3 gap-1">
          <div className="text-3xl flex items-center gap-3 text-white">
            {match.teama?.logo_url ? (
              <img
                src={match.teama.logo_url}
                alt={match.teama.name || 'Team A'}
                className="w-12 h-12 sm:w-10 sm:h-10 md:w-18 md:h-17 rounded-full shadow-lg backdrop-blur-md hover:scale-105 transition-transform duration-500"
              />
            ) : null}
          </div>
          <span className="mt-2 text-lg sm:text-base font-bold text-white tracking-wide text-center">
            <span className="block sm:hidden">{match.teama?.short_name || ''}</span>
            <span className="hidden sm:block">{match.teama?.name || ''}</span>
          </span>
        </div>
        <div className="flex flex-col items-center justify-center w-full md:w-1/3 text-center gap-2">
          <span className="font-extrabold text-xl sm:text-lg text-sky-400 bg-sky-400/10 px-4 py-1 rounded-full mb-1 tracking-widest shadow animate-fade-in">VS</span>
          {!isLive ? (
            timerCompleted ? (
              <span className="absolute top-4 left-4 z-20 flex items-center gap-2 text-xl font-extrabold text-white bg-green-100/10 px-4 py-1 rounded-full shadow animate-pulse">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                Live
              </span>
            ) : (
              <div className="scale-70 font-bold">
                <MatchStartTimer
                  startTime={match.date_start_ist}
                  onComplete={() => setTimerCompleted(true)}
                />
              </div>
            )
          ) : null}
        </div>
        <div className="flex flex-col items-center justify-center w-full md:w-1/3 gap-1">
          <div className="text-3xl flex items-center gap-3 text-white">
            {match.teamb?.logo_url ? (
              <img
                src={match.teamb.logo_url}
                alt={match.teamb.name || 'Team B'}
                className="w-12 h-12 sm:w-10 sm:h-10 md:w-18 md:h-17 rounded-full shadow-lg backdrop-blur-md hover:scale-105 transition-transform duration-500"
              />
            ) : null}
          </div>
          <span className="mt-2 text-lg sm:text-base font-bold text-white tracking-wide text-center">
            <span className="block sm:hidden">{match.teamb?.short_name || ''}</span>
            <span className="hidden sm:block">{match.teamb?.name || ''}</span>
          </span>
        </div>
      </div >
      {
        isLive && (
          <MatchInfoMarquee>
            {/* Weather */}
            {match.weather && (match.weather.weather_desc || match.weather.temp || match.weather.humidity || match.weather.wind_speed || match.weather.clouds) && (
              <div className="flex items-center gap-2">
                <Cloud className="text-sky-600/80 w-4 h-4 sm:w-3 sm:h-3" />
                <span className="text-sky-600/80 font-semibold">{match.weather.weather_desc ? match.weather.weather_desc.toUpperCase() : ''}</span>
                {match.weather.temp && <span className="ml-1 text-sky-600/80">{match.weather.temp}&deg;C</span>}
                {match.weather.humidity && <span className="ml-1 text-sky-600/80">{match.weather.humidity}% Humidity</span>}
                {match.weather.wind_speed && <span className="ml-1 text-sky-600/80">Wind {match.weather.wind_speed} km/h</span>}
                {match.weather.clouds && <span className="ml-1 text-sky-600/80">Clouds {match.weather.clouds}%</span>}
              </div>
            )}
            {/* Pitch */}
            {match.pitch && (match.pitch.pitch_condition || match.pitch.batting_condition || match.pitch.pace_bowling_condition || match.pitch.spine_bowling_condition) && (
              <div className="flex items-center gap-2">
                <Grid3X3 className="w-4 h-4 sm:w-3 sm:h-3 text-purple-400/60" />
                <span className="text-purple-400/60 font-semibold">PITCH</span>
                {match.pitch.pitch_condition && <span className="ml-1 text-purple-400/50">{match.pitch.pitch_condition}</span>}
                {match.pitch.batting_condition && <span className="ml-1 text-purple-400/50">Bat: {match.pitch.batting_condition}</span>}
                {match.pitch.pace_bowling_condition && <span className="ml-1 text-purple-400/50">Pace: {match.pitch.pace_bowling_condition}</span>}
                {match.pitch.spine_bowling_condition && <span className="ml-1 text-purple-400/50">Spin: {match.pitch.spine_bowling_condition}</span>}
              </div>
            )}
            {/* Toss */}
            {"toss" in match && (match as any).toss?.text && (
              <div className="flex items-center gap-2">
                <BadgePoundSterling className="w-4 h-4 sm:w-3 sm:h-3 text-orange-400/60" />
                <span className="text-orange-400/60 font-semibold">TOSS</span>
                <span className="ml-1 text-orange-400/60">{(match as any).toss.text}</span>
              </div>
            )}
          </MatchInfoMarquee>
        )
      }
      {/* Umpires Info Bar */}
      {
        match.umpires && (
          <div className="flex items-center gap-2 px-4 sm:px-2 py-2 bg-gradient-to-r from-purple-500/40 to-transparent via-purple-500/20 shadow-md  text-purple-100 animate-fade-in text-xs sm:text-[11px]">
            <span className="font-semibold">Umpires -</span>
            <span className="truncate font-bold">{match.umpires}</span>
          </div>
        )
      }

      {/* Footer: More Info & CTA */}
      <div className="px-4 sm:px-2 pb-6 pt-2 gap-3 ">
        <button
          onClick={() => router.push(`/betting-interface?id=${match.match_id}`)}
          className={`w-full gap-2 rounded-full text-white font-extrabold py-3 px-8 cursor-pointer shadow-xl duration-300 transition-colors border-0 text-base sm:text-xl mt-2 md:mt-0 animate-fade-in min-h-[48px] sm:min-h-[40px] ${isLive
            ? "bg-gradient-to-r from-transparent via-sky-700 to-transparent hover:via-[#3d3970] hover:from-transparent hover:to-transparent"
            : "bg-gradient-to-r from-transparent hover:via-white/40 hover:from-transparent hover:to-transparent via-white/20 to-transparent opacity-60 cursor-not-allowed"
            }`}
          aria-label={`Create Portfolio for ${match.teama?.name || 'Team A'} vs ${match.teamb?.name || 'Team B'}`}
        >
          {isLive
            ? "Create Portfolio"
            : "Will be live soon"}
        </button>
      </div>
    </div >
  );
}; 
