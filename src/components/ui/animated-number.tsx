import React, { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
    value: number;
    children: (value: number, opts: { isChanged: boolean }) => React.ReactNode;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, children }) => {
    const [displayValue, setDisplayValue] = useState(value);
    const [isChanged, setIsChanged] = useState(false);
    const prevValue = useRef(value);

    useEffect(() => {
        if (prevValue.current !== value) {
            setIsChanged(true);
            setDisplayValue(value);
            const timeout = setTimeout(() => setIsChanged(false), 600); // match Tailwind's animate-pulse duration
            prevValue.current = value;
            return () => clearTimeout(timeout);
        }
    }, [value]);

    return <>{children(displayValue, { isChanged })}</>;
};

export default AnimatedNumber; 