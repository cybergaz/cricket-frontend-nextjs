"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Target,
    TrendingUp,
    Users,
    MapPin,
    Thermometer,
    Droplets,
    BarChart3,
    HardHat,
    Radio,
    Files,
} from "lucide-react"
import type { CricketMatchData } from "../types"
import { Loading } from "./Loading"
import MatchStartTimer from "./match-start-timer"
import { redirect } from "next/navigation"


export default function YetToStart({ matchId }: { matchId: String }) {
    const [data, setData] = useState<CricketMatchData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                            {data?.competition?.title || "No match data founds"}
                        </h1>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 text-white">
                        {data ? (
                            <>
                                <div className="flex items-center gap-4 group cursor-pointer">
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
                                <div className="flex items-center gap-4 group cursor-pointer">
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
                                onComplete={() => {
                                    redirect("/live-matches")
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Tabs always render, but content is conditional */}
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
                        <TabsTrigger
                            value="report"
                            className="mx-2 flex items-center cursor-pointer rounded-2xl justify-center gap-1 text-xl font-bold py-3 transition-colors duration-300 data-[state=active]:bg-white data-[state=active]:text-sky-600 hover:bg-white/40"
                        >
                            <BarChart3 className="w-4 h-4 md:w-5 md:h-5" />
                            Report
                        </TabsTrigger>
                    </TabsList>
                    {/* Live Tab */}
                    <TabsContent value="live" className="space-y-6 mt-6">
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

            </div>
        </div>
    )
}

