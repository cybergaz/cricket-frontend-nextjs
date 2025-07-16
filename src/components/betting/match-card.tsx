import React, { useEffect } from "react";
import { Match } from "@/types/match-schedule";
import { useRouter } from "next/navigation";
import { BadgePoundSterling, Cloud, Grid3X3, Hotel, PoundSterling } from "lucide-react";
import MatchStartTimer from "@/app/(root)/betting-interface/components/match-start-timer";
import { toast } from "sonner";

interface MatchCardProps {
  match: Match;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  const router = useRouter();

  // Helper to format date string like '2025-07-06 13:30:00' to '6 July 2025, 1:30 PM'
  function formatDateTime(dateStr: string) {
    if (!dateStr) return "-";
    // Replace space with T for ISO compatibility
    const isoStr = dateStr.replace(" ", "T");
    const date = new Date(isoStr);
    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  useEffect(() => {
    console.log("MatchCard mounted with match:", match);
  }, []);

  return (
    <div className={`flex flex-col rounded-4xl overflow-hidden bg-gradient-to-tl from-transparent via-transparent to-sky-600/70 shadow-lg hover:shadow-2xl transition-all duration-300 animate-fade-in my-4 ${match.status_str !== "Live" && "from-transparent via-transparent shadow-none hover:shadow-none"}`}>
      {/* Header */}
      <div className="px-6 pt-5 pb-3 flex flex-row items-center justify-between gap-2 ">

        {match.competition.abbr && (
          <span className="text-center mx-auto px-3 py-1 rounded-full text-3xl bg-gradient-to-r from-gray-100 via-gray-100/50 to-gray-100/40 bg-clip-text text-transparent font-bold uppercase tracking-wide">
            {match.competition.title}
          </span>
        )}
        {/* Right: Status and Umpires */}
        {/* {match.status_str !== "Live" ? ( */}
        {/*   <div className="scale-70"> */}
        {/*     <MatchStartTimer */}
        {/*       startTime={match.date_start_ist} */}
        {/*       onComplete={() => { */}
        {/*         toast.success("The match has started! Good luck"); */}
        {/*         setTimeout(() => { */}
        {/*           window.location.reload(); */}
        {/*         }, 300000); */}
        {/*       }} */}
        {/*     /> */}
        {/*   </div> */}
        {/* ) : ( */}
        {/*   <div className="flex items-center gap- min-h-[40px] min-w-[120px] justify-end"> */}
        {/*     <span className="flex items-center gap-1 bg-gray-700/80 text-white px-3 py-1 rounded-full text-xl font-bold shadow"> */}
        {/*       <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span> LIVE */}
        {/*     </span> */}
        {/*   </div> */}
        {/* )} */}
      </div>

      {/* Teams Row */}
      <div className="flex items-center justify-between px-6 pt-6 pb-10 gap-4">
        {/* Team A */}
        <div className="flex flex-col items-center justify-center w-full md:w-1/3 gap-1">
          <div className="text-3xl flex items-center gap-3 text-white">
            {match.teama.logo_url && (
              <img
                src={match.teama.logo_url}
                alt={match.teama.name}
                className="w-12 h-12 md:w-18 md:h-17 rounded-full shadow-lg backdrop-blur-md hover:scale-105 transition-transform duration-500"
              />
            )}
          </div>
          <span className="mt-2 text-xl font-bold text-white tracking-wide text-center">
            {match.teama.name}
          </span>
        </div>

        {/* VS and Details */}
        <div className="flex flex-col items-center justify-center w-full md:w-1/3 text-center gap-2">
          <span className="font-extrabold text-2xl text-sky-400 bg-sky-400/10 px-4 py-1 rounded-full mb-1 tracking-widest shadow animate-fade-in">VS</span>
          <p className="text-md font-bold text-gray-400 mb-1 flex items-center justify-center gap-1">
            <Hotel />
            {[match.venue?.name, match.venue?.location].filter(Boolean).join(", ")}
          </p>
          {/* For live: toss result or weather desc; for non-live: start time */}
          {match.status_str === 'Live' ? (
            (("toss" in match && (match as any).toss?.text) ? (
              <span className="text-xs text-gray-400 font-bold mt-1">{(match as any).toss.text}</span>
            ) : ("weather" in match && (match as any).weather?.weather_desc) ? (
              <span className="text-xs text-blue-300 font-semibold mt-1">{(match as any).weather.weather_desc}</span>
            ) : <span className="text-xs text-gray-500 font-semibold mt-1">{match.status_note}</span>)
          ) : (
            <span className="text-lg text-gray-500 font-semibold mt-1">{formatDateTime(match.date_start_ist)}</span>
          )}
        </div>

        {/* Team B */}
        <div className="flex flex-col items-center justify-center w-full md:w-1/3 gap-1">
          <div className="text-3xl flex items-center gap-3 text-white">
            {match.teama.logo_url && (
              <img
                src={match.teamb.logo_url}
                alt={match.teamb.name}
                className="w-12 h-12 md:w-18 md:h-17 rounded-full shadow-lg backdrop-blur-md hover:scale-105 transition-transform duration-500"
              />
            )}
          </div>
          <span className="mt-2 text-xl font-bold text-white tracking-wide text-center">
            {match.teamb.name}
          </span>
        </div>
      </div>

      {/* Extra Info Row: Weather, Pitch, Toss (Marquee) - Only for Live Matches */}
      {match.status_str === 'Live' && (
        (!!(match.weather && (match.weather.weather_desc || match.weather.temp || match.weather.humidity || match.weather.wind_speed || match.weather.clouds)) || (match.pitch && (match.pitch.pitch_condition || match.pitch.batting_condition || match.pitch.pace_bowling_condition || match.pitch.spine_bowling_condition)) || ("toss" in match && (match as any).toss?.text)) && (
          <div className="relative overflow-hidden px-0">
            <div
              className="flex gap-16 whitespace-nowrap px-6 py-4 bg-transparent text-xs md:text-sm font-medium text-gray-300 animate-marquee hover:[animation-play-state:paused] cursor-pointer"
              style={{ animationDuration: '30s', animationTimingFunction: 'linear', animationIterationCount: 'infinite' }}
            >
              {/* Marquee sequence duplicated for seamless loop */}
              {[0, 1].map((dup) => (
                <div className="flex gap-16" key={dup}>
                  {/* Weather */}
                  {match.weather && (match.weather.weather_desc || match.weather.temp || match.weather.humidity || match.weather.wind_speed || match.weather.clouds) && (
                    <div className="flex items-center gap-2 min-w-[180px]"><Cloud className="text-sky-600/80" />
                      <span className="text-sky-600/80 font-semibold">{match.weather.weather_desc}</span>
                      {match.weather.temp && <span className="ml-1 text-sky-600/80">{match.weather.temp}&deg;C</span>}
                      {match.weather.humidity && <span className="ml-1 text-sky-600/80">{match.weather.humidity}% Humidity</span>}
                      {match.weather.wind_speed && <span className="ml-1 text-sky-600/80">Wind {match.weather.wind_speed} km/h</span>}
                      {match.weather.clouds && <span className="ml-1 text-sky-600/80">Clouds {match.weather.clouds}%</span>}
                    </div>
                  )}
                  {/* Pitch */}
                  {match.pitch && (match.pitch.pitch_condition || match.pitch.batting_condition || match.pitch.pace_bowling_condition || match.pitch.spine_bowling_condition) && (
                    <div className="flex items-center gap-2 min-w-[180px]">
                      <Grid3X3 className="w-4 h-4 text-purple-400/60" />
                      <span className="text-purple-400/60 font-semibold">Pitch:</span>
                      {match.pitch.pitch_condition && <span className="ml-1 text-purple-400/50">{match.pitch.pitch_condition}</span>}
                      {match.pitch.batting_condition && <span className="ml-1 text-purple-400/50">Bat: {match.pitch.batting_condition}</span>}
                      {match.pitch.pace_bowling_condition && <span className="ml-1 text-purple-400/50">Pace: {match.pitch.pace_bowling_condition}</span>}
                      {match.pitch.spine_bowling_condition && <span className="ml-1 text-purple-400/50">Spin: {match.pitch.spine_bowling_condition}</span>}
                    </div>
                  )}
                  {/* Toss */}
                  {"toss" in match && (match as any).toss?.text && (
                    <div className="flex items-center gap-2 min-w-[180px]">
                      <BadgePoundSterling className="w-4 h-4 text-orange-400/60" />
                      <span className="text-orange-400/60 font-semibold">Toss:</span>
                      <span className="ml-1 text-orange-400/60">{(match as any).toss.text}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* Umpires Info Bar */}
      {match.umpires && (
        <div className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-500/40 to-transparent via-purple-500/20 shadow-md  text-purple-100 animate-fade-in">
          <span className="font-semibold">Umpires -</span>
          <span className="truncate font-bold">{match.umpires}</span>
        </div>
      )}

      {/* Footer: More Info & CTA */}
      <div className="px-6 pb-6 pt-2 gap-3 ">
        <button
          onClick={() => router.push(`/betting-interface?id=${match.match_id}`)}
          className="w-full gap-2 rounded-full bg-gradient-to-r from-transparent hover:via-sky-600/40 hover:from-sky-600/20 hover:to-sky-600/20  via-sky-600/20 to-transparent text-white font-extrabold py-3 px-8 cursor-pointer shadow-xl duration-300 transition-colors border-0 text-lg mt-2 md:mt-0 animate-fade-in "
          aria-label={`Create Portfolio for ${match.teama.name} vs ${match.teamb.name}`}
        >
          Create Portfolio
        </button>
      </div>
    </div>
  );
}; 
