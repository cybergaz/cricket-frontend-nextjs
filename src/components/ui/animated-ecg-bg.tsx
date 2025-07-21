import React from "react";

interface AnimatedECGBackgroundProps {
    color: string; // Tailwind or hex color
    direction?: 'up' | 'down' | 'flat';
}

const AnimatedECGBackground: React.FC<AnimatedECGBackgroundProps> = ({ color, direction = 'flat' }) => {
    // Define paths for each direction
    let path = '';
    if (direction === 'up') {
        // Start lower, end higher
        path = "M0 30 H50 L70 28 L90 18 L110 20 H200 L220 16 L240 12 L260 18 H350 L370 14 L390 10 L410 12 H500 L520 10 L540 8 L560 10 H650 L670 8 L690 6 L710 8 H800";
    } else if (direction === 'down') {
        // Start higher, end lower
        path = "M0 10 H50 L70 12 L90 22 L110 20 H200 L220 24 L240 28 L260 22 H350 L370 26 L390 30 L410 28 H500 L520 30 L540 32 L560 30 H650 L670 32 L690 34 L710 32 H800";
    } else {
        // Flat
        path = "M0 20 H800";
    }

    return (
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0 opacity-30">
            <svg
                className="w-[200%] h-full animate-ecg-move"
                viewBox="0 0 800 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ minWidth: "100px" }}
            >
                <path
                    d={path}
                    stroke={color}
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    fill="none"
                />
            </svg>
            <style jsx>{`
        @keyframes ecg-move {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ecg-move {
          animation: ecg-move 3s linear infinite;
        }
      `}</style>
        </div>
    );
};

export default AnimatedECGBackground; 