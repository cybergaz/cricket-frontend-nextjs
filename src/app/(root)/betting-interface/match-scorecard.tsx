"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Target, TrendingUp, Users, Star, HardHat, Radio, Mic2, Twitter, Instagram } from "lucide-react"
import type { CricketMatchData, Player, MatchScorecardProps, Innings } from "./types"
import { getRoleColor, buyPlayer, sellPlayer, formatMatchNotes, updateTeamStockPrice, buyTeam, sellTeam, checkPlayerHoldings, checkTeamHoldings, calculateTeamStockPrice, updateTeamStockPriceNew, autoSellPlayerPortfolios } from "./services"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Slider } from "@/components/ui/slider"
import { MatchInfoTicker } from "./components/match-info-ticker"
import { redirect } from "next/navigation"
import Image from "next/image"

// Helper function to calculate player price dynamically
const calculatePlayerPrice = (batsman: any, batsmanIndex: number) => {
  if (!batsman) return 0
  const basePrice = batsmanIndex <= 2 ? 35 : batsmanIndex < 5 ? 30 : 25
  return (
    basePrice -
    Number(batsman.run0 || 0) * 1.0 +
    Number(batsman.run1 || 0) * 0.75 +
    Number(batsman.run2 || 0) * 1.5 +
    Number(batsman.run3 || 0) * 2.25 +
    Number(batsman.fours || 0) * 3 +
    Number(batsman.sixes || 0) * 4.5
  )
}

// Helper function to calculate team stock price based on accumulated value
const calculateTeamStockPriceForDisplay = (innings: any[], battingTeamId: string, teamStockPrices: any) => {
  if (!innings || innings.length === 0) return 50; // Default launch price

  // Find the current inning where the team is batting
  const currentInning = innings.find(inning => inning.batting_team_id === battingTeamId);
  if (!currentInning || !currentInning.batsmen) return 50;

  let accumulatedPrice = 50; // Start with launch price
  const batsmen = currentInning.batsmen;

  // Sort batsmen by their batting order (assuming they come in order they played)
  // We'll use the array order as batting order since that's how they appear in the data
  batsmen.forEach((batsman: any, index: number) => {
    const runs = Number(batsman.runs) || 0;
    const isOut = batsman.how_out !== "Not out" && batsman.dismissal !== "";
    const isCurrentlyBatting = batsman.batting === "true" && batsman.dismissal === "";

    if (runs > 0) {
      // Add 20% of runs to accumulated price
      const runsContribution = runs * 0.2;
      accumulatedPrice += runsContribution;
    }

    // If player is out, subtract 10% from accumulated price
    if (isOut) {
      const outPenalty = accumulatedPrice * 0.1;
      accumulatedPrice -= outPenalty;
    }

    // For currently batting players, we still add their runs but don't apply out penalty yet
    if (isCurrentlyBatting && runs > 0) {
      // Runs are already added above, no additional penalty
    }
  });

  // Ensure price doesn't go below 0
  return Math.max(0, accumulatedPrice);
}

