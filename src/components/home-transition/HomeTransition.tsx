import React, { JSX, useEffect, useRef, useState } from 'react';
import styles from './HomeTransition.module.css';

interface HomeTransitionProps {
    onComplete: () => void;
}

const REVEAL_TRIGGER_MS = 1900;
const REVEAL_DURATION_MS = 600;

export function HomeTransition({ onComplete }: HomeTransitionProps): JSX.Element | null {
    const [revealing, setRevealing] = useState(false);
    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;

    useEffect(() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce) {
            onCompleteRef.current();
            return;
        }
        const t = window.setTimeout(() => setRevealing(true), REVEAL_TRIGGER_MS);
        return () => window.clearTimeout(t);
    }, []);

    useEffect(() => {
        if (!revealing) return;
        const t = window.setTimeout(() => onCompleteRef.current(), REVEAL_DURATION_MS + 50);
        return () => window.clearTimeout(t);
    }, [revealing]);

    const handleSkip = () => {
        if (!revealing) setRevealing(true);
    };

    return (
        <div
            className={`${styles.overlay} ${revealing ? styles.gone : ''}`}
            aria-hidden="true"
        >
            <button type="button" className={styles.skip} onClick={handleSkip}>
                Skip
            </button>
            <div className={styles.bg} />
            <div className={styles.frame} />
            <div className={styles.center}>
                <div className={styles.logo}>
                    <span>D</span>
                    <span>O</span>
                    <span>R</span>
                    <span>I</span>
                    <span>S</span>
                </div>
                <div className={styles.rule} />
                <div className={styles.tagline}>Lightning Fast Analytics and Search Database</div>
            </div>
        </div>
    );
}

export default HomeTransition;
