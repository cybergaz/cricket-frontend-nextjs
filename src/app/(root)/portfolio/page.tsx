"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TrendingUp, BarChart3, Users, Trophy, Clock, Landmark, Bitcoin, DollarSign } from "lucide-react";
import type { Metadata } from "next";
import { useUserStore } from "@/store/user-store";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PlayerPortfolio, TeamPortfolio } from "./types";
import { Loading } from "../betting-interface/components/Loading";
import { formatINR } from "@/lib/helper";

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
  const [value, setValue] = useState(0);
  const [profit, setProfit] = useState(0);


  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        setLoading(true)
        // Get token from cookies
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
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
          },
        });

        const apiData = await res.json();
        if (!apiData.success) {
          toast(apiData.message)
          return
        }
        console.log(apiData)
        setProfit(apiData.profit)
        setValue(apiData.value)
        // setProfit(apiData.p)
        // Helper to split active/history
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
          setLoading(false)
          return { active, history };
        }

        // Player portfolios
        const playerResult = splitByStatus<PlayerPortfolio>(apiData.playerPortfolios || []);
        setPlayerPortfolios(playerResult.active);
        setPlayerPortfoliosHistorys(playerResult.history);

        // Team portfolios
        const teamResult = splitByStatus<TeamPortfolio>(apiData.teamPortfolios || []);
        setTeamPortfolios(teamResult.active);
        setTeamPortfoliosHistorys(teamResult.history);
        setLoading(false)

      } catch (e: any) {
        toast("Fetch error: " + (e?.message || e));
        setLoading(false)
      }
    };
    fetchPortfolios();
  }, []);



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
        <main className="container mx-auto px-4 py-8">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <Card className="border-none shadow-lg transition-all duration-200 bg-gradient-to-br from-purple-600 via-transparent to-transparent rounded-tl-[100px]">
              <CardContent className="p-7 pl-10 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-400 text-sm font-bold tracking-wide uppercase mb-1">
                      Total Balance
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
                    <p className="text-cyan-400 text-sm font-bold tracking-wide uppercase mb-1">
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

            <Card className="border-none shadow-lg transition-all duration-200 bg-gradient-to-br from-emerald-600 via-transparent to-transparent rounded-tl-[100px]">
              <CardContent className="p-7 pl-10 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-400 text-sm font-bold tracking-wide uppercase mb-1">
                      Total Profit
                    </p>
                    <h3 className="text-4xl font-extrabold text-white drop-shadow-sm tracking-tight mt-1">
                      {formatINR(Number(profit))}

                    </h3>
                    <p className="text-emerald-500 text-sm flex items-center mt-1">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      {
                        (() => {
                          const allPortfolios = [
                            ...playerPortfolios,
                            ...teamPortfolios,
                            ...teamPortfoliosHistorys,
                            ...playerPortfoliosHistorys
                          ];
                          const totalProfit = allPortfolios.reduce(
                            (acc, curr) => acc + (parseFloat(curr.profit) || 0),
                            0
                          );
                          const totalBought = allPortfolios.reduce(
                            (acc, curr) => acc + (parseFloat(curr.boughtPrice) || 0),
                            0
                          );
                          if (totalBought === 0) return "0.00%";
                          const profitPercentage = (totalProfit / totalBought) * 100;
                          return profitPercentage.toLocaleString("en-IN", { maximumFractionDigits: 2 }) + "%";
                        })()
                      }
                    </p>
                  </div>
                  <div className="flex items-center justify-center bg-emerald-500/20 p-4 rounded-full shadow-inner">
                    <DollarSign className="h-8 w-8 text-emerald-400 drop-shadow" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Portfolio Tabs */}
          <Tabs defaultValue="player" className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <TabsList className="">
                <TabsTrigger
                  value="player"
                  className="p-4 h-10 w-50 text-lg bg-gray-900 data-[state=active]:bg-purple-500 text-white transition-colors ease-in-out duration-600 rounded-bl-full rounded-tl-full rounded-br-none rounded-tr-none cursor-pointer"
                >
                  Player Portfolio
                </TabsTrigger>
                <TabsTrigger
                  value="team"
                  className="p-4 h-10 w-50 text-lg bg-gray-900 data-[state=active]:bg-purple-500 text-white transition-colors ease-in-out duration-600 rounded-br-full rounded-tr-full rounded-bl-none rounded-tl-none cursor-pointer"
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
                <CardContent>
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
                                Quantity(s)
                              </th>
                              <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                                Buy Price
                              </th>
                              <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                                Status
                              </th>
                              <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                                Timestamp
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {playerPortfolios && playerPortfolios.length > 0 && playerPortfolios.map((p, idx) => (
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
                                  {p.boughtPrice ? `₹${p.boughtPrice}` : "--"}
                                </td>
                                <td className="px-4 py-4 text-right">
                                  <Badge
                                    variant="outline"
                                    className="border-0 bg-white/20 text-white font-bold"
                                  >
                                    {p.status || "--"}
                                  </Badge>
                                </td>
                                <td className="px-4 py-4 text-right text-sm text-gray-300 font-bold">
                                  {formatTimestamp(p.timestamp)}
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
                            Quantity(s)
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                            Buy Price
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                            Sell Price
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                            Profit / Loss
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                            Percentage
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                            Status
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                            Timestamp
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
                              <td className="px-4 py-4 text-right text-sm text-gray-300 font-bold">
                                ₹{p.soldPrice}
                              </td>
                              <td className="px-4 py-4 text-right text-sm font-bold text-emerald-500">
                                <span className={parseFloat(p.profit) >= 0 ? "text-emerald-500" : "text-red-500"}>
                                  ₹{parseFloat(p.profit) >= 0 ? parseFloat(p.profit).toLocaleString("en-IN", { maximumFractionDigits: 2 }) : `-${Math.abs(parseFloat(p.profit)).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <Badge className={parseFloat(p.profit) >= 0 ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 font-bold" : "bg-red-500/20 text-red-400 hover:bg-red-500/30 font-bold"}>
                                  {parseFloat(p.profit) >= 0 ? "+" : "-"}
                                  {Math.abs(parseFloat(p.profitPercentage)).toLocaleString("en-IN", { maximumFractionDigits: 2 })}%
                                </Badge>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <Badge
                                  variant="outline"
                                  className="border-0 bg-white/20 text-white font-bold"
                                >
                                  {p.status}
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
                                Quantity(s)
                              </th>
                              <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                                Buy Price
                              </th>
                              <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                                Sell Price
                              </th>
                              <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                                Profit / Loss
                              </th>
                              <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                                Percentage
                              </th>
                              <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                                Status
                              </th>
                              <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                                Timestamp
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
                                </td>
                                <td className="px-4 py-4 text-right">
                                  <Badge className={parseFloat(t.profit) >= 0 ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 font-bold" : "bg-red-500/20 text-red-400 hover:bg-red-500/30 font-bold"}>
                                    +{t.profitPercentage}%
                                  </Badge>
                                </td>
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
                            Quantity(s)
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                            Buy Price
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                            Sell Price
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                            Profit / Loss
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                            Percentage
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                            Status
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-bold text-gray-300">
                            Timestamp
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
                              </td>
                              <td className="px-4 py-4 text-right">
                                <Badge className={parseFloat(t.profit) >= 0 ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 font-bold" : "bg-red-500/20 text-red-400 hover:bg-red-500/30 font-bold"}>
                                  +{t.profitPercentage}%
                                </Badge>
                              </td>
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
        </main>
      </div>
    );
  }
}