// Sub-component for the "Trade Now" tab to reduce repetition
const TradeInningScorecard = ({
  inning,
  inningIndex,
  inningTitle,
  openBettingModal,
  teamLogos,
  sellWindowActive,
  sellWindowTimeLeft,
  isPlayerCurrentlyBatting,
  isPlayerOut,
  canPlayerTrade,
  isInningOver,
  data,
  latestInningNumber,
  openTeamBettingModal,
  isUpdatingTeamStocks,
  canTeamTrade,
  wicketsIncreased,
}: {
  inning: Innings
  inningIndex: number
  inningTitle: string
  openBettingModal: (batsmanId: string, inningIndex: number) => void
  teamLogos: { teama: string; teamb: string }
  sellWindowActive: Record<string, boolean>
  sellWindowTimeLeft: Record<string, number>
  isPlayerCurrentlyBatting: (player: any) => boolean
  isPlayerOut: (player: any) => boolean
  canPlayerTrade: (player: any, inningIndex: number) => boolean
  isInningOver: (inningIndex: number) => boolean
  data: any
  latestInningNumber: number
  openTeamBettingModal: (team: any, inningIndex: number) => void
  isUpdatingTeamStocks: boolean
  canTeamTrade: (team: any, inningIndex: number) => boolean
  wicketsIncreased: boolean
}) => {
  const [subTab, setSubTab] = useState("batsmen")

  if (!inning) return null

  const sortedBatsmen = [...(inning.batsmen || [])].sort((a: any, b: any) => {
    const aNotOut = a.how_out === "Not out" || a.dismissal === ""
    const bNotOut = b.how_out === "Not out" || b.dismissal === ""
    if (aNotOut === bNotOut) return 0
    return aNotOut ? -1 : 1
  })

  // Determine which team is currently batting
  const battingTeam = inning.batting_team_id === data?.teama?.team_id ? data.teama : data?.teamb

  return (
    <div className="mb-8">
      <Card className="relative bg-transparent overflow-hidden rounded-none shadow-none -mx-3">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={teamLogos.teama || "/placeholder.svg"}
            alt="Team A"
            className="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-overlay scale-125 blur-sm"
          />
          <img
            src={teamLogos.teamb || "/placeholder.svg"}
            alt="Team B"
            className="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-overlay scale-125 blur-sm"
          />
        </div>
        <CardContent className="p-0 text-center space-y-4 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold tracking-wide bg-white/60 bg-clip-text text-transparent">
            {inningTitle}
          </h2>
        </CardContent>
      </Card>

      {/* Team Stocks Section - Only show for the current active inning when team is batting */}
      {battingTeam && canTeamTrade(battingTeam, inningIndex) && (
        <div className="mb-6">
          <div className="text-center mb-4">
            <p className="text-gray-400 text-xs mt-5">
              💡 Team stocks : +20% of runs scored, -10% when players get out
            </p>
          </div>

          <div className={`flex items-center justify-between p-4 rounded-lg transition ${!isInningOver(inningIndex)
            ? "bg-white/20 hover:bg-white/30"
            : "bg-white/5 opacity-60"
            }`}>
            <div className="flex items-center gap-4">
              <img
                src={battingTeam.logo_url || "/placeholder.svg"}
                alt={battingTeam.name}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <h3 className="text-lg font-bold text-white">{battingTeam.name}</h3>
                <p className="text-sm text-gray-300 flex items-center gap-2">
                  Current Price: ₹{(() => {
                    const storedPrice = data?.teamStockPrices?.[battingTeam.team_id === data.teama?.team_id ? 'teama' : 'teamb']
                    const calculatedPrice = calculateTeamStockPriceForDisplay(data?.innings || [], battingTeam.team_id, data?.teamStockPrices)
                    // Use calculated price if available, otherwise fall back to stored price or default
                    return (calculatedPrice || storedPrice || 50).toFixed(2)
                  })()}
                  {isUpdatingTeamStocks && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-yellow-400 bg-yellow-400/20 text-xs font-bold animate-pulse">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></span>
                      Updating...
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  if (!isInningOver(inningIndex)) {
                    openTeamBettingModal(battingTeam, inningIndex)
                  } else {
                    toast.info("Inning is over, cannot trade")
                  }
                }}
                className={`text-sm font-bold px-4 py-2 rounded-lg shadow-md transition-all duration-200 ${!isInningOver(inningIndex)
                  ? "bg-green-600/80 hover:bg-green-700/80 text-white cursor-pointer"
                  : "bg-gray-600/80 text-gray-400 cursor-not-allowed"
                  }`}
                disabled={isInningOver(inningIndex)}
              >
                Buy Team Stocks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wicket Increase Warning */}
      {wicketsIncreased && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <div className="flex items-center justify-center gap-2">
            <span className="text-red-400 text-lg">⚠️</span>
            <p className="text-red-400 text-sm font-bold text-center">
              Wicket fell! Sell windows are temporarily disabled for current batsmen until API updates.
            </p>
          </div>
        </div>
      )}

      <Tabs value={subTab} onValueChange={setSubTab} className="w-full mt-2">
        <TabsList className="flex w-full overflow-x-auto scrollbar-hide h-auto gap-1 md:gap-2 p-1 bg-white/5 rounded-xl">
          <TabsTrigger
            value="batsmen"
            className="flex-1 data-[state=active]:bg-white/80 data-[state=active]:text-sky-600 p-2 sm:py-1 text-md"
          >
            Batsmen
          </TabsTrigger>
          <TabsTrigger
            value="bowlers"
            className="flex-1 data-[state=active]:bg-white/80 data-[state=active]:text-sky-600 p-2 sm:py-1 text-md"
          >
            Bowlers
          </TabsTrigger>
        </TabsList>
        <TabsContent value="batsmen" className="mt-4 space-y-2">
          {
            inning.batsmen.length === 0 && (
              <div className="text-center text-gray-400">No batsmen data available</div>
            )
          }
          {sortedBatsmen.map((batsman: any) => {
            const isBatting = isPlayerCurrentlyBatting(batsman)
            const isOut = isPlayerOut(batsman)
            const canTrade = canPlayerTrade(batsman, inningIndex)

            return (
              <div
                key={batsman.batsman_id}
                onClick={() => {
                  if (canTrade) {
                    openBettingModal(batsman.batsman_id, inningIndex)
                  } else if (isOut) {
                    toast.info("Player is out. All holdings have been auto-sold at 50% loss.")
                  } else if (!isBatting) {
                    toast.info("Player is not currently batting")
                  } else if (isInningOver(inningIndex)) {
                    toast.info("Inning is Over")
                  }
                }}
                className={`flex items-center justify-between p-2 px-4 rounded-md transition text-xs sm:text-base ${canTrade ? "bg-white/20 hover:bg-white/30 cursor-pointer" : isOut ? "bg-red-500/20 opacity-80 cursor-not-allowed" : "bg-white/5 opacity-60 cursor-not-allowed"
                  }`}
              >
                <div>
                  <h3 className="flex items-center gap-2 text-sm sm:text-lg font-bold text-white">
                    {batsman.name}
                    {batsman.position == "striker" && <Badge className="text-xs p-1 px-2 text-white bg-white/30">Batting</Badge>}
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-white/70">
                    {batsman.runs} ({batsman.balls_faced})
                  </p>
                  {isOut && <p className="text-xs sm:text-sm font-bold text-red-400">{batsman.how_out}</p>}
                </div>
                <div className="text-right flex items-center gap-3 sm:gap-5">
                  <div className="flex flex-col items-end gap-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-white bg-white/10 text-xs sm:text-sm font-bold shadow-sm">
                      <span className="font-bold">SR:</span>
                      <span>{batsman.strike_rate}</span>
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1">
                        <span className="w-4 h-4 rounded bg-blue-500 text-white text-xs font-bold flex items-center justify-center shadow-sm border border-blue-400">
                          4
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-blue-200">{batsman.fours}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-4 h-4 rounded bg-yellow-400 text-black text-xs font-bold flex items-center justify-center shadow-sm border border-yellow-300">
                          6
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-yellow-200">{batsman.sixes}</span>
                      </span>
                    </div>
                  </div>
                  {canTrade && (
                    <button
                      type="button"
                      onClick={() => {
                        if (wicketsIncreased && isPlayerCurrentlyBatting(batsman)) {
                          toast.info("Sell windows are disabled due to recent wicket fall. Please wait for API updates.")
                          return
                        }
                        openBettingModal(batsman.batsman_id, inningIndex)
                      }}
                      className={`text-[13px] sm:text-sm font-extrabold px-4 py-2 rounded-lg shadow-md hover:scale-105 transition-all duration-200 flex items-center gap-2 cursor-pointer ${(() => {
                        if (wicketsIncreased && isPlayerCurrentlyBatting(batsman)) {
                          return "bg-yellow-600/80 text-white"
                        } else if (sellWindowActive[batsman.batsman_id]) {
                          return "bg-green-600/80 text-white animate-pulse"
                        } else {
                          return "bg-green-600/80 sm:bg-green-500/20 text-white"
                        }
                      })()}`}
                    >
                      <span>
                        {(() => {
                          if (wicketsIncreased && isPlayerCurrentlyBatting(batsman)) {
                            return "⚠️ Wicket Fell"
                          } else if (sellWindowActive[batsman.batsman_id]) {
                            return `Trade (${sellWindowTimeLeft[batsman.batsman_id]}s)`
                          } else {
                            return "Trade"
                          }
                        })()}
                      </span>
                    </button>
                  )}
                  {isOut && (
                    <button
                      type="button"
                      disabled
                      className="text-[13px] sm:text-sm font-extrabold px-4 py-2 rounded-lg shadow-md transition-all duration-200 flex items-center gap-2 cursor-not-allowed bg-red-600/80 text-white opacity-60"
                    >
                      <span> Out </span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </TabsContent>
        <TabsContent value="bowlers" className="mt-4 space-y-2">
          {
            (inning.bowlers || []).length === 0 && (
              <div className="text-center text-gray-400">No bowlers data available</div>
            )
          }

          {(inning.bowlers || []).map((bowler) => {
            const isCurrentBowler = bowler.bowling === "true"
            return (
              <div
                key={bowler.bowler_id}
                onClick={() => toast("Bowler's Stocks Coming Soon..")}
                className={`flex items-center justify-between p-2 rounded-md transition ${isCurrentBowler
                  ? "bg-white/20 hover:bg-white/30 cursor-pointer"
                  : "bg-transparent opacity-60 pointer-events-none select-none"
                  }`}
              >
                <div>
                  <h3
                    className={`flex items-center gap-2 text-sm sm:text-lg font-bold ${isCurrentBowler ? "text-white" : "text-gray-400"
                      }`}
                  >
                    {bowler.name}
                    {isCurrentBowler && <Badge className="text-xs p-1 text-red-400">*</Badge>}
                  </h3>
                  <p className={`text-xs sm:text-sm ${isCurrentBowler ? "text-white" : "text-gray-500"}`}>
                    {bowler.overs} ov, {bowler.maidens} m, {bowler.runs_conceded} r, {bowler.wickets} w
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-xs sm:text-base font-bold ${isCurrentBowler ? "text-white" : "text-gray-400"}`}>
                    Econ: {bowler.econ}
                  </p>
                </div>
              </div>
            )
          })}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function MatchScorecard({ matchData, matchId }: MatchScorecardProps) {
  // Component state

  const [isCommentaryOpen, setIsCommentaryOpen] = useState(false)
  const [isMatchInfoOpen, setIsMatchInfoOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("live")
  const [isBettingModalOpen, setIsBettingModalOpen] = useState(false)
  const [quantity, setQuantity] = useState<number[]>([1])
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [isYetToComeOpen, setIsYetToComeOpen] = useState(false)
  const [selectedBettingPlayerIdentity, setSelectedBettingPlayerIdentity] = useState<{
    batsmanId: string
    inningIndex: number
  } | null>(null)

  // Team betting modal state
  const [isTeamBettingModalOpen, setIsTeamBettingModalOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<any>(null)
  const [teamQuantity, setTeamQuantity] = useState<number[]>([1])
  const [selectedTeamInningIndex, setSelectedTeamInningIndex] = useState<number>(-1)
  const [isUpdatingTeamStocks, setIsUpdatingTeamStocks] = useState(false)

  // Player holdings state
  const [playerHoldings, setPlayerHoldings] = useState<any>(null)
  const [isLoadingHoldings, setIsLoadingHoldings] = useState(false)

  // Team holdings state
  const [teamHoldings, setTeamHoldings] = useState<any>(null)
  const [isLoadingTeamHoldings, setIsLoadingTeamHoldings] = useState(false)

  // 5-second sell window state
  const [sellWindowActive, setSellWindowActive] = useState<Record<string, boolean>>({})
  const [sellWindowTimeLeft, setSellWindowTimeLeft] = useState<Record<string, number>>({})

  // State to track if wickets have increased (to show warning in UI)
  const [wicketsIncreased, setWicketsIncreased] = useState<Record<string, boolean>>({})

  // Use useRef to maintain previous prices across renders
  const previousPrices = useRef<Record<string, number>>({})

  // Use useRef to maintain previous player stats for detecting changes
  const previousPlayerStats = useRef<Record<string, any>>({})

  // Add state to track previous dismissal status for auto-sell detection
  const previousDismissalStatus = useRef<Record<string, boolean>>({})

  // Add ref to track previous wicket counts to prevent sell window when wickets increase
  const previousWicketCounts = useRef<Record<string, number>>({})

  // Helper function to extract wicket count from score string (e.g., "47/6" -> 6)
  const extractWicketCount = (scoreString: string): number => {
    if (!scoreString) return 0
    const match = scoreString.match(/\/(\d+)$/)
    return match ? parseInt(match[1], 10) : 0
  }

  // --- Derived State ---
  // No more useState for data-derived properties. They are now derived on every render,
  // ensuring the UI is always in sync with the latest `matchData` prop.
  const hasData = matchData && Object.keys(matchData).length > 0
  const data: CricketMatchData | null = hasData ? matchData : null

  const match_id = data?.match_id || ""
  const latestInningNumber = data?.latest_inning_number ? Number(data.latest_inning_number) : 0
  const currentInnings = data?.innings && latestInningNumber > 0 ? data.innings[latestInningNumber - 1] : null
  const previousInnings = data?.innings && latestInningNumber > 1 ? data.innings[latestInningNumber - 2] : null

  const battingTeam =
    currentInnings && data?.teama && data?.teamb
      ? currentInnings.batting_team_id === data.teama.team_id
        ? data.teama
        : data.teamb
      : null

  const matchNotesNormalized = data?.match_notes
    ? Array.isArray(data.match_notes?.[0])
      ? (data.match_notes as unknown as string[][])
      : [[data.match_notes as string]]
    : [[]]

  // --- Memoized Calculations ---
  const allUsedBowlers = useMemo(() => {
    if (!data?.innings) return []
    const bowlerStats = new Map<string, any>()
    data.innings.forEach((inning) => {
      inning.bowlers.forEach((bowler) => {
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
    bowlerStats.forEach((bowler) => {
      const overs = Number(bowler.overs)
      const runs = Number(bowler.runs_conceded)
      bowler.econ = overs > 0 ? (runs / overs).toFixed(2) : "0.00"
    })
    return Array.from(bowlerStats.values())
  }, [data?.innings])

  // --- Live Betting Modal Data ---
  // The data for the modal is now derived with useMemo, so if the modal is open
  // and new `matchData` comes in, the stats will update in real-time.
  const { bettingPlayer, bettingPlayerIndex } = useMemo(() => {
    if (!selectedBettingPlayerIdentity || !data?.innings) {
      return { bettingPlayer: null, bettingPlayerIndex: -1 }
    }
    const { batsmanId, inningIndex } = selectedBettingPlayerIdentity
    const inning = data.innings[inningIndex]
    if (!inning?.batsmen) {
      return { bettingPlayer: null, bettingPlayerIndex: -1 }
    }
    const player = inning.batsmen.find((b) => b.batsman_id === batsmanId) || null
    const playerIndex = player ? inning.batsmen.findIndex((b) => b.batsman_id === batsmanId) : -1
    return { bettingPlayer: player, bettingPlayerIndex: playerIndex }
  }, [selectedBettingPlayerIdentity, data])

  // Price change detection and sell window activation
  useEffect(() => {
    if (!data?.innings || !data.latest_inning_number) return

    const currentInning = data.innings[Number(data.latest_inning_number) - 1]
    if (!currentInning?.batsmen) return

    // Check if wickets have increased
    const currentWicketCount = extractWicketCount(currentInning.scores)
    const previousWicketCount = previousWicketCounts.current[`inning_${data.latest_inning_number}`] || 0
    const wicketsIncreased = currentWicketCount > previousWicketCount

    // Log wicket changes for debugging
    if (currentWicketCount !== previousWicketCount) {
      console.log(`Wicket count changed for inning ${data.latest_inning_number}: ${previousWicketCount} -> ${currentWicketCount} (increased: ${wicketsIncreased})`)
    }

    // Update wicket increase state for UI
    setWicketsIncreased(prev => ({ ...prev, [`inning_${data.latest_inning_number}`]: wicketsIncreased }))

    // Clear wicket increase state after 10 seconds
    if (wicketsIncreased) {
      setTimeout(() => {
        setWicketsIncreased(prev => ({ ...prev, [`inning_${data.latest_inning_number}`]: false }))
      }, 10000)
    }

    // Update previous wicket count
    previousWicketCounts.current[`inning_${data.latest_inning_number}`] = currentWicketCount

    currentInning.batsmen.forEach((batsman) => {
      const batsmanIndex = currentInning.batsmen.findIndex((b) => b.batsman_id === batsman.batsman_id)
      const currentPrice = calculatePlayerPrice(batsman, batsmanIndex)
      const isOut = batsman.how_out !== "Not out" && batsman.dismissal !== ""
      const isCurrentlyBatting = batsman.batting === "true" && batsman.dismissal === ""

      // Check if price has changed for this player
      const lastPrice = previousPrices.current[batsman.batsman_id] || 0
      if (currentPrice !== lastPrice && lastPrice !== 0) {
        console.log(`Price changed for ${batsman.name}: ${lastPrice} -> ${currentPrice}`)

        // Only activate sell window if player is not out AND wickets haven't increased
        if (!isOut && !wicketsIncreased) {
          // Activate sell window for this player
          setSellWindowActive(prev => ({ ...prev, [batsman.batsman_id]: true }))
          setSellWindowTimeLeft(prev => ({ ...prev, [batsman.batsman_id]: 5 }))
        } else {
          // If player is out or wickets increased, close any existing sell window
          setSellWindowActive(prev => ({ ...prev, [batsman.batsman_id]: false }))
          setSellWindowTimeLeft(prev => ({ ...prev, [batsman.batsman_id]: 0 }))
          
          // If wickets increased and player is currently batting, log it
          if (wicketsIncreased && isCurrentlyBatting) {
            console.log(`Prevented sell window for ${batsman.name} due to wicket increase`)
            // Show a toast to inform users about the wicket increase preventing sell windows
            toast.info(`Wicket fell! Sell windows disabled for current batsmen until API updates.`)
          }
        }

        // Update the previous price after processing the change
        previousPrices.current[batsman.batsman_id] = currentPrice
      } else if (lastPrice === 0) {
        // First time setting price
        previousPrices.current[batsman.batsman_id] = currentPrice
      } else {
        // Update previous price even when no change detected (for tracking)
        previousPrices.current[batsman.batsman_id] = currentPrice
      }
    })
  }, [data?.innings, data?.latest_inning_number])

  // Team stock price update detection using new calculation method
  useEffect(() => {
    if (!data?.innings || !data.latest_inning_number || !data.match_id) return

    const currentInning = data.innings[Number(data.latest_inning_number) - 1]
    if (!currentInning?.batsmen) return

    // Update team stocks for both 1st and 2nd innings
    if (Number(data.latest_inning_number) !== 1 && Number(data.latest_inning_number) !== 2) return

    const battingTeam = currentInning.batting_team_id === data.teama?.team_id ? data.teama : data.teamb
    if (!battingTeam) return

    // Check if any player stats have changed
    let hasChanges = false
    currentInning.batsmen.forEach((batsman) => {
      const playerId = batsman.batsman_id
      const previousStats = previousPlayerStats.current[playerId]
      const wasOut = previousDismissalStatus.current[playerId] || false
      const isOut = batsman.how_out !== "Not out" && batsman.dismissal !== ""

      if (previousStats) {
        const currentRuns = Number(batsman.runs) || 0
        const previousRuns = Number(previousStats.runs) || 0
        const wasOutBefore = previousStats.how_out !== "Not out" && previousStats.dismissal !== ""

        if (currentRuns > previousRuns || (!wasOutBefore && isOut)) {
          hasChanges = true
        }

        // Check if player just got out (was not out before, but is out now)
        if (!wasOutBefore && isOut) {
          console.log(`Player ${batsman.name} just got out! Triggering auto-sell...`)

          // Close any open modals
          setIsBettingModalOpen(false)
          setIsTeamBettingModalOpen(false)
          setSelectedBettingPlayerIdentity(null)
          setSelectedTeam(null)

          // Trigger auto-sell for this player
          autoSellPlayerPortfolios(data.match_id, playerId)
            .then((result: any) => {
              if (result.success) {
                console.log(`Auto-sold ${result.data?.totalAutoSold || 0} portfolios for ${batsman.name}`)
                toast.success(`Auto-sold ${result.data?.totalAutoSold || 0} portfolios for ${batsman.name} at 50% loss`)
              } else {
                console.error("Failed to auto-sell player portfolios:", result.message)
              }
            })
            .catch((error: any) => {
              console.error("Error auto-selling player portfolios:", error)
            })
        }
      } else {
        // First time seeing this player, consider it a change
        hasChanges = true
      }

      // Update previous stats for this player
      previousPlayerStats.current[playerId] = {
        runs: batsman.runs,
        how_out: batsman.how_out,
        dismissal: batsman.dismissal,
      }

      // Update dismissal status
      previousDismissalStatus.current[playerId] = isOut
    })

    // If there are changes, recalculate team stock price
    if (hasChanges) {
      console.log(`Recalculating team stock price for ${battingTeam.name}`)

      // Show loading state for team stock updates
      setIsUpdatingTeamStocks(true)

      // Calculate new team stock price using accumulated method
      const calculatedPrice = calculateTeamStockPrice(data.innings, battingTeam.team_id)
      console.log(`Calculated team stock price: ${calculatedPrice}`)

      // Update team stock price using new calculation method
      updateTeamStockPriceNew(data.match_id, battingTeam.team_id, data.innings)
        .then((result: any) => {
          if (result.success) {
            console.log(`Team stock price updated: ${result.data.reason}`)
            toast.success(`Team stock updated: ${result.data.reason}`)

            // Activate sell window for team stocks
            const teamKey = battingTeam.team_id === data.teama?.team_id ? 'teama' : 'teamb'
            setSellWindowActive(prev => ({ ...prev, [`team_${teamKey}`]: true }))
            setSellWindowTimeLeft(prev => ({ ...prev, [`team_${teamKey}`]: 5 }))
          } else {
            console.error("Failed to update team stock price:", result.message)
            toast.error("Failed to update team stock price")
          }
        })
        .catch((error: any) => {
          console.error("Error updating team stock price:", error)
          toast.error("Error updating team stock price")
        })
        .finally(() => {
          setIsUpdatingTeamStocks(false)
          // Force a small delay to ensure backend has updated the data
          setTimeout(() => {
            // The parent component will fetch fresh data on the next interval
            // This just ensures we give the backend time to update
          }, 500)
        })
    }
  }, [data?.innings, data?.latest_inning_number, data?.match_id, data?.teama, data?.teamb])

  // --- Helper Functions ---
  const isPlayerCurrentlyBatting = (player: any) => {
    return player.batting === "true" && player.dismissal === ""
  }

  const isPlayerOut = (player: any) => {
    return player.how_out !== "Not out" && player.dismissal !== ""
  }

  const canPlayerTrade = (player: any, inningIndex: number) => {
    return isPlayerCurrentlyBatting(player) && !isPlayerOut(player) && inningIndex === (latestInningNumber - 1) && !isInningOver(inningIndex)
  }

  const isInningOver = (inningIndex: number) => {
    if (!data?.innings || inningIndex < 0 || inningIndex >= data.innings.length) return false
    const inning = data.innings[inningIndex]
    return inning?.status?.toLowerCase().includes("over") ||
      inning?.status?.toLowerCase().includes("completed") ||
      inning?.status?.toLowerCase().includes("finished")
  }

  const canTeamTrade = (team: any, inningIndex: number) => {
    // Only allow trading if:
    // 1. This is the current active inning
    // 2. The inning is not over
    // 3. The team is currently batting in this inning
    const isCurrentInning = inningIndex === (latestInningNumber - 1)
    const isInningActive = !isInningOver(inningIndex)
    const isTeamBatting = team.team_id === data?.innings?.[inningIndex]?.batting_team_id

    return isCurrentInning && isInningActive && isTeamBatting
  }

  // --- Event Handlers ---
  const openBettingModal = async (batsmanId: string, inningIndex: number) => {
    setSelectedBettingPlayerIdentity({ batsmanId, inningIndex })
    setIsBettingModalOpen(true)
    setQuantity([1]) // Reset quantity on open

    // Fetch player holdings
    setIsLoadingHoldings(true)
    try {
      if (matchId) {
        const holdingsResponse = await checkPlayerHoldings(matchId, batsmanId)
        if (holdingsResponse.success) {
          setPlayerHoldings(holdingsResponse.data)
        } else {
          console.error("Failed to fetch player holdings:", holdingsResponse.message)
          setPlayerHoldings(null)
        }
      } else {
        setPlayerHoldings(null)
      }
    } catch (error) {
      console.error("Error fetching player holdings:", error)
      setPlayerHoldings(null)
    } finally {
      setIsLoadingHoldings(false)
    }
  }

  const closeBettingModal = () => {
    setIsBettingModalOpen(false)
    setSelectedBettingPlayerIdentity(null)
  }

  const openTeamBettingModal = async (team: any, inningIndex: number) => {
    setSelectedTeam(team)
    setSelectedTeamInningIndex(inningIndex)
    setIsTeamBettingModalOpen(true)
    setTeamQuantity([1]) // Reset quantity on open

    // Fetch team holdings
    setIsLoadingTeamHoldings(true)
    try {
      if (matchId) {
        const holdingsResponse = await checkTeamHoldings(matchId, team.team_id)
        if (holdingsResponse.success) {
          setTeamHoldings(holdingsResponse.data)
        } else {
          console.error("Failed to fetch team holdings:", holdingsResponse.message)
          setTeamHoldings(null)
        }
      } else {
        setTeamHoldings(null)
      }
    } catch (error) {
      console.error("Error fetching team holdings:", error)
      setTeamHoldings(null)
    } finally {
      setIsLoadingTeamHoldings(false)
    }
  }

  const closeTeamBettingModal = () => {
    setIsTeamBettingModalOpen(false)
    setSelectedTeam(null)
    setSelectedTeamInningIndex(-1)
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" })
    }
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

  // console.log(data)
  if (!data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold">No Match Data Available</h1>
          <p className="text-xl mt-2 text-gray-400">Please check back later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-sky-600 via-transparent to-transparent">
      <div className="container max-w-[95rem] mx-auto px-3 py-4 space-y-4 overflow-x-hidden">
        {/* Status Note */}
        {data.status_note && (
          <div className="absolute top-19 left-1/2 transform -translate-x-1/2 flex justify-center w-full px-4">
            <div className="pr-3 pl-3 py-2 rounded-b-xl bg-[#7c8fa4] text-white text-sm md:text-base lg:text-xl font-bold shadow-lg flex items-center gap-2 max-w-[90vw]">
              <span className="text-red-500 bg-white px-2 md:px-4 rounded-full animate-pulse text-xs md:text-sm">
                Live
              </span>
              <span className="whitespace-nowrap truncate">{data.status_note}</span>
            </div>
          </div>
        )}

        {/* Match ID : {matchId} */}

        {/* Title & Teams */}
        <div className="text-center mt-20 max-sm:mt-10">
          <div className="flex flex-col items-center justify-center mb-5 gap-4">
            <h1 className="text-2xl md:text-4xl lg:text-6xl font-bold text-white px-4">
              {data.competition?.title || "No match data found"}
            </h1>
            {data.title && <div className="text-xs md:text-base text-gray-200 font-bold">{data.title}</div>}
          </div>
          <div className="flex items-center justify-center gap-4 sm:gap-8 md:gap-12 text-white px-4">
            <div className="flex items-center justify-center w-full">
              {/* Team A */}
              <div className="flex-1 flex flex-col items-center gap-2 md:gap-4 group">
                <img
                  src={data.teama?.logo_url || "/placeholder.svg"}
                  alt={data.teama?.name ?? "Team A"}
                  className="w-20 h-20 rounded-full shadow-lg backdrop-blur-md hover:scale-105 transition-transform duration-500"
                />
                <div className="text-center">
                  <span className="block font-extrabold">
                    <span className="text-xs sm:hidden">
                      {String(data.teama?.short_name ?? data.teama?.name ?? "").toLocaleUpperCase()}
                    </span>
                    <span className="hidden sm:inline text-2xl md:text-3xl xl:text-4xl font-extrabold">
                      {String(data.teama?.name ?? "").toLocaleUpperCase()}
                    </span>
                  </span>
                  <span className="block text-[10px] text-gray-300 sm:hidden leading-tight font-extrabold">
                    {data.teama?.name && data.teama?.short_name && data.teama?.name !== data.teama?.short_name
                      ? data.teama?.name
                      : ""}
                  </span>
                </div>
                {/* Team A Trading Button */}
                <button
                  onClick={() => {
                    if (data.teama && canTeamTrade(data.teama, latestInningNumber - 1)) {
                      openTeamBettingModal(data.teama, latestInningNumber - 1)
                    } else {
                      toast.info("Team trading is not available at this time")
                    }
                  }}
                  className={`mt-2 px-4 py-2 rounded-lg font-bold text-sm transition-all duration-200 ${canTeamTrade(data.teama, latestInningNumber - 1)
                    ? "bg-green-600/80 hover:bg-green-700/80 text-white"
                    : "bg-gray-600/80 text-gray-400 cursor-not-allowed"
                    }`}
                  disabled={!canTeamTrade(data.teama, latestInningNumber - 1)}
                >
                  Trade Team
                </button>
              </div>
              {/* VS in center */}
              <div className="flex-1 flex flex-col items-center justify-center px-2">
                <span className="text-2xl md:text-3xl font-extrabold text-sky-400 animate-pulse text-center">VS</span>
              </div>
              {/* Team B */}
              <div className="flex-1 flex flex-col items-center gap-2 md:gap-4 group">
                <img
                  src={data.teamb?.logo_url || "/placeholder.svg"}
                  alt={data.teamb?.name ?? "Team B"}
                  className="w-20 h-20 rounded-full shadow-lg backdrop-blur-md hover:scale-105 transition-transform duration-500"
                />
                <div className="text-center">
                  <span className="font-extrabold block">
                    <span className="text-xs sm:hidden">
                      {String(data.teamb?.short_name ?? data.teamb?.name ?? "").toLocaleUpperCase()}
                    </span>
                    <span className="hidden sm:inline text-2xl md:text-3xl xl:text-4xl font-extrabold">
                      {String(data.teamb?.name ?? "").toLocaleUpperCase()}
                    </span>
                  </span>
                  <span className="block text-[10px] text-gray-300 font-extrabold sm:hidden leading-tight">
                    {data.teamb?.name && data.teamb?.short_name && data.teamb?.name !== data.teamb?.short_name
                      ? data.teamb?.name
                      : ""}
                  </span>
                </div>
                {/* Team B Trading Button */}
                <button
                  onClick={() => {
                    if (data.teamb && canTeamTrade(data.teamb, latestInningNumber - 1)) {
                      openTeamBettingModal(data.teamb, latestInningNumber - 1)
                    } else {
                      toast.info("Team trading is not available at this time")
                    }
                  }}
                  className={`mt-2 px-4 py-2 rounded-lg font-bold text-sm transition-all duration-200 ${canTeamTrade(data.teamb, latestInningNumber - 1)
                    ? "bg-green-600/80 hover:bg-green-700/80 text-white"
                    : "bg-gray-600/80 text-gray-400 cursor-not-allowed"
                    }`}
                  disabled={!canTeamTrade(data.teamb, latestInningNumber - 1)}
                >
                  Trade Team
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-6 md:mt-10">
            <div className="relative mb-4 md:mb-6">
              <TabsList className="flex w-full overflow-x-auto scrollbar-hide h-auto gap-1 md:gap-5 p-1.5 bg-white/5 rounded-xl">
                {[
                  { value: "live", label: "Live", icon: Radio },
                  { value: "tradenow", label: "Trade Now", icon: TrendingUp },
                  { value: "bowling", label: "Bowling", icon: Target },
                  { value: "squads", label: "Squads", icon: Users },
                ].map(({ value, label, icon: Icon }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className={cn(
                      `flex items-center justify-center gap-1 md:gap-2 text-sm md:text-base lg:text-lg font-bold py-2 md:py-3 px-3 md:px-4 transition-colors duration-300 data-[state=active]:bg-white/80 data-[state=active]:text-sky-600 hover:bg-white/40 rounded-lg whitespace-nowrap flex-shrink-0 cursor-pointer`,
                      value === "tradenow" &&
                      "border-green-400/30 bg-green-400/10 animate-pulse data-[state=active]:animate-none data-[state=active]:border-none",
                    )}
                  >
                    <Icon className="hidden md:inline w-7 h-7 md:w-4 md:h-4 lg:w-5 lg:h-5" />
                    <span>{label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="live" className="space-y-4">
              {currentInnings && battingTeam ? (
                <Card className="rounded-2xl shadow-none overflow-hidden bg-slate-800/30">
                  <CardContent className="p-6 md:p-10 text-center space-y-4 md:space-y-6 flex flex-col items-center justify-center">
                    <div className="flex w-full items-center">
                      <div className="flex-1 flex justify-center items-center">
                        <img
                          src={battingTeam?.logo_url || "/placeholder.svg"}
                          alt={battingTeam?.name ?? "Batting Team"}
                          className="w-28 h-28 md:w-36 md:h-36 rounded-full shadow-2xl bg-white/10 hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="text-6xl md:text-7xl font-black text-white drop-shadow-xl tracking-wider">
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
                  <div className="bg-slate-800/60 rounded-lg p-2 md:p-4">
                    <div className="text-white text-base md:text-2xl flex items-center gap-2 p-2">
                      <HardHat className="w-5 h-5 md:w-10 md:h-10" />
                      Current Batsman
                    </div>
                    <div className="flex flex-col gap-1 md:gap-2 p-2">
                      {currentInnings.batsmen
                        ?.filter((b: any) => b.batting === "true" && b.dismissal === "")
                        .map((batsman: any) => (
                          <div
                            key={batsman.batsman_id}
                            className="flex items-center justify-between text-sm bg-white/20 rounded-2xl md:text-base p-3 cursor-pointer hover:bg-white/30"
                            onClick={() => openBettingModal(batsman.batsman_id, latestInningNumber - 1)}
                          >
                            <span className="font-bold text-white">
                              {batsman.name}
                              {batsman.position == "striker" && <Image src="/images/bat.png" alt="Batting" width={16} height={16} className="inline-block ml-1 size-5" />}
                              <button className="bg-green-700 text-white text-[12px] sm:text-xs font-bold px-2 py-1 rounded-md hover:bg-emerald-700 transition ml-3 cursor-pointer">
                                Trade Now
                              </button>
                            </span>
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
                          <div
                            key={bowler.bowler_id}
                            className="flex flex-1 items-center justify-between p-2 md:p-3 rounded-xl bg-white/20 min-h-[44px] md:min-h-[52px] w-full cursor-pointer"
                            onClick={() => toast("Bowler's Stock Coming Soon...")}
                          >
                            <span className="font-bold text-white text-sm md:text-xl flex-1 truncate">
                              {bowler.name}
                            </span>
                            <span className="text-gray-300 text-xs md:text-lg flex-1 text-right">
                              {bowler.overs} ov, {bowler.wickets} wkts, Econ: {bowler.econ}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Yet-to-come Batsmen TBA (Animated Slide Down) */}
              {currentInnings && currentInnings.batsmen && currentInnings.batsmen.length > 0 && (
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
                        {
                          currentInnings.did_not_bat
                            .map((batsman: any, idx: number) => (
                              <motion.li
                                key={batsman.player_id}
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.05 * idx, duration: 0.25, type: "spring", stiffness: 200 }}
                                className="text-xs md:text-base text-gray-200 px-3 py-1"
                              >
                                {batsman.name}
                              </motion.li>
                            ))
                        }
                      </ul>
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}

              {/* Compact Info Bar: Pitch, Weather, Toss, Umpires */}
              {(data?.umpires || data?.referee || data?.venue || data?.weather || data?.pitch) && (
                <div className="w-full mt-2">
                  <MatchInfoTicker
                    umpires={data?.umpires}
                    referee={data?.referee}
                    venue={data?.venue}
                    weather={data?.weather}
                    pitch={data?.pitch}
                  />
                </div>
              )}

              {/* Collapsible Commentary Section */}
              {data?.match_notes && data?.match_notes.length > 0 && (
                <div className="bg-slate-800/40 rounded-lg p-2 md:p-4 mt-2">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-2 focus:outline-none transition"
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

              {/* Collapsible Weather, Toss, Pitch, Umpires & Referee Section */}
              {(data?.weather || data?.toss || data?.pitch || data?.umpires || data?.referee || data?.venue) && (
                <div className="bg-slate-800/40 rounded-lg p-2 md:p-4 mt-2">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-2 focus:outline-none transition"
                    onClick={() => setIsMatchInfoOpen?.((prev: boolean) => !prev)}
                  >
                    <span className="flex items-center gap-2 text-white text-base md:text-2xl">
                      <svg className="w-5 h-5 md:w-8 md:h-8 text-white" fill="none" viewBox="0 0 24 24">
                        <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 2a8 8 0 110 16 8 8 0 010-16zm0 2a6 6 0 100 12A6 6 0 0012 6z" fill="currentColor" />
                      </svg>
                      Match Info
                    </span>
                    <svg
                      className={`w-5 h-5 transition-transform duration-300 ${isMatchInfoOpen ? "rotate-90" : "rotate-0"}`}
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
                      key="matchinfo"
                      initial={false}
                      animate={isMatchInfoOpen ? { height: "auto", opacity: 1, marginTop: 12 } : { height: 0, opacity: 0, marginTop: 0 }}
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
                          <div className="space-y-3">
                            {data?.weather && (
                              <div className="flex items-start gap-2">
                                <span className="font-bold text-sky-300 min-w-[80px]">Weather</span>
                                <span className="text-gray-200">
                                  {data.weather.weather && <span>{data.weather.weather}</span>}
                                  {data.weather.temp && (
                                    <span className="ml-2">Temp: {data.weather.temp}°C</span>
                                  )}
                                  {data.weather.humidity && (
                                    <span className="ml-2">Humidity: {data.weather.humidity}%</span>
                                  )}
                                  {data.weather.wind_speed && (
                                    <span className="ml-2">Wind: {data.weather.wind_speed}</span>
                                  )}
                                  {data.weather.weather_desc && (
                                    <span className="ml-2">{data.weather.weather_desc}</span>
                                  )}
                                </span>
                              </div>
                            )}
                            {data?.toss && (
                              <div className="flex items-start gap-2">
                                <span className="font-bold text-yellow-300 min-w-[80px]">Toss</span>
                                <span className="text-gray-200">{data.toss.text}</span>
                              </div>
                            )}
                            {data?.pitch && (
                              <div className="flex items-start gap-2">
                                <span className="font-bold text-green-300 min-w-[80px]">Pitch</span>
                                <span className="text-gray-200">{data.pitch.pitch_condition}</span>
                                <span className="text-gray-200">{data.pitch.batting_condition}</span>
                                <span className="text-gray-200">{data.pitch.pace_bowling_condition}</span>
                                <span className="text-gray-200">{data.pitch.spine_bowling_condition}</span>
                              </div>
                            )}
                            {data?.umpires && (
                              <div className="flex items-start gap-2">
                                <span className="font-bold text-indigo-300 min-w-[80px]">Umpires</span>
                                <span className="text-gray-200">{data.umpires}</span>
                              </div>
                            )}
                            {data?.referee && (
                              <div className="flex items-start gap-2">
                                <span className="font-bold text-pink-300 min-w-[80px]">Referee</span>
                                <span className="text-gray-200">{data.referee}</span>
                              </div>
                            )}
                            {data?.venue && (
                              <div className="flex items-start gap-2">
                                <span className="font-bold text-orange-300 min-w-[80px]">Venue</span>
                                <span className="text-gray-200 mr-2">
                                  <span className="font-semibold capitalize"></span> {String(data.venue.name)}, {String(data.venue.location)}, {String(data.venue.country)}
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>

            <TabsContent value="tradenow">
              {currentInnings && (
                <TradeInningScorecard
                  inning={currentInnings}
                  inningIndex={latestInningNumber - 1}
                  inningTitle={`${latestInningNumber}${latestInningNumber === 1 ? "st" : latestInningNumber === 2 ? "nd" : "th"
                    } Innings`}
                  openBettingModal={openBettingModal}
                  teamLogos={{
                    teama: data.teama?.logo_url || "",
                    teamb: data.teamb?.logo_url || "",
                  }}
                  sellWindowActive={sellWindowActive}
                  sellWindowTimeLeft={sellWindowTimeLeft}
                  isPlayerCurrentlyBatting={isPlayerCurrentlyBatting}
                  isPlayerOut={isPlayerOut}
                  canPlayerTrade={canPlayerTrade}
                  isInningOver={isInningOver}
                  data={data}
                  latestInningNumber={latestInningNumber}
                  openTeamBettingModal={openTeamBettingModal}
                  isUpdatingTeamStocks={isUpdatingTeamStocks}
                  canTeamTrade={canTeamTrade}
                  wicketsIncreased={wicketsIncreased[`inning_${latestInningNumber}`] || false}
                />
              )}
              {previousInnings && (
                <TradeInningScorecard
                  inning={previousInnings}
                  inningIndex={latestInningNumber - 2}
                  inningTitle={`${latestInningNumber - 1}${latestInningNumber - 1 === 1 ? "st" : latestInningNumber - 1 === 2 ? "nd" : "th"
                    } Innings`}
                  openBettingModal={openBettingModal}
                  teamLogos={{
                    teama: data.teama?.logo_url,
                    teamb: data.teamb?.logo_url,
                  }}
                  sellWindowActive={sellWindowActive}
                  sellWindowTimeLeft={sellWindowTimeLeft}
                  isPlayerCurrentlyBatting={isPlayerCurrentlyBatting}
                  isPlayerOut={isPlayerOut}
                  canPlayerTrade={canPlayerTrade}
                  isInningOver={isInningOver}
                  data={data}
                  latestInningNumber={latestInningNumber}
                  openTeamBettingModal={openTeamBettingModal}
                  isUpdatingTeamStocks={isUpdatingTeamStocks}
                  canTeamTrade={canTeamTrade}
                  wicketsIncreased={wicketsIncreased[`inning_${latestInningNumber - 1}`] || false}
                />
              )}
            </TabsContent>
            <TabsContent value="bowling">
              {/* Bowling Stocks Coming Soon Banner */}
              <div className="mb-6 p-4 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <span className="text-yellow-400 text-lg">🎯</span>
                  </div>
                  <div className="text-center">
                    <h3 className="text-yellow-400 font-bold text-lg">Bowling Stocks Coming Soon!</h3>
                    <p className="text-yellow-300/80 text-sm">Trade bowlers and earn from their performance</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                {allUsedBowlers.length > 0 ? (
                  allUsedBowlers.map((bowler) => (
                    <Card key={bowler.bowler_id} className="bg-slate-800/50 border-slate-700/50 rounded-lg">
                      <CardContent className="p-3 sm:p-4">
                        <h3 className="text-base sm:text-lg font-bold text-white px-1">{bowler.name}</h3>
                        <div className="grid grid-cols-5 gap-1 mt-2 text-center">
                          {[
                            { label: "Overs", value: bowler.overs },
                            { label: "Maidens", value: bowler.maidens },
                            { label: "Runs", value: bowler.runs_conceded },
                            { label: "Wickets", value: bowler.wickets },
                            { label: "Economy", value: bowler.econ },
                          ].map((stat) => (
                            <div key={stat.label}>
                              <p className="text-xs text-gray-400">{stat.label}</p>
                              <p className="text-sm sm:text-base font-bold text-white">{stat.value}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="bg-slate-800/50 col-span-full">
                    <CardContent className="p-4 text-center">
                      <p className="text-gray-300 text-xl font-bold">Match Has Not Started Yet</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="squads">
              <div className="space-y-4">
                {data.players && data.players.length > 0 ? (
                  Array.from(new Set(data.players.map((p) => p.nationality))).map((nationality) => (
                    <Card key={nationality} className="shadow-none bg-slate-800/50">
                      <CardHeader className="p-2 sm:p-4">
                        <CardTitle className="text-2xl md:text-3xl text-white flex items-center gap-2 px-2">
                          {nationality}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-2 sm:p-4 pt-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {data.players
                            .filter((player) => player.nationality === nationality)
                            .map((player) => (
                              <div
                                key={player.pid}
                                className="px-4 py-2 rounded-lg hover:bg-white/10 cursor-pointer"
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
                                        player.playing_role,
                                      )} text-white border-0 font-extrabold px-2 py-0.5`}
                                    >
                                      {player.playing_role.toUpperCase() === "BAT"
                                        ? "Batsman"
                                        : player.playing_role.toUpperCase() === "BOWL"
                                          ? "Bowler"
                                          : player.playing_role.toUpperCase() === "ALL"
                                            ? "All Rounder"
                                            : player.playing_role.toUpperCase() === "WK"
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
                    <CardContent className="p-4 text-center">
                      <p className="text-gray-300 text-3xl font-bold">Match Is Not Started Yet</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Player Info Modal */}
          {selectedPlayer && isPlayerModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4">
              <div className="relative w-full max-w-sm sm:max-w-md rounded-2xl bg-gradient-to-br from-gray-900/90 via-gray-900/95 to-gray-900 shadow-2xl p-5 sm:p-6 text-gray-300">

                {/* Header */}
                <div className="flex flex-row items-center gap-3 sm:gap-6 mb-4 w-full">
                  {/* Team Image or Player Image */}
                  {(() => {
                    const nationality = selectedPlayer.nationality || selectedPlayer.country || "";
                    let teamLogoUrl: string | null = null;
                    if (
                      data &&
                      data.teama &&
                      data.teama.name &&
                      nationality &&
                      nationality.toLowerCase() === data.teama.name.toLowerCase()
                    ) {
                      teamLogoUrl = data.teama.logo_url;
                    } else if (
                      data &&
                      data.teamb &&
                      data.teamb.name &&
                      nationality &&
                      nationality.toLowerCase() === data.teamb.name.toLowerCase()
                    ) {
                      teamLogoUrl = data.teamb.logo_url;
                    }

                    if (selectedPlayer.profile_image || selectedPlayer.thumb_url) {
                      return (
                        <img
                          src={selectedPlayer.profile_image || selectedPlayer.thumb_url}
                          alt={selectedPlayer.title}
                          className="w-16 h-16 sm:w-24 sm:h-24 rounded-full object-cover shadow-md flex-shrink-0"
                        />
                      );
                    } else if (teamLogoUrl) {
                      return (
                        <img
                          src={teamLogoUrl}
                          alt={nationality}
                          className="w-16 h-16 sm:w-24 sm:h-24 rounded-full object-cover shadow-md flex-shrink-0"
                        />
                      );
                    } else {
                      return (
                        <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gray-700 flex items-center justify-center text-base sm:text-xl font-bold text-white flex-shrink-0">
                          {selectedPlayer.short_name || "NA"}
                        </div>
                      );
                    }
                  })()}
                  {/* Player Name */}
                  <div className="flex-1 flex flex-col items-center sm:items-start justify-center">
                    <h2 className="text-lg sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                      <span className="block max-w-xs truncate">{selectedPlayer.title || "Player Info"}</span>
                    </h2>
                    {(selectedPlayer.twitter_profile || selectedPlayer.instagram_profile) && (
                      <div className="mt-2 flex gap-3 text-blue-400 text-lg">
                        {selectedPlayer.twitter_profile && (
                          <a
                            href={selectedPlayer.twitter_profile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-blue-500 transition-colors cursor-pointer"
                            aria-label="Twitter"
                          >
                            <Twitter className="w-5 h-5 sm:w-6 sm:h-6" />
                          </a>
                        )}
                        {selectedPlayer.instagram_profile && (
                          <a
                            href={selectedPlayer.instagram_profile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-pink-400 transition-colors cursor-pointer"
                            aria-label="Instagram"
                          >
                            <Instagram className="w-5 h-5 sm:w-6 sm:h-6" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Close Button */}
                  <button
                    onClick={() => setIsPlayerModalOpen(false)}
                    className="text-gray-400 hover:text-white transition-colors duration-150 text-lg sm:text-2xl cursor-pointer"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                {/* Table-like Info Layout */}
                <div className="w-full divide-y divide-gray-700 border border-gray-700 rounded-md overflow-hidden text-sm sm:text-base">
                  {[
                    ['Full Name', selectedPlayer.first_name || 'N/A'],
                    ['Role', selectedPlayer.playing_role || selectedPlayer.role || 'N/A'],
                    ['Batting Style', selectedPlayer.batting_style || 'N/A'],
                    ['Bowling Style', selectedPlayer.bowling_style || 'N/A'],
                    ['Bowling Type', selectedPlayer.bowling_type || 'N/A'],
                    ['Nationality', selectedPlayer.nationality || selectedPlayer.country || 'N/A'],
                    ['Birthdate', selectedPlayer.birthdate || 'N/A'],
                    ['Birthplace', selectedPlayer.birthplace || 'N/A'],
                    ['Fantasy Rating', selectedPlayer.fantasy_player_rating || 'N/A'],
                  ].map(([label, value]) => (
                    value !== 'N/A' && (
                      <div key={label} className="grid grid-cols-1 sm:grid-cols-2 p-2 sm:p-3 bg-gray-900/40">
                        <span className="text-gray-400">{label}:</span>
                        <span className="sm:text-right">{value}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>
          )}          {/* Betting Modal (Now fully dynamic) */}
          {isBettingModalOpen && bettingPlayer && bettingPlayerIndex !== -1 && (
            <div className="fixed inset-0 z-50 w-full h-full flex items-center justify-center bg-black/70 backdrop-blur-lg p-4 overflow-y-auto">
              <div className="w-full max-w-lg rounded-2xl bg-gradient-to-br from-gray-900/90 to-gray-900 p-4 sm:p-6 md:p-8 shadow-2xl">
                {/* Header */}
                <div className="mb-4 sm:mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <img
                      src={
                        data.teama?.team_id ===
                          data.innings?.[selectedBettingPlayerIdentity!.inningIndex]?.batting_team_id
                          ? data.teama?.logo_url
                          : data.teamb?.logo_url
                      }
                      alt="Team Logo"
                      className="size-12 sm:size-14 rounded-full shadow-xl"
                    />
                    <h2 className="text-lg sm:text-xl font-extrabold text-white">{bettingPlayer.name}</h2>
                    {bettingPlayer.position == "striker" && <Badge className="text-xs p-1 px-2 text-white bg-white/30">Batting</Badge>}
                  </div>
                  <button
                    onClick={closeBettingModal}
                    className="text-gray-400 transition-colors hover:text-white text-xl sm:text-2xl"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                {/* Player Status Indicator */}
                {(() => {
                  const isCurrentlyBatting = isPlayerCurrentlyBatting(bettingPlayer)
                  const isOut = isPlayerOut(bettingPlayer)

                  if (isOut) {
                    return (
                      <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                        <p className="text-red-400 text-sm font-bold text-center">
                          ⚠️ This player is out and cannot be traded. All holdings have been auto-sold at 50% loss.
                        </p>
                      </div>
                    )
                  } else if (!isCurrentlyBatting) {
                    return (
                      <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                        <p className="text-yellow-400 text-sm font-bold text-center">
                          ⏳ This player is not currently batting
                        </p>
                      </div>
                    )
                  } else {
                    return (
                      <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                        <p className="text-green-400 text-sm font-bold text-center">
                          ✅ This player is currently batting and can be traded
                        </p>
                      </div>
                    )
                  }
                })()}

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
                      {/* <div> */}
                      {/*   <p className="text-blue-300">Max Quantity</p> */}
                      {/*   <p className="text-white font-bold">{playerHoldings.maxQuantity}</p> */}
                      {/* </div> */}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 text-center">
                  {[
                    { label: "Runs", value: bettingPlayer.runs },
                    { label: "Balls", value: bettingPlayer.balls_faced },
                    { label: "SR", value: bettingPlayer.strike_rate },
                    { label: "Fours", value: bettingPlayer.fours },
                    { label: "Sixes", value: bettingPlayer.sixes },
                    { label: "Dot %", value: bettingPlayer.run0 },
                    {
                      label: "Base Price",
                      value: `₹${bettingPlayerIndex <= 2 ? 35 : bettingPlayerIndex < 5 ? 30 : 25}`,
                    },
                    { label: "Current Price", value: `₹${calculatePlayerPrice(bettingPlayer, bettingPlayerIndex)}` },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-gray-800/40 rounded-lg p-2 sm:p-3">
                      <p className="text-xs sm:text-sm text-gray-300">
                        {stat.label === "Current Price" ? (
                          <>
                            <span
                              className="text-gray-300"
                            >
                              <span className="sm:inline hidden">Current</span>
                              <span className="inline sm:hidden">Current Price</span>
                            </span>
                          </>
                        ) : (
                          stat.label
                        )}
                      </p>
                      <p
                        className={
                          stat.label === "Current Price"
                            ? `text-base sm:text-xl font-semibold ${calculatePlayerPrice(bettingPlayer, bettingPlayerIndex) > (bettingPlayerIndex <= 2 ? 35 : bettingPlayerIndex < 5 ? 30 : 25)
                              ? "text-green-400"
                              : calculatePlayerPrice(bettingPlayer, bettingPlayerIndex) < (bettingPlayerIndex <= 2 ? 35 : bettingPlayerIndex < 5 ? 30 : 25)
                                ? "text-red-400"
                                : "text-white"
                            }`
                            : "text-base sm:text-xl font-semibold text-white"
                        }
                      >
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Quantity Slider & Input */}
                <div className="mt-6 sm:mt-8">
                  <Slider
                    value={quantity}
                    onValueChange={setQuantity}
                    defaultValue={[1]}
                    max={(() => {
                      if (playerHoldings) {
                        // Use the remaining investment limit from holdings
                        const maxFromHoldings = Math.floor(Number(playerHoldings.remainingInvestment) / calculatePlayerPrice(bettingPlayer, bettingPlayerIndex))
                        const maxFromBalance = Math.max(0, Math.floor(25000 / calculatePlayerPrice(bettingPlayer, bettingPlayerIndex)))
                        return Math.min(maxFromHoldings, maxFromBalance)
                      } else {
                        // Fallback to original calculation
                        return Math.max(0, Math.floor(25000 / calculatePlayerPrice(bettingPlayer, bettingPlayerIndex)))
                      }
                    })()}
                    step={1}
                    className="my-4"
                  />
                  <div className="flex justify-between w-full text-xs font-semibold mb-4">
                    <span>{quantity[0]}</span>
                    <span>
                      {(() => {
                        if (playerHoldings) {
                          const maxFromHoldings = Math.floor(Number(playerHoldings.remainingInvestment) / calculatePlayerPrice(bettingPlayer, bettingPlayerIndex))
                          const maxFromBalance = Math.max(0, Math.floor(25000 / calculatePlayerPrice(bettingPlayer, bettingPlayerIndex)))
                          return Math.min(maxFromHoldings, maxFromBalance)
                        } else {
                          return Math.max(0, Math.floor(25000 / calculatePlayerPrice(bettingPlayer, bettingPlayerIndex)))
                        }
                      })()}
                    </span>
                  </div>

                  {/* === Quantity Selector === */}
                  <div className="mt-6 sm:mt-8">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                      <div className="flex-1 flex flex-col">
                        <label
                          className="text-xs sm:text-sm font-bold text-gray-300 mb-1"
                          htmlFor="quantity-input"
                        >
                          Quantity
                        </label>
                        <Input
                          id="quantity-input"
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          pattern="[0-9]*"
                          value={quantity[0] === 0 ? "" : quantity[0]}
                          className="text-white placeholder:text-gray-400 border-0 font-extrabold bg-gray-800/60 rounded-lg px-3 py-2 text-sm sm:text-base"
                          onChange={(e) => {
                            const val = e.target.value;

                            // Only allow digits
                            if (!/^\d*$/.test(val)) return;

                            if (val === "") {
                              setQuantity([0]);
                              return;
                            }

                            let numVal = Number(val);
                            const maxQty = (() => {
                              if (playerHoldings) {
                                const maxFromHoldings = Math.floor(Number(playerHoldings.remainingInvestment) / (calculatePlayerPrice(bettingPlayer, bettingPlayerIndex) || 1))
                                const maxFromBalance = Math.max(0, Math.floor(25000 / (calculatePlayerPrice(bettingPlayer, bettingPlayerIndex) || 1)))
                                return Math.min(maxFromHoldings, maxFromBalance)
                              } else {
                                return Math.max(0, Math.floor(25000 / (calculatePlayerPrice(bettingPlayer, bettingPlayerIndex) || 1)))
                              }
                            })()
                            if (numVal > maxQty) numVal = maxQty;

                            setQuantity([numVal]);
                          }}
                          onWheel={(e) => e.currentTarget.blur()}
                          onKeyDown={(e) => {
                            if (["ArrowUp", "ArrowDown", "e", "+", "-"].includes(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          style={{ MozAppearance: "textfield" }}
                        />
                      </div>
                      <div className="flex-1 flex flex-col lg:items-end">
                        <label className="text-xs sm:text-sm font-bold text-gray-300 mb-1" htmlFor="price-input">
                          Price
                          <span
                            className={`ml-2 text-xs mt-1 font-bold ${(() => {
                              const maxAmount = playerHoldings ? Number(playerHoldings.remainingInvestment) : 25000
                              return calculatePlayerPrice(bettingPlayer, bettingPlayerIndex) * quantity[0] > maxAmount ? "text-red-500" : "text-gray-400"
                            })()}`}
                          >
                            (Max: ₹{playerHoldings ? playerHoldings.remainingInvestment : "25000"})
                          </span>
                        </label>
                        <Input
                          id="price-input"
                          className="text-gray-300 border-0 font-extrabold bg-transparent rounded-lg px-3 py-2 lg:text-end text-sm sm:text-base"
                          placeholder={`₹${calculatePlayerPrice(bettingPlayer, bettingPlayerIndex) * quantity[0]}`}
                          value={`₹${calculatePlayerPrice(bettingPlayer, bettingPlayerIndex) * quantity[0]}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Buy/Sell Buttons */}
                <div className="mt-6 sm:mt-8 flex flex-col md:flex-row gap-3 sm:gap-4">
                  <button
                    className={`flex-1 rounded-lg sm:rounded-xl font-bold py-3 text-sm sm:text-base shadow-md transition ${(() => {
                      const isCurrentlyBatting = isPlayerCurrentlyBatting(bettingPlayer)
                      const isOut = isPlayerOut(bettingPlayer)
                      return isCurrentlyBatting && !isOut
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-gray-600 text-gray-400 cursor-not-allowed"
                    })()
                      }`}
                    onClick={async () => {
                      // Check if player is currently batting
                      const isCurrentlyBatting = isPlayerCurrentlyBatting(bettingPlayer)
                      const isOut = isPlayerOut(bettingPlayer)

                      if (!isCurrentlyBatting || isOut) {
                        toast.error("Cannot buy player who is not currently batting")
                        return
                      }

                      closeBettingModal()
                      if (data.status_str == "match_over" || data.status_str == "match ended" || data.status_str == "match finished" || data.status_str == "Completed" || data.status_str == "Cancelled") {
                        toast.info("Match is over, Redirecting...");
                        setTimeout(() => {
                          redirect("/live-matches")
                        }, 200);
                        return;
                      }

                      // Check if inning is over
                      if (selectedBettingPlayerIdentity && isInningOver(selectedBettingPlayerIdentity.inningIndex)) {
                        toast.info("Inning is over, Redirecting...");
                        setTimeout(() => {
                          redirect("/live-matches")
                        }, 200);
                        return;
                      }
                      const buyingResponse = await buyPlayer(
                        bettingPlayer,
                        String(calculatePlayerPrice(bettingPlayer, bettingPlayerIndex)),
                        String(quantity[0]),
                        match_id,
                      )
                      toast.success(buyingResponse.message)
                    }}
                    disabled={(() => {
                      const isCurrentlyBatting = isPlayerCurrentlyBatting(bettingPlayer)
                      const isOut = isPlayerOut(bettingPlayer)
                      return !isCurrentlyBatting || isOut
                    })()}
                  >
                    Buy Player
                  </button>
                  <button
                    className={`flex-1 rounded-lg sm:rounded-xl font-bold py-3 text-sm sm:text-base shadow-md transition ${(() => {
                      const isCurrentlyBatting = isPlayerCurrentlyBatting(bettingPlayer)
                      const isOut = isPlayerOut(bettingPlayer)

                      if (isOut) {
                        return "bg-gray-600 text-gray-400 cursor-not-allowed"
                      } else if (sellWindowActive[bettingPlayer.batsman_id]) {
                        return "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                      } else {
                        return "bg-gray-600 text-gray-400 cursor-not-allowed"
                      }
                    })()}`}
                    onClick={async () => {
                      const isOut = isPlayerOut(bettingPlayer)

                      if (isOut) {
                        toast.info("Player is out. All holdings have been auto-sold at 50% loss.")
                        return
                      }

                      if (!sellWindowActive[bettingPlayer.batsman_id]) {
                        toast.info("Sell window is not active. Wait for price changes to enable selling.")
                        return
                      }
                      closeBettingModal()
                      if (data.status_str == "match_over" || data.status_str == "match ended" || data.status_str == "match finished" || data.status_str == "Completed" || data.status_str == "Cancelled") {
                        toast.info("Match is over, Redirecting...");
                        setTimeout(() => {
                          redirect("/live-matches")
                        }, 1000);
                        return;
                      }

                      // Check if inning is over
                      if (selectedBettingPlayerIdentity && isInningOver(selectedBettingPlayerIdentity.inningIndex)) {
                        toast.info("Inning is over, Redirecting...");
                        setTimeout(() => {
                          redirect("/live-matches")
                        }, 1000);
                        return;
                      }
                      const sellingResponse = await sellPlayer(
                        bettingPlayer,
                        String(calculatePlayerPrice(bettingPlayer, bettingPlayerIndex)),
                        String(quantity[0]),
                        match_id,
                      )
                      toast.success(sellingResponse.message)
                    }}
                    disabled={(() => {
                      const isOut = isPlayerOut(bettingPlayer)
                      return isOut || !sellWindowActive[bettingPlayer.batsman_id]
                    })()}
                  >
                    {(() => {
                      const isOut = isPlayerOut(bettingPlayer)
                      if (isOut) {
                        return "Player Out - Auto Sold"
                      } else if (sellWindowActive[bettingPlayer.batsman_id]) {
                        return `Sell Player (${sellWindowTimeLeft[bettingPlayer.batsman_id]}s)`
                      } else {
                        return "Sell Player"
                      }
                    })()}
                  </button>
                </div>

                {!sellWindowActive[bettingPlayer.batsman_id] && !isPlayerOut(bettingPlayer) && (
                  <div className="mt-3 text-center">
                    <p className="text-sm text-gray-400">
                      ⏰ Sell button will be enabled for 5 seconds after price updates
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Team Betting Modal */}
          {isTeamBettingModalOpen && selectedTeam && (
            <div className="fixed inset-0 z-50 w-full h-full flex items-center justify-center bg-black/70 backdrop-blur-lg p-4">
              <div className="w-full max-w-lg rounded-2xl bg-gradient-to-br from-gray-900/90 to-gray-900 p-4 sm:p-6 md:p-8 shadow-2xl">
                {/* Header */}
                <div className="mb-4 sm:mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <img
                      src={selectedTeam.logo_url || "/placeholder.svg"}
                      alt={selectedTeam.name}
                      className="size-12 sm:size-14 rounded-full shadow-xl"
                    />
                    <h2 className="text-lg sm:text-xl font-extrabold text-white">{selectedTeam.name}</h2>
                  </div>
                  <button
                    onClick={closeTeamBettingModal}
                    className="text-gray-400 transition-colors hover:text-white text-xl sm:text-2xl"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                {/* Team Status */}
                <div className={`mb-4 p-3 border rounded-lg ${(() => {
                  const canTradeTeam = selectedTeam && selectedTeamInningIndex >= 0 && canTeamTrade(selectedTeam, selectedTeamInningIndex)
                  if (!canTradeTeam) {
                    return "bg-red-500/20 border-red-500/30"
                  } else {
                    return "bg-green-500/20 border-green-500/30"
                  }
                })()}`}>
                  <p className={`text-sm font-bold text-center ${(() => {
                    const canTradeTeam = selectedTeam && selectedTeamInningIndex >= 0 && canTeamTrade(selectedTeam, selectedTeamInningIndex)
                    if (!canTradeTeam) {
                      return "text-red-400"
                    } else {
                      return "text-green-400"
                    }
                  })()}`}>
                    {(() => {
                      const canTradeTeam = selectedTeam && selectedTeamInningIndex >= 0 && canTeamTrade(selectedTeam, selectedTeamInningIndex)
                      if (!canTradeTeam) {
                        if (selectedTeamInningIndex >= 0 && isInningOver(selectedTeamInningIndex)) {
                          return "❌ Inning is over, team trading is not available"
                        } else if (selectedTeam && selectedTeamInningIndex >= 0 && selectedTeam.team_id !== data?.innings?.[selectedTeamInningIndex]?.batting_team_id) {
                          return "❌ This team is not currently batting"
                        } else {
                          return "❌ Team trading is not available at this time"
                        }
                      } else {
                        const inningText = selectedTeamInningIndex === 0 ? "1st" : selectedTeamInningIndex === 1 ? "2nd" : `${selectedTeamInningIndex + 1}th`
                        return `✅ Team trading is available in the ${inningText} innings`
                      }
                    })()}
                  </p>
                </div>

                {/* Current Price */}
                <div className="mb-6 text-center">
                  <p className="text-gray-300 text-sm mb-2">Current Team Stock Price</p>
                  <p className="text-3xl font-bold text-white flex items-center justify-center gap-2">
                    ₹{(() => {
                      const storedPrice = data?.teamStockPrices?.[selectedTeam.team_id === data.teama?.team_id ? 'teama' : 'teamb']
                      const calculatedPrice = calculateTeamStockPriceForDisplay(data?.innings || [], selectedTeam.team_id, data?.teamStockPrices)
                      // Use calculated price if available, otherwise fall back to stored price or default
                      return (calculatedPrice || storedPrice || 50).toFixed(2)
                    })()}
                    {isUpdatingTeamStocks && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-yellow-400 bg-yellow-400/20 text-xs font-bold animate-pulse">
                        <span className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></span>
                        Updating...
                      </span>
                    )}
                  </p>
                </div>

                {/* Team Holdings Info */}
                {isLoadingTeamHoldings && (
                  <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                    <div className="text-center">
                      <p className="text-blue-300">Loading holdings information...</p>
                    </div>
                  </div>
                )}
                {teamHoldings && !isLoadingTeamHoldings && (
                  <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-center text-sm">
                      <div>
                        <p className="text-blue-300">Total Investment</p>
                        <p className="text-white font-bold">₹{teamHoldings.totalInvestment}</p>
                      </div>
                      <div>
                        <p className="text-blue-300">Current Holdings</p>
                        <p className="text-white font-bold">{teamHoldings.totalQuantity}</p>
                      </div>
                      <div>
                        <p className="text-blue-300">Remaining Limit</p>
                        <p className="text-white font-bold">₹{teamHoldings.remainingInvestment}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quantity Slider & Input */}
                <div className="mt-6 sm:mt-8">
                  <Slider
                    value={teamQuantity}
                    onValueChange={(value) => {
                      const isInningOverForTeam = selectedTeamInningIndex >= 0 && isInningOver(selectedTeamInningIndex)
                      if (!isInningOverForTeam) {
                        setTeamQuantity(value)
                      }
                    }}
                    defaultValue={[1]}
                    max={(() => {
                      const storedPrice = data?.teamStockPrices?.[selectedTeam.team_id === data.teama?.team_id ? 'teama' : 'teamb']
                      const calculatedPrice = calculateTeamStockPriceForDisplay(data?.innings || [], selectedTeam.team_id, data?.teamStockPrices)
                      const currentPrice = calculatedPrice || storedPrice || 50;
                      let maxQty = Math.max(0, Math.floor(25000 / currentPrice));

                      // If we have team holdings data, use the remaining investment limit
                      if (teamHoldings) {
                        const remainingInvestment = Number(teamHoldings.remainingInvestment);
                        const maxFromHoldings = Math.floor(remainingInvestment / currentPrice);
                        maxQty = Math.min(maxQty, maxFromHoldings);
                      }

                      return maxQty;
                    })()}
                    step={1}
                    className={`my-4 ${(() => {
                      const isInningOverForTeam = selectedTeamInningIndex >= 0 && isInningOver(selectedTeamInningIndex)
                      if (isInningOverForTeam) {
                        return "opacity-50 pointer-events-none"
                      } else {
                        return ""
                      }
                    })()}`}
                    disabled={selectedTeam && selectedTeamInningIndex >= 0 && !canTeamTrade(selectedTeam, selectedTeamInningIndex)}
                  />
                  <div className="flex justify-between w-full text-xs font-semibold mb-4">
                    <span>{teamQuantity[0]}</span>
                    <span>
                      {(() => {
                        const storedPrice = data?.teamStockPrices?.[selectedTeam.team_id === data.teama?.team_id ? 'teama' : 'teamb']
                        const calculatedPrice = calculateTeamStockPriceForDisplay(data?.innings || [], selectedTeam.team_id, data?.teamStockPrices)
                        const currentPrice = calculatedPrice || storedPrice || 50;
                        let maxQty = Math.max(0, Math.floor(25000 / currentPrice));

                        // If we have team holdings data, use the remaining investment limit
                        if (teamHoldings) {
                          const remainingInvestment = Number(teamHoldings.remainingInvestment);
                          const maxFromHoldings = Math.floor(remainingInvestment / currentPrice);
                          maxQty = Math.min(maxQty, maxFromHoldings);
                        }

                        return maxQty;
                      })()}
                    </span>
                  </div>

                  {/* Quantity Selector */}
                  <div className="mt-6 sm:mt-8">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                      <div className="flex-1 flex flex-col">
                        <label
                          className="text-xs sm:text-sm font-bold text-gray-300 mb-1"
                          htmlFor="team-quantity-input"
                        >
                          Quantity
                        </label>
                        <Input
                          id="team-quantity-input"
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          pattern="[0-9]*"
                          value={teamQuantity[0] === 0 ? "" : teamQuantity[0]}
                          className={`text-white placeholder:text-gray-400 border-0 font-extrabold rounded-lg px-3 py-2 text-sm sm:text-base ${(() => {
                            const isInningOverForTeam = selectedTeamInningIndex >= 0 && isInningOver(selectedTeamInningIndex)
                            if (isInningOverForTeam) {
                              return "bg-gray-700/60 text-gray-500 cursor-not-allowed"
                            } else {
                              return "bg-gray-800/60"
                            }
                          })()}`}
                          onChange={(e) => {
                            const isInningOverForTeam = selectedTeamInningIndex >= 0 && isInningOver(selectedTeamInningIndex)
                            if (isInningOverForTeam) return;

                            const val = e.target.value;
                            if (!/^\d*$/.test(val)) return;
                            if (val === "") {
                              setTeamQuantity([0]);
                              return;
                            }
                            let numVal = Number(val);

                            // Calculate max quantity based on remaining investment limit
                            const storedPrice = data?.teamStockPrices?.[selectedTeam.team_id === data.teama?.team_id ? 'teama' : 'teamb']
                            const calculatedPrice = calculateTeamStockPriceForDisplay(data?.innings || [], selectedTeam.team_id, data?.teamStockPrices)
                            const currentPrice = calculatedPrice || storedPrice || 50;
                            let maxQty = Math.max(0, Math.floor(25000 / currentPrice));

                            // If we have team holdings data, use the remaining investment limit
                            if (teamHoldings) {
                              const remainingInvestment = Number(teamHoldings.remainingInvestment);
                              const maxFromHoldings = Math.floor(remainingInvestment / currentPrice);
                              maxQty = Math.min(maxQty, maxFromHoldings);
                            }

                            if (numVal > maxQty) {
                              numVal = maxQty;
                              if (teamHoldings && Number(teamHoldings.remainingInvestment) < 25000) {
                                toast.error(`Investment limit exceeded. You can only invest ₹${teamHoldings.remainingInvestment} more in this team.`);
                              }
                            }
                            setTeamQuantity([numVal]);
                          }}
                          onWheel={(e) => e.currentTarget.blur()}
                          onKeyDown={(e) => {
                            if (["ArrowUp", "ArrowDown", "e", "+", "-"].includes(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          style={{ MozAppearance: "textfield" }}
                          disabled={selectedTeamInningIndex >= 0 && isInningOver(selectedTeamInningIndex)}
                        />
                      </div>
                      <div className="flex-1 flex flex-col lg:items-end">
                        <label className="text-xs sm:text-sm font-bold text-gray-300 mb-1" htmlFor="team-price-input">
                          Price
                          <span className={`ml-2 text-xs mt-1 font-bold ${(() => {
                            if (teamHoldings) {
                              const storedPrice = data?.teamStockPrices?.[selectedTeam.team_id === data.teama?.team_id ? 'teama' : 'teamb']
                              const calculatedPrice = calculateTeamStockPriceForDisplay(data?.innings || [], selectedTeam.team_id, data?.teamStockPrices)
                              const currentPrice = calculatedPrice || storedPrice || 50;
                              const requestedInvestment = currentPrice * teamQuantity[0];
                              return requestedInvestment > Number(teamHoldings.remainingInvestment) ? "text-red-500" : "text-gray-400";
                            }
                            return "text-gray-400";
                          })()}`}>
                            (Max: ₹{teamHoldings ? teamHoldings.remainingInvestment : "25000"})
                          </span>
                        </label>
                        <Input
                          id="team-price-input"
                          className={`border-0 font-extrabold bg-transparent rounded-lg px-3 py-2 lg:text-end text-sm sm:text-base ${(() => {
                            const canTradeTeam = selectedTeam && selectedTeamInningIndex >= 0 && canTeamTrade(selectedTeam, selectedTeamInningIndex)
                            if (!canTradeTeam) {
                              return "text-gray-500"
                            } else {
                              return "text-gray-300"
                            }
                          })()}`}
                          placeholder={`₹${(() => {
                            const storedPrice = data?.teamStockPrices?.[selectedTeam.team_id === data.teama?.team_id ? 'teama' : 'teamb']
                            const calculatedPrice = calculateTeamStockPriceForDisplay(data?.innings || [], selectedTeam.team_id, data?.teamStockPrices)
                            const currentPrice = calculatedPrice || storedPrice || 50;
                            return (currentPrice * teamQuantity[0]).toFixed(2)
                          })()}`}
                          value={`₹${(() => {
                            const storedPrice = data?.teamStockPrices?.[selectedTeam.team_id === data.teama?.team_id ? 'teama' : 'teamb']
                            const calculatedPrice = calculateTeamStockPriceForDisplay(data?.innings || [], selectedTeam.team_id, data?.teamStockPrices)
                            const currentPrice = calculatedPrice || storedPrice || 50;
                            return (currentPrice * teamQuantity[0]).toFixed(2)
                          })()}`}
                          disabled={selectedTeam && selectedTeamInningIndex >= 0 && !canTeamTrade(selectedTeam, selectedTeamInningIndex)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Buy/Sell Buttons */}
                <div className="mt-6 sm:mt-8 flex flex-col md:flex-row gap-3 sm:gap-4">
                  <button
                    className={`flex-1 rounded-lg sm:rounded-xl font-bold py-3 text-sm sm:text-base shadow-md transition ${(() => {
                      const canTradeTeam = selectedTeam && selectedTeamInningIndex >= 0 && canTeamTrade(selectedTeam, selectedTeamInningIndex)
                      if (!canTradeTeam) {
                        return "bg-gray-600 text-gray-400 cursor-not-allowed"
                      } else {
                        return "bg-green-600 hover:bg-green-700 text-white"
                      }
                    })()}`}
                    onClick={async () => {
                      const canTradeTeam = selectedTeam && selectedTeamInningIndex >= 0 && canTeamTrade(selectedTeam, selectedTeamInningIndex)

                      if (!canTradeTeam) {
                        if (selectedTeamInningIndex >= 0 && isInningOver(selectedTeamInningIndex)) {
                          toast.info("Inning is over, cannot trade team stocks")
                        } else if (selectedTeam && selectedTeamInningIndex >= 0 && selectedTeam.team_id !== data?.innings?.[selectedTeamInningIndex]?.batting_team_id) {
                          toast.info("This team is not currently batting")
                        } else {
                          toast.info("Team trading is not available at this time")
                        }
                        return
                      }

                      closeTeamBettingModal()
                      if (data.status_str == "match_over" || data.status_str == "match ended" || data.status_str == "match finished" || data.status_str == "Completed" || data.status_str == "Cancelled") {
                        toast.info("Match is over, Redirecting...");
                        setTimeout(() => {
                          redirect("/live-matches")
                        }, 1000);
                        return;
                      }

                      const storedPrice = data?.teamStockPrices?.[selectedTeam.team_id === data.teama?.team_id ? 'teama' : 'teamb']
                      const calculatedPrice = calculateTeamStockPriceForDisplay(data?.innings || [], selectedTeam.team_id, data?.teamStockPrices)
                      const currentPrice = calculatedPrice || storedPrice || 50;

                      const result = await buyTeam(
                        selectedTeam,
                        String(currentPrice.toFixed(2)),
                        String(teamQuantity[0]),
                        matchId || "",
                      )

                      if (result.success) {
                        toast.success(result.message)
                      } else {
                        toast.error(result.message || "Failed to buy team stocks")
                      }
                    }}
                    disabled={selectedTeam && selectedTeamInningIndex >= 0 && !canTeamTrade(selectedTeam, selectedTeamInningIndex)}
                  >
                    {(() => {
                      const canTradeTeam = selectedTeam && selectedTeamInningIndex >= 0 && canTeamTrade(selectedTeam, selectedTeamInningIndex)
                      if (!canTradeTeam) {
                        if (selectedTeamInningIndex >= 0 && isInningOver(selectedTeamInningIndex)) {
                          return "Inning Over - Cannot Trade"
                        } else if (selectedTeam && selectedTeamInningIndex >= 0 && selectedTeam.team_id !== data?.innings?.[selectedTeamInningIndex]?.batting_team_id) {
                          return "Not Batting - Cannot Trade"
                        } else {
                          return "Cannot Trade"
                        }
                      } else {
                        return "Buy Team Stocks"
                      }
                    })()}
                  </button>
                  <button
                    className={`flex-1 rounded-lg sm:rounded-xl font-bold py-3 text-sm sm:text-base shadow-md transition ${(() => {
                      const teamKey = selectedTeam?.team_id === data.teama?.team_id ? 'teama' : 'teamb'
                      const sellWindowKey = `team_${teamKey}`
                      const canTradeTeam = selectedTeam && selectedTeamInningIndex >= 0 && canTeamTrade(selectedTeam, selectedTeamInningIndex)

                      if (!canTradeTeam) {
                        return "bg-gray-600 text-gray-400 cursor-not-allowed"
                      } else if (sellWindowActive[sellWindowKey]) {
                        return "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                      } else {
                        return "bg-gray-600 text-gray-400 cursor-not-allowed"
                      }
                    })()}`}
                    onClick={async () => {
                      const teamKey = selectedTeam?.team_id === data.teama?.team_id ? 'teama' : 'teamb'
                      const sellWindowKey = `team_${teamKey}`
                      const canTradeTeam = selectedTeam && selectedTeamInningIndex >= 0 && canTeamTrade(selectedTeam, selectedTeamInningIndex)

                      if (!sellWindowActive[sellWindowKey]) {
                        toast.info("Sell window is not active. Wait for price changes to enable selling.")
                        return
                      }

                      if (!canTradeTeam) {
                        toast.info("Team trading is not available at this time")
                        return
                      }

                      closeTeamBettingModal()
                      if (data.status_str == "match_over" || data.status_str == "match ended" || data.status_str == "match finished" || data.status_str == "Completed" || data.status_str == "Cancelled") {
                        toast.info("Match is over, Redirecting...");
                        setTimeout(() => {
                          redirect("/live-matches")
                        }, 1000);
                        return;
                      }

                      const storedPrice = data?.teamStockPrices?.[selectedTeam.team_id === data.teama?.team_id ? 'teama' : 'teamb']
                      const calculatedPrice = calculateTeamStockPriceForDisplay(data?.innings || [], selectedTeam.team_id, data?.teamStockPrices)
                      const currentPrice = calculatedPrice || storedPrice || 50;

                      const result = await sellTeam(
                        selectedTeam,
                        String(currentPrice.toFixed(2)),
                        String(teamQuantity[0]),
                        matchId || "",
                      )

                      if (result.success) {
                        toast.success(result.message)
                      } else {
                        toast.error(result.message || "Failed to sell team stocks")
                      }
                    }}
                    disabled={(() => {
                      const teamKey = selectedTeam?.team_id === data.teama?.team_id ? 'teama' : 'teamb'
                      const sellWindowKey = `team_${teamKey}`
                      const canTradeTeam = selectedTeam && selectedTeamInningIndex >= 0 && canTeamTrade(selectedTeam, selectedTeamInningIndex)
                      return !canTradeTeam || !sellWindowActive[sellWindowKey]
                    })()}
                  >
                    {(() => {
                      const teamKey = selectedTeam?.team_id === data.teama?.team_id ? 'teama' : 'teamb'
                      const sellWindowKey = `team_${teamKey}`
                      const canTradeTeam = selectedTeam && selectedTeamInningIndex >= 0 && canTeamTrade(selectedTeam, selectedTeamInningIndex)

                      if (!canTradeTeam) {
                        return "Cannot Trade"
                      } else if (sellWindowActive[sellWindowKey]) {
                        return `Sell Team (${sellWindowTimeLeft[sellWindowKey]}s)`
                      } else {
                        return "Sell Team"
                      }
                    })()}
                  </button>
                </div>

                {(() => {
                  const teamKey = selectedTeam?.team_id === data.teama?.team_id ? 'teama' : 'teamb'
                  const sellWindowKey = `team_${teamKey}`
                  return !sellWindowActive[sellWindowKey] && (
                    <div className="mt-3 text-center">
                      <p className="text-sm text-gray-400">
                        ⏰ Sell button will be enabled for 5 seconds after price updates
                      </p>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
