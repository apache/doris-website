import React from 'react';

export const useAnimationFrame = (callback, stop) => {
    // Use useRef for mutable variables that we want to persist
    // without triggering a re-render on their change
    const requestRef = React.useRef<any>();
    const previousTimeRef = React.useRef<any>();
    /**
     * The callback function is automatically passed a timestamp indicating
     * the precise time requestAnimationFrame() was called.
     */

    React.useEffect(() => {
        console.log(stop);
        if (stop) {
            if (requestRef.current) return () => cancelAnimationFrame(requestRef.current);
            return;
        }

        const animate = time => {
            if (previousTimeRef.current !== undefined) {
                const deltaTime = time - previousTimeRef.current;
                callback(deltaTime);
            }
            previousTimeRef.current = time;
            requestRef.current = requestAnimationFrame(animate);
        };
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [stop]); // Make sure the effect runs only once
};
