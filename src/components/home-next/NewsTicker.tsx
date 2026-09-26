import React, { CSSProperties, FocusEvent, JSX, TransitionEvent, useEffect, useRef, useState } from 'react';
import Link from '@docusaurus/Link';
import { getRandomStartIndex, rotateItems } from './NewsTicker.logic';
import './NewsTicker.scss';

interface NewsAnnouncement {
    tag: string;
    text: string;
    action: string;
    href: string;
}

const ANNOUNCEMENTS: readonly NewsAnnouncement[] = [
    {
        tag: 'PROFILE',
        text: 'Diagnose slow queries with the new Apache Doris Profile Analysis workspace.',
        action: 'Open',
        href: '/profile-analysis',
    },
    {
        tag: 'COURSE',
        text: 'Learn the fundamentals with the new, free Apache Doris 101 course.',
        action: 'Start',
        href: '/course',
    },
    {
        tag: 'ROADMAP',
        text: 'See what we’re building next on the Apache Doris community roadmap.',
        action: 'Explore',
        href: '/community/roadmap',
    },
];

const AUTO_ADVANCE_MS = 3000;

export function NewsTicker(): JSX.Element {
    const [orderedAnnouncements, setOrderedAnnouncements] = useState<NewsAnnouncement[]>(() => [...ANNOUNCEMENTS]);
    const [position, setPosition] = useState(0);
    const [isMotionReady, setIsMotionReady] = useState(false);
    const [isInteractionPaused, setIsInteractionPaused] = useState(false);
    const [isDocumentHidden, setIsDocumentHidden] = useState(false);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
    const resetAnimationFrame = useRef<number | undefined>(undefined);

    useEffect(() => {
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const syncMotionPreference = () => setPrefersReducedMotion(motionQuery.matches);

        setOrderedAnnouncements(rotateItems(ANNOUNCEMENTS, getRandomStartIndex(ANNOUNCEMENTS.length)));
        syncMotionPreference();
        resetAnimationFrame.current = window.requestAnimationFrame(() => setIsMotionReady(true));

        motionQuery.addEventListener('change', syncMotionPreference);
        return () => {
            motionQuery.removeEventListener('change', syncMotionPreference);
            if (resetAnimationFrame.current !== undefined) {
                window.cancelAnimationFrame(resetAnimationFrame.current);
            }
        };
    }, []);

    useEffect(() => {
        const handleVisibilityChange = () => setIsDocumentHidden(document.hidden);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    useEffect(() => {
        if (!isMotionReady || isInteractionPaused || isDocumentHidden || prefersReducedMotion) {
            return undefined;
        }

        const timer = window.setInterval(() => {
            setPosition(current => current + 1);
        }, AUTO_ADVANCE_MS);

        return () => window.clearInterval(timer);
    }, [isDocumentHidden, isInteractionPaused, isMotionReady, prefersReducedMotion]);

    const handleTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
        if (event.currentTarget !== event.target || position !== orderedAnnouncements.length) {
            return;
        }

        setIsMotionReady(false);
        setPosition(0);
        resetAnimationFrame.current = window.requestAnimationFrame(() => {
            resetAnimationFrame.current = window.requestAnimationFrame(() => setIsMotionReady(true));
        });
    };

    const handleBlur = (event: FocusEvent<HTMLElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsInteractionPaused(false);
        }
    };

    const visiblePosition = position === orderedAnnouncements.length ? 0 : position;
    const sequenceLabel = `${String(visiblePosition + 1).padStart(2, '0')}/${String(
        orderedAnnouncements.length,
    ).padStart(2, '0')}`;
    const renderedAnnouncements = orderedAnnouncements.length > 0
        ? [...orderedAnnouncements, orderedAnnouncements[0]]
        : [];
    const trackStyle = {
        transform: `translate3d(0, -${position * 100}%, 0)`,
    } satisfies CSSProperties;

    return (
        <aside
            className={`homepage-news-ticker${isInteractionPaused ? ' homepage-news-ticker--paused' : ''}`}
            aria-label="Latest Apache Doris updates"
            onMouseEnter={() => setIsInteractionPaused(true)}
            onMouseLeave={() => setIsInteractionPaused(false)}
            onFocus={() => setIsInteractionPaused(true)}
            onBlur={handleBlur}
        >
            <div className="home-next-container homepage-news-ticker__inner">
                <span className="homepage-news-ticker__prompt" aria-hidden="true">
                    Latest
                </span>

                <div className="homepage-news-ticker__viewport">
                    <div
                        className={`homepage-news-ticker__track${
                            isMotionReady && !prefersReducedMotion ? ' homepage-news-ticker__track--animated' : ''
                        }`}
                        style={trackStyle}
                        onTransitionEnd={handleTransitionEnd}
                    >
                        {renderedAnnouncements.map((announcement, index) => {
                            const isClone = index === orderedAnnouncements.length;
                            const isVisible = !isClone && index === visiblePosition;
                            return (
                                <Link
                                    className="homepage-news-ticker__item"
                                    href={announcement.href}
                                    aria-hidden={!isVisible || undefined}
                                    tabIndex={isVisible ? undefined : -1}
                                    key={`${announcement.href}-${isClone ? 'clone' : 'original'}`}
                                >
                                    <span className="homepage-news-ticker__message">
                                        <span className="homepage-news-ticker__tag">[{announcement.tag}]</span>
                                        <span className="homepage-news-ticker__copy">{announcement.text}</span>
                                    </span>
                                    <span className="homepage-news-ticker__action">
                                        <span className="homepage-news-ticker__action-label">{announcement.action}</span>
                                        <span aria-hidden="true">↗</span>
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <span className="homepage-news-ticker__sequence" aria-hidden="true">
                    {isInteractionPaused ? 'Paused' : sequenceLabel}
                </span>
            </div>
        </aside>
    );
}
