"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, Trophy, Landmark, TrendingDown, Dot, IndianRupee, X } from "lucide-react"
import { useEffect, useState, useMemo, useCallback, useRef } from "react"
import { toast } from "sonner"
import type { PlayerPortfolio, TeamPortfolio } from "./types"
import { formatINR } from "@/lib/helper"
import type { Batsman, MatchInfoApiResponse, Team } from "../betting-interface/types-updated"
import { Button } from "@/components/ui/button"
import { sellPlayer, buyPlayer, sellTeam, buyTeam, checkPlayerHoldings } from "../betting-interface/services"
import AnimatedNumber from "@/components/ui/animated-number"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { usePortfolioSocketStore } from "@/store/portfolio-store"
import { BettingPlayer } from "../betting-interface/types"

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
  if (!batsmanData || typeof batsmanNumber === "undefined") {
    console.log("Missing data for price calculation:", { batsmanData, batsmanNumber });
    return 0;
  }

  // Log the batsman data to debug
  console.log("Calculating price for batsman:", {
    name: batsmanData.name,
    batsman_id: batsmanData.batsman_id,
    run0: batsmanData.run0,
    run1: batsmanData.run1,
    run2: batsmanData.run2,
    run3: batsmanData.run3,
    fours: batsmanData.fours,
    sixes: batsmanData.sixes
  });

  const basePrice = batsmanNumber <= 2 ? 35 : batsmanNumber < 5 ? 30 : 25
  const price =
    basePrice -
    Number(batsmanData.run0 || 0) * 1.0 +
    Number(batsmanData.run1 || 0) * 0.75 +
    Number(batsmanData.run2 || 0) * 1.5 +
    Number(batsmanData.run3 || 0) * 2.25 +
    Number(batsmanData.fours || 0) * 3 +
    Number(batsmanData.sixes || 0) * 4.5

  console.log("Calculated price:", price);
  return price
}

// Helper function to get team stock prices from the new API structure
const getTeamStockPrices = (match?: MatchInfoApiResponse) => {
  // This is a placeholder - we need to determine where team stock prices are stored in the new structure
  // For now, we'll return default values and assume they will be added to the structure
  return {
    teama: 50, // Default value
    teamb: 50, // Default value
  }
}

// Helper function to safely get team A from match data
const getTeamA = (match?: MatchInfoApiResponse): Team | undefined => {
  return match?.match_info?.teama;
}

// Helper function to safely get team B from match data
const getTeamB = (match?: MatchInfoApiResponse): Team | undefined => {
  return match?.match_info?.teamb;
}

// Helper function to safely check match status
const isMatchLiveOrInProgress = (match?: MatchInfoApiResponse): boolean => {
  const status = match?.match_info?.status;
  if (status && typeof status === 'string') {
    const statusStr = status as string;
    return statusStr.toLowerCase() === "live" || statusStr.toLowerCase() === "inprogress";
  } else if (typeof status === 'number') {
    // Assuming 1 means in progress/live based on API documentation
    return status === 1;
  }
  return false;
}

// Helper function to get match status string
const getMatchStatusStr = (match?: MatchInfoApiResponse): string => {
  return String(match?.match_info?.status_str || "");
}

// Helper function to safely check if an inning is over
const isInningOver = (inning?: any): boolean => {
  if (!inning) return false;

  const status = inning.status;

  // Log the inning status for debugging
  console.log("Checking inning status:", {
    inningNumber: inning.number,
    status: status,
    type: typeof status
  });

  // Handle both string and number status types
  if (typeof status === 'string') {
    return ["2", "3", "4", "completed", "over", "finished"].includes(status.toLowerCase());
  } else if (typeof status === 'number') {
    return status === 2 || status === 3 || status === 4;
  }

  return false;
}

// Helper function to get the latest inning from a match
const getLatestInning = (match?: MatchInfoApiResponse) => {
  if (!match?.scorecard?.innings || !match.match_info?.latest_inning_number) {
    return undefined;
  }

  const latestInningNumber = Number(match.match_info.latest_inning_number);
  return match.scorecard.innings.find(inn => inn.number === latestInningNumber);
}

// Helper function to find a player in match innings
const findPlayerInInnings = (match?: MatchInfoApiResponse, playerId?: string) => {
  if (!match?.scorecard?.innings || !playerId) {
    return { inning: undefined, batsman: undefined };
  }

  for (const inning of match.scorecard.innings) {
    if (!inning.batsmen) continue;

    const batsman = inning.batsmen.find(b => b.batsman_id === playerId);
    if (batsman) {
      return { inning, batsman };
    }
  }

  return { inning: undefined, batsman: undefined };
}

// Helper function to calculate current price for a player based on match data
const calculateCurrentPriceFromMatch = (match?: MatchInfoApiResponse, playerId?: string): number => {
  if (!match || !playerId) {
    return 0;
  }

  // Find player in innings
  const { inning, batsman } = findPlayerInInnings(match, playerId);
  if (!batsman) {
    console.log(`Player ${playerId} not found in match ${match.match_info?.match_id}`);
    return 0;
  }

  // Find batsman index/position to determine base price
  let batsmanIndex = -1;
  if (inning && inning.batsmen) {
    batsmanIndex = inning.batsmen.findIndex(b => b.batsman_id === playerId);
  }

  return calculatePlayerCurrentPrice(batsman, batsmanIndex >= 0 ? batsmanIndex : undefined);
}

// Helper function to calculate P&L for a player
const calculatePlayerPnL = (
  boughtPrice: number,
  currentPrice: number,
  quantity: number
): { pnl: number, pnlPercent: number } => {
  const pnl = (currentPrice - boughtPrice) * quantity;
  const pnlPercent = boughtPrice > 0 ? (pnl / (boughtPrice * quantity)) * 100 : 0;
  return { pnl, pnlPercent };
}

