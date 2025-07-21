"use client"

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp, Target, Zap, Shield, Brain } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StockAnimationBackground } from "@/components/about-us/stock-animation-background";
import { CricketStockChart } from "@/components/about-us/cricket-stock-chart";
import { useEffect } from "react";
import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 relative overflow-hidden flex items-center justify-center text-center">
        <StockAnimationBackground />
        <div className="relative z-10 max-w-[95rem] mx-auto px-4 md:px-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-3xl md:text-5xl font-extrabold tracking-tight text-white"
          >
            <span className="text-gray-300">Driven by Passion, Backed by Data.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-md md:text-xl text-gray-400 max-w-2xl mx-auto mt-4"
          >
            Step into a new era of cricket where every trade can change the game.
          </motion.p>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 relative overflow-hidden flex items-center justify-center text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent opacity-50" />
        <div className="relative z-10 max-w-[95rem] mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
              About Cricstock11
            </h2>
            <div className="mt-8 space-y-6">
              <p className="max-w-[900px] text-gray-300 md:text-xl/relaxed mx-auto leading-relaxed">
                Cricstock11 is a revolutionary fantasy gaming platform that redefines the way fans interact with cricket by merging the fast-paced excitement of fantasy sports with the strategic depth of the stock market.
              </p>
              <p className="max-w-[900px] text-gray-300 md:text-xl/relaxed mx-auto leading-relaxed">
                In traditional fantasy games, users create teams and wait for match outcomes to determine their points. But at Cricstock11, we've introduced a dynamic and skill-based layer to fantasy sports – where every cricket player and team becomes a tradable virtual stock. Users can buy, sell, and hold these stocks based on real-world performance, just like traders operate in the financial markets.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Where Cricket Meets Stock Market Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 relative overflow-hidden flex items-center justify-center text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent opacity-50" />
        <div className="relative z-10 max-w-[95rem] mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-600">
              Where Cricket Meets the Stock Market
            </h2>
            <div className="max-w-[900px] mx-auto mt-12 space-y-8">
              <p className="text-gray-300 md:text-xl/relaxed font-medium">
                The concept is simple yet powerful:
              </p>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-sm border border-white/10">
                  <TrendingUp className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <p className="text-gray-300 text-lg">
                    Each cricket player is assigned a stock value that fluctuates based on their live performance, recent form, and market demand.
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-sm border border-white/10">
                  <Target className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <p className="text-gray-300 text-lg">
                    Users can build a virtual portfolio of players and teams with real money, analyze match-ups, track statistics, and make strategic trades to maximize their returns.
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-sm border border-white/10">
                  <Zap className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                  <p className="text-gray-300 text-lg">
                    As a player scores runs, takes wickets, or delivers an all-round performance, their stock price moves in real time, offering opportunities to capitalize on form swings and momentum shifts.
                  </p>
                </div>
              </div>
              <p className="text-gray-300 md:text-xl/relaxed mt-8 font-medium">
                This isn't just about watching cricket – it's about actively engaging with it like never before.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Game of Skill Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 relative overflow-hidden flex items-center justify-center text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-pink-500/10 to-transparent opacity-50" />
        <div className="relative z-10 max-w-[95rem] mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-rose-600">
              A Game of Skill and Strategy
            </h2>
            <p className="max-w-[900px] text-gray-300 md:text-xl/relaxed mx-auto mt-8 leading-relaxed">
              Cricstock11 is designed for true cricket lovers and analytical minds. It's a game of skill where users must assess performance trends, read between the lines of match data, and make informed investment-like decisions. Whether you're a casual fan or a stats-driven analyst, Cricstock11 gives you the tools to prove your cricketing IQ in a market-based fantasy arena.
            </p>
            <div className="max-w-[900px] mx-auto mt-12">
              <p className="text-gray-300 md:text-xl/relaxed mb-6 font-medium">Unlike pure luck-based games, success on Cricstock11 comes from:</p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 backdrop-blur-sm border border-white/10">
                  <p className="text-gray-300 text-lg">• Deep cricketing insight</p>
                  <p className="text-gray-300 text-lg mt-4">• Real-time decision-making</p>
                </div>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 backdrop-blur-sm border border-white/10">
                  <p className="text-gray-300 text-lg">• Market analysis and research</p>
                  <p className="text-gray-300 text-lg mt-4">• Timing your entries and exits like a trader</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why We Built Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 relative overflow-hidden flex items-center justify-center text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent opacity-50" />
        <div className="relative z-10 max-w-[95rem] mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-600">
              Why We Built Cricstock11
            </h2>
            <div className="max-w-[900px] mx-auto mt-12 space-y-6">
              <p className="text-gray-300 md:text-xl/relaxed leading-relaxed">
                We noticed that while fantasy sports was booming, it lacked the interactive, real-time, and economically engaging experience that today's users crave. On the other hand, the stock market provides thrill and engagement, but it's not always accessible or relatable to the everyday sports fan.
              </p>
              <p className="text-gray-300 md:text-xl/relaxed leading-relaxed">
                So, we combined the best of both worlds. With Cricstock11, you get the passion of cricket and the adrenaline of trading, fused into one platform where your understanding of the game is your most valuable asset.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What to Expect Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 relative overflow-hidden flex items-center justify-center text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent opacity-50" />
        <div className="relative z-10 max-w-[95rem] mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-600">
              What You Can Expect
            </h2>
            <div className="max-w-[900px] mx-auto mt-12">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-sm border border-white/10">
                  <Sparkles className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                  <p className="text-gray-300 text-lg">A user-friendly app designed for smooth gameplay and instant trades</p>
                </div>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-sm border border-white/10">
                  <TrendingUp className="w-12 h-12 text-teal-400 mx-auto mb-4" />
                  <p className="text-gray-300 text-lg">Real-time price movements based on actual match events</p>
                </div>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-sm border border-white/10">
                  <Target className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                  <p className="text-gray-300 text-lg">Regular tournaments, rewards, and contests to compete and win</p>
                </div>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-sm border border-white/10">
                  <Zap className="w-12 h-12 text-teal-400 mx-auto mb-4" />
                  <p className="text-gray-300 text-lg">Detailed performance analytics and player histories to guide your trades</p>
                </div>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-sm border border-white/10">
                  <Shield className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                  <p className="text-gray-300 text-lg">Secure transactions, verified user identities, and a fair play ecosystem</p>
                </div>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-sm border border-white/10">
                  <Brain className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                  <p className="text-gray-300 text-lg">Unlimited thrills & use of your built up cricket knowledge </p>
                </div>
              </div>
              <div className="mt-12 space-y-6">
                <p className="text-gray-300 md:text-xl/relaxed leading-relaxed">
                  Whether it's a high-stakes India vs Australia clash or an under-the-radar domestic league, Cricstock11 brings every ball, every run, and every decision into your hands – not just as a fan, but as a trader and strategist.
                </p>
                <p className="text-gray-300 md:text-xl/relaxed font-semibold">
                  Cricstock11 isn't just fantasy gaming. It's fantasy stock trading – powered by cricket.
                </p>
                <p className="text-white text-4xl font-semibold mt-10">
                  Watch. Analyse. Trade. Win.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 relative overflow-hidden flex items-center justify-center text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent opacity-50" />
        <div className="relative z-10 max-w-[95rem] mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
              Ready to Join the Revolution?
            </h2>
            <p className="max-w-[600px] text-gray-300 md:text-xl/relaxed mx-auto mt-4">
              Start your journey with CricStock11 today and experience fantasy cricket like never before.
            </p>
            <div className="mt-8">
              <Button
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 py-6 px-8 font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105"
                asChild
              >
                <Link href="/live-matches" className="flex items-center gap-2">
                  Get Started
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function TeamMember({ name, role, description, image }: any) {
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative h-40 w-40 overflow-hidden rounded-full shadow-[0_0_10px_rgba(147,51,234,0.3)]">
        <Image src={image} alt={name} width={160} height={160} className="object-cover" />
      </div>
      <h3 className="text-xl font-bold text-white">{name}</h3>
      <p className="text-gray-400">{role}</p>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
    </div>
  );
}
