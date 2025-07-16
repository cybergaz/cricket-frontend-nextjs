"use client";

import { useEffect, useRef, useState } from "react";

type MatchStartTimerProps = {
    startTime?: string | null;
    onComplete?: () => void; // Add onComplete prop
};

function pad(n: number) {
    return n < 10 ? `0${n}` : n;
}

export default function MatchStartTimer({ startTime, onComplete }: MatchStartTimerProps) {
    // If no startTime, just show nothing
    if (!startTime) return null;

    // Parse the start time (assume IST, so treat as local if no timezone)
    let matchStart: Date;
    if (startTime.includes("T")) {
        matchStart = new Date(startTime);
    } else {
        // fallback: replace space with T for ISO
        matchStart = new Date(startTime.replace(" ", "T"));
    }

    // Timer should show countdown if match hasn't started, or elapsed if started
    const [diff, setDiff] = useState<number>(() => {
        const now = new Date();
        return Math.floor((matchStart.getTime() - now.getTime()) / 1000);
    });

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const calledRef = useRef(false); // To ensure onComplete is called only once

    useEffect(() => {
        intervalRef.current = setInterval(() => {
            const now = new Date();
            setDiff(Math.floor((matchStart.getTime() - now.getTime()) / 1000));
        }, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
        // eslint-disable-next-line
    }, [startTime]);

    // Call onComplete when timer finishes (diff <= 0), only once
    useEffect(() => {
        if (diff <= 0 && !calledRef.current) {
            if (typeof onComplete === 'function') {
                onComplete();
            }
            calledRef.current = true;
        }
    }, [diff, onComplete]);

    // Format elapsed as HH:MM:SS
    // Use diff (seconds) to compute hours, minutes, seconds (can be negative)
    const absDiff = Math.abs(diff);
    const hours = Math.floor(absDiff / 3600);
    const minutes = Math.floor((absDiff % 3600) / 60);
    const seconds = absDiff % 60;

    return (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-br from-sky-500 via-transparent to-transparent shadow-lg">
            <span className="font-mono text-xl md:text-2xl text-sky-100 px-3 py-1 rounded-lg tracking-widest">
                {pad(hours)}:{pad(minutes)}:{pad(seconds)}
            </span>
        </div>
    );
}
