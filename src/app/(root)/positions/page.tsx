"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, Trophy, Landmark, TrendingDown, Dot, IndianRupee, X } from "lucide-react"
import { useEffect, useState, useMemo, useCallback, useRef } from "react"
import { toast } from "sonner"
import type { PlayerPortfolio, TeamPortfolio } from "./types"
import { formatINR } from "@/lib/helper"
import type { Batsman, BettingPlayer, CricketMatchData } from "../betting-interface/types"
import { Button } from "@/components/ui/button"
import { sellPlayer, buyPlayer, sellTeam, buyTeam, initializeTeamStockPrices } from "../betting-interface/services"
import AnimatedNumber from "@/components/ui/animated-number"
import { Input } from "@/components/ui/input"

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
  const [sellAllConfirmOpen, setSellAllConfirmOpen] = useState(false)

  // Team trading modal state
  const [teamTradeModalOpen, setTeamTradeModalOpen] = useState(false)
  const [teamTradeModalPortfolio, setTeamTradeModalPortfolio] = useState<TeamPortfolio | null>(null)
  const [teamTradeQuantity, setTeamTradeQuantity] = useState(1)

  const [sellWindowActive, setSellWindowActive] = useState<Record<string, boolean>>({})
  const [sellWindowTimeLeft, setSellWindowTimeLeft] = useState<Record<string, number>>({})

  // Use useRef to maintain previous prices across renders
  const previousPrices = useRef<Record<string, number>>({})

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [hasPrevPage, setHasPrevPage] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)

  const fetchAllData = async (page = 1) => {
    // console.log("called ")
    // setFiveSecondWindow(true)
    setHistoryLoading(true)
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

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/portfolio/all?page=${page}&limit=${itemsPerPage}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })

      const apiData = await res.json()
      if (!apiData.success) {
        // console.log(apiData.message)
        setLoading(false)
        return
      }

      setAvailableBalance(apiData.value)
      setTotalProfit(apiData.totalPortfolioProfit)

      // Update pagination state
      if (apiData.playerHistoryPagination) {
        setCurrentPage(apiData.playerHistoryPagination.currentPage)
        setTotalPages(apiData.playerHistoryPagination.totalPages)
        setTotalItems(apiData.playerHistoryPagination.totalItems)
        setItemsPerPage(apiData.playerHistoryPagination.itemsPerPage)
        setHasNextPage(apiData.playerHistoryPagination.hasNextPage)
        setHasPrevPage(apiData.playerHistoryPagination.hasPrevPage)
      }

      setPlayerPortfoliosHistory(apiData.playerHistory || [])
      setTeamPortfoliosHistory(apiData.teamHistory || [])

      // Update team portfolios with current prices
      const updatedTeamPortfolios = (apiData.teamPortfolios || []).map(async (p: TeamPortfolio) => {
        let match = newMatchData[p.matchId] || matchDataById[p.matchId]
        let currentPrice = 50 // Default fallback price
        
        if (match) {
          // Initialize team stock prices if they are missing or 0
          if (!match.teamStockPrices || 
              !match.teamStockPrices.teama || 
              !match.teamStockPrices.teamb ||
              match.teamStockPrices.teama === 0 ||
              match.teamStockPrices.teamb === 0) {
            try {
              await initializeTeamStockPrices(p.matchId)
              // Fetch updated match data after initialization
              const matchRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/cricket/scorecard/${p.matchId}`)
              const matchResJson = await matchRes.json()
              if (matchResJson.success) {
                newMatchData[p.matchId] = matchResJson.data
                match = matchResJson.data
              }
            } catch (e) {
              console.error(`Failed to initialize team stock prices for ${p.matchId}`, e)
            }
          }
          
          if (match.teamStockPrices) {
            // Determine which team this portfolio belongs to
            const isTeamA = p.team === match.teama?.team_id
            const teamPrice = isTeamA ? match.teamStockPrices.teama : match.teamStockPrices.teamb
            currentPrice = teamPrice || 50 // Use fallback if price is 0 or undefined
          }
        }
        
        return { ...p, currentPrice: String(currentPrice) }
      })
      
      // Wait for all team portfolio updates to complete
      const resolvedTeamPortfolios = await Promise.all(updatedTeamPortfolios)
      setTeamPortfolios(resolvedTeamPortfolios)

      const uniqueMatchIds = Array.from(new Set([
        ...(apiData.playerPortfolios as PlayerPortfolio[]).map((p) => p.matchId),
        ...(apiData.teamPortfolios as TeamPortfolio[]).map((p) => p.matchId)
      ]))

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

      const updatedPlayerPortfolios = apiData.playerPortfolios.map((p: PlayerPortfolio) => {
        const match = newMatchData[p.matchId] || matchDataById[p.matchId]
        let currentPrice = 0
        if (match && match.innings && match.latest_inning_number) {
          const currentInning = match.innings[Number(match.latest_inning_number) - 1]
          if (currentInning && currentInning.batsmen) {
            const batsmanIndex = currentInning.batsmen.findIndex((b) => b.batsman_id === p.playerId)
            const batsmanData = currentInning.batsmen[batsmanIndex]
            currentPrice = calculatePlayerCurrentPrice(batsmanData, batsmanIndex)

            // Check if price has changed for this player
            const lastPrice = previousPrices.current[p.playerId] || 0
            if (currentPrice !== lastPrice && lastPrice !== 0) {
              // console.log(`Price changed for ${p.playerName}: ${lastPrice} -> ${currentPrice}`)
              // console.log(`Activating sell window for ${p.playerName}`)
              // Activate sell window for this player
              setSellWindowActive(prev => ({ ...prev, [p.playerId]: true }))
              setSellWindowTimeLeft(prev => ({ ...prev, [p.playerId]: 5 }))
              // Update the previous price after processing the change
              previousPrices.current[p.playerId] = currentPrice
            } else if (lastPrice === 0) {
              // First time setting price
              previousPrices.current[p.playerId] = currentPrice
            } else {
              // Update previous price even when no change detected (for tracking)
              previousPrices.current[p.playerId] = currentPrice
            }
          }
        }
        return { ...p, currentPrice: String(currentPrice) }
      })

      setPlayerPortfolios(updatedPlayerPortfolios)

    } catch (e: any) {
      console.error("Fetch error: " + (e?.message || "Unknown error"))
    } finally {
      setLoading(false)
      setHistoryLoading(false)
    }
  }

  // Separate function for real-time updates (active portfolios only)
  const fetchRealTimeData = async () => {
    try {
      const getTokenFromCookies = () => {
        if (typeof document === "undefined") return null
        const cookies = document.cookie.split("; ")
        const tokenCookie = cookies.find((cookie) => cookie.startsWith("token="))
        return tokenCookie ? tokenCookie.split("=")[1] : null
      }
      const token = getTokenFromCookies()
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/portfolio/all?page=1&limit=1`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })

      const apiData = await res.json()
      if (!apiData.success) return

      // Only update active portfolios and balance, not history
      setAvailableBalance(apiData.value)
      setTotalProfit(apiData.totalPortfolioProfit)

      const uniqueMatchIds = Array.from(new Set((apiData.playerPortfolios as PlayerPortfolio[]).map((p) => p.matchId)))

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

      const updatedPlayerPortfolios = apiData.playerPortfolios.map((p: PlayerPortfolio) => {
        const match = newMatchData[p.matchId] || matchDataById[p.matchId]
        let currentPrice = 0
        if (match && match.innings && match.latest_inning_number) {
          const currentInning = match.innings[Number(match.latest_inning_number) - 1]
          if (currentInning && currentInning.batsmen) {
            const batsmanIndex = currentInning.batsmen.findIndex((b) => b.batsman_id === p.playerId)
            const batsmanData = currentInning.batsmen[batsmanIndex]
            currentPrice = calculatePlayerCurrentPrice(batsmanData, batsmanIndex)

            // Check if price has changed for this player
            const lastPrice = previousPrices.current[p.playerId] || 0
            // console.log("lastPrice -> ", lastPrice)
            // console.log("currentPrice -> ", currentPrice)
            if (currentPrice !== lastPrice && lastPrice !== 0) {
              console.log(`Price changed for ${p.playerName}: ${lastPrice} -> ${currentPrice}`)
              // Activate sell window for this player
              setSellWindowActive(prev => ({ ...prev, [p.playerId]: true }))
              setSellWindowTimeLeft(prev => ({ ...prev, [p.playerId]: 5 }))
              // Update the previous price after processing the change
              previousPrices.current[p.playerId] = currentPrice
            } else if (lastPrice === 0) {
              // First time setting price
              previousPrices.current[p.playerId] = currentPrice
            } else {
              // Update previous price even when no change detected (for tracking)
              previousPrices.current[p.playerId] = currentPrice
            }
          }
        }
        return { ...p, currentPrice: String(currentPrice) }
      })

      setPlayerPortfolios(updatedPlayerPortfolios)

      // Update team portfolios with current prices
      const updatedTeamPortfolios = (apiData.teamPortfolios || []).map(async (p: TeamPortfolio) => {
        let match = newMatchData[p.matchId] || matchDataById[p.matchId]
        let currentPrice = 50 // Default fallback price
        
        if (match) {
          // Initialize team stock prices if they are missing or 0
          if (!match.teamStockPrices || 
              !match.teamStockPrices.teama || 
              !match.teamStockPrices.teamb ||
              match.teamStockPrices.teama === 0 ||
              match.teamStockPrices.teamb === 0) {
            try {
              await initializeTeamStockPrices(p.matchId)
              // Fetch updated match data after initialization
              const matchRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/cricket/scorecard/${p.matchId}`)
              const matchResJson = await matchRes.json()
              if (matchResJson.success) {
                newMatchData[p.matchId] = matchResJson.data
                match = matchResJson.data
              }
            } catch (e) {
              console.error(`Failed to initialize team stock prices for ${p.matchId}`, e)
            }
          }
          
          if (match.teamStockPrices) {
            // Determine which team this portfolio belongs to
            const isTeamA = p.team === match.teama?.team_id
            const teamPrice = isTeamA ? match.teamStockPrices.teama : match.teamStockPrices.teamb
            currentPrice = teamPrice || 50 // Use fallback if price is 0 or undefined
          }
        }
        
        return { ...p, currentPrice: String(currentPrice) }
      })
      
      // Wait for all team portfolio updates to complete
      const resolvedTeamPortfolios = await Promise.all(updatedTeamPortfolios)
      setTeamPortfolios(resolvedTeamPortfolios)

      // Also fetch match data for team portfolios in real-time updates
      const teamMatchIds = Array.from(new Set((apiData.teamPortfolios as TeamPortfolio[]).map((p) => p.matchId)))
      if (teamMatchIds.length > 0) {
        await Promise.all(
          teamMatchIds.map(async (matchId) => {
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

    } catch (e: any) {
      console.error("Real-time fetch error: " + (e?.message || "Unknown error"))
    }
  }

  // Initial load and pagination changes
  useEffect(() => {
    if (currentPage === 1) {
      setLoading(true)
    }
    fetchAllData(currentPage)
  }, [currentPage])

  // Real-time updates for active portfolios only
  useEffect(() => {
    const intervalId = setInterval(fetchRealTimeData, 1000)
    return () => clearInterval(intervalId)
  }, [])

  // Timer effect for sell window
  useEffect(() => {
    const timerEffects: any[] = []
    Object.entries(sellWindowTimeLeft).forEach(([playerId, timeLeft]) => {
      if (timeLeft > 0) {
        const timer = setTimeout(() => {
          setSellWindowTimeLeft(prev => {
            const newTimeLeft = prev[playerId] - 1
            if (newTimeLeft <= 0) {
              // Close sell window for this player
              setSellWindowActive(prev => ({ ...prev, [playerId]: false }))
              return { ...prev, [playerId]: 0 }
            }
            return { ...prev, [playerId]: newTimeLeft }
          })
        }, 1000)
        timerEffects.push(timer)
      }
    })
    return () => timerEffects.forEach(clearTimeout)
  }, [sellWindowTimeLeft])

  useEffect(() => {
    if (loading || (playerPortfolios.length === 0 && teamPortfolios.length === 0)) return

    const portfoliosToSell: { portfolio: PlayerPortfolio; price: string; reason: string }[] = []
    const teamPortfoliosToSell: { portfolio: TeamPortfolio; price: string; reason: string }[] = []

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

        // Close trade modal if this player is currently being traded
        if (tradeModalPortfolio && tradeModalPortfolio.playerId === p.playerId) {
          setTradeModalOpen(false)
          setTradeModalPortfolio(null)
        }
        return
      }

      // Check if inning is over for this player
      if (match.innings && match.latest_inning_number) {
        const latestInning = match.innings.find((inn) => inn.number === match.latest_inning_number)

        // Check if the latest inning is over (status indicates inning completion)
        const isInningOver = latestInning?.status?.toLowerCase().includes("over") ||
          latestInning?.status?.toLowerCase().includes("completed") ||
          latestInning?.status?.toLowerCase().includes("finished")

        // Check if this player belongs to the latest inning and the inning is over
        if (isInningOver && latestInning?.batting_team_id) {
          // Find which inning this player belongs to
          const playerInning = match.innings.find((inn) => {
            return inn.batsmen?.some((batsman) => batsman.batsman_id === p.playerId)
          })

          // If player belongs to the latest inning and it's over, auto-sell
          if (playerInning && playerInning.number === match.latest_inning_number) {
            portfoliosToSell.push({
              portfolio: p,
              price: p.currentPrice || "0",
              reason: `Inning is Over`,
            })

            // Close trade modal if this player is currently being traded
            if (tradeModalPortfolio && tradeModalPortfolio.playerId === p.playerId) {
              setTradeModalOpen(false)
              setTradeModalPortfolio(null)
            }
            return
          }
        }
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

          // Close trade modal if this player is currently being traded
          if (tradeModalPortfolio && tradeModalPortfolio.playerId === p.playerId) {
            setTradeModalOpen(false)
            setTradeModalPortfolio(null)
          }
        }
      }
    })

    // Check team portfolios for auto-selling
    teamPortfolios.forEach((p) => {
      const match = matchDataById[p.matchId]
      if (!match) return

      const matchOverWords = ["won", "loss", "draw", "abandoned", "no result", "completed", "finished", "ended"]
      const statusNote = `${match.status_note || ""} ${match.live || ""}`.toLowerCase()
      const isMatchOver = matchOverWords.some((word) => statusNote.includes(word))

      if (isMatchOver) {
        // Get current team stock price for selling
        const isTeamA = p.team === match.teama?.team_id
        const currentPrice = isTeamA ? match.teamStockPrices?.teama : match.teamStockPrices?.teamb
        teamPortfoliosToSell.push({
          portfolio: p,
          price: String(currentPrice || 0),
          reason: `Match is Over`,
        })
        return
      }

      // Check if inning is over for team portfolios
      if (match.innings && match.latest_inning_number) {
        const latestInning = match.innings.find((inn) => inn.number === match.latest_inning_number)

        // Check if the latest inning is over (status indicates inning completion)
        const isInningOver = latestInning?.status?.toLowerCase().includes("over") ||
          latestInning?.status?.toLowerCase().includes("completed") ||
          latestInning?.status?.toLowerCase().includes("finished")

        // If inning is over and this team was batting in the latest inning, auto-sell team stocks
        if (isInningOver && latestInning?.batting_team_id === p.team) {
          // Get current team stock price for selling
          const isTeamA = p.team === match.teama?.team_id
          const currentPrice = isTeamA ? match.teamStockPrices?.teama : match.teamStockPrices?.teamb
          teamPortfoliosToSell.push({
            portfolio: p,
            price: String(currentPrice || 0),
            reason: `Inning is Over`,
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
          fetchAllData(currentPage).then(() => {
            fetchRealTimeData() // Also refresh real-time data
            setAutoSellingInProgress(new Set()) // Clear the set after successful fetch
          })
        }, 2000)
      })
    }

    if (teamPortfoliosToSell.length > 0) {
      const sellPromises = teamPortfoliosToSell.map(async (item) => {
        try {
          const match = matchDataById[item.portfolio.matchId]
          const isTeamA = item.portfolio.team === match?.teama?.team_id
          const team = isTeamA ? match?.teama : match?.teamb

          if (team) {
            await sellTeam(team, item.price, item.portfolio.quantity, item.portfolio.matchId)
            toast.success(item.reason)
          }
        } catch (e: any) {
          console.log(e)
        }
      })

      Promise.allSettled(sellPromises).then(() => {
        setTimeout(() => {
          fetchAllData(currentPage).then(() => {
            fetchRealTimeData() // Also refresh real-time data
          })
        }, 2000)
      })
    }
  }, [playerPortfolios, teamPortfolios, matchDataById, loading, fetchAllData, autoSellingInProgress, tradeModalPortfolio])

  const openTradeModal = (portfolio: PlayerPortfolio) => {
    setTradeModalPortfolio(portfolio)
    setTradeQuantity(1)
    setTradeModalOpen(true)
  }

  const openTeamTradeModal = (portfolio: TeamPortfolio) => {
    const tradingCheck = isTeamTradingAllowed(portfolio.matchId)
    if (!tradingCheck.allowed) {
      toast.error(tradingCheck.reason || "Team trading is not available at this time")
      return
    }

    setTeamTradeModalPortfolio(portfolio)
    setTeamTradeQuantity(1)
    setTeamTradeModalOpen(true)
  }

  // Function to check if team trading is allowed
  const isTeamTradingAllowed = (matchId: string): { allowed: boolean; reason?: string } => {
    const match = matchDataById[matchId]
    if (!match) {
      return { allowed: false, reason: "No Match data available" }
    }

    // Check if match is over
    const matchOverWords = ["won", "loss", "draw", "abandoned", "no result", "completed", "finished", "ended"]
    const statusNote = `${match.status_note || ""} ${match.live || ""}`.toLowerCase()
    const isMatchOver = matchOverWords.some((word) => statusNote.includes(word))

    if (isMatchOver) {
      return { allowed: false, reason: "Match is over" }
    }

    // Check if we have valid team stock prices (with fallback)
    const teamAPrice = match.teamStockPrices?.teama || 50
    const teamBPrice = match.teamStockPrices?.teamb || 50
    
    if (typeof teamAPrice !== 'number' || typeof teamBPrice !== 'number') {
      return { allowed: false, reason: "Team stock prices not available" }
    }

    // Check if we have valid innings data
    if (!match.innings || match.innings.length === 0) {
      return { allowed: false, reason: "Innings data not available" }
    }

    // Check if latest inning is in progress
    const latestInning = match.innings.find(inn => inn.number === match.latest_inning_number)
    if (!latestInning) {
      return { allowed: false, reason: "Current inning data not available" }
    }

    // Check if inning is over (this indicates transition period)
    const isInningOver = latestInning.status?.toLowerCase().includes("over") ||
      latestInning.status?.toLowerCase().includes("completed") ||
      latestInning.status?.toLowerCase().includes("finished")

    if (isInningOver) {
      return { allowed: false, reason: "Inning transition in progress" }
    }

    return { allowed: true }
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
      await fetchAllData(currentPage) // Refresh data after trade
      await fetchRealTimeData() // Also refresh real-time data
    } catch (e: any) {
      console.error(e?.message || `${action.charAt(0).toUpperCase() + action.slice(1)} failed`)
    } finally {
      setLoading(false)
    }
  }

  const handleTeamTradeAction = async (action: "buy" | "sell") => {
    if (!teamTradeModalPortfolio) return

    // Check if trading is still allowed (in case conditions changed while modal was open)
    const tradingCheck = isTeamTradingAllowed(teamTradeModalPortfolio.matchId)
    if (!tradingCheck.allowed) {
      toast.error(tradingCheck.reason || "Team trading is not available at this time")
      setTeamTradeModalOpen(false)
      return
    }

    setLoading(true)
    try {
      const match = matchDataById[teamTradeModalPortfolio.matchId]
      const isTeamA = teamTradeModalPortfolio.team === match?.teama?.team_id
      const team = isTeamA ? match?.teama : match?.teamb

      if (!team) {
        toast.error("Team information not found")
        return
      }

      const price = teamTradeModalPortfolio.currentPrice || "0"
      const quantityStr = String(teamTradeQuantity)
      const matchId = teamTradeModalPortfolio.matchId

      const response =
        action === "buy"
          ? await buyTeam(team, price, quantityStr, matchId)
          : await sellTeam(team, price, quantityStr, matchId)

      toast.success(response?.message || `${action.charAt(0).toUpperCase() + action.slice(1)} successful`)
      setTeamTradeModalOpen(false)
      await fetchAllData(currentPage) // Refresh data after trade
      await fetchRealTimeData() // Also refresh real-time data
    } catch (e: any) {
      console.error(e?.message || `${action.charAt(0).toUpperCase() + action.slice(1)} failed`)
      toast.error(e?.message || `${action.charAt(0).toUpperCase() + action.slice(1)} failed`)
    } finally {
      setLoading(false)
    }
  }

  const handleSellAll = async () => {
    if (playerPortfolios.length === 0) {
      toast.error("No active holdings to sell")
      return
    }

    setLoading(true)
    try {
      const sellPromises = playerPortfolios.map(async (portfolio) => {
        const player: BettingPlayer = {
          name: portfolio.playerName,
          batsman_id: portfolio.playerId,
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
        const price = portfolio.currentPrice || "0"
        const quantity = portfolio.quantity
        const matchId = portfolio.matchId

        return sellPlayer(player, price, quantity, matchId)
      })

      await Promise.allSettled(sellPromises)
      toast.success(`Successfully sold all ${playerPortfolios.length} holdings`)
      await fetchAllData(currentPage) // Refresh data after selling all
      await fetchRealTimeData() // Also refresh real-time data
    } catch (e: any) {
      console.error("Sell all failed:", e?.message || "Unknown error")
      toast.error("Failed to sell all holdings")
    } finally {
      setLoading(false)
      setSellAllConfirmOpen(false)
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
          <Card className={`border-none shadow-lg bg-gradient-to-br ${totalProfit >= 0 ? "from-purple-900" : "from-red-900"} via-transparent to-transparent rounded-none rounded-tl-[60px]`} >
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
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white text-xl">Active Player Holdings</CardTitle>
                  {/* {playerPortfolios.length > 0 && ( */}
                  {/*   <Button */}
                  {/*     onClick={() => setSellAllConfirmOpen(true)} */}
                  {/*     disabled={loading} */}
                  {/*     className="bg-red-600 hover:bg-red-700 text-white font-bold" */}
                  {/*     size="sm" */}
                  {/*   > */}
                  {/*     Sell All Holdings */}
                  {/*   </Button> */}
                  {/* )} */}
                </div>
              </CardHeader>
              <CardContent>
                {
                  playerPortfolios.length === 0 ? (
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
                                      className={`font-bold text-xs ${sellWindowActive[p.playerId]
                                        ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                                        : "bg-green-600/50 hover:bg-green-600 text-white"
                                        }`}
                                      disabled={isPriceLoading}
                                      onClick={() => openTradeModal(p)}
                                    >
                                      {sellWindowActive[p.playerId]
                                        ? `Sell (${sellWindowTimeLeft[p.playerId]}s)`
                                        : "Trade"
                                      }
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
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white text-xl">Player Trade History</CardTitle>
                  {totalItems > 0 && (
                    <div className="text-sm text-gray-400">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} trades
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="text-center py-12">
                    <div className="flex justify-center mb-4">
                      <div className="relative">
                        <div className="w-8 h-8 border-2 border-transparent border-t-sky-400 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-4 h-4 bg-sky-400 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400">Loading trade history...</p>
                  </div>
                ) : playerPortfoliosHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                    <h3 className="text-lg font-bold text-white">No Trade History</h3>
                    <p className="text-gray-400">Your completed trades will appear here.</p>
                  </div>
                ) : (
                  <>
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

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-700">
                        <div className="text-sm text-gray-400">
                          Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={!hasPrevPage || historyLoading}
                            className="bg-gray-700 hover:bg-gray-600 text-white font-bold"
                            size="sm"
                          >
                            Previous
                          </Button>
                          <div className="flex gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }

                              return (
                                <Button
                                  key={pageNum}
                                  onClick={() => setCurrentPage(pageNum)}
                                  disabled={historyLoading}
                                  className={`font-bold text-sm ${currentPage === pageNum
                                    ? "bg-sky-600 text-white"
                                    : "bg-gray-700 hover:bg-gray-600 text-white"
                                    }`}
                                  size="sm"
                                >
                                  {pageNum}
                                </Button>
                              );
                            })}
                          </div>
                          <Button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={!hasNextPage || historyLoading}
                            className="bg-gray-700 hover:bg-gray-600 text-white font-bold"
                            size="sm"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
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
                {teamPortfolios.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                    <h3 className="text-lg font-bold text-white">No Active Team Holdings</h3>
                    <p className="text-gray-400">Invest in teams to see them here.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Team</th>
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
                        {teamPortfolios.map((p, idx) => {
                          const boughtPrice = Number.parseFloat(p.boughtPrice) || 0
                          const currentPrice = Number.parseFloat(p.currentPrice || "0") || 0
                          const quantity = Number.parseInt(p.quantity, 10) || 0
                          const pnl = (currentPrice - boughtPrice) * quantity
                          const pnlPercent = boughtPrice > 0 ? (pnl / (boughtPrice * quantity)) * 100 : 0
                          const match = matchDataById[p.matchId]
                          const isPriceLoading = currentPrice === 0 && (match?.status?.toLowerCase() === "live" || match?.status?.toLowerCase() === "inprogress")

                          // Check if team trading is allowed
                          const tradingCheck = isTeamTradingAllowed(p.matchId)
                          const canTrade = tradingCheck.allowed

                          // Check if match/inning is over for this team
                          const matchOverWords = ["won", "loss", "draw", "abandoned", "no result", "completed", "finished", "ended"]
                          const statusNote = `${match?.status_note || ""} ${match?.live || ""}`.toLowerCase()
                          const isMatchOver = matchOverWords.some((word) => statusNote.includes(word))

                          // Check if inning is over for this team
                          let isInningOver = false
                          if (match?.innings && match?.latest_inning_number) {
                            const latestInning = match.innings.find((inn) => inn.number === match.latest_inning_number)
                            isInningOver = Boolean(latestInning?.status?.toLowerCase().includes("over") ||
                              latestInning?.status?.toLowerCase().includes("completed") ||
                              latestInning?.status?.toLowerCase().includes("finished"))
                          }

                          const teamInning = match?.innings?.find(inn => inn.batting_team_id === p.team)
                          const isTeamUnavailable = isMatchOver || (isInningOver && teamInning?.number === match?.latest_inning_number) || false

                          return (
                            <tr key={idx} className="border-b border-gray-700/50 hover:bg-gray-700/20 cursor-pointer"
                              onClick={() => {
                                if (canTrade && !isTeamUnavailable) {
                                  openTeamTradeModal(p)
                                } else {
                                  toast.error(tradingCheck.reason || "Team trading is not available at this time")
                                }
                              }}>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-4">
                                  <div className="flex flex-col">
                                    <p className="font-bold text-white">{p.teamName}</p>
                                    <p className="text-xs text-gray-400">{match?.short_title || "..."}</p>
                                  </div>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className={`font-bold text-xs ${canTrade && !isTeamUnavailable
                                      ? "bg-green-600/50 hover:bg-green-600 text-white"
                                      : "bg-gray-600/50 text-gray-400 cursor-not-allowed"
                                      }`}
                                    disabled={isPriceLoading || !canTrade || isTeamUnavailable}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (canTrade && !isTeamUnavailable) {
                                        openTeamTradeModal(p)
                                      } else {
                                        toast.error(tradingCheck.reason || "Team trading is not available at this time")
                                      }
                                    }}
                                  >
                                    {canTrade && !isTeamUnavailable ? "Trade" : "Unavailable"}
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
                <CardTitle className="text-white text-xl">Team Trade History</CardTitle>
              </CardHeader>
              <CardContent>
                {teamPortfoliosHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                    <h3 className="text-lg font-bold text-white">No Team Trade History</h3>
                    <p className="text-gray-400">Your completed team trades will appear here.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Team</th>
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
                        {teamPortfoliosHistory.map((p, idx) => {
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
                            Math.abs(pnlPercent + 50) < 0.01
                          ) {
                            status = "Auto Sold"
                            badgeClass = "border-0 bg-red-600/40 text-red-200 font-bold text-xs"
                          }
                          return (
                            <tr key={idx} className="border-b border-gray-700/50">
                              <td className="px-4 py-4">
                                <p className="font-mono text-white">{p.teamName}</p>
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

                <div className="w-full flex items-end justify-end mt-7" >
                  <Button
                    className="bg-white/30"
                    onClick={() => { setTradeQuantity(Number(portfolio.quantity)) }}
                  >
                    Select All
                  </Button>
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

                    <Input
                      id="quantity-input"
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      pattern="[0-9]*"
                      value={tradeQuantity === 0 ? "" : tradeQuantity}
                      className=" placeholder:text-gray-400 bg-gray-800/60 rounded-lg px-3 py-2 sm:text-base text-center text-xl font-bold text-white border-0 focus:ring-0"
                      onChange={(e) => {
                        const val = e.target.value;

                        // Only allow digits
                        if (!/^\d*$/.test(val)) return;

                        if (val === "") {
                          setTradeQuantity(0);
                          return;
                        }

                        let numVal = Number(val);
                        const maxQty = Math.max(0, Math.floor(25000 / boughtPrice || 1));
                        if (numVal > maxQty) numVal = maxQty;

                        setTradeQuantity(numVal);
                      }}
                      onWheel={(e) => e.currentTarget.blur()}
                      onKeyDown={(e) => {
                        if (["ArrowUp", "ArrowDown", "e", "+", "-"].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      style={{ MozAppearance: "textfield" }}
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
                    className={`font-bold text-base ${sellWindowActive[portfolio.playerId]
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-gray-600 text-gray-400 cursor-not-allowed"
                      }`}
                    onClick={() => handleTradeAction("sell")}
                    disabled={!sellWindowActive[portfolio.playerId]}
                  >
                    {sellWindowActive[portfolio.playerId] ? `Sell (${sellWindowTimeLeft[portfolio.playerId]}s)` : "Sell"}
                  </Button>
                </div>

                {!sellWindowActive[portfolio.playerId] && (
                  <div className="mt-3 text-center">
                    <p className="text-sm text-gray-400">
                      ⏰ Sell button will be enabled for 5 seconds after price updates
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        })()}

      {/* Sell All Confirmation Dialog */}
      {sellAllConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setSellAllConfirmOpen(false)}
        >
          <div
            className="bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-md relative border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSellAllConfirmOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Confirm Sell All</h3>
              <p className="text-gray-400">
                Are you sure you want to sell all {playerPortfolios.length} active holdings?
              </p>
              <p className="text-sm text-red-400 mt-2">
                This action cannot be undone.
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <h4 className="text-white font-semibold mb-2">Holdings to be sold:</h4>
              <div className="max-h-32 overflow-y-auto">
                {playerPortfolios.slice(0, 5).map((portfolio, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1">
                    <span className="text-gray-300 text-sm">{portfolio.playerName}</span>
                    <span className="text-white text-sm font-mono">{portfolio.quantity} × {formatINR(Number.parseFloat(portfolio.currentPrice || "0"))}</span>
                  </div>
                ))}
                {playerPortfolios.length > 5 && (
                  <div className="text-gray-400 text-sm py-1">
                    ... and {playerPortfolios.length - 5} more
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setSellAllConfirmOpen(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSellAll}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
                disabled={loading}
              >
                {loading ? "Selling..." : "Confirm Sell All"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Team Trading Modal */}
      {teamTradeModalOpen &&
        teamTradeModalPortfolio &&
        (() => {
          const portfolio = teamTradeModalPortfolio
          if (!portfolio) return null

          const match = matchDataById[portfolio.matchId]
          const isTeamA = portfolio.team === match?.teama?.team_id
          const team = isTeamA ? match?.teama : match?.teamb

          const boughtPrice = Number.parseFloat(portfolio.boughtPrice) || 0
          const currentPrice = Number.parseFloat(portfolio.currentPrice || "0") || 0
          const totalValue = teamTradeQuantity * currentPrice
          const pnl = (currentPrice - boughtPrice) * Number.parseInt(portfolio.quantity, 10)

          // Check if trading is still allowed
          const tradingCheck = isTeamTradingAllowed(portfolio.matchId)
          const canTrade = tradingCheck.allowed

          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={() => setTeamTradeModalOpen(false)}
            >
              <div
                className="bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-md relative border border-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setTeamTradeModalOpen(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>

                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-white">{portfolio.teamName}</h3>
                  <p className="text-sm text-gray-400">{match?.short_title}</p>
                </div>

                {/* Warning message when trading is not available */}
                {!canTrade && (
                  <div className="mb-4 p-3 bg-red-600/20 border border-red-600/40 rounded-lg">
                    <p className="text-red-400 text-sm font-semibold">
                      ⚠️ {tradingCheck.reason || "Trading is temporarily unavailable"}
                    </p>
                  </div>
                )}

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

                <div className="w-full flex items-end justify-end mt-7" >
                  <Button
                    className="bg-white/30"
                    onClick={() => { setTeamTradeQuantity(Number(portfolio.quantity)) }}
                    disabled={!canTrade}
                  >
                    Select All
                  </Button>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-300 mb-2">Quantity</label>
                  <div className="flex items-center bg-gray-800 rounded-lg">
                    <button
                      onClick={() => setTeamTradeQuantity((q) => Math.max(1, q - 1))}
                      className="px-4 py-2 text-xl font-bold text-white"
                      disabled={!canTrade}
                    >
                      -
                    </button>

                    <Input
                      id="team-quantity-input"
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      pattern="[0-9]*"
                      value={teamTradeQuantity === 0 ? "" : teamTradeQuantity}
                      className=" placeholder:text-gray-400 bg-gray-800/60 rounded-lg px-3 py-2 sm:text-base text-center text-xl font-bold text-white border-0 focus:ring-0"
                      onChange={(e) => {
                        if (!canTrade) return

                        const val = e.target.value;

                        // Only allow digits
                        if (!/^\d*$/.test(val)) return;

                        if (val === "") {
                          setTeamTradeQuantity(0);
                          return;
                        }

                        let numVal = Number(val);
                        const maxQty = Math.max(0, Math.floor(25000 / boughtPrice || 1));
                        if (numVal > maxQty) numVal = maxQty;

                        setTeamTradeQuantity(numVal);
                      }}
                      onWheel={(e) => e.currentTarget.blur()}
                      onKeyDown={(e) => {
                        if (["ArrowUp", "ArrowDown", "e", "+", "-"].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      style={{ MozAppearance: "textfield" }}
                      disabled={!canTrade}
                    />
                    <button
                      onClick={() => setTeamTradeQuantity((q) => q + 1)}
                      className="px-4 py-2 text-xl font-bold text-white"
                      disabled={!canTrade}
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
                    className={`font-bold text-base ${canTrade
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-gray-600 text-gray-400 cursor-not-allowed"
                      }`}
                    onClick={() => handleTeamTradeAction("buy")}
                    disabled={!canTrade}
                  >
                    Buy More
                  </Button>
                  <Button
                    size="lg"
                    className={`font-bold text-base ${canTrade
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-gray-600 text-gray-400 cursor-not-allowed"
                      }`}
                    onClick={() => handleTeamTradeAction("sell")}
                    disabled={!canTrade}
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
