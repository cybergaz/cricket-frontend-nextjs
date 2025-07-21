import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { TrendingUp, PlusCircle } from "lucide-react"
import { Match } from "@/types/match-schedule"
import { useRouter } from "next/navigation"

export function FeaturedBanner(match: Match) {
  const router = useRouter();
  const {
    competition,
    teama,
    teamb,
    venue,
    status_note,
  } = match;

  return (
    <section className="relative bg-background py-16 md:py-20 lg:py-18 mb-8 overflow-hidden ">
      {/* === Full-Background Blended Team Images === */}
      <div className="absolute inset-0 z-10 overflow-hidden blur-lg bg-gradient-to-b from-transparent via-black/60 to-black/60">
        <img
          src={teama?.logo_url}
          alt={teama?.name}
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay scale-125"
        />
        <img
          src={teamb?.logo_url}
          alt={teamb?.name}
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay scale-125"
        />
      </div>

      {/* === Main Content === */}
      <div className="relative z-20 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-center gap-6 md:gap-8 text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <div className="inline-flex items-center gap-2 mb-4 mx-auto md:mx-0 px-4 py-2">
              <TrendingUp className="h-4 w-4 mr-2" />
              <span className="font-extrabold text-base sm:text-lg md:text-xl">
                FEATURED MATCH
              </span>
            </div>

            <h2 className="relative text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              <span className="relative z-10">{competition?.title}</span>
              <motion.span
                style={{
                  position: "absolute",
                  inset: "0",
                  borderRadius: "0.5rem",
                }}
                animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.02, 1] }}
                transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
              />
            </h2>

            <p className="text-gray-400 mb-1 text-base sm:text-lg font-semibold">
              {venue?.name}, {venue?.location}
            </p>
            <p className="text-gray-400 mb-1 text-base sm:text-lg font-semibold">
              {status_note}
            </p>
            <p className="text-gray-300 mb-6 text-base sm:text-lg md:text-xl font-semibold max-w-2xl mx-auto md:mx-0">
              Don&apos;t miss the exciting clash between {teama?.name} and {teamb?.name}! Add this match to your portfolio now.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
              <Button
                size="lg"
                onClick={() => router.push(`/betting-interface?id=${match.match_id}`)}
                className="bg-green-400/30 hover:bg-green-800 text-white/80 hover:text-white text-base sm:text-lg font-bold px-6 py-4 transition-all duration-300"
              >
                <PlusCircle className="h-6 w-6 mr-2 stroke-3" />
                Create Portfolio
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}