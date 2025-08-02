"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Target,
  TrendingUp,
  Users,
  Radio,
} from "lucide-react"
import type { CricketMatchData } from "../types"
import { Loading } from "./Loading"
import MatchStartTimer from "./match-start-timer"
import { MatchInfoTicker } from "./match-info-ticker"

export default function YetToStart({ matchId }: { matchId: string }) {
  const [data, setData] = useState<CricketMatchData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/cricket/match/${matchId}`)
        const res_data = await res.json()
        setData(res_data.data.response)
      } catch (e) {
        console.log(e)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, []);

  const [activeTab, setActiveTab] = useState<string>("live")

  if (isLoading && !data) {
    return <Loading />
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-sky-600 via-transparent to-transparent">
      <div className="container mx-auto px-3 py-4 space-y-4 max-w-full overflow-x-hidden">
        {/* Status Note */}
        {data?.status_note}
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
        <div className={`text-center ${data?.status_note ? "mt-15" : "mt-5"}`}>
          <div className="flex flex-col items-center justify-center mb-6 gap-4">
            <h1 className="text-2xl md:text-4xl lg:text-6xl font-bold text-white px-4">
              {data?.competition?.title || "No match data found"}
            </h1>
            {data?.title && (
              <div className="text-xs md:text-base text-gray-200 mt-1 font-bold">
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
                  <div className="text-left">
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
                  <div className="text-right">
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

          <div className="flex flex-col items-center gap-2 mt-4">
            <div className="text-sm md:text-base text-gray-300">
              <MatchStartTimer
                startTime={data?.date_start_ist}
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
                {[
                  {
                    value: "live",
                    label: "Live",
                    icon: Radio,
                  },
                  {
                    value: "batting",
                    label: "Trade Now",
                    icon: TrendingUp,
                  },
                  {
                    value: "bowling",
                    label: "Bowling",
                    icon: Target,
                  },
                  {
                    value: "partnership",
                    label: "Squads",
                    icon: Users,
                  },
                ].map(({ value, label, icon: Icon }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className={`flex items-center justify-center gap-1 md:gap-2 text-sm md:text-base lg:text-lg font-bold py-2 md:py-3 px-3 md:px-4 transition-colors duration-300 data-[state=active]:bg-white data-[state=active]:text-sky-600 hover:bg-white/40 rounded-lg whitespace-nowrap flex-shrink-0 cursor-pointer`}
                  >
                    <Icon className="hidden md:inline w-7 h-7 md:w-4 md:h-4 lg:w-5 lg:h-5" />
                    <span className="">{label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <div className="w-full">
              <TabsContent value="live" forceMount className="space-y-6 mt-6 -mx-4">
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
              
              <TabsContent value="bowling" forceMount className="space-y-6 mt-6 -mx-4">
                {/* Bowling Stocks Coming Soon Banner */}
                <Card className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-lg">
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                        <span className="text-yellow-400 text-2xl">🎯</span>
                      </div>
                    </div>
                    <h3 className="text-yellow-400 font-bold text-2xl mb-2">Bowling Stocks Coming Soon!</h3>
                    <p className="text-yellow-300/80 text-lg">Trade bowlers and earn from their performance</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>

      </div>
      {(data?.umpires || data?.referee || data?.venue || data?.weather || data?.pitch) && (
        <MatchInfoTicker
          umpires={data.umpires}
          referee={data.referee}
          venue={data.venue}
          weather={data.weather}
          pitch={data.pitch}
        />
      )}
    </div>
  )
}
