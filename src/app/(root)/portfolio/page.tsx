"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Trophy, Landmark, DollarSign, TrendingDown, Dot } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PlayerPortfolio, TeamPortfolio } from "./types";
import { formatINR } from "@/lib/helper";
import { Batsman, BettingPlayer, CricketMatchData, Team } from "../betting-interface/types";
import { Button } from "@/components/ui/button";
import { sellPlayer, buyPlayer, sellTeam, buyTeam } from "../betting-interface/services";
import AnimatedNumber from "@/components/ui/animated-number";
import PortfolioTradeModal from "@/components/ui/portfolio-trade-modal";

function formatTimestamp(ts: Date | string | undefined): string {
  if (!ts) return "--";
  const date = typeof ts === "string" ? new Date(ts) : ts;
  if (isNaN(date.getTime())) return "--";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function Portfolio() {
  const [loading, setLoading] = useState(true);
  const [playerPortfolios, setPlayerPortfolios] = useState<PlayerPortfolio[]>([]);
  const [teamPortfolios, setTeamPortfolios] = useState<TeamPortfolio[]>([]);
  const [playerPortfoliosHistorys, setPlayerPortfoliosHistorys] = useState<PlayerPortfolio[]>([]);
  const [teamPortfoliosHistorys, setTeamPortfoliosHistorys] = useState<TeamPortfolio[]>([]);
  const [todaysProfit, setTodaysProfit] = useState()
  const [value, setValue] = useState(0);
  const [profit, setProfit] = useState(0);
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [tradeModalPortfolio, setTradeModalPortfolio] = useState<any>(null);
  const [tradeModalType, setTradeModalType] = useState<"player" | "team" | null>(null);
  const [matchDataById, setMatchDataById] = useState<Record<string, CricketMatchData>>({});


  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const fetchPortfolios = async () => {
      try {
        const getTokenFromCookies = () => {
          if (typeof document === "undefined") return null;
          const cookies = document.cookie.split("; ");
          const tokenCookie = cookies.find((cookie) => cookie.startsWith("token="));
          return tokenCookie ? tokenCookie.split("=")[1] : null;
        };
        const token = getTokenFromCookies();

        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/portfolio/all`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        });

        const apiData = await res.json();
        if (!apiData.success) {
          toast(apiData.message)
          return
        }
        setProfit(apiData.profit)
        setValue(apiData.value)
        setTodaysProfit(apiData.totalPortfolioProfit)
        function splitByStatus<T extends { status?: string }>(arr: T[]): { active: T[]; history: T[] } {
          const active: T[] = [];
          const history: T[] = [];
          arr?.forEach((item) => {
            const status = (item.status || "").toLowerCase();
            if (status === "sell" || status === "sold") {
              history.push(item);
            } else {
              active.push(item);
            }
          });
          return { active, history };
        }

        // Player portfolios
        const playerResult = splitByStatus<PlayerPortfolio>(apiData.playerPortfolios || []);
        const playerPortfoliosWithPrice = await Promise.all(
          playerResult.active.map(async (p) => ({
            ...p,
            currentPrice: await currentPrice(p)
          }))
        );
        setPlayerPortfolios(playerPortfoliosWithPrice);
        setPlayerPortfoliosHistorys(playerResult.history);

        // Team portfolios
        const teamResult = splitByStatus<TeamPortfolio>(apiData.teamPortfolios || []);
        setTeamPortfolios(teamResult.active);
        setTeamPortfoliosHistorys(teamResult.history);

        // Fetch match data for all unique matchIds
        const allPortfolios = [...(apiData.playerPortfolios || []), ...(apiData.teamPortfolios || [])];
        const uniqueMatchIds = Array.from(new Set(allPortfolios.map((p: any) => p.matchId)));
        const matchDataObj: Record<string, CricketMatchData> = {};
        await Promise.all(uniqueMatchIds.map(async (matchId: string) => {
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/cricket/scorecard/${matchId}`);
            const apiData = await res.json();
            if (apiData.data) {
              matchDataObj[matchId] = apiData.data;
            }
          } catch { }
        }));
        setMatchDataById(matchDataObj);
        setLoading(false)

      } catch (e: any) {
        toast("Fetch error: " + (e?.message || e));
      }
    };

    fetchPortfolios();
    intervalId = setInterval(fetchPortfolios, 5000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);
  useEffect(() => {
    playerPortfolios.forEach(async (playerPortfolio) => {
      const isAvailable = await availableToSold(playerPortfolio);
      if (isAvailable.success) {
        const portfolio: BettingPlayer = {
          name: playerPortfolio.playerName,
          batsman_id: playerPortfolio.playerId,
          batting: "",
          position: "",
          role: "",
          role_str: "",
          runs: "",
          balls_faced: "",
          fours: "",
          sixes: "",
          run0: "",
          run1: "",
          run2: "",
          run3: "",
          run5: "",
          how_out: "",
          dismissal: "",
          strike_rate: "",
          bowler_id: "",
          first_fielder_id: "",
          second_fielder_id: "",
          third_fielder_id: "",
        };
        if (isAvailable.code === 1) {
          await sellPlayer(portfolio, String(playerPortfolio.currentPrice), playerPortfolio.quantity, playerPortfolio.matchId)
        } else {
          await sellPlayer(portfolio, String(Number(playerPortfolio.boughtPrice) / 2), playerPortfolio.quantity, playerPortfolio.matchId)
        }
      }
    });
  }, [playerPortfolios]);

  const currentPrice = async (portfolioPlayer: PlayerPortfolio) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/cricket/scorecard/${portfolioPlayer.matchId}`
      );
      const apiData = await res.json();
      const match: CricketMatchData = apiData.data
      const currentInningNumber = match.latest_inning_number
      const currentInning = match.innings[Number(currentInningNumber) - 1]
      const batsmanNumber = currentInning.batsmen.findIndex(
        (batsman: Batsman) => batsman.batsman_id === portfolioPlayer.playerId
      ) + 1;
      const inningPlayer = currentInning.batsmen.find(
        (batsman: Batsman) => batsman.batsman_id === portfolioPlayer.playerId
      ) as Batsman
      const basePrice = batsmanNumber < 3
        ? 35
        : batsmanNumber < 6
          ? 30
          : 25
      return String(basePrice
        - (Number(inningPlayer.run0) * 0.5)
        + (Number(inningPlayer.run1) * 0.75)
        + (Number(inningPlayer.run2) * 1.50)
        + (Number(inningPlayer.run3) * 2.25)
        + (Number(inningPlayer.fours) * 3)
        + (Number(inningPlayer.sixes) * 4.5))
    } catch {
      return "0"
    }
  }
  const availableToSold = async (player: PlayerPortfolio) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/cricket/scorecard/${player.matchId}`
      );
      const apiData = await res.json();
      if (!apiData.data) {
        toast.success("Match is Over")
        return { success: true, code: 1 }
      }

      const match: CricketMatchData = apiData.data;
      // Check if batsman is not batting
      const currentInningNumber = match.latest_inning_number;
      const currentInning = match.innings[Number(currentInningNumber) - 1];
      const isBatting = currentInning.batsmen.some(
        (batsman: Batsman) =>
          batsman.batsman_id === player.playerId && batsman.batting == "true"
      );

      if (!isBatting) {
        toast.success(`${player.playerName} Got Out`);
        return { success: true, code: 0 }
      }
      return { success: false, code: 0 }
    } catch {
      return { success: false, code: 0 }
    }
  };
  const mapPlayerPortfolioToBettingPlayer = (p: PlayerPortfolio): BettingPlayer => ({
    name: p.playerName,
    batsman_id: p.playerId,
    batting: "",
    position: "",
    role: "",
    role_str: "",
    runs: "",
    balls_faced: "",
    fours: "",
    sixes: "",
    run0: "",
    run1: "",
    run2: "",
    run3: "",
    run5: "",
    how_out: "",
    dismissal: "",
    strike_rate: "",
    bowler_id: "",
    first_fielder_id: "",
    second_fielder_id: "",
    third_fielder_id: "",
  });
  const mapTeamPortfolioToTeam = (t: TeamPortfolio): Team => {
    const match = matchDataById[t.matchId];
    if (match) {
      if (match.teama && (match.teama.team_id === t.team || match.teama.name === t.team || match.teama.name === t.teamName)) return match.teama;
      if (match.teamb && (match.teamb.team_id === t.team || match.teamb.name === t.team || match.teamb.name === t.teamName)) return match.teamb;
    }
    // fallback
    return {
      team_id: t.team,
      name: t.teamName,
      short_name: t.teamName,
      logo_url: "",
      thumb_url: "",
      scores_full: "",
      scores: "",
      overs: "",
    };
  };
  const mapPlayerPortfolioToTeam = (p: PlayerPortfolio): Team => ({
    team_id: p.team,
    name: p.team,
    short_name: p.team,
    logo_url: "",
    thumb_url: "",
    scores_full: "",
    scores: "",
    overs: "",
  });
  const handleBuy = async (quantity: number) => {
    if (!tradeModalPortfolio) return;
    setLoading(true);
    try {
      let response;
      if (tradeModalType === "player") {
        const player = mapPlayerPortfolioToBettingPlayer(tradeModalPortfolio);
        response = await buyPlayer(player, tradeModalPortfolio.currentPrice, String(quantity), tradeModalPortfolio.matchId);
      } else if (tradeModalType === "team") {
        const team = mapTeamPortfolioToTeam(tradeModalPortfolio);
        response = await buyTeam(team, tradeModalPortfolio.currentPrice, String(quantity), tradeModalPortfolio.matchId);
      }
      toast.success(response?.message || "Buy successful");
      setTradeModalOpen(false);
      setTimeout(() => window.location.reload(), 1000);
    } catch (e: any) {
      toast.error(e?.message || "Buy failed");
    } finally {
      setLoading(false);
    }
  };
  const handleSell = async (quantity: number) => {
    if (!tradeModalPortfolio) return;
    setLoading(true);
    try {
      let response;
      if (tradeModalType === "player") {
        const player = mapPlayerPortfolioToBettingPlayer(tradeModalPortfolio);
        response = await sellPlayer(player, tradeModalPortfolio.currentPrice, String(quantity), tradeModalPortfolio.matchId);
      } else if (tradeModalType === "team") {
        const team = mapTeamPortfolioToTeam(tradeModalPortfolio);
        response = await sellTeam(team, tradeModalPortfolio.currentPrice, String(quantity), tradeModalPortfolio.matchId);
      }
      toast.success(response?.message || "Sell successful");
      setTradeModalOpen(false);
      setTimeout(() => window.location.reload(), 1000);
    } catch (e: any) {
      toast.error(e?.message || "Sell failed");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-tl from-transparent via-transparent to-sky-600/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-transparent border-t-white/70 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-white/70 rounded-full animate-pulses"></div>
                </div>
              </div>
            </div>
            <CardTitle className="text-xl font-semibold text-white/70">Loading Portfolio...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }
  else {
    return (
      <div className="p-5 min-h-screen">
        <main className="container mx-auto px-4 max-sm:px-0 py-8">
          {/* Portfolio Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-white mb-2">
              My Portfolio
            </h1>
            <p className="text-gray-400 text-lg font-bold">
              Monitor your cricket investment portfolio, analyze your player and team positions, and review your performance over time
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="border-none shadow-lg transition-all duration-200 bg-gradient-to-br from-purple-600 via-transparent to-transparent rounded-tl-[100px]">
              <CardContent className="p-7 pl-10 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-400 text-lg font-bold tracking-wide mb-1">
                      Available Balance
                    </p>
                    <h3 className="text-4xl font-extrabold text-white drop-shadow-sm tracking-tight mt-1">
                      {formatINR(Number(value))}
                    </h3>
                  </div>
                  <div className="flex items-center justify-center bg-purple-500/20 p-4 rounded-full shadow-inner">
                    <Landmark className="h-8 w-8 text-purple-400 drop-shadow" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg transition-all duration-200 bg-gradient-to-br from-sky-600 via-transparent to-transparent rounded-tl-[100px]">
              <CardContent className="p-7 pl-10 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sky-400 text-lg font-bold tracking-wide mb-1">
                      Active Holdings
                    </p>
                    {playerPortfolios && teamPortfolios && (playerPortfolios.length + teamPortfolios.length > 0) ? (
                      <h3 className="text-4xl font-extrabold text-white drop-shadow-sm tracking-tight">
                        {playerPortfolios.length + teamPortfolios.length}
                      </h3>
                    ) : (
                      <h3 className="text-4xl font-extrabold text-white drop-shadow-sm tracking-tight">
                        0
                      </h3>)}
                  </div>
                  <div className="flex items-center justify-center bg-cyan-500/20 p-4 rounded-full shadow-inner">
                    <Users className="h-8 w-8 text-cyan-400 drop-shadow" />
                  </div>
                </div>
                {playerPortfolios && teamPortfolios && (playerPortfolios.length + teamPortfolios.length > 0) && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-block bg-cyan-600/20 text-cyan-300 text-xs px-3 py-1 rounded-full font-semibold tracking-wide">
                      {playerPortfolios.length} Player{playerPortfolios.length !== 1 && "s"}
                    </span>
                    <span className="inline-block bg-cyan-600/20 text-cyan-300 text-xs px-3 py-1 rounded-full font-semibold tracking-wide">
                      {teamPortfolios.length} Team{teamPortfolios.length !== 1 && "s"}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
            {(() => {
              const profitPending = [
                ...playerPortfolios,
                ...teamPortfolios
              ].some(p => !p.currentPrice || p.currentPrice === "0");

              const currentHoldingsProfit = [
                ...playerPortfolios,
                ...teamPortfolios
              ].reduce((acc, curr) => {
                const quantity = parseFloat(curr.quantity) || 0;
                const boughtPrice = parseFloat(curr.boughtPrice) || 0;
                const currentPrice = parseFloat(curr.currentPrice) || 0;
                return acc + (currentPrice - boughtPrice) * quantity;
              }, 0);

              const currentHoldingsAmount = [
                ...playerPortfolios,
                ...teamPortfolios
              ].reduce((ac, cur) => {
                const boughtPrice = parseFloat(cur.boughtPrice) || 0;
                return ac + boughtPrice
              }, 0);


              const hasCurrentHoldings = playerPortfolios.length > 0 || teamPortfolios.length > 0;
              let profitNumberRaw = hasCurrentHoldings ? currentHoldingsProfit : profit;
              const profitNumber = typeof profitNumberRaw === "string" ? parseFloat(profitNumberRaw) : profitNumberRaw;

              let profitColor = "text-white";
              let percentColor = "text-emerald-400";
              let icon = <TrendingUp className="h-4 w-4 mr-1" />;
              if (profitNumber < 0) {
                profitColor = "text-white";
                percentColor = "text-red-700 font-bold";
                icon = <TrendingDown className="h-4 w-4 mr-1" />;
              } else if (profitNumber === 0) {
                profitColor = "text-gray-400";
                percentColor = "text-gray-400";
                icon = <Dot className="h-4 w-4 mr-1" />;
              }

              const profitPercentage =
                currentHoldingsAmount === 0
                  ? "0.00%"
                  : (
                    currentHoldingsAmount === 0
                      ? 0
                      : (currentHoldingsProfit / currentHoldingsAmount) * 100
                  ).toLocaleString("en-IN", { maximumFractionDigits: 2 }) + "%"
              return (
                <>
                  <Card
                    className={`border-none shadow-lg transition-all duration-200 bg-gradient-to-br rounded-tl-[100px] ${profitPending
                      ? "from-gray-600"
                      : (typeof profitNumber !== "undefined" ? profitNumber : profit) === 0
                        ? "from-gray-600"
                        : (typeof profitNumber !== "undefined" ? profitNumber : profit) < 0
                          ? "from-red-800"
                          : "from-emerald-600"
                      } via-transparent to-transparent`}
                  >
                    <CardContent className="p-7 pl-10 flex flex-col gap-2 relative overflow-hidden">
                      <div className="relative z-10">
                        <div className="flex items-center justify-between">
                          <div>
                            <p
                              className={`text-lg font-bold tracking-wide mb-1 ${profitPending
                                ? "text-gray-400"
                                : profitNumber < 0
                                  ? "text-red-700"
                                  : profitNumber === 0
                                    ? "text-gray-400"
                                    : "text-emerald-400"
                                }`}
                            >
                              {profitPending
                                ? "Calculating P&L..."
                                : `Current ${profitNumber > 0 ? "Profit" : profitNumber < 0 ? "Loss" : "P&L"}`
                              }
                            </p>
                            {profitPending ?
                              <div
                                className="text-4xl font-extrabold drop-shadow-sm tracking-tight mt-1 text-gray-400"
                              >
                                Calculating...
                              </div>
                              :
                              <AnimatedNumber value={profitNumber}>
                                {(val, { isChanged }) => (
                                  <span
                                    className={`text-4xl font-extrabold drop-shadow-sm tracking-tight mt-1 ${profitPending
                                      ? "text-gray-400"
                                      : profitNumber < 0
                                        ? "text-white"
                                        : profitNumber === 0
                                          ? "text-gray-400"
                                          : "text-white"
                                      } ${isChanged ? "animate-pulse" : ""}`}
                                  >
                                    {formatINR(val)}
                                  </span>
                                )}
                              </AnimatedNumber>}
                            <p
                              className={`text-sm flex items-center mt-1 ${profitPending
                                ? "text-gray-400"
                                : percentColor
                                }`}
                            >
                              {!profitPending && icon}
                              {profitPending ? <span className="ml-2 text-xs font-bold">Calculating...</span>
                                :
                                <span className="ml-2 text-sm font-bold">
                                  {profitPercentage}
                                </span>
                              }
                            </p>
                          </div>

                          <div
                            className={`flex items-center justify-center p-4 rounded-full shadow-inner ${profitPending
                              ? "bg-transparent"
                              : (typeof profitNumber !== "undefined" && profitNumber !== null
                                ? profitNumber
                                : profit) > 0
                                ? "bg-emerald-400/20"
                                : (typeof profitNumber !== "undefined" && profitNumber !== null
                                  ? profitNumber
                                  : profit) < 0
                                  ? "bg-red-700/20"
                                  : "bg-transparent"
                              }`}
                          >
                            {profitPending ?
                              <div className="relative">
                                <svg className="absolute -top-5 -right-1 animate-spin h-12 w-12 text-gray-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                </svg>
                              </div>
                              :
                              <DollarSign
                                className={`h-8 w-8 drop-shadow ${profitPending
                                  ? "text-gray-400"
                                  : (typeof profitNumber !== "undefined" && profitNumber !== null
                                    ? profitNumber
                                    : profit) > 0
                                    ? "text-emerald-400"
                                    : (typeof profitNumber !== "undefined" && profitNumber !== null
                                      ? profitNumber
                                      : profit) < 0
                                      ? "text-red-700"
                                      : "text-gray-400"
                                  }`}
                              />
                            }
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card >
                </>
              )
            })()}
            <Card
              className={`border-none shadow-lg transition-all duration-200 bg-gradient-to-br rounded-tl-[100px] ${Number(todaysProfit) < 0
                ? "from-red-700 via-transparent to-transparent"
                : "from-emerald-700 via-transparent to-transparent"
                }`}
            >
              <CardContent className="p-7 pl-10 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={`text-lg font-bold tracking-wide mb-1 ${Number(todaysProfit) < 0
                        ? "text-red-500"
                        : "text-emerald-600"
                        }`}
                    >
                      Total P&L
                    </p>
                    <h3 className="text-4xl font-extrabold text-white drop-shadow-sm tracking-tight mt-1 ">
                      <span className="flex flex-col">
                        {formatINR(Number(todaysProfit))}
                        <span className={`ml-2 text-sm font-bold flex items-center gap-2 ${
                          Number(todaysProfit) > 0
                            ? "text-emerald-400"
                            : Number(todaysProfit) < 0
                              ? "text-red-500"
                              : "text-gray-400"
                        }`}>
                          {(() => {
                            const totalProfitPercentage = value === 0
                              ? "0.00%"
                              : (
                                (Number(todaysProfit) / value) * 100
                              ).toLocaleString("en-IN", { maximumFractionDigits: 2 }) + "%";
                            // Show TrendingUp if profit > 0, TrendingDown if < 0, Dot if 0
                            if (Number(todaysProfit) > 0) {
                              return (
                                <>
                                  <TrendingUp className="h-4 w-4 ml-1 text-emerald-400" />
                                  {totalProfitPercentage}
                                </>
                              );
                            } else if (Number(todaysProfit) < 0) {
                              return (
                                <>
                                  <TrendingDown className="h-4 w-4 ml-1 text-red-500" />
                                  {totalProfitPercentage}
                                </>
                              );
                            } else {
                              return (
                                <>
                                  <Dot className="h-4 w-4 ml-1 text-gray-400" />
                                  {totalProfitPercentage}
                                </>
                              );
                            }
                          })()}
                        </span>
                      </span>
                    </h3>
                  </div>
                  <div
                    className={`flex items-center justify-center p-4 rounded-full shadow-inner ${Number(todaysProfit) < 0
                      ? "bg-red-700/20"
                      : "bg-emerald-600/20"
                      }`}
                  >
                    <Trophy
                      className={`h-8 w-8 drop-shadow ${Number(todaysProfit) < 0
                        ? "text-red-400"
                        : "text-emerald-400"
                        }`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Portfolio Tabs */}
          <Tabs defaultValue="player" className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
              <TabsList className="flex w-full sm:w-auto">
                <TabsTrigger
                  value="player"
                  className="flex-1 sm:flex-none p-3 sm:p-4 h-10 w-full sm:w-48 text-base sm:text-lg bg-gray-900 data-[state=active]:bg-purple-500 text-white transition-colors ease-in-out duration-600 rounded-bl-full rounded-tl-full rounded-br-none rounded-tr-none cursor-pointer"
                >
                  Player Portfolio
                </TabsTrigger>
                <TabsTrigger
                  value="team"
                  className="flex-1 sm:flex-none p-3 sm:p-4 h-10 w-full sm:w-48 text-base sm:text-lg bg-gray-900 data-[state=active]:bg-purple-500 text-white transition-colors ease-in-out duration-600 rounded-br-full rounded-tr-full rounded-bl-none rounded-tl-none cursor-pointer"
                >
                  Team Portfolio
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="player">
              <Card className="bg-gray-800/30">
                <CardHeader>
                  <CardTitle className="text-white text-2xl">
                    Player Holdings
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-sm:px-1">
                  {playerPortfolios.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="p-6 rounded-full mb-4">
                        <Users className="h-10 w-10 text-gray-500 hover:text-purple-700" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        No current player holdings
                      </h3>
                      <p className="text-gray-400 max-w-md mb-6">
                        You don't have any active player investments. Add players to
                        your portfolio to start tracking their performance.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl bg-gray-800/30">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className=" bg-gray-800/50">
                              <th className="px-4 py-3 text-left text-sm font-bold text-gray-300 pl-6">
                                Player
                              </th>
                              <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                                <span className="hidden xl:inline">Quantity(s)</span>
                                <span className="inline xl:hidden">Qt(s)</span>
                              </th>
                              <th className="px-3 py-3 text-right text-sm font-bold text-gray-300">
                                <span className="hidden xl:inline">Buy Price</span>
                                <span className="inline xl:hidden">Buy @</span>
                              </th>
                              <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                                <span className="hidden xl:inline">Current Price</span>
                                <span className="inline xl:hidden">CP @</span>
                              </th>
                              {/* <th className="px-4 py-3 text-right text-sm font-bold text-gray-300"> */}
                              {/*   <span className="hidden xl:inline">Percentage</span> */}
                              {/*   <span className="inline xl:hidden">%</span> */}
                              {/* </th> */}
                              <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                                Status
                              </th>
                              <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                                <span className="hidden lg:inline">Timestamp</span>
                                <span className="inline lg:hidden">Time</span>
                              </th>
                            </tr>

                          </thead>
                          <tbody>
                            {playerPortfolios && playerPortfolios.length > 0 && playerPortfolios.map((p, idx) => {
                              return (
                                <tr key={idx}>
                                  <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                      <p className="font-bold text-white">{p.playerName}</p>
                                      <div className="flex gap-2">
                                        <Button
                                          variant="secondary"
                                          size="sm"
                                          className="font-bold text-xs bg-white/20 hover:bg-white/30 hover:text-white transition-colors duration-300"
                                          disabled={p.currentPrice == "0"}
                                          onClick={() => {
                                            setTradeModalPortfolio(p);
                                            setTradeModalType("player");
                                            setTradeModalOpen(true);
                                          }}
                                        >
                                          Buy / Sell
                                        </Button>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 text-right text-sm text-gray-300 font-bold">
                                    {p.quantity ? `${p.quantity}` : "--"}
                                  </td>
                                  <td className="px-4 py-4 text-right text-sm text-gray-300 font-bold">
                                    {p.boughtPrice && p.quantity ? (
                                      <div className="text-gray-300 font-bold">
                                        ₹{Number(p.boughtPrice).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                                      </div>
                                    ) : "--"}
                                  </td>
                                  <td className="px-4 py-4 text-right text-sm text-gray-300 font-bold">
                                    {p.currentPrice == "0" ?
                                      (
                                        <div className="relative">
                                          <svg className="absolute -top-3 right-0 animate-spin h-5 w-5 text-gray-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                          </svg>
                                        </div>
                                      ) : (
                                        <div className="flex flex-col items-end">
                                          <span
                                            className={
                                              `flex items-center gap-2
                                              ${Number(p.currentPrice) > Number(p.boughtPrice)
                                                ? "text-emerald-400"
                                                : Number(p.currentPrice) < Number(p.boughtPrice)
                                                  ? "text-red-500"
                                                  : "text-gray-300"}

                                            `}
                                          >
                                            ₹{Number(p.currentPrice).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                                            <span
                                              className={
                                                " px-2 py-0.5 rounded-full text-xs font-normal text-[10px] " +
                                                (
                                                  Number(p.currentPrice) > Number(p.boughtPrice)
                                                    ? "bg-emerald-400/10 text-emerald-400"
                                                    : Number(p.currentPrice) < Number(p.boughtPrice)
                                                      ? "bg-red-500/10 text-red-400"
                                                      : "bg-gray-400/10 text-gray-300"
                                                )
                                              }
                                            >
                                              {
                                                Number(p.currentPrice) === 0
                                                  ? "0.00%"
                                                  : (
                                                    ((Number(p.currentPrice) - Number(p.boughtPrice)) / Number(p.boughtPrice)) * 100
                                                  ).toLocaleString("en-IN", { maximumFractionDigits: 2 }) + "%"
                                              }
                                            </span>
                                          </span>
                                        </div>
                                      )}
                                  </td>
                                  <td className="px-4 py-4 text-right">
                                    <Badge
                                      variant="outline"
                                      className="border-0 bg-white/20 text-white font-bold"
                                    >
                                      {p.status || "--"}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-4 text-right text-xs lg:text-sm text-gray-300 font-bold">
                                    {(() => {
                                      const date = new Date(p.timestamp);
                                      let hours = date.getHours();
                                      const minutes = date.getMinutes().toString().padStart(2, '0');
                                      const ampm = hours >= 12 ? 'PM' : 'AM';
                                      hours = hours % 12;
                                      hours = hours ? hours : 1; // the hour '0' should be '1'
                                      return `${hours}:${minutes}${ampm}`;
                                    })()}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              {/* Player Portfolio History Table */}
              <div className="mb-8 mt-8">
                <div className="flex justify-between items-center mb-4 mt-5 px-2">
                  <h2 className="text-2xl font-bold text-white">
                    History
                  </h2>
                </div>
                <div className="overflow-hidden rounded-xl bg-gray-800/30">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className=" bg-gray-800/50">
                          <th className="px-4 py-3 text-left text-sm font-bold text-gray-300 pl-6">
                            Player
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                            <span className="hidden xl:inline">Quantity(s)</span>
                            <span className="inline xl:hidden">Qt(s)</span>
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                            <span className="hidden xl:inline">Buy Price</span>
                            <span className="inline xl:hidden">Buy @</span>
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                            <span className="hidden xl:inline">Sell Price</span>
                            <span className="inline xl:hidden">Sell @</span>
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                            <span className="hidden xl:inline">Profit / Loss</span>
                            <span className="inline xl:hidden">P&amp;L</span>
                          </th>
                          {/* <th className="px-4 py-3 text-right text-sm font-bold text-gray-300"> */}
                          {/*   <span className="hidden xl:inline">Percentage</span> */}
                          {/*   <span className="inline xl:hidden">%</span> */}
                          {/* </th> */}
                          <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                            Status
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                            <span className="hidden lg:inline">Timestamp</span>
                            <span className="inline lg:hidden">Time</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {playerPortfoliosHistorys.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center text-gray-400 py-4">No player portfolio history</td>
                          </tr>
                        ) : (
                          playerPortfoliosHistorys.map((p, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <p className="font-bold text-white">{p.playerName}</p>
                                  <p className="text-xs text-gray-400 font-bold">{p.team}</p>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-right text-sm text-gray-300 font-bold">
                                {p.quantity ? `${p.quantity}` : "--"}
                              </td>
                              <td className="px-4 py-4 text-right text-sm text-gray-300 font-bold">
                                ₹{p.boughtPrice}
                              </td>
                              <td
                                className={`px-4 py-4 text-right text-sm font-bold ${Number(p.soldPrice) > Number(p.boughtPrice)
                                  ? "text-emerald-500"
                                  : Number(p.soldPrice) < Number(p.boughtPrice)
                                    ? "text-red-500"
                                    : "text-gray-300"
                                  }`}
                              >
                                ₹
                                {(Number(p.boughtPrice) + (Number(p.profit) / Number(p.quantity))).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-4 text-right text-sm font-bold text-emerald-500">
                                <span className={parseFloat(p.profit) >= 0 ? "text-emerald-500" : "text-red-500"}>
                                  ₹{parseFloat(p.profit) >= 0 ? parseFloat(p.profit).toLocaleString("en-IN", { maximumFractionDigits: 2 }) : `-${Math.abs(parseFloat(p.profit)).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
                                </span>
                                <span
                                  className={
                                    "ml-2 px-2 py-0.5 rounded-full text-[10px] font-normal  " +
                                    (
                                      Number(p.soldPrice) > Number(p.boughtPrice)
                                        ? "bg-emerald-400/10 text-emerald-400"
                                        : Number(p.soldPrice) < Number(p.boughtPrice)
                                          ? "bg-red-500/10 text-red-500"
                                          : "bg-gray-400/10 text-gray-300"
                                    )
                                  }
                                >
                                  {
                                    Number(p.boughtPrice) === 0
                                      ? "0.00%"
                                      : (
                                        ((Number(p.soldPrice) - Number(p.boughtPrice)) / Number(p.boughtPrice)) * 100
                                      ).toLocaleString("en-IN", { maximumFractionDigits: 2 }) + "%"
                                  }
                                </span>

                              </td>
                              <td className="px-4 py-4 text-right">
                                <Badge
                                  variant="outline"
                                  className={
                                    "border-0 font-normal text-[11px] " +
                                    (
                                      ((p.status?.toLowerCase() === "sold" || p.status?.toLowerCase() === "sell") && (String(parseFloat(p.profitPercentage)) === "-50"))
                                      && "bg-red-500/20 text-red-400"
                                    )
                                  }
                                >
                                  {((p.status?.toLowerCase() === "sold" || p.status?.toLowerCase() === "sell") && (String(parseFloat(p.profitPercentage)) === "-50")) ? "Auto-Sold" : p.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-4 text-right text-sm text-gray-300 font-bold">
                                {formatTimestamp(p.timestamp)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="team">
              <Card className="bg-gray-800/30">
                <CardHeader>
                  <CardTitle className="text-white text-2xl">
                    Team Holdings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {teamPortfolios.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="p-6 rounded-full mb-4">
                        <Trophy className="h-10 w-10 text-gray-500 hover:text-purple-700" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        No team holdings
                      </h3>
                      <p className="text-gray-400 max-w-md mb-6">
                        You don't have any team investments yet. Add teams to your
                        portfolio to track their performance.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl bg-gray-800/30">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className=" bg-gray-800/50">
                              <th className="px-4 py-3 text-left text-sm font-bold text-gray-300 pl-6">
                                Player
                              </th>
                              <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                                <span className="hidden xl:inline">Quantity(s)</span>
                                <span className="inline xl:hidden">Qt(s)</span>
                              </th>
                              <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                                <span className="hidden xl:inline">Buy Price</span>
                                <span className="inline xl:hidden">Buy @</span>
                              </th>
                              <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                                <span className="hidden xl:inline">Sell Price</span>
                                <span className="inline xl:hidden">Sell @</span>
                              </th>
                              <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                                <span className="hidden xl:inline">Profit / Loss</span>
                                <span className="inline xl:hidden">P&amp;L</span>
                              </th>
                              {/* <th className="px-4 py-3 text-right text-sm font-bold text-gray-300"> */}
                              {/*   <span className="hidden xl:inline">Percentage</span> */}
                              {/*   <span className="inline xl:hidden">%</span> */}
                              {/* </th> */}
                              <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                                Status
                              </th>
                              <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                                <span className="hidden lg:inline">Timestamp</span>
                                <span className="inline lg:hidden">Time</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {teamPortfolios.map((t, idx) => (
                              <tr key={idx}>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-3">
                                    <p className="font-bold text-white">{t.teamName}</p>
                                    <p className="text-xs text-gray-400">{t.team}</p>
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-right text-sm text-gray-300 font-bold">
                                  {t.quantity ? `${t.quantity}` : "--"}
                                </td>
                                <td className="px-4 py-4 text-right text-sm font-bold text-gray-300">
                                  ₹{t.boughtPrice}
                                </td>
                                <td className="px-4 py-4 text-right text-sm font-bold text-gray-300">
                                  ₹{t.soldPrice}
                                </td>
                                <td className="px-4 py-4 text-right text-sm font-bold text-emerald-500">
                                  ₹{t.profit}
                                  <span
                                    className={
                                      "ml-2 px-2 py-0.5 rounded-full text-xs font-bold " +
                                      (
                                        Number(t.boughtPrice) > Number(t.soldPrice)
                                          ? "bg-emerald-400/10 text-emerald-400"
                                          : Number(t.soldPrice) < Number(t.boughtPrice)
                                            ? "bg-red-500/10 text-red-400"
                                            : "bg-gray-400/10 text-gray-300"
                                      )
                                    }
                                  >
                                    {
                                      Number(t.boughtPrice) === 0
                                        ? "0.00%"
                                        : (
                                          ((Number(t.soldPrice) - Number(t.boughtPrice)) / Number(t.boughtPrice)) * 100
                                        ).toLocaleString("en-IN", { maximumFractionDigits: 2 }) + "%"
                                    }
                                  </span>

                                </td>
                                {/* <td className="px-4 py-4 text-right"> */}
                                {/*   <Badge className={parseFloat(t.profit) >= 0 ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 font-bold" : "bg-red-500/20 text-red-400 hover:bg-red-500/30 font-bold"}> */}
                                {/*     +{t.profitPercentage}% */}
                                {/*   </Badge> */}
                                {/* </td> */}
                                <td className="px-4 py-4 text-right">
                                  <Badge
                                    variant="outline"
                                    className="border-0 bg-white/20 text-white font-bold"
                                  >
                                    {((t.status?.toLowerCase() === "sold" || t.status?.toLowerCase() === "sell") && (parseFloat(t.profitPercentage) === -50)) ? "Auto-Sold" : t.status}
                                  </Badge>
                                </td>
                                <td className="px-4 py-4 text-right text-sm text-gray-300 font-bold">
                                  {formatTimestamp(t.timestamp)}
                                </td>
                                <td className="px-4 py-4 text-right">
                                  <div className="flex gap-2">
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      className="font-bold text-xs bg-white/20 hover:bg-emerald-600 hover:text-white transition-colors duration-300"
                                      onClick={() => {
                                        setTradeModalPortfolio(t);
                                        setTradeModalType("team");
                                        setTradeModalOpen(true);
                                      }}
                                    >
                                      Buy
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="font-bold text-xs bg-white/30 hover:bg-red-600 hover:text-white transition-colors duration-300"
                                      onClick={() => {
                                        setTradeModalPortfolio(t);
                                        setTradeModalType("team");
                                        setTradeModalOpen(true);
                                      }}
                                    >
                                      Sell
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              {/* Team Portfolio History Table */}
              <div className="mb-8 mt-8">
                <div className="flex justify-between items-center mb-4 mt-5 px-2">
                  <h2 className="text-2xl font-bold text-white">
                    History
                  </h2>
                </div>
                <div className="overflow-hidden rounded-xl bg-gray-800/30">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className=" bg-gray-800/50">
                          <th className="px-4 py-3 text-left text-sm font-bold text-gray-300 pl-6">
                            Player
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                            <span className="hidden xl:inline">Quantity(s)</span>
                            <span className="inline xl:hidden">Qt(s)</span>
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                            <span className="hidden xl:inline">Buy Price</span>
                            <span className="inline xl:hidden">Buy @</span>
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                            <span className="hidden xl:inline">Sell Price</span>
                            <span className="inline xl:hidden">Sell @</span>
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                            <span className="hidden xl:inline">Profit / Loss</span>
                            <span className="inline xl:hidden">P&amp;L</span>
                          </th>
                          {/* <th className="px-4 py-3 text-right text-sm font-bold text-gray-300"> */}
                          {/*   <span className="hidden xl:inline">Percentage</span> */}
                          {/*   <span className="inline xl:hidden">%</span> */}
                          {/* </th> */}
                          <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                            Status
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                            <span className="hidden lg:inline">Timestamp</span>
                            <span className="inline lg:hidden">Time</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamPortfoliosHistorys.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center text-gray-400 py-4">No team portfolio history</td>
                          </tr>
                        ) : (
                          teamPortfoliosHistorys.map((t, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <p className="font-bold text-white">{t.teamName}</p>
                                  <p className="text-xs font-bold text-gray-400">{t.team}</p>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-right text-sm text-gray-300 font-bold">
                                {t.quantity ? `${t.quantity}` : "--"}
                              </td>
                              <td className="px-4 py-4 text-right text-sm text-gray-300 font-bold">
                                ₹{t.boughtPrice}
                              </td>
                              <td className="px-4 py-4 text-right text-sm text-gray-300 font-bold">
                                ₹{t.soldPrice}
                              </td>
                              <td className="px-4 py-4 text-right text-sm font-bold text-emerald-500">
                                ₹{t.profit}
                                <span
                                  className={
                                    "ml-2 px-2 py-0.5 rounded-full text-xs font-bold " +
                                    (
                                      Number(t.boughtPrice) > Number(t.soldPrice)
                                        ? "bg-emerald-400/10 text-emerald-400"
                                        : Number(t.soldPrice) < Number(t.boughtPrice)
                                          ? "bg-red-500/10 text-red-400"
                                          : "bg-gray-400/10 text-gray-300"
                                    )
                                  }
                                >
                                  {
                                    Number(t.boughtPrice) === 0
                                      ? "0.00%"
                                      : (
                                        ((Number(t.soldPrice) - Number(t.boughtPrice)) / Number(t.boughtPrice)) * 100
                                      ).toLocaleString("en-IN", { maximumFractionDigits: 2 }) + "%"
                                  }
                                </span>

                              </td>
                              {/* <td className="px-4 py-4 text-right"> */}
                              {/*   <Badge className={parseFloat(t.profit) >= 0 ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 font-bold" : "bg-red-500/20 text-red-400 hover:bg-red-500/30 font-bold"}> */}
                              {/*     +{t.profitPercentage}% */}
                              {/*   </Badge> */}
                              {/* </td> */}
                              <td className="px-4 py-4 text-right">
                                <Badge
                                  variant="outline"
                                  className="border-0 bg-white/20 text-white font-bold"

                                >
                                  {t.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-4 text-right text-sm text-gray-300 font-bold">
                                {formatTimestamp(t.timestamp)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main >
        <PortfolioTradeModal
          open={tradeModalOpen}
          onClose={() => setTradeModalOpen(false)}
          portfolio={tradeModalPortfolio}
          team={tradeModalPortfolio ? (tradeModalType === "player" ? mapPlayerPortfolioToTeam(tradeModalPortfolio) : mapTeamPortfolioToTeam(tradeModalPortfolio)) : { team_id: '', name: '', short_name: '', logo_url: '', thumb_url: '', scores_full: '', scores: '', overs: '' }}
          onBuy={handleBuy}
          onSell={handleSell}
        />
      </div >
    );
  }
}
