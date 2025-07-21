import React from "react";

interface AnimatedBarGraphBackgroundProps {
    values?: number[]; // Array of profit/loss values
    color: string;
}

const AnimatedBarGraphBackground: React.FC<AnimatedBarGraphBackgroundProps> = ({ values, color }) => {
    // If no values provided, mock some data for demo
    const bars = values && values.length > 0 ? values : [10, -5, 8, 0, 12, -7, 5, 0, 9, -3, 6, 0, 11, -6, 7];
    const maxAbs = Math.max(...bars.map(v => Math.abs(v)), 1);

    return (
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0 opacity-30 flex items-end">
            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${bars.length * 8} 40`}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ minWidth: `${bars.length * 8}px`, height: '100%' }}
            >
                {bars.map((v, i) => {
                    // Bar height: scale to maxAbs, center at y=20
                    const barHeight = (Math.abs(v) / maxAbs) * 16; // max bar is 16px
                    const y = v >= 0 ? 20 - barHeight : 20;
                    return (
                        <rect
                            key={i}
                            x={i * 8}
                            y={y}
                            width={6}
                            height={barHeight}
                            rx={2}
                            fill={color}
                            opacity={0.8}
                        />
                    );
                })}
                {/* Center line */}
                <rect x={0} y={20} width={bars.length * 8} height={1} fill={color} opacity={0.3} />
            </svg>
        </div>
    );
};

export default AnimatedBarGraphBackground; 