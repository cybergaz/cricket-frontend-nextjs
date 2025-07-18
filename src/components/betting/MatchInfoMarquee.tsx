import { motion } from "framer-motion";
import React from "react";

interface MatchInfoMarqueeProps {
    children: React.ReactNode[];
    duration?: number; // seconds for one full scroll
}

export const MatchInfoMarquee: React.FC<MatchInfoMarqueeProps> = ({
    children,
    duration = 30,
}) => {
    // Duplicate children for seamless scroll
    const marqueeItems = [...children, ...children];

    return (
        <div className="overflow-hidden w-full bg-transparent py-4">
            <motion.div
                className="flex gap-8 px-4"
                animate={{ x: ["0%", "-50%"] }}
                transition={{
                    duration,
                    repeat: Infinity,
                    ease: "linear",
                }}
                style={{ width: "max-content" }}
            >
                {marqueeItems.map((child, i) => (
                    <div key={i} className="flex items-center min-w-[160px] sm:min-w-[120px]">
                        {child}
                    </div>
                ))}
            </motion.div>
        </div>
    );
}; 