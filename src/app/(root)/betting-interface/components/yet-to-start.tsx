"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
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

export default function YetToStart({ matchId }: { matchId: string }) {
  const [data, setData] = useState<CricketMatchData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/cricket/match/${matchId}`)
        const res_data = await res.json()
        setData(res_data.data.response)
      } catch (e) {
        setError("Failed to fetch match data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const [activeTab, setActiveTab] = useState<string>("live")

  if (isLoading && !data) {
    return <Loading />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-600 via-transparent to-transparent">
      <div className="container mx-auto px-3 py-4 space-y-4 max-w-full overflow-x-hidden">
        {/* Status Note */}
        {data?.status_note && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 flex justify-center w-full px-4">
            <div className="pr-3 pl-3 py-2 rounded-full bg-[#7c8fa4] text-white text-sm md:text-base lg:text-xl font-bold shadow-lg flex items-center gap-2 max-w-[90vw]">
              <span className="text-red-500 bg-white px-2 md:px-4 rounded-full animate-pulse text-xs md:text-sm">
                Live
              </span>
              <span className="whitespace-nowrap truncate">{data.status_note}</span>
            </div>
          </div>
        )}

        {/* Title & Teams */}
        <div className="text-center mb-4 mt-14">
          <div className="flex items-center justify-center mb-6 md:mb-10 gap-4">
            <h1 className="text-2xl md:text-4xl lg:text-6xl font-bold text-white px-4">
              {data?.competition?.title || "No match data found"}
            </h1>
          </div>

          <div className="flex items-center justify-center gap-4 sm:gap-8 md:gap-12 text-white px-4">
            {data ? (
              <>
                {/* Team A */}
                <div className="flex items-center gap-2 md:gap-4 group cursor-pointer">
                  <img
                    src={data.teama?.logo_url}
                    alt={data.teama?.name ?? "Team A"}
                    className="w-20 h-20 rounded-full shadow-lg backdrop-blur-md hover:scale-105 transition-transform duration-500"
                  />
                  {/* Hide font on small, show large font on large */}
                  <div className="hidden lg:block text-left">
                    <span className="text-3xl xl:text-4xl font-extrabold block">
                      {String(data?.teama?.name ?? "").toLocaleUpperCase()}
                    </span>
                    <span className="text-lg xl:text-xl text-sky-400 font-bold block">
                      {data?.teama?.scores_full || "Yet to bat"}
                    </span>
                  </div>
                </div>

                <span className="text-2xl md:text-3xl font-extrabold text-sky-400 animate-pulse">VS</span>

                {/* Team B */}
                <div className="flex items-center gap-2 md:gap-4 group cursor-pointer">
                  {/* Hide font on small, show large font on large */}
                  <div className="hidden lg:block text-right">
                    <span className="text-3xl xl:text-4xl font-extrabold block">
                      {String(data?.teamb?.name ?? "").toLocaleUpperCase()}
                    </span>
                    <span className="text-lg xl:text-xl text-gray-500 font-bold block">
                      {data?.teamb?.scores_full || "Yet to bat"}
                    </span>
                  </div>
                  <img
                    src={data?.teamb?.logo_url}
                    alt={data?.teamb?.name ?? "Team B"}
                    className="w-20 h-20 rounded-full shadow-lg backdrop-blur-md hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </>
            ) : (
              <span className="text-gray-400 text-xl md:text-2xl">No team data found</span>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 mt-4">
            <div className="text-sm md:text-base text-gray-300">
              <MatchStartTimer
                startTime={data?.date_start_ist}
              // onComplete={() => { redirect("/live-matches") }}
              />
            </div>
          </div>
        </div>

        {/* Tabs - Responsive Design */}
        <div className="w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-6 md:mt-10">
            {/* Scrollable Tabs List */}
            <div className="relative mb-4 md:mb-6">
              <TabsList className="flex w-full overflow-x-auto scrollbar-hide bg-transparent p-0 h-auto gap-1 md:gap-2">
                <TabsTrigger
                  value="live"
                  className="flex items-center justify-center gap-1 md:gap-2 text-sm md:text-base lg:text-lg font-bold py-2 md:py-3 px-3 md:px-4 transition-colors duration-300 data-[state=active]:bg-white data-[state=active]:text-sky-600 hover:bg-white/40 rounded-xl whitespace-nowrap flex-shrink-0"
                >
                  <Radio className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5" />
                  Live
                </TabsTrigger>

                <TabsTrigger
                  value="batting"
                  className="flex items-center justify-center gap-1 md:gap-2 text-sm md:text-base lg:text-lg font-bold py-2 md:py-3 px-3 md:px-4 transition-colors duration-300 data-[state=active]:bg-white data-[state=active]:text-sky-600 hover:bg-white/40 rounded-xl whitespace-nowrap flex-shrink-0"
                >
                  <HardHat className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5" />
                  Batting
                </TabsTrigger>

                <TabsTrigger
                  value="bowling"
                  className="flex items-center justify-center gap-1 md:gap-2 text-sm md:text-base lg:text-lg font-bold py-2 md:py-3 px-3 md:px-4 transition-colors duration-300 data-[state=active]:bg-white data-[state=active]:text-sky-600 hover:bg-white/40 rounded-xl whitespace-nowrap flex-shrink-0"
                >
                  <Target className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5" />
                  Bowling
                </TabsTrigger>

                <TabsTrigger
                  value="partnership"
                  className="flex items-center justify-center gap-1 md:gap-2 text-sm md:text-base lg:text-lg font-bold py-2 md:py-3 px-3 md:px-4 transition-colors duration-300 data-[state=active]:bg-white data-[state=active]:text-sky-600 hover:bg-white/40 rounded-xl whitespace-nowrap flex-shrink-0"
                >
                  <TrendingUp className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5" />
                  Partnership
                </TabsTrigger>

                <TabsTrigger
                  value="players"
                  className="flex items-center justify-center gap-1 md:gap-2 text-sm md:text-base lg:text-lg font-bold py-2 md:py-3 px-3 md:px-4 transition-colors duration-300 data-[state=active]:bg-white data-[state=active]:text-sky-600 hover:bg-white/40 rounded-xl whitespace-nowrap flex-shrink-0"
                >
                  <Users className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5" />
                  Players
                </TabsTrigger>

                <TabsTrigger
                  value="match-notes"
                  className="flex items-center justify-center gap-1 md:gap-2 text-sm md:text-base lg:text-lg font-bold py-2 md:py-3 px-3 md:px-4 transition-colors duration-300 data-[state=active]:bg-white data-[state=active]:text-sky-600 hover:bg-white/40 rounded-xl whitespace-nowrap flex-shrink-0"
                >
                  <Files className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5" />
                  Commentary
                </TabsTrigger>

                <TabsTrigger
                  value="report"
                  className="flex items-center justify-center gap-1 md:gap-2 text-sm md:text-base lg:text-lg font-bold py-2 md:py-3 px-3 md:px-4 transition-colors duration-300 data-[state=active]:bg-white data-[state=active]:text-sky-600 hover:bg-white/40 rounded-xl whitespace-nowrap flex-shrink-0"
                >
                  <BarChart3 className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5" />
                  Report
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Contents */}
            <div className="w-full">
              {/* Live Tab */}
              <TabsContent value="live" className="space-y-6 mt-6">
                <Card className="relative bg-gradient-to-r from-transparent to-transparent overflow-hidden rounded-none shadow-none">
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
                  <CardContent className="p-4 md:p-6 text-center space-y-4 relative z-20">
                    <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold tracking-wide bg-gradient-to-r from-gray-100 via-gray-100/30 to-gray-100/5 bg-clip-text text-transparent">
                      Match Will Be Live Soon
                    </h2>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Other Tabs with Same Content */}
              {["batting", "bowling", "partnership", "players", "match-notes"].map((tabValue) => (
                <TabsContent key={tabValue} value={tabValue}>
                  <div className="space-y-4 mt-6">
                    {data && (
                      <Card className="relative bg-gradient-to-r from-transparent to-transparent overflow-hidden rounded-none shadow-none">
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
                        <CardContent className="p-4 md:p-6 text-center space-y-4 relative z-20">
                          <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold tracking-wide bg-gradient-to-r from-gray-100 via-gray-100/30 to-gray-100/5 bg-clip-text text-transparent">
                            Match Will Be Live Soon
                          </h2>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              ))}

              {/* Report Tab */}
              <TabsContent value="report">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 py-4 mt-6">
                  {/* Venue */}
                  <div className="p-4 md:p-6 flex flex-col h-full">
                    <h4 className="flex items-center gap-2 md:gap-3 text-white font-semibold text-lg md:text-xl lg:text-2xl mb-3">
                      <MapPin className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-emerald-400 flex-shrink-0" />
                      <span className="truncate">Venue</span>
                    </h4>
                    {data?.venue && typeof data.venue === "object" ? (
                      <div className="text-gray-300 text-sm md:text-base lg:text-lg leading-relaxed space-y-1">
                        {Object.entries(data.venue)
                          .filter(([key, value]) => !!value && key !== "timezone" && key !== "venue_id")
                          .map(([key, value]) => (
                            <p key={key} className="flex flex-col sm:flex-row sm:items-center break-words">
                              <span className="font-semibold text-white mr-1">
                                {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}:
                              </span>
                              <span className="break-words">
                                {typeof value === "string" || typeof value === "number" ? value : ""}
                              </span>
                            </p>
                          ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm md:text-base lg:text-lg">No venue data found</p>
                    )}
                  </div>

                  {/* Weather */}
                  <div className="p-4 md:p-6 flex flex-col h-full">
                    <h4 className="flex items-center gap-2 md:gap-3 text-white font-semibold text-lg md:text-xl lg:text-2xl mb-3">
                      <Thermometer className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-orange-400 flex-shrink-0" />
                      <span className="truncate">Weather</span>
                    </h4>
                    {data?.weather && typeof data.weather === "object" && !!data.weather.weather_desc ? (
                      <div className="text-gray-300 text-sm md:text-base lg:text-lg leading-relaxed space-y-1">
                        {typeof data.weather.weather_desc === "string" &&
                          data.weather.weather_desc.trim().length > 0 &&
                          (() => {
                            const words = data.weather.weather_desc.split(" ")
                            if (words.length >= 2) {
                              const first = words[0]
                              const second = words[1]
                              return (
                                <p>
                                  {first.charAt(0).toUpperCase() + first.slice(1)}{" "}
                                  {second.charAt(0).toUpperCase() + second.slice(1)}
                                </p>
                              )
                            } else {
                              return <p>{data.weather.weather_desc}</p>
                            }
                          })()}
                        <div className="space-y-1">
                          {typeof data.weather.temp !== "undefined" && data.weather.temp !== null && (
                            <p>
                              <span className="font-semibold text-white">Temperature:</span> {String(data.weather.temp)}
                              °C
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
                      <p className="text-gray-400 text-sm md:text-base lg:text-lg">No weather data found</p>
                    )}
                  </div>

                  {/* Pitch */}
                  <div className="p-4 md:p-6 flex flex-col h-full">
                    <h4 className="flex items-center gap-2 md:gap-3 text-white font-semibold text-lg md:text-xl lg:text-2xl mb-3">
                      <Droplets className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-blue-400 flex-shrink-0" />
                      <span className="truncate">Pitch</span>
                    </h4>
                    {data?.pitch &&
                      typeof data.pitch === "object" &&
                      (data.pitch.pitch_condition ||
                        data.pitch.batting_condition ||
                        data.pitch.pace_bowling_condition ||
                        data.pitch.spine_bowling_condition) ? (
                      <div className="text-gray-300 text-sm md:text-base lg:text-lg leading-relaxed space-y-1">
                        {data.pitch.pitch_condition && <p className="break-words">{data.pitch.pitch_condition}</p>}
                        {data.pitch.batting_condition && (
                          <p className="break-words">
                            <span className="font-semibold text-white">Batting:</span> {data.pitch.batting_condition}
                          </p>
                        )}
                        {data.pitch.pace_bowling_condition && (
                          <p className="break-words">
                            <span className="font-semibold text-white">Pace Bowling:</span>{" "}
                            {data.pitch.pace_bowling_condition}
                          </p>
                        )}
                        {data.pitch.spine_bowling_condition && (
                          <p className="break-words">
                            <span className="font-semibold text-white">Spin Bowling:</span>{" "}
                            {data.pitch.spine_bowling_condition}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm md:text-base lg:text-lg">No pitch data found</p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Umpires Section */}
        {data?.umpires && (
          <Card className="bg-gradient-to-r via-sky-700/70 from-transparent to-transparent">
            <CardContent className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-lg md:text-2xl lg:text-3xl">
                <div>
                  <h4 className="text-white font-bold mb-1">Umpires</h4>
                  <p className="text-white/60 font-bold text-sm md:text-base lg:text-lg break-words">
                    {data?.umpires || "Data not found"}
                  </p>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">Match Referee</h4>
                  <p className="text-white/60 font-bold text-sm md:text-base lg:text-lg break-words">
                    {data?.referee || "Data not found"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
