import React, { JSX, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { normalizePathname } from '@site/src/utils/locale';
import {
    computeMascotPupilOffset,
    getSlackNudgeBenefits,
    isDocumentationFeedbackPath,
    shouldOpenSlackNudge,
} from './SlackCommunityNudge.logic';
import './SlackCommunityNudge.scss';

const SLACK_URL = 'https://doris.apache.org/slack';
const DORIS_SUMMIT_URL = 'https://apache-doris-summit.org/';
const DOCS_FEEDBACK_URL = 'https://github.com/apache/doris-website/issues/364';
const STORAGE_KEY = 'doris-home-slack-nudge-dismissed';
const ECOSYSTEM_TARGET_ID = 'home-next-ecosystem';
const OPEN_DELAY_MS = 5000;
const SMALL_SCREEN_QUERY = '(max-width: 640px)';
const MASCOT_EYE_RADIUS_PCT = 1.7;
const MASCOT_PUPIL_RADIUS_RATIO = 0.5;
const MASCOT_SOFT_DISTANCE_PX = 80;
const MASCOT_EYES: Array<{ cx: number; cy: number }> = [
    { cx: 22.96, cy: 54.01 },
    { cx: 28.59, cy: 54.01 },
    { cx: 51.01, cy: 51.27 },
    { cx: 56.39, cy: 51.95 },
    { cx: 74.99, cy: 58.71 },
    { cx: 80.30, cy: 59.91 },
];

function SlackGlyph(): JSX.Element {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
        </svg>
    );
}

