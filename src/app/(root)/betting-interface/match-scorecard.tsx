"use client"

import { useEffect, useState } from "react"
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
} from "lucide-react"
import type { CricketMatchData, Player, BettingPlayer, MatchScorecardProps, Team, BettingTeam } from "./types"
import { getRoleColor, formatMatchNotes, buyPlayer, sellPlayer } from "./services"
import { toast } from "sonner"

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

  const [activeTab, setActiveTab] = useState<string>("live")
  const [bettingNumber, setBettingNumber] = useState(0)
  const [currentPlayerPrice, setCurrentPlayerPrice] = useState(0)
  const [currentTeamPrice, setCurrentTeamPrice] = useState(0)
  const [isBettingModalOpen, setIsBettingModalOpen] = useState(false)
  const [quantity, setQuantity] = useState(1);

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
  // useEffect(() => {
  //   if (data) console.log(data)
  // }, [data])
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-600 via-transparent to-transparent">
      <div className="container mx-auto px-3 py-4 space-y-4">
        {data?.status_note && (
          <div className="fixed top-23 left-1/2 transform -translate-x-1/2 z-50 flex justify-center w-full px-4">
            <div className="pr-5 pl-3 py-3 rounded-full bg-[#7c8fa4] text-white text-base md:text-xl font-bold shadow-lg flex items-center gap-2">
              <span className="text-red-500 text-shadow-sm bg-white px-4 rounded-4xl animate-pulse">Live</span>
              <span className="whitespace-nowrap">{data.status_note}</span>
            </div>
          </div>
        )}
        <div className="text-center mb-4 mt-14">
          <div className="flex items-center justify-center mb-10 gap-4">
            <h1 className="text-6xl font-bold">
              {data?.competition?.title || (
                <span className="text-gray-400">No match data found</span>
              )}
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 text-white">
            {battingTeam && bowlingTeam ? (
              <>
                <div className="flex items-center gap-4 group cursor-pointer" onClick={() => { if (data?.teama) { setSelectedTeam(data.teama); setIsTeamModalOpen(true); } }}>
                  <img
                    src={data?.teama?.logo_url || "/placeholder.svg?height=48&width=48"}
                    alt={data?.teama?.name ?? "Team A"}
                    className="w-12 h-12 md:w-17 md:h-17 rounded-full shadow-lg backdrop-blur-md hover:scale-105 transition-transform duration-500"
                  />
                  <div className="text-left">
                    <span className="text-xl md:text-2xl font-extrabold block">{String(data?.teama?.name ?? "").toLocaleUpperCase()}</span>
                    <span className="text-base md:text-lg text-sky-400 font-bold block">{data?.teama?.scores_full || "Yet to bat"}</span>
                  </div>
                </div>
                <span className="text-3xl font-extrabold text-sky-400 animate-pulse">VS</span>
                <div className="flex items-center gap-4 group cursor-pointer" onClick={() => { if (data?.teamb) { setSelectedTeam(data.teamb); setIsTeamModalOpen(true); } }}>
                  <div className="text-right">
                    <span className="text-xl md:text-2xl font-extrabold block">{String(data?.teamb?.name ?? "").toLocaleUpperCase()}</span>
                    <span className="text-base md:text-lg text-gray-500 font-bold block">{data?.teamb?.scores_full || "Yet to bat"}</span>
                  </div>
                  <img
                    src={data?.teamb?.logo_url || "/placeholder.svg?height=48&width=48"}
                    alt={data?.teamb?.name ?? "Team B"}
                    className="w-12 h-12 md:w-17 md:h-17 rounded-full shadow-lg backdrop-blur-md hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center gap-8 sm:gap-12 text-white">
                <div className="flex items-center gap-4 group">
                  <img
                    src={data?.teama?.logo_url || "/placeholder.svg?height=48&width=48"}
                    alt={data?.teama?.name ?? "Team A"}
                    className="w-12 h-12 md:w-17 md:h-17 rounded-full shadow-lg backdrop-blur-md"
                  />
                  <div className="text-left">
                    <span className="text-xl md:text-2xl font-extrabold block">{String(data?.teama?.name ?? "").toLocaleUpperCase()}</span>
                    <span className="text-base md:text-lg text-sky-400 font-bold block">Yet to bat</span>
                  </div>
                </div>
                <span className="text-3xl font-extrabold text-sky-400">VS</span>
                <div className="flex items-center gap-4 group">
                  <div className="text-right">
                    <span className="text-xl md:text-2xl font-extrabold block">{String(data?.teamb?.name ?? "").toLocaleUpperCase()}</span>
                    <span className="text-base md:text-lg text-gray-500 font-bold block">Yet to bat</span>
                  </div>
                  <img
                    src={data?.teamb?.logo_url || "/placeholder.svg?height=48&width=48"}
                    alt={data?.teamb?.name ?? "Team B"}
                    className="w-12 h-12 md:w-17 md:h-17 rounded-full shadow-lg backdrop-blur-md"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-10">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-7 overflow-visible mb-5">
            <TabsTrigger
              value="live"
              className="mx-2 flex items-center cursor-pointer rounded-2xl justify-center gap-1 text-xl font-bold py-3 transition-colors duration-300 data-[state=active]:bg-white data-[state=active]:text-sky-600 hover:bg-white/40"
            >
              <Radio className="w-4 h-4 md:w-5 md:h-5" />
              Live
            </TabsTrigger>

            <TabsTrigger
              value="batting"
              className="mx-2 flex items-center cursor-pointer rounded-2xl justify-center gap-1 text-xl font-bold py-3 transition-colors duration-300 data-[state=active]:bg-white data-[state=active]:text-sky-600 hover:bg-white/40"
            >
              <HardHat className="w-4 h-4 md:w-5 md:h-5" />
              Batting
            </TabsTrigger>

            <TabsTrigger
              value="bowling"
              className="mx-2 flex items-center cursor-pointer rounded-2xl justify-center gap-1 text-xl font-bold py-3 transition-colors duration-300 data-[state=active]:bg-white data-[state=active]:text-sky-600 hover:bg-white/40"
            >
              <Target className="w-4 h-4 md:w-5 md:h-5" />
              Bowling
            </TabsTrigger>

            <TabsTrigger
              value="partnership"
              className="mx-2 flex items-center cursor-pointer rounded-2xl justify-center gap-1 text-xl font-bold py-3 transition-colors duration-300 data-[state=active]:bg-white data-[state=active]:text-sky-600 hover:bg-white/40"
            >
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
              Partnership
            </TabsTrigger>

            <TabsTrigger
              value="squad"
              className="mx-2 flex items-center cursor-pointer rounded-2xl justify-center gap-1 text-xl font-bold py-3 transition-colors duration-300 data-[state=active]:bg-white data-[state=active]:text-sky-600 hover:bg-white/40"
            >
              <Users className="w-4 h-4 md:w-5 md:h-5" />
              Squads
            </TabsTrigger>

            <TabsTrigger
              value="match-notes"
              className="mx-2 flex items-center cursor-pointer rounded-2xl justify-center gap-1 text-xl font-bold py-3 transition-colors duration-300 data-[state=active]:bg-white data-[state=active]:text-sky-600 hover:bg-white/40"
            >
              <Files className="w-4 h-4 md:w-5 md:h-5" />
              Commentary
            </TabsTrigger>
            <TabsTrigger
              value="report"
              className="mx-2 flex items-center cursor-pointer rounded-2xl justify-center gap-1 text-xl font-bold py-3 transition-colors duration-300 data-[state=active]:bg-white data-[state=active]:text-sky-600 hover:bg-white/40"
            >
              <BarChart3 className="w-4 h-4 md:w-5 md:h-5" />
              Report
            </TabsTrigger>
          </TabsList>
          <TabsContent value="live" className="space-y-6 mt-6">
            {currentInnings && battingTeam ? (
              <Card className="bg-gradient-to-r via-sky-700 from-transparent to-transparent rounded-none shadow-none overflow-hidden">
                <CardContent className="p-6 text-center space-y-4">
                  <h2 className="text-5xl font-bold text-white uppercase tracking-wide">{battingTeam.name}</h2>
                  <div className="text-6xl md:text-7xl font-extrabold text-white">
                    {currentInnings?.scores}
                  </div>
                  <div className="text-lg md:text-xl text-gray-300">({currentInnings?.equations.overs} overs)</div>
                </CardContent>
              </Card>
            ) : (
              <Card className="relative bg-gradient-to-r from-transparent to-transparent overflow-hidden rounded-none shadow-none">
                <div className="absolute inset-0 z-10 overflow-hidden">
                  <img
                    src={data?.teama?.logo_url || "/placeholder.svg?height=48&width=48"}
                    alt={data?.teama?.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay scale-125 blur-sm"
                  />
                  <img
                    src={data?.teamb?.logo_url || "/placeholder.svg?height=48&width=48"}
                    alt={data?.teamb?.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay scale-125 blur-sm"
                  />
                </div>
                <CardContent className="p-6 text-center space-y-4">
                  <h2 className="text-6xl font-bold tracking-wide bg-gradient-to-r from-gray-100 via-gray-100/30 to-gray-100/5 bg-clip-text text-transparent">
                    Match Will Be Live Soon
                  </h2>
                </CardContent>
              </Card>
            )}

            {currentInnings?.equations.overs != '' ?
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {battingTeam && (
                  <Card className="bg-gradient-to-l from-sky-700/70 via-sky-700/20 to-transparent rounded-xl shadow-none transition">
                    <CardHeader className="pb-2 -mb-5">
                      <CardTitle className="text-3xl flex items-center gap-3 text-white">
                        <img
                          src={data?.teama?.logo_url || "/placeholder.svg?height=48&width=48"}
                          alt={data?.teama?.name}
                          className="w-12 h-12 md:w-17 md:h-17 rounded-full shadow-lg backdrop-blur-md hover:scale-105 transition-transform duration-500"
                        />

                        <span className="text-gray-400">{battingTeam.name}'s</span> Batsmen
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {currentInnings?.batsmen
                        ?.filter((batsman: BettingPlayer) => batsman.batting === "true")
                        .map((batsman: BettingPlayer) => (
                          <div
                            key={batsman.batsman_id}
                            className="p-4"
                          >
                            <div className="flex items-center mb-2">
                              <h3 className="text-2xl font-bold text-white">{batsman.name}</h3>
                              <Badge variant={batsman.position === "striker" ? "default" : "secondary"} className="text-md font-bold text-gray-500">
                                {batsman.position === "striker" ? "Striker" : "Non-Striker"}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-base text-gray-300">
                              <div>
                                Runs: <span className="text-white font-bold">{batsman.runs}</span>
                              </div>
                              <div>
                                Balls: <span className="text-white font-bold">{batsman.balls_faced}</span>
                              </div>
                              <div>
                                4s: <span className="text-white font-bold">{batsman.fours}</span>
                              </div>
                              <div>
                                6s: <span className="text-white font-bold">{batsman.sixes}</span>
                              </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-white/10 text-sm text-gray-400">
                              SR: <span className="text-white font-bold">{batsman.strike_rate}</span>
                            </div>
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                )}

                {/* === Current Bowler + Match Stats === */}
                {bowlingTeam && (
                  <Card className="bg-gradient-to-r from-sky-700/70 via-sky-700/70 to-transparent rounded-xl shadow-none transition">
                    <CardHeader className="pb-2 -mb-5">
                      <CardTitle className="text-3xl flex items-center gap-3 text-white">
                        <img
                          src={data?.teamb?.logo_url || "/placeholder.svg?height=48&width=48"}
                          alt={data?.teamb?.name}
                          className="w-12 h-12 md:w-17 md:h-17 rounded-full shadow-lg backdrop-blur-md hover:scale-105 transition-transform duration-500"
                        />
                        <span className="text-gray-400">{bowlingTeam.name}'s</span> Bowlers
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {currentInnings?.bowlers
                        ?.filter((bowler: any) => bowler.bowling === "true")
                        .map((bowler: any) => (
                          <div
                            key={bowler.bowler_id}
                            className="p-4"
                          >
                            <div className="flex items-center mb-2">
                              <h3 className="text-lg font-bold text-white">{bowler.name}</h3>
                              <Badge variant="destructive" className="text-md font-bold text-gray-400">Bowling</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-base text-gray-300">
                              <div>
                                Overs: <span className="text-white font-bold">{bowler.overs}</span>
                              </div>
                              <div>
                                Runs: <span className="text-white font-bold">{bowler.runs_conceded}</span>
                              </div>
                              <div>
                                Wickets: <span className="text-white font-bold">{bowler.wickets}</span>
                              </div>
                              <div>
                                Maidens: <span className="text-white font-bold">{bowler.maidens}</span>
                              </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-white/10 text-sm text-gray-400">
                              Econ: <span className="text-white font-bold">{bowler.econ}</span>
                            </div>
                          </div>
                        ))}

                      {/* === Extra Stats Inside Bowler Card === */}
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-4">
                          <p className="text-4xl font-bold text-white">{currentInnings?.equations.runrate}</p>
                          <p className="text-gray-400 font-bold text-xl mt-1">Run Rate</p>
                        </div>
                        <div className="p-4">
                          <p className="text-4xl font-bold text-white">{currentInnings?.extra_runs.total}</p>
                          <p className="text-gray-400 font-bold text-xl mt-1">Extras</p>
                        </div>
                        <div className="p-4">
                          <p className="text-4xl font-bold text-white">{currentInnings?.equations.bowlers_used}</p>
                          <p className="text-gray-400 font-bold text-xl mt-1">Bowlers Used</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
              :
              <Card className="relative bg-gradient-to-r from-transparent  to-transparent overflow-hidden rounded-none shadow-none">
                {/* === Full-Background Blended Team Images (with blur) === */}
                <div className="absolute inset-0 z-10 overflow-hidden">
                  <img
                    src={data?.teama.logo_url}
                    alt={data?.teama.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay scale-125 blur-sm"
                  />
                  <img
                    src={data?.teamb.logo_url}
                    alt={data?.teamb.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay scale-125 blur-sm"
                  />
                </div>

                <CardContent className="p-6 text-center space-y-4">
                  <h2 className="text-6xl font-bold tracking-wide bg-gradient-to-r from-gray-100 via-gray-100/30 to-gray-100/5 bg-clip-text text-transparent">
                    Match Will Be Live Soon
                  </h2>
                </CardContent>
              </Card>

            }

          </TabsContent>
          <TabsContent value="batting">
            <div className="space-y-4">
              {data?.innings && data?.innings.length > 0 ? (
                data?.innings?.map((inning, inningNumber) => (
                  <Card key={inning.iid} className="border-slate-700 bg-slate-800/50">
                    <CardHeader className="pb-2 border-b-white/20 border-b">
                      <CardTitle className="text-5xl font-bold text-white -mb-4">
                        {inning.name} — {inning.scores_full}
                      </CardTitle>
                    </CardHeader>
                    {inning.bowlers.length != 0 ?
                      <CardContent>
                        <div className="space-y-2">
                          {inning.batsmen?.map((batsman, batsmanNumber) => {
                            const isBatting = batsman.batting === "true";
                            const isOut = batsman.how_out !== "Not out";

                            return (
                              <div
                                key={batsman.batsman_id}
                                className={`flex items-center justify-between p-3 rounded-md transition ${!isOut && inningNumber == (Number(data?.latest_inning_number) - 1)
                                  ? "bg-gray-700/20 hover:bg-gray-700/60 cursor-pointer"
                                  : isOut
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                  }`}
                                onClick={() => {
                                  if (!isOut && inningNumber == (Number(data?.latest_inning_number) - 1)) {
                                    setBettingPlayer(batsman)
                                    setBettingNumber(batsmanNumber)
                                    setBasePrice(
                                      batsmanNumber < 3
                                        ? 35
                                        : batsmanNumber < 6
                                          ? 30
                                          : 25
                                    )
                                    const current = batsmanNumber < 3
                                      ? 35
                                      : batsmanNumber < 6
                                        ? 30
                                        : 25
                                    setCurrentPlayerPrice(
                                      current
                                      - (Number(batsman.run0) * 0.5)
                                      + (Number(batsman.run1) * 0.75)
                                      + (Number(batsman.run2) * 1.25)
                                      + (Number(batsman.run3) * 2)
                                      + (Number(batsman.fours) * 3)
                                      + (Number(batsman.sixes) * 4.5)
                                    )
                                    setIsBettingModalOpen(true)
                                  }
                                }}
                              >
                                <div>
                                  <h3 className="flex items-center gap-2 text-2xl font-bold text-white">
                                    {batsman.name}
                                    {isBatting && (
                                      <Badge variant="default" className="text-2xl m-0 p-0 text-white">
                                        *
                                      </Badge>
                                    )}
                                  </h3>
                                  <p className="text-sm font-bold text-gray-400">
                                    {batsman.runs} runs in {batsman.balls_faced} balls
                                  </p>
                                  {isOut && (
                                    <p className="text-sm font-bold text-red-400">{batsman.how_out}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-xl font-bold text-white">
                                    SR: {batsman.strike_rate}
                                  </p>
                                  <p className="text-xl font-bold text-gray-400">
                                    {batsman.fours} × 4s, {batsman.sixes} × 6s
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                      :
                      <div className="mb-3">
                        <div className="text-center">
                          <p className="text-gray-400 text-4xl">{data?.live}</p>
                        </div>
                      </div>
                    }
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
          <TabsContent value="bowling">
            <div className="space-y-4">
              {data?.innings && data?.innings.length > 0 ? (
                data?.innings?.map((inning, index) => (
                  <Card key={inning.iid} className="bg-slate-800/50 border-slate-700">
                    <CardHeader className="border-b-white/20 border-b">
                      <CardTitle className="text-white flex items-center gap-5 px-2">
                        <span className="text-5xl">
                          {index == 1 ?
                            `${index + 1}nd Innings`
                            :
                            `${index + 1}st Innings`
                          }
                        </span>
                      </CardTitle>
                    </CardHeader>
                    {inning.bowlers.length != 0 ?
                      <CardContent>
                        <div className="space-y-2">
                          {inning.bowlers.map((bowler) => (
                            <div
                              key={bowler.bowler_id}
                              className="flex items-center justify-between p-2"
                            >
                              <div>
                                <h3 className="text-white font-bold text-2xl flex items-center gap-2">
                                  {bowler.name}
                                  {bowler.bowling === "true" && (
                                    <Badge variant="destructive" className="text-4xl m-0 p-0 text-red-700 animate-pulse">
                                      *
                                    </Badge>
                                  )}
                                </h3>
                                <p className="text-gray-400 text-lg">
                                  {bowler.overs} overs
                                  {Number(bowler.maidens) > 0 ? `, ${bowler.maidens} maidens` : ""}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-white font-bold text-2xl">
                                  {bowler.wickets}/{bowler.runs_conceded}
                                </p>
                                <p className="text-gray-400 text-lg">@ {bowler.econ}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                      :
                      <div className="mb-3">
                        <div className="text-center">
                          <p className="text-gray-400 text-4xl">{data?.live}</p>
                        </div>
                      </div>
                    }
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
          <TabsContent value="partnership">
            <div className="space-y-4">
              {data?.innings && data?.innings.length > 0 && data?.innings?.[Number(data?.latest_inning_number) - 1]?.current_partnership ? (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-2 border-b-white/20 border-b">
                    <CardTitle className="text-white text-5xl flex gap-5 items-center">
                      Current Partnership
                    </CardTitle>
                  </CardHeader>
                  {data.innings[Number(data?.latest_inning_number) - 1].current_partnership.balls != '' ?
                    <CardContent>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="text-center">
                          <p className="text-5xl font-bold text-white">{currentInnings?.current_partnership?.runs}</p>
                          <p className="text-gray-400 text-4xl">Runs</p>
                        </div>
                        <div className="text-center">
                          <p className="text-5xl font-bold text-white">{currentInnings?.current_partnership?.balls}</p>
                          <p className="text-gray-400 text-4xl">Balls</p>
                        </div>
                        <div className="text-center">
                          <p className="text-5xl font-bold text-white">{currentInnings?.current_partnership?.overs}</p>
                          <p className="text-gray-400 text-4xl">Overs</p>
                        </div>
                      </div>
                      <Separator className="my-7 bg-white" />
                      <div className="space-y-1">
                        {currentInnings?.current_partnership?.batsmen?.map((batsman: any, index: number) => (
                          <div key={index} className="flex justify-between items-center font-bold text-3xl">
                            <span className="text-white">{batsman.name}</span>
                            <span className="text-gray-400">
                              {batsman.runs} in {batsman.balls}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    :
                    <div className="mb-3">
                      <div className="text-center">
                        <p className="text-gray-400 text-4xl">{data?.live}</p>

                      </div>
                    </div>
                  }
                </Card>
              ) : (
                <Card className="bg-slate-800/50">
                  <CardContent>
                    <div className="p-2 text-center">
                      <p className="text-gray-300 text-3xl font-bold">Match Is Not Started Yet</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Fall of Wickets - Compact */}
              {currentInnings?.fows && currentInnings.fows.length > 0 && (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-5xl">Fall of Wickets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {currentInnings.fows.map((wicket: any, index: any) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-2"
                        >
                          <div>
                            <span className="text-white font-bold text-2xl">{wicket.name}</span>
                            <p className="text-gray-400 text-2xl">{wicket.how_out}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-white font-bold text-4xl">
                              {wicket.score_at_dismissal}/{wicket.number}
                            </span>
                            <p className="text-gray-400 text-xl">({wicket.overs_at_dismissal} ov)</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          <TabsContent value="squad">
            <div className="space-y-4">
              {data?.players && data.players.length > 0 ? (
                Array.from(new Set(data.players.map((p) => p.nationality))).map((nationality) => (
                  <Card key={nationality} className="shadow-none bg-slate-800/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white text-4xl flex items-center gap-2">
                        {nationality}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 -mt-5">
                        {data.players.filter((player) => player.nationality === nationality).map((player) => (
                          <div
                            key={player.pid}
                            className="bg-gradient-to-br from-[#19317b]/30 via-[#2c256c]/20 to-[#4b1577]/10 rounded-lg p-4 hover:from-[#19317b]/40 hover:via-[#2c256c]/30 hover:to-[#4b1577]/20 duration-500 cursor-pointer transform transition-all hover:scale-102 "
                            onClick={() => {
                              setSelectedPlayer(player as any)
                              setIsPlayerModalOpen(true)
                            }}
                          >
                            <div className="space-y-1">
                              <div className="flex items-start justify-between">
                                <h3 className="text-white font-bold text-md">
                                  {player.first_name} {player.last_name}
                                </h3>
                                <Badge
                                  variant="outline"
                                  className={`text-sm ${getRoleColor(player.playing_role)} text-white border-0 font-extrabold`}
                                >
                                  {player.playing_role.toUpperCase() == "BAT" ? "Batsman" : player.playing_role.toUpperCase() == "BOWL" ? "Bowler" : player.playing_role.toUpperCase() == "ALL" ? "All Rounder" : player.playing_role.toUpperCase() == "WK" ? "Wicket Keeper" : "Player"}
                                </Badge>
                              </div>
                              <p className="text-gray-400 text-sm font-bold">{player.short_name}</p>
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                <span className="text-yellow-400 text-sm font-bold">{player.fantasy_player_rating}/10</span>
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
          <TabsContent value="match-notes">
            {data?.match_notes && data?.match_notes.length > 0 ? (
              <Card className="bg-slate-800/50">
                <CardHeader className="-mb-2 border-b border-b-white/20">
                  <CardTitle className="text-white text-4xl flex items-center gap-2 py-2">
                    <BarChart3 className="w-10 h-10" />
                    Match Commentary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {formatMatchNotes(matchNotesNormalized).map((note, index) => (
                      <div
                        key={index}
                        className="p-2"
                      >
                        <p className="text-gray-300 text-md font-bold">{note}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-slate-800/50">
                <CardHeader className="-mb-2 border-b border-b-white/20">
                  <CardTitle className="text-white text-4xl flex items-center gap-2 py-2">
                    <BarChart3 className="w-10 h-10" />
                    Match Commentary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="p-2 text-center">
                      <p className="text-gray-300 text-3xl font-bold">Match Is Not Started Yet</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="report">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 lg:gap-14 py-4">
              {/* Venue */}
              <div className="p-5 sm:p-7 flex flex-col h-full">
                <h4 className="flex items-center gap-3 text-white font-semibold text-xl sm:text-2xl md:text-3xl mb-3">
                  <MapPin className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400" />
                  <span className="truncate">Venue</span>
                </h4>
                {data?.venue && typeof data.venue === "object" ? (
                  <div className="text-gray-300 text-base sm:text-lg md:text-xl leading-relaxed space-y-1">
                    {Object.entries(data.venue)
                      .filter(([key, value]) => !!value && key !== "timezone" && key !== "venue_id")
                      .map(([key, value]) => (
                        <p key={key} className="flex flex-wrap items-center">
                          <span className="font-semibold text-white mr-1">
                            {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}:
                          </span>
                          <span className="truncate">{typeof value === "string" || typeof value === "number" ? value : ""}</span>
                        </p>
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-base sm:text-lg md:text-xl">No venue data found</p>
                )}
              </div>
              {/* Weather */}
              <div className="p-5 sm:p-7 flex flex-col h-full">
                <h4 className="flex items-center gap-3 text-white font-semibold text-xl sm:text-2xl md:text-3xl mb-3">
                  <Thermometer className="w-7 h-7 sm:w-8 sm:h-8 text-orange-400" />
                  <span className="truncate">Weather</span>
                </h4>
                {data?.weather && typeof data.weather === "object" && !!data.weather.weather_desc ? (
                  <div className="text-gray-300 text-base sm:text-lg md:text-xl leading-relaxed space-y-1">
                    {typeof data.weather.weather_desc === "string" && data.weather.weather_desc.trim().length > 0 && (() => {
                      const words = data.weather.weather_desc.split(" ");
                      if (words.length >= 2) {
                        const first = words[0];
                        const second = words[1];
                        return (
                          <p>
                            {first.charAt(0).toUpperCase() + first.slice(1)}{" "}
                            {second.charAt(0).toUpperCase() + second.slice(1)}
                          </p>
                        );
                      } else {
                        return <p>{data.weather.weather_desc}</p>;
                      }
                    })()}
                    <div className="space-y-1">
                      {typeof data.weather.temp !== "undefined" && data.weather.temp !== null && (
                        <p>
                          <span className="font-semibold text-white">Temperature:</span>{" "}
                          {String(data.weather.temp)}°C
                        </p>
                      )}
                      {data.weather.wind_speed && (
                        <p>
                          <span className="font-semibold text-white">Wind:</span> {data.weather.wind_speed} km/h
                        </p>
                      )}
                      {data.weather.humidity && (
                        <p>
                          <span className="font-semibold text-white">Humidity:</span> {data.weather.humidity}%
                        </p>
                      )}
                      {data.weather.clouds && (
                        <p>
                          <span className="font-semibold text-white">Clouds:</span> {data.weather.clouds}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 text-base sm:text-lg md:text-xl">No weather data found</p>
                )}
              </div>
              {/* Pitch */}
              <div className="p-5 sm:p-7 flex flex-col h-full">
                <h4 className="flex items-center gap-3 text-white font-semibold text-xl sm:text-2xl md:text-3xl mb-3">
                  <Droplets className="w-7 h-7 sm:w-8 sm:h-8 text-blue-400" />
                  <span className="truncate">Pitch</span>
                </h4>
                {data?.pitch && typeof data.pitch === "object" && (
                  data.pitch.pitch_condition ||
                  data.pitch.batting_condition ||
                  data.pitch.pace_bowling_condition ||
                  data.pitch.spine_bowling_condition
                ) ? (
                  <div className="text-gray-300 text-base sm:text-lg md:text-xl leading-relaxed space-y-1">
                    {data.pitch.pitch_condition && (
                      <p>{data.pitch.pitch_condition}</p>
                    )}
                    {data.pitch.batting_condition && (
                      <p>
                        <span className="font-semibold text-white">Batting:</span> {data.pitch.batting_condition}
                      </p>
                    )}
                    {data.pitch.pace_bowling_condition && (
                      <p>
                        <span className="font-semibold text-white">Pace Bowling:</span> {data.pitch.pace_bowling_condition}
                      </p>
                    )}
                    {data.pitch.spine_bowling_condition && (
                      <p>
                        <span className="font-semibold text-white">Spin Bowling:</span> {data.pitch.spine_bowling_condition}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 text-base sm:text-lg md:text-xl">No pitch data found</p>
                )}
              </div>
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
          <div className="fixed inset-0 z-50 w-full h-full flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-gradient-to-br from-gray-900/90 via-gray-900/90 to-gray-900 p-8 shadow-2xl transition-all duration-300">
              {/* === Header === */}
              <div className="mb-6 flex items-center justify-between">
                <img
                  src={data?.teama?.team_id == data?.innings?.[Number(data?.latest_inning_number) - 1]?.batting_team_id ? data?.teama?.logo_url : data?.teamb?.logo_url}
                  alt={data?.teama?.team_id == data?.innings?.[Number(data?.latest_inning_number) - 1]?.batting_team_id ? data?.teama?.name : data?.teamb?.name}
                  className="w-20 h-20 rounded-full shadow-xl"
                />
                <h2 className="text-4xl flex items-center gap-4 font-extrabold text-white">
                  {bettingPlayer.name}
                  <span className="text-sm text-gray-600 capitalize">{bettingPlayer.position}</span>
                </h2>
                <button
                  onClick={() => {
                    setIsBettingModalOpen(false);
                    setBettingPlayer(null);
                  }}
                  className="text-gray-400 transition-colors hover:text-white text-xl cursor-pointer"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {/* === Stats === */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                <div className="bg-gray-800/40 rounded-lg p-4">
                  <p className="text-2xl font-bold text-white">{bettingPlayer.runs}</p>
                  <p className="text-sm font-bold text-gray-400">Runs</p>
                </div>
                <div className="bg-gray-800/40 font-bold rounded-lg p-4">
                  <p className="text-2xl font-bold text-white">{bettingPlayer.balls_faced}</p>
                  <p className="text-sm text-gray-400">Balls</p>
                </div>
                <div className="bg-gray-800/40 font-bold rounded-lg p-4">
                  <p className="text-2xl font-bold text-white">{Number(bettingPlayer.strike_rate)}</p>
                  <p className="text-sm text-gray-400">Strike Rate</p>
                </div>
                <div className="bg-gray-800/40 font-bold rounded-lg p-4">
                  <p className="text-2xl font-bold text-white">{bettingPlayer.fours}</p>
                  <p className="text-sm text-gray-400">Fours</p>
                </div>
                <div className="bg-gray-800/40 font-bold rounded-lg p-4">
                  <p className="text-2xl font-bold text-white">{bettingPlayer.sixes}</p>
                  <p className="text-sm text-gray-400">Sixes</p>
                </div>
                <div className="bg-gray-800/40 font-bold rounded-lg p-4">
                  <p className="text-2xl font-bold text-white">
                    {bettingPlayer.balls_faced && Number(bettingPlayer.balls_faced) > 0
                      ? `${Math.round((Number(bettingPlayer.run0) / Number(bettingPlayer.balls_faced)) * 100)}`
                      : "N/A"}
                  </p>
                  <p className="text-sm font-bold text-gray-400">Dot %</p>
                </div>
                <div className="bg-gray-800/40 font-bold rounded-lg p-4">
                  <p className="text-2xl font-bold text-white">₹{basePrice}</p>
                  <p className="text-sm text-gray-400">Base Price</p>
                </div>

                <div className="bg-gray-800/40 font-bold rounded-lg p-4">
                  <p className="text-2xl font-bold text-white">₹{currentPlayerPrice}</p>
                  <p className="text-sm text-gray-400">Current Price</p>
                </div>
              </div>
              {/* === Quantity Selector === */}
              <div className="mt-8">
                <label className="block mb-2 text-sm font-bold text-gray-300">Select Quantity</label>
                <div className="flex gap-1.5 flex-wrap">
                  {[1, 5, 10, 15, 20, 25, 30, 35].map((qty) => (
                    <button
                      key={qty}
                      onClick={() => setQuantity(qty)}
                      className={`px-[16.7px] py-2 rounded-lg text-white font-bold transition-all cursor-pointer ${quantity === qty
                        ? "bg-green-600 border-green-700"
                        : "bg-gray-800 hover:bg-gray-700"
                        }`}
                    >
                      {qty}
                    </button>
                  ))}
                </div>
              </div>
              {/* === CTA Buttons === */}
              <div className="mt-8 flex flex-col md:flex-row gap-4">
                <button
                  className="flex-1 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold py-3 text-lg shadow-md transition cursor-pointer"
                  onClick={async () => {
                    const statusNote = data?.status_note.toLowerCase() || "";
                    const isMatchOver = ["won", "loss", "draw", "tie", "abandoned", "no result", "ended", "finished", "completed"].some(word => statusNote.includes(word));
                    if (isMatchOver) {
                      toast.info("Match is not LIVE");
                      return;
                    }
                    const buyingResponse = await buyPlayer(bettingPlayer, String(currentPlayerPrice), String(quantity), match_id)
                    toast.success(buyingResponse.message)
                  }}
                >
                  Buy Player
                </button>
                <button
                  className="flex-1 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold py-3 text-lg shadow-md transition cursor-pointer"
                  onClick={async () => {
                    const statusNote = data?.status_note.toLowerCase() || "";
                    const isMatchOver = ["won", "loss", "draw", "tie", "abandoned", "no result", "ended", "finished", "completed"].some(word => statusNote.includes(word));
                    if (isMatchOver) {
                      toast.info("Match is not LIVE");
                      return;
                    }
                    const sellingResponse = await sellPlayer(bettingPlayer, String(currentPlayerPrice), String(quantity), match_id)
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

        {data?.umpires != "" ? (
          <Card className="bg-gradient-to-r via-sky-700/70 from-transparent to-transparent">
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-3xl">
                <div>
                  <h4 className="text-white font-bold mb-1">Umpires</h4>
                  <p className="text-white/60 font-bold text-lg">{data?.umpires || "No data found"}</p>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">Match Referee</h4>
                  <p className="text-white/60 font-bold text-lg">{data?.referee || "No data found"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div >
  )
}