export default function Portfolio() {
  const [loading, setLoading] = useState(true)
  const playerPortfolios = usePortfolioSocketStore((state) => state.playerPortfolios)
  const teamPortfolios = usePortfolioSocketStore((state) => state.teamPortfolios)
  const playerPortfoliosHistory = usePortfolioSocketStore((state) => state.playerPortfoliosHistory)
  const teamPortfoliosHistory = usePortfolioSocketStore((state) => state.teamPortfoliosHistory)
  const playerPortfoliosLoading = usePortfolioSocketStore((state) => state.isLoading)
  const teamPortfoliosLoading = usePortfolioSocketStore((state) => state.isLoading)
  const availableBalance = usePortfolioSocketStore((state) => state.availableBalance)
  const totalProfit = usePortfolioSocketStore((state) => state.totalProfit)
  const matchDataById = usePortfolioSocketStore((state) => state.matchDataById as Record<string, MatchInfoApiResponse>)
  // console.log("matchDataById -> ", Object.keys(matchDataById).length)
  // console.log("matchDataById -> ", matchDataById)
  // if (matchDataById["92557"]) {
  //   let hehe = calculatePlayerCurrentPrice(matchDataById["92557"].innings[0].batsmen[2], 2)
  // }

  // const [playerPortfolios, setPlayerPortfolios] = useState<PlayerPortfolio[]>([])
  // const [teamPortfolios, setTeamPortfolios] = useState<TeamPortfolio[]>([])
  // const [playerPortfoliosHistory, setPlayerPortfoliosHistory] = useState<PlayerPortfolio[]>([])
  // const [teamPortfoliosHistory, setTeamPortfoliosHistory] = useState<TeamPortfolio[]>([])
  //
  // const [playerPortfoliosLoading, setPlayerPortfoliosLoading] = useState(false)
  // const [teamPortfoliosLoading, setTeamPortfoliosLoading] = useState(false)

  // const [availableBalance, setAvailableBalance] = useState(0)
  // const [totalProfit, setTotalProfit] = useState(0)
  //
  // const [matchDataById, setMatchDataById] = useState<Record<string, CricketMatchData>>({})

  const [tradeModalOpen, setTradeModalOpen] = useState(false)
  const [tradeModalPortfolio, setTradeModalPortfolio] = useState<PlayerPortfolio | null>(null)
  const [tradeQuantity, setTradeQuantity] = useState(1)
  const [autoSellingInProgress, setAutoSellingInProgress] = useState<Set<string>>(new Set())
  const [sellAllConfirmOpen, setSellAllConfirmOpen] = useState(false)

  // Player holdings state for investment limit
  const [playerHoldings, setPlayerHoldings] = useState<any>(null)
  const [isLoadingHoldings, setIsLoadingHoldings] = useState(false)

  // Team trading modal state
  const [teamTradeModalOpen, setTeamTradeModalOpen] = useState(false)
  const [teamTradeModalPortfolio, setTeamTradeModalPortfolio] = useState<TeamPortfolio | null>(null)
  const [teamTradeQuantity, setTeamTradeQuantity] = useState(1)

  const [sellWindowActive, setSellWindowActive] = useState<Record<string, boolean>>({})
  const [sellWindowTimeLeft, setSellWindowTimeLeft] = useState<Record<string, number>>({})

  // Use useRef to maintain previous prices across renders
  const previousPrices = useRef<Record<string, number>>({})

  // Use useRef to maintain previous team stock prices for detecting changes
  const previousTeamStockPrices = useRef<Record<string, number>>({})

  // Use useRef to maintain last valid prices for auto-selling when innings/matches end
  const lastValidPrices = useRef<Record<string, number>>({})
  const lastValidTeamPrices = useRef<Record<string, number>>({})

  // Use useRef to track if sell window was just activated to prevent resetting timer
  const justActivatedSellWindow = useRef<Record<string, boolean>>({})

  // Add ref to track previous wicket counts to prevent sell window when wickets increase
  const previousWicketCounts = useRef<Record<string, number>>({})

  // State to track players whose sell windows are disabled due to wicket falls
  const [sellWindowDisabledDueToWicket, setSellWindowDisabledDueToWicket] = useState<Record<string, boolean>>({})

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [hasPrevPage, setHasPrevPage] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)

  // Portfolio socket store
  const portfolioSocket = usePortfolioSocketStore()

  // Helper function to extract wicket count from score string (e.g., "47/6" -> 6)
  const extractWicketCount = (scoreString: string): number => {
    if (!scoreString) return 0
    const match = scoreString.match(/\/(\d+)$/)
    return match ? parseInt(match[1], 10) : 0
  }

  // Helper function to set disabled state with timeout
  const setDisabledStateWithTimeout = (playerId: string) => {
    setSellWindowDisabledDueToWicket(prev => ({ ...prev, [playerId]: true }))
    setTimeout(() => {
      setSellWindowDisabledDueToWicket(prev => ({ ...prev, [playerId]: false }))
    }, 10000)
  }

  // Initial load and pagination changes
  useEffect(() => {
    if (currentPage === 1) {
      setLoading(true)
    }

    // Connect to WebSocket and fetch initial data
    portfolioSocket.connectSocket()
    portfolioSocket.fetchInitialData(currentPage, itemsPerPage)
      .then(() => {
        setLoading(false)

        // Debug logging
        console.log("Match data received:", Object.keys(matchDataById).length);
        if (Object.keys(matchDataById).length > 0) {
          const sampleMatchId = Object.keys(matchDataById)[0];
          const sampleMatch = matchDataById[sampleMatchId];
          console.log("Sample match structure:", {
            match_id: sampleMatchId,
            has_match_info: !!sampleMatch.match_info,
            has_scorecard: !!sampleMatch.scorecard,
            innings_count: sampleMatch.scorecard?.innings?.length || 0,
            latest_inning_number: sampleMatch.match_info?.latest_inning_number,
            status: sampleMatch.match_info?.status,
            status_str: sampleMatch.match_info?.status_str
          });

          if (sampleMatch.scorecard?.innings?.length > 0) {
            const latestInning = sampleMatch.scorecard.innings[sampleMatch.scorecard.innings.length - 1];
            console.log("Latest inning:", {
              number: latestInning.number,
              status: latestInning.status,
              batsmen_count: latestInning.batsmen?.length || 0
            });
          }
        }
      })
      .catch((error) => {
        console.error("Error fetching initial data:", error)
        setLoading(false)
      })

    // Clean up socket connection when component unmounts
    return () => {
      portfolioSocket.disconnectSocket()
    }
  }, [currentPage, itemsPerPage])

  // Update local state from socket store
  // useEffect(() => {
  //   setPlayerPortfolios(portfolioSocket.playerPortfolios)
  //   setTeamPortfolios(portfolioSocket.teamPortfolios)
  //   setPlayerPortfoliosHistory(portfolioSocket.playerPortfoliosHistory)
  //   setTeamPortfoliosHistory(portfolioSocket.teamPortfoliosHistory)
  //   setAvailableBalance(portfolioSocket.availableBalance)
  //   setTotalProfit(portfolioSocket.totalProfit)
  //   setMatchDataById(portfolioSocket.matchDataById)
  //   setPlayerPortfoliosLoading(portfolioSocket.isLoading)
  //   setTeamPortfoliosLoading(portfolioSocket.isLoading)
  //   setHistoryLoading(portfolioSocket.isLoading)
  // }, [
  //   portfolioSocket.playerPortfolios,
  //   portfolioSocket.teamPortfolios,
  //   portfolioSocket.playerPortfoliosHistory,
  //   portfolioSocket.teamPortfoliosHistory,
  //   portfolioSocket.availableBalance,
  //   portfolioSocket.totalProfit,
  //   portfolioSocket.matchDataById,
  //   portfolioSocket.isLoading
  // ])

  // Price change detection and sell window activation
  useEffect(() => {
    if (playerPortfolios.length === 0) return

    playerPortfolios.forEach((portfolio) => {
      const match = matchDataById[portfolio.matchId]
      if (!match || !match.scorecard?.innings || !match.match_info?.latest_inning_number) return

      const currentInning = match.scorecard.innings[Number(match.match_info.latest_inning_number) - 1]
      if (!currentInning?.batsmen) return

      const batsmanIndex = currentInning.batsmen.findIndex((b: Batsman) => b.batsman_id === portfolio.playerId)
      const batsmanData = currentInning.batsmen[batsmanIndex]

      let currentPrice = 0
      if (batsmanIndex !== -1 && batsmanData) {
        currentPrice = calculatePlayerCurrentPrice(batsmanData, batsmanIndex)
      } else {
        // Look for player in all innings
        for (let i = 0; i < match.scorecard.innings.length; i++) {
          const inning = match.scorecard.innings[i]
          if (inning.batsmen) {
            const index = inning.batsmen.findIndex((b: Batsman) => b.batsman_id === portfolio.playerId)
            if (index !== -1) {
              currentPrice = calculatePlayerCurrentPrice(inning.batsmen[index], index)
              break
            }
          }
        }
      }

      // Store last valid price (non-zero price)
      if (currentPrice > 0) {
        lastValidPrices.current[portfolio.playerId] = currentPrice
      }

      // Check if price has changed for this player
      const lastPrice = previousPrices.current[portfolio.playerId] || 0
      if (currentPrice !== lastPrice && lastPrice !== 0) {
        // Check if wickets have increased for this match
        let wicketsIncreased = false
        if (match && match.scorecard?.innings && match.match_info?.latest_inning_number) {
          const currentInning = match.scorecard.innings[Number(match.match_info.latest_inning_number) - 1]
          if (currentInning && currentInning.scores) {
            const currentWicketCount = extractWicketCount(currentInning.scores)
            const previousWicketCount = previousWicketCounts.current[`${portfolio.matchId}_${match.match_info.latest_inning_number}`] || 0
            wicketsIncreased = currentWicketCount > previousWicketCount
            if (currentWicketCount == 0 || previousWicketCount == 0) wicketsIncreased = false

            // Update previous wicket count
            previousWicketCounts.current[`${portfolio.matchId}_${match.match_info.latest_inning_number}`] = currentWicketCount
          }
        }

        // Check if this player is currently batting (to prevent sell window when wickets increase)
        const isCurrentlyBatting = match && match.scorecard?.innings && match.match_info?.latest_inning_number ?
          match.scorecard.innings[Number(match.match_info.latest_inning_number) - 1]?.batsmen?.some(b => b.batsman_id === portfolio.playerId) : false

        // Only activate sell window if wickets haven't increased OR if player is not currently batting
        if (!wicketsIncreased || !isCurrentlyBatting) {
          // Clear the disabled state if it was set
          setSellWindowDisabledDueToWicket(prev => ({ ...prev, [portfolio.playerId]: false }))

          // Only activate sell window if it's not already active and wasn't just activated
          if (!justActivatedSellWindow.current[portfolio.playerId]) {
            setSellWindowActive(prev => {
              if (!prev[portfolio.playerId]) {
                setSellWindowTimeLeft(prevTime => ({ ...prevTime, [portfolio.playerId]: 5 }))
                justActivatedSellWindow.current[portfolio.playerId] = true
                // Reset the flag after a short delay
                setTimeout(() => {
                  justActivatedSellWindow.current[portfolio.playerId] = false
                }, 1000)
                return { ...prev, [portfolio.playerId]: true }
              }
              return prev
            })
          }
        } else {
          console.log(`Sell window disabled for ${portfolio.playerName} due to recent wicket fall`)
          // Set the disabled state for this player with timeout
          setDisabledStateWithTimeout(portfolio.playerId)
        }
        // Update the previous price after processing the change
        previousPrices.current[portfolio.playerId] = currentPrice
      } else if (lastPrice === 0) {
        // First time setting price
        previousPrices.current[portfolio.playerId] = currentPrice
      }
    })

    // Check team stock price changes
    teamPortfolios.forEach((portfolio) => {
      const match = matchDataById[portfolio.matchId]
      if (!match) return

      const isTeamA = Number(portfolio.team) === getTeamA(match)?.team_id
      const teamKey = isTeamA ? 'teama' : 'teamb'
      const teamStockPrices = getTeamStockPrices(match)
      const currentTeamPrice = teamStockPrices[teamKey] !== undefined && teamStockPrices[teamKey] !== null ? teamStockPrices[teamKey] : 50
      const sellWindowKey = `team_${portfolio.matchId}_${teamKey}`

      // Store last valid team price (non-zero price)
      if (currentTeamPrice > 0) {
        lastValidTeamPrices.current[sellWindowKey] = currentTeamPrice
      }

      // Check if team stock price has changed
      const lastTeamPrice = previousTeamStockPrices.current[sellWindowKey] || 0
      if (currentTeamPrice !== lastTeamPrice && lastTeamPrice !== 0) {
        console.log(`Team stock price changed for ${portfolio.teamName}: ${lastTeamPrice} -> ${currentTeamPrice}`)
        // Only activate sell window if it's not already active and wasn't just activated
        if (!justActivatedSellWindow.current[sellWindowKey]) {
          setSellWindowActive(prev => {
            if (!prev[sellWindowKey]) {
              setSellWindowTimeLeft(prevTime => ({ ...prevTime, [sellWindowKey]: 5 }))
              justActivatedSellWindow.current[sellWindowKey] = true
              // Reset the flag after a short delay
              setTimeout(() => {
                justActivatedSellWindow.current[sellWindowKey] = false
              }, 1000)
              return { ...prev, [sellWindowKey]: true }
            }
            return prev
          })
        }
        // Update the previous price after processing the change
        previousTeamStockPrices.current[sellWindowKey] = currentTeamPrice
      } else if (lastTeamPrice === 0) {
        // First time setting price
        previousTeamStockPrices.current[sellWindowKey] = currentTeamPrice
      }
    })
  }, [playerPortfolios, teamPortfolios, matchDataById])

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

  // Auto-selling logic
  useEffect(() => {
    if (loading || (playerPortfolios.length === 0 && teamPortfolios.length === 0)) return

    const portfoliosToSell: { portfolio: PlayerPortfolio; price: string; reason: string }[] = []
    const teamPortfoliosToSell: { portfolio: TeamPortfolio; price: string; reason: string }[] = []

    // Debug log for auto-selling
    console.log("Auto-selling check running for", playerPortfolios.length, "player portfolios");

    playerPortfolios.forEach((p) => {
      if (autoSellingInProgress.has(p.playerId)) return

      const match = matchDataById[p.matchId]
      if (!match) {
        console.log("No match data found for portfolio:", p.matchId);
        return;
      }

      // Debug log match status
      console.log(`Match ${p.matchId} status:`, {
        status: match.match_info?.status,
        statusStr: match.match_info?.status_str,
        hasScorecard: !!match.scorecard,
        hasInnings: !!match.scorecard?.innings,
        inningsCount: match.scorecard?.innings?.length || 0
      });

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

      // TEMPORARILY DISABLE AUTO-SELLING FOR DEBUGGING
      // We'll return early here to prevent any auto-selling

      // Check if match is over
      const matchStatus = match.match_info?.status
      const isMatchOver = matchStatus === 2 || String(matchStatus) === "2"

      if (isMatchOver) {
        console.log(`Match ${p.matchId} is over, auto-selling player ${p.playerName}`);

        // Use last valid price if available, otherwise use current price
        const lastValidPrice = lastValidPrices.current[p.playerId] || Number.parseFloat(p.currentPrice || "0")
        portfoliosToSell.push({
          portfolio: p,
          price: String(lastValidPrice),
          reason: `Match is Over`,
        })

        // Close trade modal if this player is currently being traded
        if (tradeModalPortfolio !== null && tradeModalPortfolio.playerId === p.playerId) {
          setTradeModalOpen(false)
          setTradeModalPortfolio(null)
        }
        return
      }

      // Get latest inning and check if it's over
      const latestInning = getLatestInning(match);
      if (!latestInning) {
        console.log(`No latest inning found for match ${p.matchId}`);
        return;
      }

      // Check if inning is over using our helper function
      const inningOverStatus = isInningOver(latestInning);
      if (latestInning) {
        console.log(`Inning status for match ${p.matchId}:`, {
          inningNumber: latestInning.number,
          isOver: inningOverStatus
        });
      }

      // Find player in innings
      const { inning: playerInning, batsman } = findPlayerInInnings(match, p.playerId);

      // Log player inning information
      if (playerInning) {
        console.log(`Player ${p.playerName} found in inning ${playerInning.number}`);
      } else {
        console.log(`Player ${p.playerName} not found in any innings`);
        return; // Skip if player not found in any innings
      }

      // Check if player's inning is the latest inning and if it's over
      if (inningOverStatus && playerInning && latestInning && playerInning.number === latestInning.number) {
        // Check if player is out
        const isPlayerOut = batsman && batsman.dismissal &&
          batsman.dismissal !== "" &&
          batsman.dismissal.toLowerCase() !== "not out";

        console.log(`Player ${p.playerName} dismissal check:`, {
          dismissal: batsman?.dismissal || "N/A",
          isPlayerOut: isPlayerOut
        });

        // Auto-sell if inning is over and player is not out (or if price is 0)
        const currentPrice = Number.parseFloat(p.currentPrice || "0");
        // if (!isPlayerOut || currentPrice === 0) {
        //   // Use last valid price if available, otherwise use current price
        //   const lastValidPrice = lastValidPrices.current[p.playerId] || currentPrice;
        //
        //   console.log(`Auto-selling player ${p.playerName}:`, {
        //     reason: !isPlayerOut ? "Player Not Out" : "Price Zero",
        //     price: lastValidPrice
        //   });
        //
        //   portfoliosToSell.push({
        //     portfolio: p,
        //     price: String(lastValidPrice),
        //     reason: `Inning is Over${!isPlayerOut ? " - Player Not Out" : " - Price Zero"}`,
        //   });
        //
        //   // Close trade modal if this player is currently being traded
        //   if (tradeModalPortfolio !== null && tradeModalPortfolio.playerId === p.playerId) {
        //     setTradeModalOpen(false);
        //     setTradeModalPortfolio(null);
        //   }
        // }
      }

      if (match.scorecard?.innings && match.match_info?.latest_inning_number) {
        const latestInning = match.scorecard.innings.find((inn) => inn.number === Number(match.match_info.latest_inning_number))
        const batsman = latestInning?.batsmen?.find((b) => b.batsman_id === p.playerId)

        if (batsman && batsman.dismissal != "" && batsman.dismissal.toLowerCase() !== "not out") {
          portfoliosToSell.push({
            portfolio: p,
            price: (Number.parseFloat(p.boughtPrice) / 2).toString(),
            reason: `${p.playerName} is Out`,
          })

          // Close trade modal if this player is currently being traded
          if (tradeModalPortfolio !== null && tradeModalPortfolio.playerId === p.playerId) {
            setTradeModalOpen(false)
            setTradeModalPortfolio(null)
          }
        }
      }

      // Additional check for when player price drops to 0 during their inning
      if (match.scorecard?.innings && match.match_info?.latest_inning_number) {
        const latestInning = match.scorecard.innings.find((inn) => inn.number === Number(match.match_info.latest_inning_number))
        const batsman = latestInning?.batsmen?.find((b) => b.batsman_id === p.playerId)

        // Check if this player belongs to the current inning
        const playerInning = match.scorecard.innings.find((inn) => {
          return inn.batsmen?.some((batsman) => batsman.batsman_id === p.playerId)
        })

        if (playerInning && playerInning.number === Number(match.match_info.latest_inning_number) && batsman) {
          const currentPrice = Number.parseFloat(p.currentPrice || "0")
          const isPlayerOut = batsman.dismissal !== "" && batsman.dismissal.toLowerCase() !== "not out"

          // Auto-sell if price is 0 and player is not out (this indicates inning ended for this player)
          // if (currentPrice === 0 && !isPlayerOut) {
          //   // Use last valid price if available, otherwise use 0
          //   const lastValidPrice = lastValidPrices.current[p.playerId] || 0
          //   portfoliosToSell.push({
          //     portfolio: p,
          //     price: String(lastValidPrice),
          //     reason: `Player Inning Ended - Price Zero`,
          //   })
          //
          //   // Close trade modal if this player is currently being traded
          //   if (tradeModalPortfolio !== null && tradeModalPortfolio.playerId === p.playerId) {
          //     setTradeModalOpen(false)
          //     setTradeModalPortfolio(null)
          //   }
          // }
        }
      }

      // Final safety check: if player price is 0 and they're not out, auto-sell regardless of inning status
      const currentPrice = Number.parseFloat(p.currentPrice || "0")
      if (currentPrice === 0) {
        // Check if player is out in any inning
        let isPlayerOut = false
        if (match.scorecard?.innings) {
          for (const inning of match.scorecard.innings) {
            const batsman = inning.batsmen?.find((b) => b.batsman_id === p.playerId)
            if (batsman && batsman.dismissal !== "" && batsman.dismissal.toLowerCase() !== "not out") {
              isPlayerOut = true
              break
            }
          }
        }

        // If player is not out and price is 0, auto-sell
        // if (!isPlayerOut) {
        //   // Use last valid price if available, otherwise use 0
        //   const lastValidPrice = lastValidPrices.current[p.playerId]
        //   portfoliosToSell.push({
        //     portfolio: p,
        //     price: String(lastValidPrice),
        //     reason: `Player Price Zero - Auto Sell`,
        //   })
        //
        //   // Close trade modal if this player is currently being traded
        //   if (tradeModalPortfolio && tradeModalPortfolio.playerId === p.playerId) {
        //     setTradeModalOpen(false)
        //     setTradeModalPortfolio(null)
        //   }
        // }
      }
    })

    // Check team portfolios for auto-selling
    teamPortfolios.forEach((p) => {
      const match = matchDataById[p.matchId]
      if (!match) return

      const matchOverWords = ["won", "loss", "draw", "abandoned", "no result", "completed", "cancelled", "finished", "ended"]
      const statusNote = `${match.match_info.status_note || ""} ${match.match_info.live || ""}`.toLowerCase()
      const isMatchOver = matchOverWords.some((word) => statusNote.includes(word))

      if (isMatchOver) {
        // Get current team stock price for selling
        const isTeamA = Number(p.team) === getTeamA(match)?.team_id
        const teamKey = isTeamA ? 'teama' : 'teamb'
        const sellWindowKey = `team_${teamKey}`
        const teamStockPrices = getTeamStockPrices(match)
        const currentPrice = isTeamA ? teamStockPrices.teama : teamStockPrices.teamb
        // Use last valid price if available, otherwise use current price
        const lastValidPrice = lastValidTeamPrices.current[sellWindowKey] || currentPrice || 0
        teamPortfoliosToSell.push({
          portfolio: p,
          price: String(lastValidPrice),
          reason: `Match is Over`,
        })
        return
      }

      // Check if inning is over for team portfolios
      if (match.scorecard?.innings && match.match_info?.latest_inning_number) {
        const latestInning = match.scorecard.innings.find((inn) => inn.number === Number(match.match_info.latest_inning_number))

        // Check if the latest inning is over (status indicates inning completion)
        const inningStatus = typeof latestInning?.status === 'number'
          ? String(latestInning?.status)
          : latestInning?.status || ""
        const isInningOver = inningStatus === "2" || inningStatus === "3" || inningStatus === "4"

        // If inning is over and this team was batting in the latest inning, auto-sell team stocks
        if (isInningOver && latestInning?.batting_team_id === Number(p.team)) {
          // Get current team stock price for selling
          const isTeamA = Number(p.team) === getTeamA(match)?.team_id
          const teamKey = isTeamA ? 'teama' : 'teamb'
          const sellWindowKey = `team_${teamKey}`
          const teamStockPrices = getTeamStockPrices(match)
          const currentPrice = isTeamA ? teamStockPrices.teama : teamStockPrices.teamb
          // Use last valid price if available, otherwise use current price
          const lastValidPrice = lastValidTeamPrices.current[sellWindowKey] || currentPrice || 0
          teamPortfoliosToSell.push({
            portfolio: p,
            price: String(lastValidPrice),
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
          // Refresh data after auto-selling
          portfolioSocket.fetchInitialData(currentPage, itemsPerPage)
          setAutoSellingInProgress(new Set())
        }, 2000)
      })
    }

    if (teamPortfoliosToSell.length > 0) {
      const sellPromises = teamPortfoliosToSell.map(async (item) => {
        try {
          const match = matchDataById[item.portfolio.matchId]
          const isTeamA = Number(item.portfolio.team) === getTeamA(match)?.team_id
          const team = isTeamA ? getTeamA(match) : getTeamB(match)

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
          // Refresh data after auto-selling
          portfolioSocket.fetchInitialData(currentPage, itemsPerPage)
        }, 2000)
      })
    }
  }, [playerPortfolios, teamPortfolios, matchDataById, loading, autoSellingInProgress, tradeModalPortfolio, currentPage, itemsPerPage])

  const openTradeModal = async (portfolio: PlayerPortfolio) => {
    setTradeModalPortfolio(portfolio)
    setTradeQuantity(1)
    setTradeModalOpen(true)

    // Fetch player holdings for investment limit
    setIsLoadingHoldings(true)
    try {
      const holdingsResponse = await checkPlayerHoldings(portfolio.matchId, portfolio.playerId)
      if (holdingsResponse.success) {
        setPlayerHoldings(holdingsResponse.data)
      } else {
        console.error("Failed to fetch player holdings:", holdingsResponse.message)
        setPlayerHoldings(null)
      }
    } catch (error) {
      console.error("Error fetching player holdings:", error)
      setPlayerHoldings(null)
    } finally {
      setIsLoadingHoldings(false)
    }
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
    const matchOverWords = ["won", "loss", "draw", "abandoned", "no result", "completed", "cancelled", "finished", "ended"]
    const statusNote = `${match.match_info.status_note || ""} ${match.match_info.live || ""}`.toLowerCase()
    const isMatchOver = matchOverWords.some((word) => statusNote.includes(word))

    if (isMatchOver) {
      return { allowed: false, reason: "Match is over" }
    }

    // Check if we have valid team stock prices (with fallback)
    const teamStockPrices = getTeamStockPrices(match)
    const teamAPrice = teamStockPrices.teama !== undefined && teamStockPrices.teama !== null ? teamStockPrices.teama : 50
    const teamBPrice = teamStockPrices.teamb !== undefined && teamStockPrices.teamb !== null ? teamStockPrices.teamb : 50

    if (typeof teamAPrice !== 'number' || typeof teamBPrice !== 'number') {
      return { allowed: false, reason: "Team stock prices not available" }
    }

    // Check if we have valid innings data
    if (!match.scorecard?.innings || match.scorecard.innings.length === 0) {
      return { allowed: false, reason: "Innings data not available" }
    }

    // Check if latest inning is in progress
    const latestInning = match.scorecard.innings.find(inn => inn.number === Number(match.match_info.latest_inning_number))
    if (!latestInning) {
      return { allowed: false, reason: "Current inning data not available" }
    }

    // Check if inning is over (this indicates transition period)
    const inningStatus = typeof latestInning.status === 'number'
      ? String(latestInning.status)
      : latestInning.status || ""
    const isInningOver = inningStatus === "2" || inningStatus === "3" || inningStatus === "4"

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

      // Check investment limit for buy actions
      if (action === "buy" && playerHoldings) {
        const requestedInvestment = Number(price) * Number(quantityStr)
        const remainingInvestment = Number(playerHoldings.remainingInvestment)

        if (requestedInvestment > remainingInvestment) {
          toast.error(`Investment limit exceeded. You can only invest ₹${remainingInvestment.toFixed(2)} more in this player.`)
          setLoading(false)
          return
        }
      }

      const response =
        action === "buy"
          ? await buyPlayer(player, price, quantityStr, matchId)
          : await sellPlayer(player, price, quantityStr, matchId)

      toast.success(response?.message || `${action.charAt(0).toUpperCase() + action.slice(1)} successful`)
      setTradeModalOpen(false)

      // Refresh data after trade using portfolio socket
      portfolioSocket.fetchInitialData(currentPage, itemsPerPage)
    } catch (e: any) {
      console.error(e?.message || `${action.charAt(0).toUpperCase() + action.slice(1)} failed`)
      toast.error(e?.message || `${action.charAt(0).toUpperCase() + action.slice(1)} failed`)
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
      const isTeamA = Number(teamTradeModalPortfolio.team) === getTeamA(match)?.team_id
      const team = isTeamA ? getTeamA(match) : getTeamB(match)

      if (!team) {
        toast.error("Team information not found")
        return
      }

      // Get real-time current price from match data
      let price = teamTradeModalPortfolio.currentPrice || "0"
      if (match) {
        const teamStockPrices = getTeamStockPrices(match)
        const isTeamA = Number(teamTradeModalPortfolio.team) === getTeamA(match)?.team_id
        const teamKey = isTeamA ? 'teama' : 'teamb'
        const realTimePrice = teamStockPrices[teamKey]
        if (realTimePrice !== undefined && realTimePrice !== null) {
          price = String(realTimePrice)
        }
      }
      const quantityStr = String(teamTradeQuantity)
      const matchId = teamTradeModalPortfolio.matchId

      const response =
        action === "buy"
          ? await buyTeam(team, price, quantityStr, matchId)
          : await sellTeam(team, price, quantityStr, matchId)

      toast.success(response?.message || `${action.charAt(0).toUpperCase() + action.slice(1)} successful`)
      setTeamTradeModalOpen(false)

      // Refresh data after trade using portfolio socket
      portfolioSocket.fetchInitialData(currentPage, itemsPerPage)
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

      // Refresh data after selling all using portfolio socket
      portfolioSocket.fetchInitialData(currentPage, itemsPerPage)
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

    const currentHoldingsProfit = activePortfolios.reduce((acc, curr) => {
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
                  playerPortfolios.length === 0 && playerPortfoliosLoading
                    ? (
                      <div className="text-center py-12">
                        <div className="flex justify-center mb-4">
                          <div className="relative">
                            <div className="w-8 h-8 border-2 border-transparent border-t-sky-400 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-4 h-4 bg-sky-400 rounded-full animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-400">Loading player holdings...</p>
                      </div>
                    )
                    : playerPortfolios.length === 0
                      ? (
                        <div className="text-center py-12">
                          <Users className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                          <h3 className="text-lg font-bold text-white">No Active Player Holdings</h3>
                          <p className="text-gray-400">Invest in players to see them here.</p>
                        </div>
                      )
                      : (
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
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">
                                  P&L
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {playerPortfolios.map((p, idx) => {
                                console.log("Player Portfolio:", p)
                                const boughtPrice = Number.parseFloat(p.boughtPrice) || 0
                                const match = matchDataById[p.matchId]

                                // Calculate current price from match data instead of using portfolio data
                                const currentPrice = calculateCurrentPriceFromMatch(match, p.playerId);

                                const quantity = Number.parseInt(p.quantity, 10) || 0

                                // Calculate P&L using the calculated current price
                                const { pnl, pnlPercent } = calculatePlayerPnL(boughtPrice, currentPrice, quantity);

                                const isPriceLoading = currentPrice === 0 && match && isMatchLiveOrInProgress(match)

                                return (
                                  <tr key={idx} className="border-b border-gray-700/50 hover:bg-gray-700/20 cursor-pointer">
                                    <td className="px-4 py-4">
                                      <div className="flex items-center gap-4">
                                        <div className="flex flex-col">
                                          <p className="font-bold text-white">{p.playerName}</p>
                                          <Link
                                            href={`/betting-interface?id=${p.matchId}`}
                                            className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors cursor-pointer"
                                          >
                                            {match?.match_info?.short_title || "N/A"}
                                          </Link>
                                        </div>
                                        <Button
                                          variant="secondary"
                                          size="sm"
                                          className={`font-bold text-xs ${(() => {
                                            if (sellWindowDisabledDueToWicket[p.playerId]) {
                                              return "bg-yellow-600/80 text-white"
                                            } else if (sellWindowActive[p.playerId]) {
                                              return "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                                            } else {
                                              return "bg-green-600/50 hover:bg-green-600 text-white"
                                            }
                                          })()}`}
                                          disabled={isPriceLoading || sellWindowDisabledDueToWicket[p.playerId]}
                                          onClick={() => {
                                            if (sellWindowDisabledDueToWicket[p.playerId]) {
                                              toast.info("Sell windows are disabled due to recent wicket fall. Please wait for API updates.")
                                              return
                                            }
                                            openTradeModal(p)
                                          }}
                                        >
                                          {(() => {
                                            if (sellWindowDisabledDueToWicket[p.playerId]) {
                                              return "⚠️ Wicket Fell"
                                            } else if (sellWindowActive[p.playerId]) {
                                              return `Sell (${sellWindowTimeLeft[p.playerId]}s)`
                                            } else {
                                              return "Trade"
                                            }
                                          })()}
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
                              Math.abs(pnlPercent + 50) < 0.03 // allow for floating point error
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
                {
                  teamPortfolios.length === 0 && teamPortfoliosLoading
                    ? (
                      <div className="text-center py-12">
                        <div className="flex justify-center mb-4">
                          <div className="relative">
                            <div className="w-8 h-8 border-2 border-transparent border-t-sky-400 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-4 h-4 bg-sky-400 rounded-full animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-400">Loading player holdings...</p>
                      </div>
                    )
                    : teamPortfolios.length === 0
                      ? (
                        <div className="text-center py-12">
                          <Trophy className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                          <h3 className="text-lg font-bold text-white">No Active Team Holdings</h3>
                          <p className="text-gray-400">Invest in teams to see them here.</p>
                        </div>
                      )
                      : (
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
                                const match = matchDataById[p.matchId]
                                const isTeamA = match ? Number(p.team) === getTeamA(match)?.team_id : false
                                const teamStockPrices = match ? getTeamStockPrices(match) : { teama: 0, teamb: 0 }
                                const currentPrice = teamStockPrices[isTeamA ? 'teama' : 'teamb'] !== undefined ?
                                  teamStockPrices[isTeamA ? 'teama' : 'teamb'] :
                                  Number.parseFloat(p.currentPrice || "0") || 0
                                const quantity = Number.parseInt(p.quantity, 10) || 0
                                const pnl = (currentPrice - boughtPrice) * quantity
                                const pnlPercent = boughtPrice > 0 ? (pnl / (boughtPrice * quantity)) * 100 : 0
                                const isPriceLoading = currentPrice === 0 && match && isMatchLiveOrInProgress(match)

                                // Check if team trading is allowed
                                const tradingCheck = isTeamTradingAllowed(p.matchId)
                                const canTrade = tradingCheck.allowed

                                // Check if match/inning is over for this team
                                const matchOverWords = ["won", "loss", "draw", "abandoned", "no result", "completed", "cancelled", "finished", "ended"]
                                const statusNote = match ? getMatchStatusStr(match).toLowerCase() : ""
                                const isMatchOver = matchOverWords.some((word) => statusNote.includes(word))

                                // Check if inning is over for this team
                                let isInningOver = false
                                if (match?.scorecard?.innings && match?.match_info?.latest_inning_number) {
                                  const latestInning = match.scorecard.innings.find((inn) => inn.number === Number(match.match_info.latest_inning_number))
                                  {/* isInningOver = Boolean(latestInning?.status?.toLowerCase().includes("over") || */ }
                                  {/*   latestInning?.status?.toLowerCase(c.includes("completed") || */ }
                                  {/*   latestInning?.status?.toLowerCase().includes("finished")) */ }
                                  isInningOver = latestInning?.status === 2
                                }

                                const teamInning = match?.scorecard?.innings?.find(inn => inn.batting_team_id === Number(p.team))
                                const isTeamUnavailable = isMatchOver || (isInningOver && teamInning?.number === Number(match?.match_info.latest_inning_number)) || false

                                return (
                                  <tr key={idx} className="border-b border-gray-700/50 hover:bg-gray-700/20 cursor-pointer">
                                    <td className="px-4 py-4">
                                      <div className="flex items-center gap-4">
                                        <div className="flex flex-col">
                                          <p className="font-bold text-white">{p.teamName}</p>
                                          <Link
                                            href={`/betting-interface?id=${p.matchId}`}
                                            className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors cursor-pointer"
                                          >
                                            {match?.match_info?.short_title || "..."}
                                          </Link>
                                        </div>
                                        <Button
                                          variant="secondary"
                                          size="sm"
                                          className={`font-bold text-xs ${(() => {
                                            const teamKey = Number(p.team) === getTeamA(match)?.team_id ? 'teama' : 'teamb'
                                            const sellWindowKey = `team_${p.matchId}_${teamKey}`
                                            if (canTrade && !isTeamUnavailable) {
                                              if (sellWindowActive[sellWindowKey]) {
                                                return "bg-red-600/50 hover:bg-red-600 text-white animate-pulse"
                                              } else {
                                                return "bg-green-600/50 hover:bg-green-600 text-white"
                                              }
                                            } else {
                                              return "bg-gray-600/50 text-gray-400 cursor-not-allowed"
                                            }
                                          })()}`}
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
                                          {(() => {
                                            const teamKey = Number(p.team) === getTeamA(match)?.team_id ? 'teama' : 'teamb'
                                            const sellWindowKey = `team_${p.matchId}_${teamKey}`
                                            if (canTrade && !isTeamUnavailable) {
                                              if (sellWindowActive[sellWindowKey]) {
                                                return `Sell (${sellWindowTimeLeft[sellWindowKey]}s)`
                                              } else {
                                                return "Trade"
                                              }
                                            } else {
                                              return "Unavailable"
                                            }
                                          })()}
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

          // Calculate current price from match data
          const currentPrice = calculateCurrentPriceFromMatch(match, portfolio.playerId);
          const boughtPrice = Number.parseFloat(portfolio.boughtPrice) || 0
          const totalValue = tradeQuantity * currentPrice

          // Calculate P&L using the calculated current price
          const quantity = Number.parseInt(portfolio.quantity, 10) || 0
          const { pnl, pnlPercent } = calculatePlayerPnL(boughtPrice, currentPrice, quantity);

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
                  <p className="text-sm text-gray-400">{match?.match_info?.short_title}</p>
                </div>

                {/* Player Holdings Info */}
                {isLoadingHoldings && (
                  <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                    <div className="text-center">
                      <p className="text-blue-300">Loading holdings information...</p>
                    </div>
                  </div>
                )}
                {playerHoldings && !isLoadingHoldings && (
                  <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-center text-sm">
                      <div>
                        <p className="text-blue-300">Total Investment</p>
                        <p className="text-white font-bold">₹{playerHoldings.totalInvestment}</p>
                      </div>
                      <div>
                        <p className="text-blue-300">Current Holdings</p>
                        <p className="text-white font-bold">{playerHoldings.totalQuantity}</p>
                      </div>
                      <div>
                        <p className="text-blue-300">Remaining Limit</p>
                        <p className="text-white font-bold">₹{playerHoldings.remainingInvestment}</p>
                      </div>
                    </div>
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
          const isTeamA = Number(portfolio.team) === getTeamA(match)?.team_id
          const team = isTeamA ? getTeamA(match) : getTeamB(match)

          const boughtPrice = Number.parseFloat(portfolio.boughtPrice) || 0

          // Get real-time current price from match data
          let currentPrice = Number.parseFloat(portfolio.currentPrice || "0") || 0
          if (match) {
            const teamStockPrices = getTeamStockPrices(match)
            const isTeamA = Number(portfolio.team) === getTeamA(match)?.team_id
            const teamKey = isTeamA ? 'teama' : 'teamb'
            const realTimePrice = teamStockPrices[teamKey]
            if (realTimePrice !== undefined && realTimePrice !== null) {
              currentPrice = realTimePrice
            }
          }
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
                  <p className="text-sm text-gray-400">{match?.match_info?.short_title}</p>
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
                        const maxQty = Math.max(0, Math.floor(25000 / (currentPrice || 1)));
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
                    className={`font-bold text-base ${(() => {
                      const teamKey = Number(portfolio.team) === getTeamA(match)?.team_id ? 'teama' : 'teamb'
                      const sellWindowKey = `team_${portfolio.matchId}_${teamKey}`
                      if (canTrade) {
                        if (sellWindowActive[sellWindowKey]) {
                          return "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                        } else {
                          return "bg-red-600 hover:bg-red-700 text-white"
                        }
                      } else {
                        return "bg-gray-600 text-gray-400 cursor-not-allowed"
                      }
                    })()}`}
                    onClick={() => {
                      const teamKey = Number(portfolio.team) === getTeamA(match)?.team_id ? 'teama' : 'teamb'
                      const sellWindowKey = `team_${portfolio.matchId}_${teamKey}`

                      if (!sellWindowActive[sellWindowKey]) {
                        toast.info("Sell window is not active. Wait for price changes to enable selling.")
                        return
                      }

                      handleTeamTradeAction("sell")
                    }}
                    disabled={(() => {
                      const teamKey = Number(portfolio.team) === getTeamA(match)?.team_id ? 'teama' : 'teamb'
                      const sellWindowKey = `team_${portfolio.matchId}_${teamKey}`
                      return !canTrade || !sellWindowActive[sellWindowKey]
                    })()}
                  >
                    {(() => {
                      const teamKey = Number(portfolio.team) === getTeamA(match)?.team_id ? 'teama' : 'teamb'
                      const sellWindowKey = `team_${portfolio.matchId}_${teamKey}`
                      if (canTrade) {
                        if (sellWindowActive[sellWindowKey]) {
                          return `Sell (${sellWindowTimeLeft[sellWindowKey]}s)`
                        } else {
                          return "Sell"
                        }
                      } else {
                        return "Sell"
                      }
                    })()}
                  </Button>
                </div>

                {/* Sell window message */}
                {(() => {
                  const teamKey = Number(portfolio.team) === getTeamA(match)?.team_id ? 'teama' : 'teamb'
                  const sellWindowKey = `team_${portfolio.matchId}_${teamKey}`
                  return !sellWindowActive[sellWindowKey] && canTrade && (
                    <div className="mt-3 text-center">
                      <p className="text-sm text-gray-400">
                        ⏰ Sell button will be enabled for 5 seconds after price updates
                      </p>
                    </div>
                  )
                })()}
              </div>
            </div>
          )
        })()}
    </div>
  )
}
