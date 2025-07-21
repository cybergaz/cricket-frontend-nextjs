"use client"

import { motion } from "framer-motion"
import { ShieldCheck, Award, MapPin, Thermometer, Droplets } from "lucide-react"

const colorClassMap: Record<string, { text: string; fill: string }> = {
    sky: { text: "text-sky-400", fill: "fill-sky-400/20" },
    amber: { text: "text-amber-400", fill: "fill-amber-400/20" },
    emerald: { text: "text-emerald-400", fill: "fill-emerald-400/20" },
    orange: { text: "text-orange-400", fill: "fill-orange-400/20" },
    cyan: { text: "text-cyan-400", fill: "fill-cyan-400/20" },
}

interface TickerItem {
    label: string
    value: string
    Icon: React.ElementType
    color: string
}

interface MatchInfoTickerProps {
    umpires?: string
    referee?: string
    venue?: { name?: string; location?: string }
    weather?: { weather_desc?: string; temp?: string | number }
    pitch?: { pitch_condition?: string }
}

export function MatchInfoTicker({ umpires, referee, venue, weather, pitch }: MatchInfoTickerProps) {
    const tickerItems: TickerItem[] = []

    if (umpires) {
        tickerItems.push({ label: "Umpires", value: umpires, Icon: ShieldCheck, color: "sky" })
    }
    if (referee) {
        tickerItems.push({ label: "Referee", value: referee, Icon: Award, color: "amber" })
    }
    if (venue?.name && venue.location) {
        tickerItems.push({
            label: "Venue",
            value: `${venue.name}, ${venue.location}`,
            Icon: MapPin,
            color: "emerald",
        })
    }
    if (weather?.weather_desc && weather.temp) {
        tickerItems.push({
            label: "Weather",
            value: `${weather.weather_desc}, ${weather.temp}°C`,
            Icon: Thermometer,
            color: "orange",
        })
    }
    if (pitch?.pitch_condition) {
        tickerItems.push({ label: "Pitch", value: pitch.pitch_condition, Icon: Droplets, color: "cyan" })
    }

    if (tickerItems.length === 0) {
        return null
    }

    const duplicatedItems = [...tickerItems, ...tickerItems, ...tickerItems, ...tickerItems]

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/60 backdrop-blur-sm py-2 z-20 overflow-hidden">
            <motion.div
                className="flex items-center space-x-12"
                animate={{ x: [0, -2500] }}
                transition={{
                    duration: 50,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                }}
            >
                {duplicatedItems.map(({ label, value, Icon, color }, i) => {
                    // Use the colorClassMap to get the correct Tailwind classes
                    const colorClasses = colorClassMap[color] || { text: "text-white", fill: "" }
                    return (
                        <div key={i} className="flex items-center space-x-2 whitespace-nowrap">
                            <Icon className={`w-5 h-5 ${colorClasses.text} ${colorClasses.fill}`} />
                            <span className="font-semibold text-sm md:text-base">
                                <span className={`font-bold ${colorClasses.text}`}>{label}:</span>{" "}
                                <span className="text-white font-bold">{value}</span>
                            </span>
                        </div>
                    )
                })}
            </motion.div>
        </div>
    )
} 