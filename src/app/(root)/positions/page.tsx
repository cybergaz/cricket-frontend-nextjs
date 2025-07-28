"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, Trophy, Landmark, TrendingDown, Dot, IndianRupee, X } from "lucide-react"
import { useEffect, useState, useMemo, useCallback } from "react"
import { toast } from "sonner"
import type { PlayerPortfolio, TeamPortfolio } from "./types"
import { formatINR } from "@/lib/helper"
import type { Batsman, BettingPlayer, CricketMatchData } from "../betting-interface/types"
import { Button } from "@/components/ui/button"
import { sellPlayer, buyPlayer } from "../betting-interface/services"
import AnimatedNumber from "@/components/ui/animated-number"

function formatTimestamp(ts: Date | string | undefined): string {
  if (!ts) return "--"
  const date = typeof ts === "string" ? new Date(ts) : ts
  if (isNaN(date.getTime())) return "--"
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

const calculatePlayerCurrentPrice = (batsmanData: Batsman | undefined, batsmanNumber: number | undefined): number => {
  if (!batsmanData || typeof batsmanNumber === "undefined") return 0
  const basePrice = batsmanNumber <= 2 ? 35 : batsmanNumber < 5 ? 30 : 25
  const price =
    basePrice -
    Number(batsmanData.run0 || 0) * 1.0 +
    Number(batsmanData.run1 || 0) * 0.75 +
    Number(batsmanData.run2 || 0) * 1.5 +
    Number(batsmanData.run3 || 0) * 2.25 +
    Number(batsmanData.fours || 0) * 3 +
    Number(batsmanData.sixes || 0) * 4.5
  return price
}

export default function Portfolio() {
  const [loading, setLoading] = useState(true)
  const [playerPortfolios, setPlayerPortfolios] = useState<PlayerPortfolio[]>([])
  const [teamPortfolios, setTeamPortfolios] = useState<TeamPortfolio[]>([])
  const [playerPortfoliosHistory, setPlayerPortfoliosHistory] = useState<PlayerPortfolio[]>([])
  const [teamPortfoliosHistory, setTeamPortfoliosHistory] = useState<TeamPortfolio[]>([])

  const [availableBalance, setAvailableBalance] = useState(0)
  const [totalProfit, setTotalProfit] = useState(0)

  const [matchDataById, setMatchDataById] = useState<Record<string, CricketMatchData>>({})

  const [tradeModalOpen, setTradeModalOpen] = useState(false)
  const [tradeModalPortfolio, setTradeModalPortfolio] = useState<PlayerPortfolio | null>(null)
  const [tradeQuantity, setTradeQuantity] = useState(1)
  const [autoSellingInProgress, setAutoSellingInProgress] = useState<Set<string>>(new Set())

  const fetchAllData = useCallback(async () => {
    try {
      const getTokenFromCookies = () => {
        if (typeof document === "undefined") return null
        const cookies = document.cookie.split("; ")
        const tokenCookie = cookies.find((cookie) => cookie.startsWith("token="))
        return tokenCookie ? tokenCookie.split("=")[1] : null
      }
      const token = getTokenFromCookies()
      if (!token) {
        console.error("Authentication token not found. Please log in.")
        setLoading(false)
        return
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/portfolio/all`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })

      const apiData = await res.json()
      if (!apiData.success) {
        console.log(apiData.message)
        setLoading(false)
        return
      }

      setAvailableBalance(apiData.value)
      setTotalProfit(apiData.totalPortfolioProfit)

      const allPlayerPortfolios: PlayerPortfolio[] = apiData.playerPortfolios || []
      const allTeamPortfolios: TeamPortfolio[] = apiData.teamPortfolios || []

      const activePlayers = allPlayerPortfolios.filter((p) => (p.status || "").toLowerCase() === "buy")
      const playerHistory = allPlayerPortfolios.filter((p) => (p.status || "").toLowerCase() !== "buy")
      const activeTeams = allTeamPortfolios.filter((t) => (t.status || "").toLowerCase() === "buy")
      const teamHistory = allTeamPortfolios.filter((t) => (t.status || "").toLowerCase() !== "buy")

      setPlayerPortfoliosHistory(playerHistory)
      setTeamPortfoliosHistory(teamHistory)
      setTeamPortfolios(activeTeams)

      const uniqueMatchIds = Array.from(new Set(activePlayers.map((p) => p.matchId)))

      const newMatchData: Record<string, CricketMatchData> = {}
      if (uniqueMatchIds.length > 0) {
        await Promise.all(
          uniqueMatchIds.map(async (matchId) => {
            try {
              const matchRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/cricket/scorecard/${matchId}`)
              const matchResJson = await matchRes.json()
              if (matchResJson.success) {
                newMatchData[matchId] = matchResJson.data
              }
            } catch (e) {
              console.error(`Failed to fetch match data for ${matchId}`, e)
            }
          }),
        )
      }

      setMatchDataById((prev) => ({ ...prev, ...newMatchData }))

      const updatedPlayerPortfolios = activePlayers.map((p) => {
        const match = newMatchData[p.matchId] || matchDataById[p.matchId]
        let currentPrice = 0
        if (match && match.innings && match.latest_inning_number) {
          const currentInning = match.innings[Number(match.latest_inning_number) - 1]
          if (currentInning && currentInning.batsmen) {
            const batsmanIndex = currentInning.batsmen.findIndex((b) => b.batsman_id === p.playerId)
            const batsmanData = currentInning.batsmen[batsmanIndex]
            currentPrice = calculatePlayerCurrentPrice(batsmanData, batsmanIndex)
          }
        }
        return { ...p, currentPrice: String(currentPrice) }
      })

      setPlayerPortfolios(updatedPlayerPortfolios)
    } catch (e: any) {
      console.error("Fetch error: " + (e?.message || "Unknown error"))
    } finally {
      setLoading(false)
    }
  }, [matchDataById])

  useEffect(() => {
    fetchAllData()
    const intervalId = setInterval(fetchAllData, 5000) // Fetch every 5 seconds
    return () => clearInterval(intervalId)
  }, [fetchAllData])

  useEffect(() => {
    if (loading || playerPortfolios.length === 0) return

    const portfoliosToSell: { portfolio: PlayerPortfolio; price: string; reason: string }[] = []

    playerPortfolios.forEach((p) => {
      if (autoSellingInProgress.has(p.playerId)) return

      const match = matchDataById[p.matchId]
      if (!match) return

      const player: BettingPlayer = {
        name: p.playerName,
        batsman_id: p.playerId,
        batting: "",
        position: "",
        role: "",
        role_str: "",
        runs: "0",
        balls_faced: "0",
        fours: "0",
        sixes: "0",
        run0: "0",
        run1: "0",
        run2: "0",
        run3: "0",
        run5: "0",
        how_out: "",
        dismissal: "",
        strike_rate: "0",
        bowler_id: "",
        first_fielder_id: "",
        second_fielder_id: "",
        third_fielder_id: "",
      }

      const matchOverWords = ["won", "loss", "draw", "abandoned", "no result", "completed", "finished", "ended"]
      const statusNote = `${match.status_note || ""} ${match.live || ""}`.toLowerCase()
      const isMatchOver = matchOverWords.some((word) => statusNote.includes(word))

      if (isMatchOver) {
        portfoliosToSell.push({
          portfolio: p,
          price: p.currentPrice || "0",
          reason: `Match is Over`,
        })
        return
      }

      if (match.innings && match.latest_inning_number) {
        const latestInning = match.innings.find((inn) => inn.number === match.latest_inning_number)
        const batsman = latestInning?.batsmen?.find((b) => b.batsman_id === p.playerId)

        if (batsman && batsman.dismissal != "" && batsman.dismissal.toLowerCase() !== "not out") {
          portfoliosToSell.push({
            portfolio: p,
            price: (Number.parseFloat(p.boughtPrice) / 2).toString(),
            reason: `${p.playerName} is Out`,
          })
        }
      }
    })

    if (portfoliosToSell.length > 0) {
      const newAutoSellingIds = new Set(autoSellingInProgress)
      portfoliosToSell.forEach((item) => newAutoSellingIds.add(item.portfolio.playerId))
      setAutoSellingInProgress(newAutoSellingIds)

      const sellPromises = portfoliosToSell.map(async (item) => {
        try {
          const player: BettingPlayer = {
            name: item.portfolio.playerName,
            batsman_id: item.portfolio.playerId,
            batting: "",
            position: "",
            role: "",
            role_str: "",
            runs: "0",
            balls_faced: "0",
            fours: "0",
            sixes: "0",
            run0: "0",
            run1: "0",
            run2: "0",
            run3: "0",
            run5: "0",
            how_out: "",
            dismissal: "",
            strike_rate: "0",
            bowler_id: "",
            first_fielder_id: "",
            second_fielder_id: "",
            third_fielder_id: "",
          }
          await sellPlayer(player, item.price, item.portfolio.quantity, item.portfolio.matchId)
          toast.success(item.reason)
        } catch (e: any) {
          console.log(e)
        }
      })

      Promise.allSettled(sellPromises).then(() => {
        setTimeout(() => {
          fetchAllData().then(() => {
            setAutoSellingInProgress(new Set()) // Clear the set after successful fetch
          })
        }, 2000)
      })
    }
  }, [playerPortfolios, matchDataById, loading, fetchAllData, autoSellingInProgress])

  const openTradeModal = (portfolio: PlayerPortfolio) => {
    setTradeModalPortfolio(portfolio)
    setTradeQuantity(1)
    setTradeModalOpen(true)
  }

  const handleTradeAction = async (action: "buy" | "sell") => {
    if (!tradeModalPortfolio) return
    setLoading(true)
    try {
      const player: BettingPlayer = {
        name: tradeModalPortfolio.playerName,
        batsman_id: tradeModalPortfolio.playerId,
        batting: "",
        position: "",
        role: "",
        role_str: "",
        runs: "0",
        balls_faced: "0",
        fours: "0",
        sixes: "0",
        run0: "0",
        run1: "0",
        run2: "0",
        run3: "0",
        run5: "0",
        how_out: "",
        dismissal: "",
        strike_rate: "0",
        bowler_id: "",
        first_fielder_id: "",
        second_fielder_id: "",
        third_fielder_id: "",
      }
      const price = tradeModalPortfolio.currentPrice || "0"
      const quantityStr = String(tradeQuantity)
      const matchId = tradeModalPortfolio.matchId

      const response =
        action === "buy"
          ? await buyPlayer(player, price, quantityStr, matchId)
          : await sellPlayer(player, price, quantityStr, matchId)

      toast.success(response?.message || `${action.charAt(0).toUpperCase() + action.slice(1)} successful`)
      setTradeModalOpen(false)
      await fetchAllData() // Refresh data after trade
    } catch (e: any) {
      console.error(e?.message || `${action.charAt(0).toUpperCase() + action.slice(1)} failed`)
    } finally {
      setLoading(false)
    }
  }

  const { currentHoldingsProfit, currentHoldingsValue, profitPercentage } = useMemo(() => {
    const activePortfolios = [...playerPortfolios, ...teamPortfolios]
    if (activePortfolios.length === 0) {
      return { currentHoldingsProfit: 0, currentHoldingsValue: 0, profitPercentage: 0 }
    }

    const currentHoldingsValue = activePortfolios.reduce((acc, curr) => {
      const quantity = Number.parseFloat(curr.quantity) || 0
      const boughtPrice = Number.parseFloat(curr.boughtPrice) || 0
      return acc + boughtPrice * quantity
    }, 0)

    const currentHoldingsProfit = playerPortfolios.reduce((acc, curr) => {
      const quantity = Number.parseFloat(curr.quantity) || 0
      const boughtPrice = Number.parseFloat(curr.boughtPrice) || 0
      const currentPrice = Number.parseFloat(curr.currentPrice || "0") || 0
      if (currentPrice === 0) return acc // Don't count if price is not available
      return acc + (currentPrice - boughtPrice) * quantity
    }, 0)

    const profitPercentage = currentHoldingsValue === 0 ? 0 : (currentHoldingsProfit / currentHoldingsValue) * 100

    return { currentHoldingsProfit, currentHoldingsValue, profitPercentage }
  }, [playerPortfolios, teamPortfolios])

  if (loading && playerPortfolios.length === 0 && playerPortfoliosHistory.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-tl from-transparent via-transparent to-sky-600/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl bg-transparent border-none">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-transparent border-t-white/70 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-white/70 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
            <CardTitle className="text-xl font-semibold text-white/70">Loading Portfolio...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 min-h-screen text-white">
      <main className="container mx-auto px-0 md:px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">My Portfolio</h1>
          <p className="text-gray-400 text-base md:text-lg">
            Monitor your cricket investments, analyze performance, and stay on top of the game.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-none shadow-lg bg-gradient-to-br from-sky-600 via-transparent to-transparent rounded-none rounded-tl-[60px]">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sky-400 text-sm font-bold tracking-wide mb-1">Available Balance</p>
                <h3 className="text-3xl font-extrabold text-white">
                  <AnimatedNumber value={availableBalance}>{(val) => formatINR(val)}</AnimatedNumber>
                </h3>
              </div>
              <div className="bg-sky-500/20 p-3 rounded-full">
                <Landmark className="h-6 w-6 text-sky-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-lg bg-gradient-to-br from-yellow-600 via-transparent to-transparent rounded-none rounded-tl-[60px]">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-yellow-400 text-sm font-bold tracking-wide mb-1">Active Holdings</p>
                <h3 className="text-3xl font-extrabold text-white">
                  {playerPortfolios.length + teamPortfolios.length}
                </h3>
                <div className="flex gap-2 mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-600/80 text-xs font-semibold text-yellow-300">
                    {playerPortfolios.length} Player{playerPortfolios.length !== 1 ? "s" : ""}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-400/80 text-xs font-semibold text-yellow-900">
                    {teamPortfolios.length} Team{teamPortfolios.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <div className="bg-yellow-500/20 p-3 rounded-full">
                <Users className="h-6 w-6 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card
            className={`border-none shadow-lg bg-gradient-to-br ${currentHoldingsProfit >= 0 ? "from-emerald-900" : "from-red-900"} via-transparent to-transparent rounded-none rounded-tl-[60px]`}
          >
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p
                  className={`text-sm font-bold tracking-wide mb-1 ${currentHoldingsProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}
                >
                  Current P&L
                </p>
                <h3 className="text-3xl font-extrabold text-white">
                  <AnimatedNumber value={currentHoldingsProfit}>{(val) => formatINR(val)}</AnimatedNumber>
                </h3>
                <p
                  className={`text-xs flex items-center mt-1 font-bold ${currentHoldingsProfit > 0 ? "text-emerald-400" : currentHoldingsProfit < 0 ? "text-red-400" : "text-gray-400"}`}
                >
                  {currentHoldingsProfit > 0 ? (
                    <TrendingUp size={14} className="mr-1" />
                  ) : currentHoldingsProfit < 0 ? (
                    <TrendingDown size={14} className="mr-1" />
                  ) : (
                    <Dot size={14} className="mr-1" />
                  )}
                  {profitPercentage.toFixed(2)}%
                </p>
              </div>
              <div className={`p-3 rounded-full ${currentHoldingsProfit >= 0 ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
                <IndianRupee
                  className={`h-6 w-6 ${currentHoldingsProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}
                />
              </div>
            </CardContent>
          </Card>
          <Card
            className={`border-none shadow-lg bg-gradient-to-br ${totalProfit >= 0 ? "from-purple-900" : "from-red-900"} via-transparent to-transparent rounded-none rounded-tl-[60px]`}
          >
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p
                  className={`text-sm font-bold tracking-wide mb-1 ${totalProfit >= 0 ? "text-purple-400" : "text-red-400"}`}
                >
                  Total P&L
                </p>
                <h3 className="text-3xl font-extrabold text-white">
                  <AnimatedNumber value={totalProfit}>{(val) => formatINR(val)}</AnimatedNumber>
                </h3>
              </div>
              <div className={`p-3 rounded-full ${totalProfit >= 0 ? "bg-purple-500/20" : "bg-red-500/20"}`}>
                <IndianRupee className={`h-6 w-6 ${totalProfit >= 0 ? "text-purple-400" : "text-red-400"}`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Portfolio Tabs */}
        <Tabs defaultValue="player" className="mb-8">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800 p-1 rounded-xl h-auto">
            <TabsTrigger
              value="player"
              className="py-2.5 text-sm font-bold data-[state=active]:bg-sky-600 data-[state=active]:text-white rounded-lg transition-all cursor-pointer"
            >
              Player Portfolio
            </TabsTrigger>
            <TabsTrigger
              value="team"
              className="py-2.5 text-sm font-bold data-[state=active]:bg-sky-600 data-[state=active]:text-white rounded-lg transition-all cursor-pointer"
            >
              Team Portfolio
            </TabsTrigger>
          </TabsList>

          <TabsContent value="player" className="mt-4">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-xl">Active Player Holdings</CardTitle>
              </CardHeader>
              <CardContent>
                {playerPortfolios.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                    <h3 className="text-lg font-bold text-white">No Active Player Holdings</h3>
                    <p className="text-gray-400">Invest in players to see them here.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Player</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Qty</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">
                            Buy Price
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">
                            Current Price
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">P&L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {playerPortfolios.map((p, idx) => {
                          const boughtPrice = Number.parseFloat(p.boughtPrice) || 0
                          const currentPrice = Number.parseFloat(p.currentPrice || "0") || 0
                          const quantity = Number.parseInt(p.quantity, 10) || 0
                          const pnl = (currentPrice - boughtPrice) * quantity
                          const pnlPercent = boughtPrice > 0 ? (pnl / (boughtPrice * quantity)) * 100 : 0
                          const match = matchDataById[p.matchId]
                          const isPriceLoading =
                            currentPrice === 0 &&
                            (match?.status?.toLowerCase() === "live" || match?.status?.toLowerCase() === "inprogress")

                          return (
                            <tr key={idx} className="border-b border-gray-700/50 hover:bg-gray-700/20 cursor-pointer"
                              onClick={() => openTradeModal(p)}>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-4">
                                  <div className="flex flex-col">
                                    <p className="font-bold text-white">{p.playerName}</p>
                                    <p className="text-xs text-gray-400">{match?.short_title || "..."}</p>
                                  </div>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className="font-bold text-xs bg-green-600/50 hover:bg-green-600 text-white"
                                    disabled={isPriceLoading}
                                    onClick={() => openTradeModal(p)}
                                  >
                                    Trade
                                  </Button>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-right font-mono text-white">{p.quantity}</td>
                              <td className="px-4 py-4 text-right font-mono text-gray-300">{formatINR(boughtPrice)}</td>
                              <td className="px-4 py-4 text-right font-mono text-white">
                                {isPriceLoading ? (
                                  <div className="flex justify-end">
                                    <div className="w-4 h-4 border-2 border-transparent border-t-sky-400 rounded-full animate-spin"></div>
                                  </div>
                                ) : (
                                  formatINR(currentPrice)
                                )}
                              </td>
                              <td
                                className={`px-4 py-4 text-right font-mono font-bold ${pnl > 0 ? "text-emerald-400" : pnl < 0 ? "text-red-400" : "text-gray-300"}`}
                              >
                                {formatINR(pnl)}
                                <p className="text-xs">({pnlPercent.toFixed(2)}%)</p>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 mt-8">
              <CardHeader>
                <CardTitle className="text-white text-xl">Player Trade History</CardTitle>
              </CardHeader>
              <CardContent>
                {playerPortfoliosHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                    <h3 className="text-lg font-bold text-white">No Trade History</h3>
                    <p className="text-gray-400">Your completed trades will appear here.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Player</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Qty</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Buy Price</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Sold Price</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">P&L</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">% P&L</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Status</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {playerPortfoliosHistory.map((p, idx) => {
                          const profit = Number.parseFloat(p.profit || "0")
                          const boughtPrice = Number.parseFloat(p.boughtPrice || "0")
                          const soldPrice = Number.parseFloat(p.soldPrice || "0")
                          const quantity = Number.parseInt(p.quantity || "0", 10)
                          const totalBuy = boughtPrice * quantity
                          const pnlPercent = totalBuy !== 0 ? (profit / totalBuy) * 100 : 0
                          let status = p.status
                          let badgeClass = "border-0 bg-gray-600 text-white font-bold text-xs"
                          if (
                            status &&
                            status.toLowerCase() === "sold" &&
                            Math.abs(pnlPercent + 50) < 0.01 // allow for floating point error
                          ) {
                            status = "Auto Sold"
                            badgeClass = "border-0 bg-red-600/40 text-red-200 font-bold text-xs"
                          }
                          return (
                            <tr key={idx} className="border-b border-gray-700/50">
                              <td className="px-4 py-4">
                                <p className="font-mono text-white">{p.playerName}</p>
                              </td>
                              <td className="px-4 py-4 text-right font-mono text-white">{p.quantity}</td>
                              <td className="px-4 py-4 text-right font-mono text-white">
                                {p.boughtPrice ? formatINR(boughtPrice) : "--"}
                              </td>
                              <td
                                className={`px-4 py-4 text-right font-mono ${p.soldPrice
                                  ? soldPrice > boughtPrice
                                    ? "text-emerald-400"
                                    : soldPrice < boughtPrice
                                      ? "text-red-400"
                                      : "text-gray-300"
                                  : "text-white"
                                  }`}
                              >
                                {p.soldPrice ? formatINR(soldPrice) : "--"}
                              </td>
                              <td
                                className={`px-4 py-4 text-right font-mono ${profit > 0 ? "text-emerald-400" : profit < 0 ? "text-red-400" : "text-gray-300"}`}
                              >
                                {formatINR(profit)}
                              </td>
                              <td
                                className={`px-4 py-4 text-right font-mono ${pnlPercent > 0 ? "text-emerald-400" : pnlPercent < 0 ? "text-red-400" : "text-gray-300"}`}
                              >
                                {totalBuy !== 0 ? `${pnlPercent.toFixed(2)}%` : "--"}
                              </td>
                              <td className="px-4 py-4 text-center">
                                <Badge variant="outline" className={badgeClass}>
                                  {status}
                                </Badge>
                              </td>
                              <td className="px-4 py-4 text-right text-xs text-gray-400">
                                {formatTimestamp(p.timestamp)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="mt-4">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-xl">Active Team Holdings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Trophy className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                  <h3 className="text-lg font-bold text-white">Team Holdings</h3>
                  <p className="text-gray-400">This Feature is Coming Soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {tradeModalOpen &&
        tradeModalPortfolio &&
        (() => {
          const portfolio = tradeModalPortfolio
          const match = matchDataById[portfolio.matchId]
          const currentInning = match?.innings?.[Number(match.latest_inning_number) - 1]
          const batsmanIndex = currentInning?.batsmen?.findIndex((b) => b.batsman_id === portfolio.playerId)
          const batsmanData =
            typeof batsmanIndex !== "undefined" && batsmanIndex > -1 ? currentInning.batsmen[batsmanIndex] : undefined

          const boughtPrice = Number.parseFloat(portfolio.boughtPrice) || 0
          const currentPrice = calculatePlayerCurrentPrice(batsmanData, batsmanIndex)
          const totalValue = tradeQuantity * currentPrice
          const pnl = (currentPrice - boughtPrice) * Number.parseInt(portfolio.quantity, 10)

          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={() => setTradeModalOpen(false)}
            >
              <div
                className="bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-md relative border border-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setTradeModalOpen(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>

                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-white">{portfolio.playerName}</h3>
                  <p className="text-sm text-gray-400">{match?.short_title}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 text-center">
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-400">Buy Price</p>
                    <p className="text-lg font-bold text-white">{formatINR(boughtPrice)}</p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-400">Current Price</p>
                    <p
                      className={`text-lg font-bold ${currentPrice > boughtPrice ? "text-emerald-400" : currentPrice < boughtPrice ? "text-red-400" : "text-white"}`}
                    >
                      {formatINR(currentPrice)}
                    </p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-400 hidden lg:block">P&L</p>
                    <p className="text-xs text-gray-400 block lg:hidden">
                      {pnl > 0 ? "Profit" : pnl < 0 ? "Loss" : "P&L"}
                    </p>
                    <p
                      className={`text-lg font-bold ${pnl > 0 ? "text-emerald-400" : pnl < 0 ? "text-red-400" : "text-white"}`}
                    >
                      {formatINR(pnl)}
                    </p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-400 hidden lg:block">Existing Quantity</p>
                    <p className="text-xs text-gray-400 block lg:hidden">Qty</p>
                    <p className="text-lg font-bold text-white">
                      {portfolio.quantity}
                    </p>
                  </div>
                </div>


                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-300 mb-2">Quantity</label>
                  <div className="flex items-center bg-gray-800 rounded-lg">
                    <button
                      onClick={() => setTradeQuantity((q) => Math.max(1, q - 1))}
                      className="px-4 py-2 text-xl font-bold text-white"
                    >
                      -
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={tradeQuantity}
                      onChange={(e) => {
                        const val = Number.parseInt(e.target.value, 10)
                        setTradeQuantity(isNaN(val) || val < 1 ? 1 : val)
                      }}
                      className="w-full bg-transparent text-center text-xl font-bold text-white border-0 focus:ring-0"
                    />
                    <button
                      onClick={() => setTradeQuantity((q) => q + 1)}
                      className="px-4 py-2 text-xl font-bold text-white"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-3 mb-4 flex justify-between items-center">
                  <span className="text-gray-300 font-semibold">Total Value</span>
                  <span className="text-xl font-bold text-white">{formatINR(totalValue)}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base"
                    onClick={() => handleTradeAction("buy")}
                  >
                    Buy More
                  </Button>
                  <Button
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-base"
                    onClick={() => handleTradeAction("sell")}
                  >
                    Sell
                  </Button>
                </div>
              </div>
            </div>
          )
        })()}
    </div >
  )
}
