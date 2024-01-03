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
    const animate = time => {
        if (previousTimeRef.current !== undefined) {
            const deltaTime = time - previousTimeRef.current;
            callback(deltaTime);
        }
        previousTimeRef.current = time;
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        if (!stop) requestRef.current = requestAnimationFrame(animate);
    };

    React.useEffect(() => {
        if (!stop) {
            requestRef.current = requestAnimationFrame(animate);
        }

        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    });
};