function hasStoredDismissal(): boolean {
    try {
        return window.sessionStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
}

function storeDismissal(): void {
    try {
        window.sessionStorage.setItem(STORAGE_KEY, 'true');
    } catch {
        // Storage may be unavailable in private or restricted browsing modes.
    }
}

export function SlackCommunityNudge(): JSX.Element {
    const { pathname } = useLocation();
    const {
        i18n: { locales },
    } = useDocusaurusContext();
    const [isOpen, setIsOpen] = useState(false);
    const [eyeTrackingEnabled, setEyeTrackingEnabled] = useState(false);
    const autoDismissedRef = useRef(false);
    const autoOpenedRef = useRef(false);
    const mountedAtRef = useRef<number | null>(null);
    const mascotRef = useRef<HTMLButtonElement>(null);
    const pupilRefs = useRef<Array<HTMLSpanElement | null>>([]);
    const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
    const normalizedPathname = normalizePathname(pathname, locales);
    const showDocsFeedback = isDocumentationFeedbackPath(normalizedPathname);

    const openAutomatically = useCallback((ecosystemVisible: boolean) => {
        const mountedAt = mountedAtRef.current ?? Date.now();
        const elapsedMs = Date.now() - mountedAt;

        if (
            shouldOpenSlackNudge({
                dismissed: autoDismissedRef.current,
                opened: autoOpenedRef.current,
                elapsedMs,
                ecosystemVisible,
            })
        ) {
            autoOpenedRef.current = true;
            setIsOpen(true);
        }
    }, []);

    const dismissAutoPrompt = useCallback(() => {
        autoDismissedRef.current = true;
        storeDismissal();
        setIsOpen(false);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        mountedAtRef.current = Date.now();
        autoDismissedRef.current = hasStoredDismissal();

        const timer = window.setTimeout(() => {
            openAutomatically(false);
        }, OPEN_DELAY_MS);

        return () => window.clearTimeout(timer);
    }, [openAutomatically]);

    useEffect(() => {
        if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;

        const target = document.getElementById(ECOSYSTEM_TARGET_ID);
        if (!target || typeof window.IntersectionObserver === 'undefined') {
            return undefined;
        }

        const observer = new window.IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && entry.intersectionRatio >= 0.24) {
                        openAutomatically(true);
                    }
                });
            },
            {
                threshold: [0, 0.24, 0.5],
                rootMargin: '0px 0px -12% 0px',
            },
        );

        observer.observe(target);
        return () => observer.disconnect();
    }, [openAutomatically]);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const mediaQuery = window.matchMedia(SMALL_SCREEN_QUERY);
        const updateEyeTracking = () => setEyeTrackingEnabled(!mediaQuery.matches);

        updateEyeTracking();
        if (typeof mediaQuery.addEventListener === 'function') {
            mediaQuery.addEventListener('change', updateEyeTracking);
        } else {
            mediaQuery.addListener(updateEyeTracking);
        }

        return () => {
            if (typeof mediaQuery.removeEventListener === 'function') {
                mediaQuery.removeEventListener('change', updateEyeTracking);
            } else {
                mediaQuery.removeListener(updateEyeTracking);
            }
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined' || !eyeTrackingEnabled) return undefined;

        const updateEyes = (mouseX: number, mouseY: number) => {
            const mascot = mascotRef.current;
            if (!mascot) return;

            const rect = mascot.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;

            const eyeRadiusPx = (MASCOT_EYE_RADIUS_PCT / 100) * rect.width;

            MASCOT_EYES.forEach((eye, index) => {
                const pupil = pupilRefs.current[index];
                if (!pupil) return;

                const eyeX = rect.left + (eye.cx / 100) * rect.width;
                const eyeY = rect.top + (eye.cy / 100) * rect.height;
                const offset = computeMascotPupilOffset({
                    eyeX,
                    eyeY,
                    mouseX,
                    mouseY,
                    eyeRadiusPx,
                    pupilRadiusRatio: MASCOT_PUPIL_RADIUS_RATIO,
                    softDistancePx: MASCOT_SOFT_DISTANCE_PX,
                });

                pupil.style.transform = `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`;
            });
        };

        const onMouseMove = (event: MouseEvent) => {
            lastPointerRef.current = { x: event.clientX, y: event.clientY };
            updateEyes(event.clientX, event.clientY);
        };

        const onTouchMove = (event: TouchEvent) => {
            const touch = event.touches[0];
            if (!touch) return;
            lastPointerRef.current = { x: touch.clientX, y: touch.clientY };
            updateEyes(touch.clientX, touch.clientY);
        };

        const onScroll = () => {
            const pointer = lastPointerRef.current;
            if (pointer) updateEyes(pointer.x, pointer.y);
        };

        window.addEventListener('mousemove', onMouseMove, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('scroll', onScroll);
        };
    }, [eyeTrackingEnabled]);

    const handleJoin = () => {
        dismissAutoPrompt();
    };

    return (
        <aside
            className={`slack-community-nudge${isOpen ? ' slack-community-nudge--open' : ''}`}
            aria-label={showDocsFeedback
                ? 'Apache Doris community, Summit, and documentation resources'
                : 'Apache Doris community and Summit resources'}
        >
            <div className="slack-community-nudge__bubble" aria-hidden={!isOpen}>
                <button
                    type="button"
                    className="slack-community-nudge__close"
                    aria-label={showDocsFeedback
                        ? 'Dismiss community, Summit, and documentation prompt'
                        : 'Dismiss community and Summit prompt'}
                    onClick={dismissAutoPrompt}
                    tabIndex={isOpen ? undefined : -1}
                >
                    <span aria-hidden="true">×</span>
                </button>
                <div className="slack-community-nudge__eyebrow">
                    Community help
                </div>
                <p className="slack-community-nudge__title">
                    Building with Doris?
                </p>
                <p className="slack-community-nudge__copy">
                    Join Slack for setup help, performance tips, and answers from Apache Doris users and maintainers.
                </p>
                <ul className="slack-community-nudge__benefits">
                    {getSlackNudgeBenefits().map(benefit => (
                        <li className="slack-community-nudge__benefit" key={benefit}>
                            {benefit}
                        </li>
                    ))}
                </ul>
                <a
                    className="slack-community-nudge__cta"
                    href={SLACK_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleJoin}
                    tabIndex={isOpen ? undefined : -1}
                >
                    <SlackGlyph />
                    Join Slack
                </a>
                <section
                    className="slack-community-nudge__summit"
                    aria-labelledby="slack-community-nudge-summit-title"
                >
                    <div>
                        <p id="slack-community-nudge-summit-title" className="slack-community-nudge__summit-title">
                            Doris Summit 26
                        </p>
                        <p className="slack-community-nudge__summit-meta">
                            October 21–22 · Virtual event
                        </p>
                    </div>
                    <a
                        className="slack-community-nudge__cta slack-community-nudge__cta--summit"
                        href={DORIS_SUMMIT_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={dismissAutoPrompt}
                        tabIndex={isOpen ? undefined : -1}
                    >
                        Explore Summit
                        <span aria-hidden="true">↗</span>
                    </a>
                </section>
                {showDocsFeedback && (
                    <section
                        className="slack-community-nudge__docs-feedback"
                        aria-labelledby="slack-community-nudge-docs-feedback-title"
                    >
                        <p
                            id="slack-community-nudge-docs-feedback-title"
                            className="slack-community-nudge__docs-feedback-title"
                        >
                            Found a documentation issue?
                        </p>
                        <p className="slack-community-nudge__docs-feedback-copy">
                            Share your feedback and help us improve the quality of the Apache Doris documentation.
                        </p>
                        <a
                            className="slack-community-nudge__cta slack-community-nudge__cta--feedback"
                            href={DOCS_FEEDBACK_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={dismissAutoPrompt}
                            tabIndex={isOpen ? undefined : -1}
                        >
                            Report a docs issue
                            <span aria-hidden="true">↗</span>
                        </a>
                    </section>
                )}
            </div>

            <button
                type="button"
                className="slack-community-nudge__mascot"
                ref={mascotRef}
                aria-expanded={isOpen}
                aria-label={showDocsFeedback
                    ? `${isOpen ? 'Hide' : 'Open'} community, Summit, and documentation resources`
                    : `${isOpen ? 'Hide' : 'Open'} community and Summit resources`}
                onClick={() => setIsOpen(open => !open)}
            >
                <img
                    className="slack-community-nudge__mascot-image"
                    src="/images/next/home-page/doris-mascot.png"
                    width={1344}
                    height={768}
                    alt=""
                    draggable={false}
                />
                {MASCOT_EYES.map((eye, index) => (
                    <span
                        key={index}
                        ref={(el) => { pupilRefs.current[index] = el; }}
                        className="slack-community-nudge__mascot-pupil"
                        style={{ left: `${eye.cx}%`, top: `${eye.cy}%` }}
                        aria-hidden="true"
                    />
                ))}
            </button>
        </aside>
    );
}
