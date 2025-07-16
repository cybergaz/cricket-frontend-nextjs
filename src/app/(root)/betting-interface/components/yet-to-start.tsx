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
    Zap,
    MapPin,
    Thermometer,
    Trophy,
    Calendar,
    Activity,
    Clock,
    Sun,
    Droplets,
    BarChart3,
    Timer,
    Star,
    Award,
    HardHat,
    Radio,
    Files,
} from "lucide-react"
import type { CricketMatchData, Player, BettingPlayer, MatchScorecardProps, Team, BettingTeam } from "../types"
import { getRoleColor, formatMatchNotes, buyPlayer, sellPlayer, buyTeam, sellTeam } from "../services"
import { toast } from "sonner"
import { Loading } from "./Loading"
import MatchStartTimer from "./match-start-timer"


export default function YetToStart({ matchId }: { matchId: String }) {
    // Fetch match data from backend
    const [data, setData] = useState<CricketMatchData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    function formatDateTime(dateStr: string) {
        if (!dateStr) return "-";
        // Replace space with T for ISO compatibility
        const isoStr = dateStr.replace(" ", "T");
        const date = new Date(isoStr);
        return date.toLocaleString("en-IN", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/cricket/match/${matchId}`);
                const res_data = await res.json();
                setData(res_data.data.response);
            } catch (e) {
                setError("Failed to fetch match data");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

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
    const [teamQuantity, setTeamQuantity] = useState(1);
    const [teamPrice, setTeamPrice] = useState(0);


    // Defensive: fallback values if no data
    const match_id = data && data.match_id ? data.match_id : "";
    const currentInnings = data && data.innings && data.innings.length > 0 ? data.innings[data.innings.length - 1] : null;
    const battingTeam = currentInnings && data?.teama && data?.teamb ? (currentInnings.batting_team_id === data.teama.team_id ? data.teama : data.teamb) : null;
    const bowlingTeam = currentInnings && data?.teama && data?.teamb ? (currentInnings.batting_team_id === data.teama.team_id ? data.teamb : data.teama) : null;
    const matchNotesNormalized: string[][] = data && data.match_notes ? (Array.isArray(data.match_notes?.[0]) ? data.match_notes as unknown as string[][] : [[data.match_notes as string]]) : [[]];
    const basePrice =
        bettingNumber < 3
            ? 35
            : bettingNumber < 6
                ? 30
                : 25;


    if (isLoading && !data) {
        return <Loading />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-600 via-transparent to-transparent">
            <div className="container mx-auto px-3 py-4 space-y-4">
                {/* Status Note */}
                {data?.status_note && (
                    <div className="fixed top-23 left-1/2 transform -translate-x-1/2 z-50 flex justify-center w-full px-4">
                        <div className="pr-5 pl-3 py-3 rounded-full bg-[#7c8fa4] text-white text-base md:text-xl font-bold shadow-lg flex items-center gap-2">
                            <span className="text-red-500 text-shadow-sm bg-white px-4 rounded-4xl animate-pulse">Live</span>
                            <span className="whitespace-nowrap">{data.status_note}</span>
                        </div>
                    </div>
                )}

                {/* Title & Teams */}
                <div className="text-center mb-4 mt-14">
                    <div className="flex items-center justify-center mb-10 gap-4">
                        <h1 className="text-6xl font-bold">
                            {data?.competition?.title || "No match data found"}
                        </h1>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 text-white">
                        {data ? (
                            <>
                                <div className="flex items-center gap-4 group cursor-pointer" onClick={() => { if (data.teama) { setSelectedTeam(data.teama); setIsTeamModalOpen(true); } }}>
                                    <img
                                        src={data.teama?.logo_url || "/placeholder.svg?height=48&width=48"}
                                        alt={data.teama?.name ?? "Team A"}
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
                            <span className="text-gray-400 text-2xl">No team data found</span>
                        )}
                    </div>
                    <div className="flex flex-col items-center gap-2 mt-2">
                        <div className="text-base text-gray-300">
                            <MatchStartTimer
                                startTime={data?.date_start_ist}
                                // startTime={new Date(Date.now() + 5000).toISOString()}
                                onComplete={() => {
                                    toast.success("The match has started! Good luck");
                                    setTimeout(() => {
                                        window.location.reload();
                                    }, 3000);
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Tabs always render, but content is conditional */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-10">
                    <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 overflow-visible mb-5">
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
                            value="players"
                            className="mx-2 flex items-center cursor-pointer rounded-2xl justify-center gap-1 text-xl font-bold py-3 transition-colors duration-300 data-[state=active]:bg-white data-[state=active]:text-sky-600 hover:bg-white/40"
                        >
                            <Users className="w-4 h-4 md:w-5 md:h-5" />
                            Players
                        </TabsTrigger>

                        <TabsTrigger
                            value="match-notes"
                            className="mx-2 flex items-center cursor-pointer rounded-2xl justify-center gap-1 text-xl font-bold py-3 transition-colors duration-300 data-[state=active]:bg-white data-[state=active]:text-sky-600 hover:bg-white/40"
                        >
                            <Files className="w-4 h-4 md:w-5 md:h-5" />
                            Commentary
                        </TabsTrigger>
                    </TabsList>
                    {/* Live Tab */}
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
                            <Card className="bg-gradient-to-r via-sky-700 from-transparent to-transparent rounded-none shadow-none overflow-hidden">
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
                                                ?.filter((batsman) => batsman.batting === "true")
                                                .map((batsman) => (
                                                    <div
                                                        key={batsman.batsman_id}
                                                        className="p-4"
                                                    >
                                                        <div className="flex justify-between items-center mb-2">
                                                            <h3 className="text-2xl font-bold text-white">{batsman.name}</h3>
                                                            <Badge variant={batsman.position === "striker" ? "default" : "secondary"} className="text-md font-bold">
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
                                                ?.filter((bowler) => bowler.bowling === "true")
                                                .map((bowler) => (
                                                    <div
                                                        key={bowler.bowler_id}
                                                        className="p-4"
                                                    >
                                                        <div className="flex justify-between items-center mb-2">
                                                            <h3 className="text-lg font-bold text-white">{bowler.name}</h3>
                                                            <Badge variant="destructive" className="text-md font-bold">Bowling</Badge>
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
                            <div className="mb-3">
                                <div className="text-center">
                                    <p className="text-gray-400 text-4xl">{data?.live || "Data not found"}</p>
                                </div>
                            </div>
                        }
                    </TabsContent>
                    <TabsContent value="batting">
                        <div className="space-y-4">
                            {data &&
                                <Card className="bg-slate-800/50">
                                    <CardHeader className="-mb-2 border-b border-b-white/20">
                                        <CardTitle className="text-white text-4xl flex items-center gap-2 py-2">
                                            <HardHat className="w-10 h-10" />
                                            Batting
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div
                                                className="p-2"
                                            >
                                                <p className="text-gray-300 text-3xl font-bold">Match Is Not Started Yet</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            }
                        </div>
                    </TabsContent>
                    <TabsContent value="bowling">
                        <div className="space-y-4">
                            {data &&
                                <Card className="bg-slate-800/50">
                                    <CardHeader className="-mb-2 border-b border-b-white/20">
                                        <CardTitle className="text-white text-4xl flex items-center gap-2 py-2">
                                            <Target className="w-10 h-10" />
                                            Bowling
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div
                                                className="p-2"
                                            >
                                                <p className="text-gray-300 text-3xl font-bold">Match Is Not Started Yet</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            }                        </div>
                    </TabsContent>
                    <TabsContent value="partnership">
                        <div className="space-y-4">
                            {data &&
                                <Card className="bg-slate-800/50">
                                    <CardHeader className="-mb-2 border-b border-b-white/20">
                                        <CardTitle className="text-white text-4xl flex items-center gap-2 py-2">
                                            <TrendingUp className="w-10 h-10" />
                                            Partnership
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div
                                                className="p-2"
                                            >
                                                <p className="text-gray-300 text-3xl font-bold">Match Is Not Started Yet</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            }
                        </div>
                    </TabsContent>
                    <TabsContent value="players">
                        <div className="space-y-4">
                            {data &&
                                <Card className="bg-slate-800/50">
                                    <CardHeader className="-mb-2 border-b border-b-white/20">
                                        <CardTitle className="text-white text-4xl flex items-center gap-2 py-2">
                                            <Users className="w-10 h-10" />
                                            Players
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div
                                                className="p-2"
                                            >
                                                <p className="text-gray-300 text-3xl font-bold">Match Is Not Started Yet</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            }
                        </div>
                    </TabsContent>
                    <TabsContent value="match-notes">
                        {
                            <Card className="bg-slate-800/50">
                                <CardHeader className="-mb-2 border-b border-b-white/20">
                                    <CardTitle className="text-white text-4xl flex items-center gap-2 py-2">
                                        <BarChart3 className="w-10 h-10" />
                                        Match Commentary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div
                                            className="p-2"
                                        >
                                            <p className="text-gray-300 text-3xl font-bold">Match Is Not Started Yet</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        }
                    </TabsContent>
                </Tabs>




                {data?.umpires &&
                    <Card className="bg-gradient-to-r via-sky-700/70 from-transparent to-transparent">
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-3xl">
                                <div>
                                    <h4 className="text-white font-bold mb-1">Umpires</h4>
                                    <p className="text-white/60 font-bold text-lg">{data?.umpires || "Data not found"}</p>
                                </div>
                                <div>
                                    <h4 className="text-white font-bold mb-1">Match Referee</h4>
                                    <p className="text-white/60 font-bold text-lg">{data?.referee || "Data not found"}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                }

                <div className="w-full flex justify-center mb-12">
                    <Card className="w-full bg-gradient-to-r via-sky-700/70 from-transparent to-transparent rounded-3xl">
                        <CardContent className="px-6 py-2">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                {/* Venue */}
                                <div className="space-y-4">
                                    <h4 className="flex items-center gap-3 text-white font-semibold text-2xl md:text-3xl">
                                        <MapPin className="w-8 h-8 text-emerald-400" />
                                        Venue
                                    </h4>
                                    <div className="text-gray-300 text-lg md:text-xl leading-relaxed">
                                        {data?.venue && typeof data.venue === "object"
                                            ? Object.entries(data.venue)
                                                .filter(([key, value]) => !!value && key !== "timezone")
                                                .map(([key, value]) => (
                                                    <p key={key}>
                                                        <span className="font-semibold text-white">
                                                            {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                                                        </span>{" "}
                                                        {typeof value === "string" || typeof value === "number" ? value : ""}
                                                    </p>
                                                ))
                                            : <p>Data not found</p>
                                        }
                                    </div>
                                </div>

                                {/* Weather */}
                                {data?.weather && typeof data.weather === "object" && !!data.weather.weather_desc && (
                                    <div className="space-y-4">
                                        <h4 className="flex items-center gap-3 text-white font-semibold text-2xl md:text-3xl">
                                            <Thermometer className="w-8 h-8 text-orange-400" />
                                            Weather
                                        </h4>
                                        <div className="text-gray-300 text-lg md:text-xl leading-relaxed">
                                            {typeof data.weather.weather_desc === "string" && data.weather.weather_desc.trim().length > 0 && (() => {
                                                // Defensive split for hydration error proofing
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
                                            <div>
                                                {typeof data.weather.temp !== "undefined" && data.weather.temp !== null && (
                                                    <p>
                                                        <span className="font-semibold text-white">Temperature</span>{" "}
                                                        {String(data.weather.temp)}°C
                                                    </p>
                                                )}
                                                {data.weather.wind_speed && (
                                                    <p>
                                                        <span className="font-semibold text-white">Wind</span> {data.weather.wind_speed}km/h
                                                    </p>
                                                )}
                                                {data.weather.humidity && (
                                                    <p>
                                                        <span className="font-semibold text-white">Humidity</span> {data.weather.humidity}%
                                                    </p>
                                                )}
                                                {data.weather.clouds && (
                                                    <p>
                                                        <span className="font-semibold text-white">Clouds</span> {data.weather.clouds}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Pitch */}
                                {data?.pitch && typeof data?.pitch === "object" && (
                                    (data?.pitch?.pitch_condition ||
                                        data?.pitch?.batting_condition ||
                                        data?.pitch?.pace_bowling_condition ||
                                        data?.pitch?.spine_bowling_condition) && (
                                        <div className="space-y-4">
                                            <h4 className="flex items-center gap-3 text-white font-semibold text-2xl md:text-3xl">
                                                <Droplets className="w-8 h-8 text-blue-400" />
                                                Pitch
                                            </h4>
                                            <div className="text-gray-300 text-lg md:text-xl leading-relaxed">
                                                {data?.pitch?.pitch_condition && (
                                                    <p>{data?.pitch?.pitch_condition}</p>
                                                )}
                                                {data?.pitch?.batting_condition && (
                                                    <p>
                                                        <span className="font-semibold text-white">Batting</span> {data?.pitch?.batting_condition}
                                                    </p>
                                                )}
                                                {data?.pitch?.pace_bowling_condition && (
                                                    <p>
                                                        <span className="font-semibold text-white">Pace Bowling</span> {data?.pitch?.pace_bowling_condition}
                                                    </p>
                                                )}
                                                {data?.pitch?.spine_bowling_condition && (
                                                    <p>
                                                        <span className="font-semibold text-white">Spin Bowling</span> {data?.pitch?.spine_bowling_condition}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

