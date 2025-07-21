"use client"

import React, { useEffect, useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Target,
  TrendingUp,
  Users,
  MapPin,
  Thermometer,
  Droplets,
  BarChart3,
  Star,
  HardHat,
  Radio,
  Files,
  BarChart,
  Mic2,
} from "lucide-react"
import type { CricketMatchData, Player, BettingPlayer, MatchScorecardProps, Team, BettingTeam } from "./types"
import { getRoleColor, formatMatchNotes, buyPlayer, sellPlayer } from "./services"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { MatchInfoTicker } from "./components/match-info-ticker"
import { cn } from "@/lib/utils"

export default function MatchScorecard({ matchData }: MatchScorecardProps) {
  const hasData = matchData && Object.keys(matchData).length > 0;

  // const patchedSample = {
  //     ...sample,
  //     match_notes: Array.isArray(sample.match_notes)
  //         ? (sample.match_notes.flat().join(" | ") || "")
  //         : (sample.match_notes ?? ""),
  //     match_number: Array.isArray(sample.match_number)
  //         ? sample.match_number
  //         : (typeof sample.match_number === "string"
  //             ? [[sample.match_number]]
  //             : [[""]])
  // }
  // const data: CricketMatchData = patchedSample as CricketMatchData

  const data: CricketMatchData | null = hasData ? matchData : null;
  const [isCommentaryOpen, setIsCommentaryOpen] = useState(false)
  const [tradeSubTab, setTradeSubTab] = useState("batsmen")
  const [activeTab, setActiveTab] = useState<string>("live")
  const [bettingNumber, setBettingNumber] = useState(0)
  const [currentPlayerPrice, setCurrentPlayerPrice] = useState(0)
  const [currentTeamPrice, setCurrentTeamPrice] = useState(0)
  const [isBettingModalOpen, setIsBettingModalOpen] = useState(false)
  const [quantity, setQuantity] = useState("");

  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [bettingPlayer, setBettingPlayer] = useState<BettingPlayer | null>(null)

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  // Team betting modal state
  const [teamQuantity, setTeamQuantity] = useState(1);
  const [teamPrice, setTeamPrice] = useState(0);

  // Defensive: fallback values if no data
  const [match_id, setMatchId] = useState<string>(data && data.match_id ? data.match_id : "");
  const [currentInnings, setCurrentInnings] = useState<any>(
    data && data.innings && data.innings.length > 0 ? data.innings[data.innings.length - 1] : null
  );
  const [battingTeam, setBattingTeam] = useState<Team | null>(
    currentInnings && data?.teama && data?.teamb
      ? (currentInnings.batting_team_id === data.teama.team_id ? data.teama : data.teamb)
      : null
  );
  const [bowlingTeam, setBowlingTeam] = useState<Team | null>(
    currentInnings && data?.teama && data?.teamb
      ? (currentInnings.batting_team_id === data.teama.team_id ? data.teamb : data.teama)
      : null
  );
  const [matchNotesNormalized, setMatchNotesNormalized] = useState<string[][]>(
    data && data.match_notes
      ? (Array.isArray(data.match_notes?.[0])
        ? (data.match_notes as unknown as string[][])
        : [[data.match_notes as string]])
      : [[]]
  );

  const allUsedBowlers = useMemo(() => {
    if (!data?.innings) return []

    const bowlerStats = new Map<string, any>()

    data.innings.forEach(inning => {
      inning.bowlers.forEach(bowler => {
        const existing = bowlerStats.get(bowler.bowler_id)
        if (existing) {
          existing.overs = String(Number(existing.overs) + Number(bowler.overs))
          existing.runs_conceded = String(Number(existing.runs_conceded) + Number(bowler.runs_conceded))
          existing.wickets = String(Number(existing.wickets) + Number(bowler.wickets))
          existing.maidens = String(Number(existing.maidens) + Number(bowler.maidens))
        } else {
          bowlerStats.set(bowler.bowler_id, { ...bowler })
        }
      })
    })

    bowlerStats.forEach(bowler => {
      const overs = Number(bowler.overs)
      const runs = Number(bowler.runs_conceded)
      if (overs > 0) {
        bowler.econ = (runs / overs).toFixed(2)
      } else {
        bowler.econ = "0.00"
      }
    })

    return Array.from(bowlerStats.values())
  }, [data?.innings])

  useEffect(() => {
    setMatchId(data && data.match_id ? data.match_id : "");
    setCurrentInnings(data && data.innings && data.innings.length > 0 ? data.innings[data.innings.length - 1] : null);

    const newCurrentInnings = data && data.innings && data.innings.length > 0 ? data.innings[data.innings.length - 1] : null;
    setBattingTeam(
      newCurrentInnings && data?.teama && data?.teamb
        ? (newCurrentInnings.batting_team_id === data.teama.team_id ? data.teama : data.teamb)
        : null
    );
    setBowlingTeam(
      newCurrentInnings && data?.teama && data?.teamb
        ? (newCurrentInnings.batting_team_id === data.teama.team_id ? data.teamb : data.teama)
        : null
    );
    setMatchNotesNormalized(
      data && data.match_notes
        ? (Array.isArray(data.match_notes?.[0])
          ? (data.match_notes as unknown as string[][])
          : [[data.match_notes as string]])
        : [[]]
    );
  }, [data]);

  const [basePrice, setBasePrice] = useState(0);

  useEffect(() => {
    if (bettingNumber < 3) setBasePrice(35);
    else if (bettingNumber < 6) setBasePrice(30);
    else setBasePrice(25);
  }, [bettingNumber]);
  useEffect(() => {
    if (data) console.log(data)
  }, [])
  const [isYetToComeOpen, setIsYetToComeOpen] = useState(false)
  return (
    <div className="min-h-full bg-gradient-to-br from-sky-600 via-transparent to-transparent">
      <div className="container max-w-[100rem] mx-auto px-3 py-4 space-y-4 overflow-x-hidden">
        {/* Status Note */}
        {data?.status_note && (
          <div className="absolute top-19 left-1/2 transform -translate-x-1/2 flex justify-center w-full px-4">
            <div className="pr-3 pl-3 py-2 rounded-b-xl bg-[#7c8fa4] text-white text-sm md:text-base lg:text-xl font-bold shadow-lg flex items-center gap-2 max-w-[90vw]">
              <span className="text-red-500 bg-white px-2 md:px-4 rounded-full animate-pulse text-xs md:text-sm">
                Live
              </span>
              <span className="whitespace-nowrap truncate">{data.status_note}</span>
            </div>
          </div>
        )}

        {/* Title & Teams */}
        <div className="text-center mt-20 max-sm:mt-10">
          <div className="flex flex-col items-center justify-center mb-5 gap-4">
            <h1 className="text-2xl md:text-4xl lg:text-6xl font-bold text-white px-4">
              {data?.competition?.title || "No match data found"}
            </h1>
            {data?.title && (
              <div className="text-xs md:text-base text-gray-200 font-bold">
                {data.title}
              </div>
            )}

          </div>

          <div className="flex items-center justify-center gap-4 sm:gap-8 md:gap-12 text-white px-4">
            {data ? (
              <div className="flex items-center justify-center w-full">
                {/* Team A */}
                <div className="flex-1 flex flex-col items-center gap-2 md:gap-4 group cursor-pointer">
                  <img
                    src={data.teama?.logo_url}
                    alt={data.teama?.name ?? "Team A"}
                    className="w-20 h-20 rounded-full shadow-lg backdrop-blur-md hover:scale-105 transition-transform duration-500"
                  />
                  {/* Show short_name on small screens, name on large screens, and full name tiny under shortname on small screens */}
                  <div className="text-center">
                    <span className="block font-extrabold">
                      <span className="text-xs sm:hidden">
                        {String(data?.teama?.short_name ?? data?.teama?.name ?? "").toLocaleUpperCase()}
                      </span>
                      <span className="hidden sm:inline text-2xl md:text-3xl xl:text-4xl font-extrabold">
                        {String(data?.teama?.name ?? "").toLocaleUpperCase()}
                      </span>
                    </span>
                    {/* Full name in very small text under shortname on small screens */}
                    <span className="block text-[10px] text-gray-300 sm:hidden leading-tight font-extrabold">
                      {data?.teama?.name && data?.teama?.short_name && data?.teama?.name !== data?.teama?.short_name
                        ? data?.teama?.name
                        : ""}
                    </span>
                  </div>
                </div>

                {/* VS in center */}
                <div className="flex-1 flex flex-col items-center justify-center px-2">
                  <span className="text-2xl md:text-3xl font-extrabold text-sky-400 animate-pulse text-center">VS</span>
                </div>

                {/* Team B */}
                <div className="flex-1 flex flex-col items-center gap-2 md:gap-4 group cursor-pointer">
                  <img
                    src={data?.teamb?.logo_url}
                    alt={data?.teamb?.name ?? "Team B"}
                    className="w-20 h-20 rounded-full shadow-lg backdrop-blur-md hover:scale-105 transition-transform duration-500"
                  />
                  <div className="text-center">
                    <span className="font-extrabold block">
                      <span className="text-xs sm:hidden">
                        {String(data?.teamb?.short_name ?? data?.teamb?.name ?? "").toLocaleUpperCase()}
                      </span>
                      <span className="hidden sm:inline text-2xl md:text-3xl xl:text-4xl font-extrabold">
                        {String(data?.teamb?.name ?? "").toLocaleUpperCase()}
                      </span>
                    </span>
                    {/* Full name in very small text under shortname on small screens */}
                    <span className="block text-[10px] text-gray-300 font-extrabold sm:hidden leading-tight">
                      {data?.teamb?.name && data?.teamb?.short_name && data?.teamb?.name !== data?.teamb?.short_name
                        ? data?.teamb?.name
                        : ""}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <span className="text-gray-400 text-xl md:text-2xl">No team data found</span>
            )}
          </div>
        </div>
        {/* <div className="flex w-full gap-4 mt-6">
          <button
            className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-6 rounded-lg shadow transition-colors duration-200"
            onClick={() => setActiveTab("batting")}
            type="button"
          >
            Trade Now
          </button>
          <button
            className="flex-1 bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-6 rounded-lg shadow transition-colors duration-200"
            onClick={() => setActiveTab("partnership")}
            type="button"
          >
            Positions
          </button>
        </div> */}
        <div className="w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-6 md:mt-10">
            {/* Scrollable Tabs List */}
            <div className="relative mb-4 md:mb-6">
              <TabsList className="flex w-full overflow-x-auto scrollbar-hide h-auto gap-1 md:gap-5 p-1.5 bg-white/5 rounded-xl">
                {[
                  {
                    value: "live",
                    label: "Live",
                    icon: Radio,
                  },
                  {
                    value: "tradenow",
                    label: "Trade Now",
                    icon: TrendingUp,
                  },
                  {
                    value: "bowling",
                    label: "Bowling",
                    icon: Target,
                  },
                  {
                    value: "squads",
                    label: "Squads",
                    icon: Users,
                  },
                ].map(({ value, label, icon: Icon }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className={cn(`flex items-center justify-center gap-1 md:gap-2 text-sm md:text-base lg:text-lg font-bold py-2 md:py-3 px-3 md:px-4 transition-colors duration-300 data-[state=active]:bg-white/80 data-[state=active]:text-sky-600 hover:bg-white/40 rounded-lg whitespace-nowrap flex-shrink-0 cursor-pointer `, value === "tradenow" && "border-green-400/30 bg-green-400/10 animate-pulse data-[state=active]:animate-none data-[state=active]:border-none")}
                  >
                    <Icon className="hidden md:inline w-7 h-7 md:w-4 md:h-4 lg:w-5 lg:h-5" />
                    <span className="">{label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <TabsContent value="live" className="space-y-4">
              {currentInnings && battingTeam ? (
                <Card className="rounded-2xl shadow-none overflow-hidden">
                  <CardContent className="p-6 md:p-10 text-center space-y-4 md:space-y-6 flex flex-col items-center justify-center">
                    <div className="flex w-full items-center">
                      <div className="flex-1 flex justify-center items-center">
                        <img
                          src={battingTeam?.logo_url}
                          alt={battingTeam?.name ?? "Team B"}
                          className="w-28 h-28 md:w-36 md:h-36 rounded-full shadow-2xl bg-white/10 hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="text-6xl md:text-7xl font-black text-sky-200 drop-shadow-xl tracking-wider">
                          {currentInnings?.scores}
                        </div>
                        <div className="text-lg md:text-2xl font-semibold text-sky-100/80 mt-1">
                          ({currentInnings?.equations.overs} overs)
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="relative bg-gradient-to-r from-slate-900 via-sky-800/30 to-slate-900 overflow-hidden rounded-2xl shadow-xl border-2 border-sky-700">
                  <div className="absolute inset-0 z-0 overflow-hidden">
                    <img
                      src={data?.teama?.logo_url}
                      alt={data?.teama?.name}
                      className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay scale-125 blur-sm"
                    />
                    <img
                      src={data?.teamb?.logo_url}
                      alt={data?.teamb?.name}
                      className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay scale-125 blur-sm"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-sky-900/60 to-slate-900/80" />
                  </div>
                  <CardContent className="relative z-10 p-8 md:p-16 text-center flex flex-col items-center justify-center min-h-[220px]">
                    <h2 className="text-2xl md:text-6xl font-extrabold tracking-widest bg-gradient-to-r from-sky-200 via-white to-sky-400 bg-clip-text text-transparent drop-shadow-2xl">
                      Match Will Be Live Soon
                    </h2>
                  </CardContent>
                </Card>
              )}
              {/* Current Batsmen & Bowler Section */}
              {currentInnings && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-6">
                  {/* Current Batsmen */}
                  <div className="bg-slate-800/60 rounded-lg p-2 md:p-4">

                    <div className="text-white text-base md:text-2xl flex items-center gap-2 p-2">
                      <HardHat className="w-5 h-5 md:w-10 md:h-10" />
                      Current Batsman
                    </div>
                    <div className="flex flex-col gap-1 md:gap-2 p-2">
                      {currentInnings.batsmen
                        ?.filter((b: any) => b.batting === "true")
                        .map((batsman: any) => (
                          <div
                            key={batsman.batsman_id}
                            className="flex items-center justify-between text-xs md:text-base p-1"
                          >
                            <span className="font-bold text-white">{batsman.name}</span>
                            <span className="text-gray-300">
                              {batsman.runs}({batsman.balls_faced})
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                  {/* Current Bowler */}
                  <div className="bg-slate-800/60 rounded-lg p-2 md:p-4">
                    <div className="text-white text-base md:text-2xl flex items-center gap-2 p-2">
                      <Target className="w-5 h-5 md:w-10 md:h-10" />
                      Current Bowler
                    </div>
                    <div className="flex flex-col gap-1 md:gap-2 p-2">
                      {currentInnings.bowlers
                        ?.filter((b: any) => b.bowling === "true")
                        .map((bowler: any) => (
                          <div key={bowler.bowler_id} className="flex items-center justify-between text-xs md:text-base p-1">
                            <span className="font-bold text-white">{bowler.name}</span>
                            <span className="text-gray-300">
                              {bowler.overs} ov, {bowler.wickets} wkts, Econ: {bowler.econ}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Yet-to-come Batsmen TBA (Animated Slide Down) */}
              {currentInnings && currentInnings.did_not_bat && currentInnings.did_not_bat.length > 0 && (
                <div className="bg-slate-800/40 rounded-lg p-2 md:p-4 mt-2">
                  <button
                    type="button"
                    className={`w-full flex items-center justify-between text-xs md:text-lg font-bold text-white mb-1 md:mb-2 pr-2 pb-0 rounded-md focus:outline-none focus:ring-0 transition-colors duration-200`}
                    onClick={() => setIsYetToComeOpen(v => !v)}
                    aria-expanded={isYetToComeOpen}
                  >

                    <span>
                      <div className="text-white text-base md:text-2xl flex items-center gap-2 p-2">
                        <Users className="w-5 h-5 md:w-10 md:h-10" />
                        Yet to Come Batsmen
                      </div>
                    </span>
                    <svg className={`w-5 h-5 -ml-2 transition-transform duration-300 ${isYetToComeOpen ? "rotate-90" : "rotate-0"}`} fill="none" viewBox="0 0 24 24">
                      <path
                        d="M6 9l6 6 6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <AnimatePresence initial={false}>
                    <motion.div
                      key="yet-to-come"
                      initial={false}
                      animate={isYetToComeOpen ? { height: "auto", opacity: 1, marginTop: 12 } : { height: 0, opacity: 0, marginTop: 0 }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      transition={{ height: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }, opacity: { duration: 0.25 }, marginTop: { duration: 0.3 } }}
                      style={{ overflow: "hidden" }}
                    >
                      <ul className="flex flex-col gap-2 mt-2 justify-start">
                        {currentInnings.did_not_bat.map((batsman: any, idx: number) => (
                          <motion.li
                            key={batsman.player_id}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.05 * idx, duration: 0.25, type: "spring", stiffness: 200 }}
                            className="text-xs md:text-base text-gray-200 px-3 py-1"
                          >
                            {batsman.name}
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}

              {/* Compact Info Bar: Pitch, Weather, Toss, Umpires */}
              <div className="w-full mt-2">
                <MatchInfoTicker umpires={data?.umpires} referee={data?.referee} venue={data?.venue} weather={data?.weather} pitch={data?.pitch} />
              </div>

              {/* Collapsible Commentary Section */}
              {data?.match_notes && data?.match_notes.length > 0 && (
                <div className="mt-4">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between bg-slate-800/50 p-3 rounded-lg focus:outline-none transition"
                    onClick={() => setIsCommentaryOpen?.((prev: boolean) => !prev)}
                  >
                    <span className="flex items-center gap-2 text-white text-base md:text-2xl">
                      <Mic2 className="w-5 h-5 md:w-10 md:h-10" />
                      Commentary
                    </span>
                    <svg
                      className={`w-5 h-5 transition-transform duration-300 ${isCommentaryOpen ? "rotate-90" : "rotate-0"}`}
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M6 9l6 6 6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <AnimatePresence initial={false}>
                    <motion.div
                      key="commentary"
                      initial={false}
                      animate={isCommentaryOpen ? { height: "auto", opacity: 1, marginTop: 12 } : { height: 0, opacity: 0, marginTop: 0 }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      transition={{
                        height: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
                        opacity: { duration: 0.25 },
                        marginTop: { duration: 0.3 }
                      }}
                      style={{ overflow: "hidden" }}
                    >
                      <Card className="bg-slate-800/50 p-3 mt-0">
                        <CardContent>
                          <div className="relative">
                            <div className="absolute -left-3 top-0 bottom-0 w-1 bg-slate-600 rounded-full" style={{ zIndex: 0 }} />
                            <ul className="space-y-4">
                              {formatMatchNotes(matchNotesNormalized).map((note, index) => (
                                <li key={index} className="relative flex items-start group">
                                  {/* Dot */}
                                  <span className="absolute -left-4 top-1.5 flex items-center justify-center">
                                    <span className="w-3 h-3 rounded-full bg-white shadow-md" />
                                  </span>
                                  <div className="p-1 md:p-2 ml-2">
                                    <p className="text-gray-300 text-xs md:text-md font-bold">{note}</p>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>
            <TabsContent value="tradenow">
              <Tabs value={tradeSubTab} onValueChange={setTradeSubTab} className="w-full">
                {currentInnings && (
                  <Card className="relative bg-gradient-to-r from-transparent to-transparent overflow-hidden rounded-none shadow-none -mx-3">
                    {data && (
                      <div className="absolute inset-0 z-10 overflow-hidden">
                        <img
                          src={data?.teama.logo_url || "/placeholder.svg"}
                          alt={data?.teama.name}
                          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay scale-125 blur-sm"
                        />
                        <img
                          src={data?.teamb.logo_url || "/placeholder.svg"}
                          alt={data?.teamb.name}
                          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay scale-125 blur-sm"
                        />
                      </div>
                    )}
                    <CardContent className="p-0 text-center space-y-4 relative z-20">
                      <h2 className="text-5xl font-bold tracking-wide bg-white/60 bg-clip-text text-transparent">
                        {data && Number(data.latest_inning_number) === 1
                          ? "1st Innings"
                          : Number(data?.latest_inning_number) === 2
                            ? "2nd Innings"
                            : data?.latest_inning_number
                              ? `${data.latest_inning_number}th Innings`
                              : ""}
                      </h2>
                    </CardContent>
                  </Card>
                )}
                <TabsList className="flex w-full overflow-x-auto scrollbar-hide h-auto gap-1 md:gap-2 p-1 bg-white/5 rounded-xl">
                  <TabsTrigger
                    value="batsmen"
                    className={`flex items-center justify-center gap-1 md:gap-2 text-sm md:text-base lg:text-lg font-bold py-2 md:py-3 px-3 md:px-4 transition-colors duration-300 data-[state=active]:bg-white/80 data-[state=active]:text-sky-600 hover:bg-white/40 rounded-lg whitespace-nowrap flex-shrink-0 cursor-pointer `}
                  >
                    Batsmen
                  </TabsTrigger>
                  <TabsTrigger
                    value="bowlers"
                    className={`flex items-center justify-center gap-1 md:gap-2 text-sm md:text-base lg:text-lg font-bold py-2 md:py-3 px-3 md:px-4 transition-colors duration-300 data-[state=active]:bg-white/80 data-[state=active]:text-sky-600 hover:bg-white/40 rounded-lg whitespace-nowrap flex-shrink-0 cursor-pointer `}
                  >
                    Bowlers
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="batsmen" className="mt-4">
                  <div className="space-y-2">
                    {data?.innings &&
                      data?.innings[Number(data.latest_inning_number) - 1]?.batsmen?.map(
                        (batsman: any, batsmanNumber: any) => {
                          const isBatting = batsman.batting === "true";
                          const isOut = batsman.how_out !== "Not out";
                          return (
                            <div
                              key={batsman.batsman_id}
                              className={`flex items-center justify-between p-2 rounded-md transition text-xs sm:text-base ${!isOut
                                ? "bg-gray-700/20 hover:bg-gray-700/60 cursor-pointer"
                                : "opacity-50 cursor-not-allowed"
                                }`}
                              onClick={() => {
                                if (!isOut) {
                                  setBettingPlayer(batsman);
                                  setBettingNumber(batsmanNumber);
                                  setBasePrice(
                                    batsmanNumber < 3
                                      ? 35
                                      : batsmanNumber < 6
                                        ? 30
                                        : 25
                                  );
                                  const current =
                                    batsmanNumber < 3
                                      ? 35
                                      : batsmanNumber < 6
                                        ? 30
                                        : 25;
                                  setCurrentPlayerPrice(
                                    current -
                                    Number(batsman.run0) * 0.5 +
                                    Number(batsman.run1) * 0.75 +
                                    Number(batsman.run2) * 1.5 +
                                    Number(batsman.run3) * 2.25 +
                                    Number(batsman.fours) * 3 +
                                    Number(batsman.sixes) * 4.5
                                  );
                                  setIsBettingModalOpen(true);
                                }
                              }}
                            >
                              <div>
                                <h3 className="flex items-center gap-2 text-sm sm:text-lg font-bold text-white">
                                  {batsman.name}
                                  {isBatting && (
                                    <Badge className="text-xs p-1 text-white">*</Badge>
                                  )}
                                </h3>
                                <p className="text-xs sm:text-sm font-bold text-gray-400">
                                  {batsman.runs} ({batsman.balls_faced})
                                </p>
                                {isOut && (
                                  <p className="text-xs sm:text-sm font-bold text-red-400">
                                    {batsman.how_out}
                                  </p>
                                )}
                              </div>
                              <div className="text-right flex gap-5">
                                <div>
                                  <p className="text-xs sm:text-base font-bold text-white">
                                    SR: {batsman.strike_rate}
                                  </p>
                                  <p className="text-xs sm:text-sm font-bold text-gray-400">
                                    {batsman.fours}x4, {batsman.sixes}x6
                                  </p>
                                </div>
                                {!isOut ? (
                                  <button
                                    onClick={() => {
                                      setBettingPlayer(batsman);
                                      setBettingNumber(batsmanNumber);
                                      setBasePrice(
                                        batsmanNumber < 3
                                          ? 35
                                          : batsmanNumber < 6
                                            ? 30
                                            : 25
                                      );
                                      const current =
                                        batsmanNumber < 3
                                          ? 35
                                          : batsmanNumber < 6
                                            ? 30
                                            : 25;
                                      setCurrentPlayerPrice(
                                        current -
                                        Number(batsman.run0) * 0.5 +
                                        Number(batsman.run1) * 0.75 +
                                        Number(batsman.run2) * 1.5 +
                                        Number(batsman.run3) * 2.25 +
                                        Number(batsman.fours) * 3 +
                                        Number(batsman.sixes) * 4.5
                                      );
                                      setIsBettingModalOpen(true);
                                    }}
                                    className="bg-green-700 text-white text-[12px] sm:text-xs font-bold px-2 py-1 rounded-md hover:bg-emerald-700 transition"
                                  >
                                    Trade
                                  </button>
                                ) : (
                                  <button
                                    disabled
                                    className="bg-green-700/70 text-white text-[12px] sm:text-xs font-bold px-2 py-1 rounded-md hover:bg-emerald-700 transition"
                                  >
                                    Trade
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        }
                      )}
                  </div>
                </TabsContent>
                <TabsContent value="bowlers" className="mt-4">
                  <div className="space-y-2">
                    {data?.innings?.map(inning =>
                      inning.bowlers.map(bowler => {
                        const isCurrentBowler = bowler.bowling === "true";
                        return (
                          <div
                            key={bowler.bowler_id}
                            onClick={() => toast("Bowler's Stocks Coming Soon..")}
                            className={`flex items-center justify-between p-2 rounded-md transition
                              ${isCurrentBowler
                                ? "bg-slate-700/40"
                                : "bg-transparent opacity-60 pointer-events-none select-none"
                              }`}
                          >
                            <div>
                              <h3 className={`flex items-center gap-2 text-sm sm:text-lg font-bold
                                ${isCurrentBowler ? "text-white" : "text-gray-400"}
                              `}>
                                {bowler.name}
                                {isCurrentBowler && <Badge className="text-xs p-1 text-red-400">*</Badge>}
                              </h3>
                              <p className={`text-xs sm:text-sm ${isCurrentBowler ? "text-gray-400" : "text-gray-500"}`}>
                                {bowler.overs} ov, {bowler.maidens} m, {bowler.runs_conceded} r, {bowler.wickets} w
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`text-xs sm:text-base font-bold ${isCurrentBowler ? "text-white" : "text-gray-400"}`}>
                                Econ: {bowler.econ}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>
            <TabsContent value="bowling">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                {allUsedBowlers.length > 0 ? (
                  allUsedBowlers.map(bowler => (
                    <Card key={bowler.bowler_id} className="bg-slate-800/50 border-slate-700/50 rounded-lg">
                      <CardContent className="p-1 sm:p-4">
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg sm:text-base font-bold text-white px-4">{bowler.name}</h3>
                        </div>
                        <div className="grid grid-cols-5 gap-2 mt-2 text-center">
                          <div>
                            <p className="text-xs text-gray-400">Overs</p>
                            <p className="text-sm sm:text-base font-bold text-white">{bowler.overs}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Maidens</p>
                            <p className="text-sm sm:text-base font-bold text-white">{bowler.maidens}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Runs</p>
                            <p className="text-sm sm:text-base font-bold text-white">{bowler.runs_conceded}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Wickets</p>
                            <p className="text-sm sm:text-base font-bold text-white">{bowler.wickets}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Economy</p>
                            <p className="text-sm sm:text-base font-bold text-white">{bowler.econ}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="bg-slate-800/50 col-span-full">
                    <CardContent>
                      <div className="p-2 text-center">
                        <p className="text-gray-300 text-sm font-bold">
                          Match has not started yet or no bowlers data available.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
            <TabsContent value="squads">
              <div className="space-y-4">
                {data?.players && data.players.length > 0 ? (
                  Array.from(new Set(data.players.map(p => p.nationality))).map(nationality => (
                    <Card key={nationality} className="shadow-none bg-slate-800/50">
                      <CardHeader className="p-2 sm:p-4">
                        <CardTitle className="text-4xl sm:text-2xl md:text-3xl text-white flex items-center gap-2 px-5">
                          {nationality}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-2 sm:p-4 pt-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {data.players
                            .filter(player => player.nationality === nationality)
                            .map(player => (
                              <div
                                key={player.pid}
                                className="px-4 py-2"
                                onClick={() => {
                                  setSelectedPlayer(player as any)
                                  setIsPlayerModalOpen(true)
                                }}
                              >
                                <div className="space-y-1">
                                  <div className="flex items-start justify-between">
                                    <h3 className="text-white font-bold text-sm sm:text-base pr-2">
                                      {player.first_name} {player.last_name}
                                    </h3>
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] sm:text-xs text-center shrink-0 ${getRoleColor(
                                        player.playing_role
                                      )} text-white border-0 font-extrabold px-2 sm:px-2 py-0.5`}
                                    >
                                      {player.playing_role.toUpperCase() == "BAT"
                                        ? "Batsman"
                                        : player.playing_role.toUpperCase() == "BOWL"
                                          ? "Bowler"
                                          : player.playing_role.toUpperCase() == "ALL"
                                            ? "All Rounder"
                                            : player.playing_role.toUpperCase() == "WK"
                                              ? "Wicket Keeper"
                                              : "Player"}
                                    </Badge>
                                  </div>
                                  <p className="text-gray-400 text-xs sm:text-sm font-bold">{player.short_name}</p>
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                    <span className="text-yellow-400 text-xs sm:text-sm font-bold">
                                      {player.fantasy_player_rating}/10
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="bg-slate-800/50">
                    <CardContent>
                      <div className="p-2 text-center">
                        <p className="text-gray-300 text-3xl font-bold">Match Is Not Started Yet</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>


          {selectedPlayer && isPlayerModalOpen && (
            <div className="fixed inset-0 w-full h-full z-50 flex items-center justify-center bg-black/70 p-4">
              <div className="w-full max-w-md transform rounded-xl bg-gradient-to-br from-gray-900/80 via-gray-900/90 to-gray-900 p-6 shadow-lg transition-all duration-300">
                <div className="mb-4 flex items-start justify-between">
                  <h2 className="text-2xl font-bold text-white">
                    {selectedPlayer.first_name} {selectedPlayer.last_name}
                  </h2>
                  <button
                    onClick={() => {
                      setIsPlayerModalOpen(false);
                      setSelectedPlayer(null);
                    }}
                    className="text-gray-400 transition-colors hover:text-white cursor-pointer shadow-md"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Role:</span>
                    <Badge className={getRoleColor(selectedPlayer.playing_role)}>
                      {(() => {
                        const role = selectedPlayer.playing_role.toUpperCase();
                        if (role === "BAT") return "Batsman";
                        if (role === "BOWL") return "Bowler";
                        if (role === "ALL") return "All Rounder";
                        if (role === "WK") return "Wicket Keeper";
                        return "Player";
                      })()}
                    </Badge>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-400">Country:</span>
                    <span className="text-white">{selectedPlayer.nationality}</span>
                  </div>

                  {selectedPlayer.birthdate && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Born:</span>
                      <span className="text-white">{selectedPlayer.birthdate}</span>
                    </div>
                  )}

                  {selectedPlayer.batting_style && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Batting:</span>
                      <span className="text-white">{selectedPlayer.batting_style}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-400">Rating:</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-white">{selectedPlayer.fantasy_player_rating}/10</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {bettingPlayer && isBettingModalOpen && (
            <div className="fixed inset-0 z-50 w-full h-full flex items-center justify-center bg-black/70 backdrop-blur-lg p-4">
              <div className="w-full max-w-lg rounded-2xl bg-gradient-to-br from-gray-900/90 via-gray-900/90 to-gray-900 p-6 sm:p-6 md:p-8 shadow-2xl transition-all duration-300">
                {/* === Header === */}
                <div className="mb-4 sm:mb-6 flex items-center justify-between">
                  <img
                    src={
                      data?.teama?.team_id == data?.innings?.[Number(data?.latest_inning_number) - 1]?.batting_team_id
                        ? data?.teama?.logo_url
                        : data?.teamb?.logo_url
                    }
                    alt={
                      data?.teama?.team_id == data?.innings?.[Number(data?.latest_inning_number) - 1]?.batting_team_id
                        ? data?.teama?.name
                        : data?.teamb?.name
                    }
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full shadow-xl"
                  />
                  <h2 className="text-xl sm:text-2xl md:text-4xl flex items-center gap-2 sm:gap-4 font-extrabold text-white text-right">
                    {bettingPlayer.name}
                    <span className="text-xs sm:text-sm text-gray-500 capitalize">{bettingPlayer.position}</span>
                  </h2>
                  <button
                    onClick={() => {
                      setIsBettingModalOpen(false)
                      setBettingPlayer(null)
                    }}
                    className="text-gray-400 transition-colors hover:text-white text-lg sm:text-xl cursor-pointer"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                {/* === Stats === */}
                <div className="mt-4 sm:mt-6 grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 text-center">
                  <div className="bg-gray-800/40 rounded-lg p-3 sm:p-6">
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{bettingPlayer.runs}</p>
                    <p className="text-sm sm:text-base font-bold text-gray-400">Runs</p>
                  </div>
                  <div className="bg-gray-800/40 font-bold rounded-lg p-3 sm:p-6">
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{bettingPlayer.balls_faced}</p>
                    <p className="text-sm sm:text-base text-gray-400">Balls</p>
                  </div>
                  <div className="bg-gray-800/40 font-bold rounded-lg p-3 sm:p-6">
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                      {Number(bettingPlayer.strike_rate)}
                    </p>
                    <p className="text-sm sm:text-base text-gray-400">Strike Rate</p>
                  </div>
                  <div className="bg-gray-800/40 font-bold rounded-lg p-3 sm:p-6">
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{bettingPlayer.fours}</p>
                    <p className="text-sm sm:text-base text-gray-400">Fours</p>
                  </div>
                  <div className="bg-gray-800/40 font-bold rounded-lg p-3 sm:p-6">
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{bettingPlayer.sixes}</p>
                    <p className="text-sm sm:text-base text-gray-400">Sixes</p>
                  </div>
                  <div className="bg-gray-800/40 font-bold rounded-lg p-3 sm:p-6">
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                      {bettingPlayer.balls_faced && Number(bettingPlayer.balls_faced) > 0
                        ? `${Math.round((Number(bettingPlayer.run0) / Number(bettingPlayer.balls_faced)) * 100)}`
                        : "N/A"}
                    </p>
                    <p className="text-sm sm:text-base font-bold text-gray-400">Dot %</p>
                  </div>
                  <div className="bg-gray-800/40 font-bold rounded-lg p-3 sm:p-6">
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">₹{basePrice}</p>
                    <p className="text-sm sm:text-base text-gray-400">Base Price</p>
                  </div>
                  <div className="bg-gray-800/40 font-bold rounded-lg p-3 sm:p-6">
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">₹{currentPlayerPrice}</p>
                    <p className="text-sm sm:text-base text-gray-400">Current Price</p>
                  </div>
                </div>
                {/* === Quantity Selector === */}
                <div className="mt-6 sm:mt-8">
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div className="flex-1 flex flex-col">
                      <label className="text-xs sm:text-sm font-bold text-gray-300 mb-1" htmlFor="quantity-input">
                        Quantity
                      </label>
                      <Input
                        id="quantity-input"
                        className="text-white border-0 font-extrabold bg-gray-800/60 rounded-lg px-3 py-2 text-sm sm:text-base"
                        type="number"
                        min={0}
                        max={Math.max(0, Math.floor(25000 / (currentPlayerPrice || 1)))}
                        value={quantity}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === "") {
                            setQuantity("");
                            return;
                          }
                          let numVal = Number(val);
                          if (isNaN(numVal)) numVal = 0;
                          const maxQty = Math.max(0, Math.floor(25000 / (currentPlayerPrice || 1)));
                          if (numVal < 0) numVal = 0;
                          if (numVal > maxQty) numVal = maxQty;
                          setQuantity(String(numVal));
                        }}
                      />
                    </div>
                    <div className="flex-1 flex flex-col lg:items-end">
                      <label className="text-xs sm:text-sm font-bold text-gray-300 mb-1" htmlFor="price-input">
                        Price
                        <span
                          className={`ml-2 text-xs mt-1 font-bold ${currentPlayerPrice * Number(quantity) > 25000 ? "text-red-500" : "text-gray-400"
                            }`}
                        >
                          (Max: ₹25000)
                        </span>
                      </label>
                      <Input
                        id="price-input"
                        className="text-white border-0 font-extrabold bg-transparent rounded-lg px-3 py-2 lg:text-end text-sm sm:text-base"
                        placeholder={`₹${currentPlayerPrice * Number(quantity)}`}
                        value={`₹${currentPlayerPrice * Number(quantity)}`}
                        disabled
                      />
                    </div>
                  </div>
                </div>
                {/* === CTA Buttons === */}
                <div className="mt-6 sm:mt-8 flex flex-col md:flex-row gap-3 sm:gap-4">
                  <button
                    className="flex-1 rounded-md sm:rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold py-2 text-sm sm:text-base md:text-lg shadow-md transition cursor-pointer"
                    onClick={async () => {
                      const statusNote = data?.status_note.toLowerCase() || ""
                      const isMatchOver = ["won", "loss", "draw", "tie", "abandoned", "no result", "ended", "finished", "completed"].some(
                        word => statusNote.includes(word)
                      )
                      if (isMatchOver) {
                        toast.info("Match is not LIVE")
                        return
                      }
                      if (!quantity || Number(quantity) === 0) {
                        toast.info("Quantity must be greater than 0")
                        return
                      }
                      const buyingResponse = await buyPlayer(bettingPlayer, String(currentPlayerPrice), String(quantity), match_id)
                      toast.success(buyingResponse.message)
                    }}
                  >
                    Buy Player
                  </button>
                  <button
                    className="flex-1 rounded-md sm:rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold py-2 text-sm sm:text-base md:text-lg shadow-md transition cursor-pointer"
                    onClick={async () => {
                      const statusNote = data?.status_note.toLowerCase() || ""
                      const isMatchOver = ["won", "loss", "draw", "tie", "abandoned", "no result", "ended", "finished", "completed"].some(
                        word => statusNote.includes(word)
                      )
                      if (isMatchOver) {
                        toast.info("Match is not LIVE")
                        return
                      }
                      const sellingResponse = await sellPlayer(
                        bettingPlayer,
                        String(currentPlayerPrice),
                        String(quantity),
                        match_id
                      )
                      toast.success(sellingResponse.message)
                    }}
                  >
                    Sell Player
                  </button>
                </div>
              </div>
            </div>
          )}

          {isTeamModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
              <div className="relative bg-[#1e293b] rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-8">
                <button
                  className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold cursor-pointer"
                  onClick={() => {
                    setIsTeamModalOpen(false);
                    setSelectedTeam(null);
                    setTeamQuantity(1);
                  }}
                  aria-label="Close"
                >
                  ×
                </button>
                {!data || !data.innings || data.innings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center text-white py-12">
                    <p className="text-2xl font-bold mb-2">No match data available</p>
                    <p className="text-gray-400 mb-4">Team statistics are currently unavailable. Please check back later.</p>
                    <button
                      onClick={() => {
                        setIsTeamModalOpen(false);
                        setSelectedTeam(null);
                        setTeamQuantity(1);
                      }}
                      className="px-6 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 transition text-white font-bold cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                ) : (() => {
                  const teamInnings = data.innings.filter((inn) => inn.batting_team_id === selectedTeam?.team_id);
                  const otherInnings = data.innings.filter((inn) => inn.batting_team_id !== selectedTeam?.team_id);

                  const latestTeamInning = teamInnings[teamInnings.length - 1];
                  const latestOtherInning = otherInnings[otherInnings.length - 1];

                  let price = 0;
                  if (latestTeamInning) {
                    if (latestOtherInning && latestOtherInning.scores) {
                      const theirRuns = Number(latestOtherInning.equations?.runs || latestOtherInning.scores?.split("/")[0] || 0);
                      const ourRuns = Number(latestTeamInning.equations?.runs || latestTeamInning.scores?.split("/")[0] || 0);
                      price = theirRuns > 0 ? Math.round((ourRuns / theirRuns) * 100) : ourRuns * 1.5;
                    } else {
                      price = Number(latestTeamInning.equations?.runs || latestTeamInning.scores?.split("/")[0] || 0) * 1.5;
                    }
                  }

                  if (teamPrice !== price) setTeamPrice(price);

                  if (!latestTeamInning) {
                    return (
                      <div className="flex flex-col items-center justify-center text-center text-white py-12">
                        <p className="text-2xl font-bold mb-2">No team stats yet</p>
                        <p className="text-gray-400 mb-4">This team has not played any innings yet.</p>
                      </div>
                    );
                  }

                  return (
                    <>
                      <div className="flex items-center justify-around mb-6">
                        {/* Left: Logo + Name */}
                        <div className="flex flex-col items-center gap-4">
                          <span className="text-xl md:text-2xl font-extrabold text-white">
                            {selectedTeam?.name}
                          </span>
                          <img
                            src={selectedTeam?.logo_url}
                            alt={selectedTeam?.name}
                            className="w-20 h-20 rounded-full shadow-xl"
                          />
                        </div>

                        {/* Right: Score Info */}
                        <div className="bg-gray-800/40 rounded-lg flex flex-col items-center mt-8">
                          {/* <p className="text-2xl font-bold text-white">Score</p> */}
                          <p className="text-6xl font-bold text-white">
                            {latestTeamInning?.scores || latestTeamInning?.scores || "-"}
                          </p>
                        </div>
                      </div>                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center mb-6">
                        <div className="bg-gray-800/40 rounded-lg p-4">
                          <p className="text-2xl font-bold text-white">{latestTeamInning?.equations?.overs || "-"}</p>
                          <p className="text-sm font-bold text-gray-400">Overs</p>
                        </div>
                        <div className="bg-gray-800/40 rounded-lg p-4">
                          <p className="text-2xl font-bold text-white">{latestTeamInning?.equations?.wickets || "-"}</p>
                          <p className="text-sm font-bold text-gray-400">Wickets</p>
                        </div>
                        {latestOtherInning && (
                          <div className="bg-gray-800/40 rounded-lg p-4 col-span-2 md:col-span-1">
                            <p className="text-2xl font-bold text-white">{latestOtherInning?.scores_full || latestOtherInning?.scores || "-"}</p>
                            <p className="text-sm font-bold text-gray-400">Opponent Score</p>
                          </div>
                        )}
                        <div className="bg-gray-800/40 rounded-lg p-4 col-span-2 md:col-span-1">
                          <p className="text-2xl font-bold text-green-400">₹{price}</p>
                          <p className="text-sm font-bold text-gray-400">Team Price</p>
                        </div>
                      </div>

                      {/* Quantity Selector */}
                      <div className="mt-4">
                        <label className="block mb-2 text-sm font-bold text-gray-300">Select Quantity</label>
                        <div className="flex gap-1.5 flex-wrap">
                          {[1, 5, 10, 15, 20, 25, 30, 35].map((qty) => (
                            <button
                              key={qty}
                              onClick={() => setTeamQuantity(qty)}
                              className={`px-[16.7px] py-2 rounded-lg text-white font-bold transition-all cursor-pointer ${teamQuantity === qty
                                ? "bg-green-600 border-green-700"
                                : "bg-gray-800 hover:bg-gray-700"
                                }`}
                            >
                              {qty}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Buy/Sell Buttons */}
                      <div className="mt-8 flex flex-col md:flex-row gap-4">
                        <button
                          className="flex-1 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold py-3 text-lg shadow-md transition cursor-pointer"
                          onClick={async () => {
                            toast("Feature coming soon...")
                            // if (!selectedTeam) {
                            //     toast("Please select a team to buy.");
                            //     return;
                            // }
                            // const data = await buyTeam(selectedTeam, String(currentTeamPrice), String(quantity), match_id);
                            // toast(data.message);
                          }}
                        >
                          Buy Team
                        </button>
                        <button
                          className="flex-1 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold py-3 text-lg shadow-md transition cursor-pointer"
                          onClick={async () => {
                            toast("Feature coming soon...")
                            // if (!selectedTeam) {
                            //     toast("Please select a team to buy.");
                            //     return;
                            // }
                            // const data = await sellTeam(selectedTeam, String(currentTeamPrice), String(quantity), match_id);
                            // toast(data.message);
                          }}
                        >
                          Sell Team
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {(data?.umpires || data?.referee) && <MatchInfoTicker umpires={data?.umpires} referee={data?.referee} />}
        </div>
      </div >
    </div >
  )
}

