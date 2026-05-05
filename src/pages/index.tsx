import React, { JSX, useEffect, useState } from 'react';
import HomeClassic from '@site/src/components/home-classic/HomeClassic';
import HomeNext from '@site/src/components/home-next/HomeNext';
import { HomeTransition } from '@site/src/components/home-transition/HomeTransition';
import { HomeVersionToggle } from '@site/src/components/home-version-toggle/HomeVersionToggle';

const HOME_VERSION_KEY = 'doris-home-version';

export default function Home(): JSX.Element {
    const [isNext, setIsNext] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [transitioning, setTransitioning] = useState(false);

    useEffect(() => {
        setIsNext(localStorage.getItem(HOME_VERSION_KEY) === 'next');
        setMounted(true);
    }, []);

    const handleToggle = (next: boolean) => {
        if (next) {
            localStorage.setItem(HOME_VERSION_KEY, 'next');
            setIsNext(true);
            setTransitioning(true);
        } else {
            localStorage.removeItem(HOME_VERSION_KEY);
            setIsNext(false);
        }
    };

    const handleTransitionComplete = () => {
        setTransitioning(false);
    };

    return (
        <>
            {isNext ? (
                <HomeNext onSwitchBack={() => handleToggle(false)} />
            ) : (
                <HomeClassic />
            )}
            {transitioning && <HomeTransition onComplete={handleTransitionComplete} />}
            {/* Toggle button only renders client-side to avoid SSR hydration mismatch */}
            {mounted && !transitioning && (
                <HomeVersionToggle isV2={isNext} onToggle={() => handleToggle(!isNext)} />
            )}
        </>
    );
}
