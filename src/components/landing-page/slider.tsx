"use client"

import Autoplay from "embla-carousel-autoplay"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import React from "react"
import Image from "next/image"
import { Activity, Brain, ChartColumn, ChevronRight, LucideIcon, Sparkles, TrendingUp, Trophy, Zap } from "lucide-react"
import { Button } from "../ui/button"
import Link from "next/link"

type Banners = {
  icons: LucideIcon
  title: string
  description: string
  image: string
}

const banners: Banners[] = [
  {

    icons: ChartColumn,
    title: "Cricket Meets Stock Market",
    description: "Buy low, sell high, and beat the competition. Trade players like stocks and build your fantasy portfolio.",
    image: "/images/bn.png",
  },
  {
    icons: Activity,
    title: "The Future of Fantasy Cricket Is Here",
    description: "Experience cricket like never before. Buy, sell, and trade players based on their real-time stats.",
    image: "/images/bn1.png",
  },
  {
    icons: Brain,
    title: "Outsmart the Crowd. Own the Game",
    description: "Use your cricket IQ to invest in real-time player performance. Analyse right, trade smart, and win real rewards.",
    image: "/images/bn2.png",
  },
]

const BannerSlider = () => {
  const plugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false })
  )

  return (
    <Carousel
      plugins={[plugin.current]}
      className="w-full relative"
    >
      <CarouselContent className="">
        <div />
        {banners.map((item, index) => (
          <CarouselItem key={index} className="min-h-[32rem] lg:h-[35rem] h-auto py-8 lg:py-0">
            <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 bg-gradient-to-br from-slate-900/80 via-accent-dark/80 to-blue-900/80 backdrop-blur-sm rounded-3xl p-6 lg:p-16 shadow-2xl">
              <div className="flex-1 z-10">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#5bb4de]/20 to-blue-500/20 backdrop-blur-sm border border-purple-500/30 rounded-full px-3 lg:px-4 py-1.5 lg:py-2 mb-4 lg:mb-6">
                  <Zap className="w-3 h-3 lg:w-4 lg:h-4 text-purple-400" />
                  <span className="text-xs lg:text-sm font-medium text-purple-200">Welcome to CricStock11</span>
                </div>

                <h1 className="text-2xl lg:text-5xl text-blue-100 gap-1 lg:gap-2 font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text mb-4 lg:mb-6">
                  {<item.icons className="text-[#FFB3B3] mb-2.5 lg:size-10 size-6 inline-block" />} {item.title}
                  {/* <span className="text-xl lg:text-4xl text-gray-200">Analyze, Trade & Win Big!</span> */}
                </h1>

                <p className="text-base lg:text-xl text-slate-300 mb-6 lg:mb-8 leading-relaxed max-w-2xl">
                  {item.description}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
                  <Button className="group bg-emerald-600 text-base hover:border-b hover:rounded-none hover:border-emerald-400 flex justify-center items-center rounded-sm px-6 lg:px-8 py-4 lg:py-6" asChild>
                    <Link href="/login" className="flex justify-center items-center">
                      <TrendingUp className="size-4 lg:size-5 text-green-200" />
                      <span className="ml-2 text-base lg:text-lg">Start Trading Now</span>
                      <ChevronRight className="size-0 group-hover:size-4 lg:group-hover:size-5 transition-all duration-400" />
                    </Link>
                  </Button>
                  <Button variant="outline" className="group bg-white/70 border-purple-500/30 text-base hover:bg-purple-500/10 flex justify-center items-center rounded-sm px-6 lg:px-8 py-4 lg:py-6" asChild>
                    <Link href="/about" className="flex justify-center items-center">
                      <span className="ml-2 text-base lg:text-lg text-black hover:text-white">Learn More</span>
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="flex-1 flex justify-center lg:justify-end w-full lg:w-auto">
                <div className="relative w-full max-w-[500px]">
                  <Image
                    src={item.image}
                    alt="CricStock11 Trading Platform"
                    width={500}
                    height={500}
                    className="relative w-full max-h-60 rounded-3xl shadow-2xl object-cover border border-white/20"
                  />

                  <div className="mt-8 lg:mt-12 flex flex-wrap items-center gap-4 lg:gap-8">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 border-2 border-slate-900"></div>
                        ))}
                      </div>
                      <span className="text-sm lg:text-base text-slate-300">10K+ Active Traders</span>
                    </div>
                    <div className="h-6 w-px bg-slate-700"></div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
                        <Trophy className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
                      </div>
                      <span className="text-sm lg:text-base text-slate-300">₹50M+ Trading Volume</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  )
}

export default BannerSlider
