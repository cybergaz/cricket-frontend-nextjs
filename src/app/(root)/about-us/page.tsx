"use client"

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useSocketStore } from "@/store/socket-store";

import { Button } from "@/components/ui/button";
import { StockAnimationBackground } from "@/components/about-us/stock-animation-background";
import { CricketStockChart } from "@/components/about-us/cricket-stock-chart";
import { useEffect } from "react";

export default function AboutPage() {

  // const fetchMatches = useMatchesStore((s) => s.fetchMatches);
  //
  // const matchData = useMatchesStore((s) => s.matchData);;
  // console.log("matchData :", matchData)
  //
  // useEffect(() => {
  //   fetchMatches();
  //   return () => {
  //     useSocketStore.getState().disconnectSocket();
  //   };
  // }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 relative overflow-hidden flex items-center justify-center text-center">
        <StockAnimationBackground />
        <div className="relative z-10 max-w-[95rem] mx-auto px-4 md:px-6">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
            <span className="text-gray-300">Driven by Passion, Backed by Data.</span>
          </h1>
          <p className="text-md md:text-xl text-gray-400 max-w-2xl mx-auto">
            Step into a new era of cricket where every trade can change the game.
          </p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 relative overflow-hidden flex items-center justify-center text-center">
        <div className="relative z-10 max-w-[95rem] mx-auto px-4 md:px-6">
          <div className="inline-block rounded-lg px-3 py-1 text-sm text-gray-300">Our Story</div>
          <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl md:text-5xl">
            From Vision to Reality
          </h2>
          <p className="p-5 text-gray-400 md:text-xl/relaxed">
            Founded in 2023, CricStock11 emerged from a passion for cricket and a vision to transform how fans engage with the sport. Our founders, avid cricket enthusiasts and technology experts, recognized the potential to combine fantasy sports with blockchain technology.
          </p>
        </div>
      </section>

      {/* Our Mission Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 relative overflow-hidden flex items-center justify-center text-center">
        <div className="relative z-10 max-w-[95rem] mx-auto px-4 md:px-6">
          <div className="inline-block rounded-lg px-3 py-1 text-sm text-gray-300">Our Mission</div>
          <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl md:text-5xl">
            Revolutionizing Fantasy Cricket
          </h2>
          <p className="max-w-[900px] text-gray-400 md:text-xl/relaxed mx-auto">
            At CricStock11, we're on a mission to transform fantasy cricket by creating a transparent, engaging, and rewarding platform that combines the thrill of fantasy sports with the innovation of blockchain technology.
          </p>
        </div>
      </section>

      {/* Stock Chart Showcase */}
      <section className="w-full py-12 md:py-24 lg:py-32 relative overflow-hidden flex items-center justify-center text-center">
        <div className="relative z-10 max-w-[95rem] mx-auto px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl md:text-5xl">
            Cricket Meets the Stock Market
          </h2>
          <p className="max-w-[900px] text-gray-400 mx-auto">
            Watch how player values fluctuate based on performance, market demand, and strategic insights.
          </p>
          <div className="mx-auto max-w-5xl mt-8">
            <div className="aspect-[16/9] w-full">
              <CricketStockChart />
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      {/* <section className="w-full py-12 md:py-24 lg:py-32 relative overflow-hidden flex items-center justify-center text-center"> */}
      {/*   <div className="relative z-10 max-w-[95rem] mx-auto px-4 md:px-6"> */}
      {/*     <div className="inline-block rounded-lg px-3 py-1 text-sm text-gray-300">Our Leaders</div> */}
      {/*     <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl md:text-5xl"> */}
      {/*       Meet the Experts Behind CricStock11 */}
      {/*     </h2> */}
      {/*     <p className="max-w-[900px] text-gray-400 mx-auto"> */}
      {/*       Our diverse team brings together expertise in cricket, blockchain technology, data science, and user experience design. */}
      {/*     </p> */}
      {/*     <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 mt-12"> */}
      {/*       <TeamMember */}
      {/*         name="Rahul Sharma" */}
      {/*         role="Co-Founder & CEO" */}
      {/*         description="Former cricket analyst with 10+ years of experience in sports technology" */}
      {/*         image="/professional-male-headshot.png" */}
      {/*       /> */}
      {/*       <TeamMember */}
      {/*         name="Priya Patel" */}
      {/*         role="Co-Founder & CTO" */}
      {/*         description="Blockchain expert with background in developing decentralized applications" */}
      {/*         image="/professional-headshot-female.png" */}
      {/*       /> */}
      {/*       <TeamMember */}
      {/*         name="Vikram Singh" */}
      {/*         role="Head of Data Science" */}
      {/*         description="AI specialist focused on predictive analytics for sports performance" */}
      {/*         image="/placeholder.svg" */}
      {/*       /> */}
      {/*     </div> */}
      {/*   </div> */}
      {/* </section> */}

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 relative overflow-hidden flex items-center justify-center text-center">
        <div className="relative z-10 max-w-[95rem] mx-auto px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl">
            Ready to Join the Revolution?
          </h2>
          <p className="max-w-[600px] text-gray-400 md:text-xl/relaxed mx-auto">
            Start your journey with CricStock11 today and experience fantasy cricket like never before.
          </p>
          <div className="mt-5">
            <Button
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-accent-light hover:bg-accent-dark py-5 font-semibold text-accent hover:text-white shadow-lg transition-all duration-300 hover:shadow-2xl"
              asChild
            >
              <Link href="/live-matches" className="flex items-center gap-2">
                Start Trading Now
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
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
