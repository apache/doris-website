import {translate} from '@docusaurus/Translate';
import React, { JSX, KeyboardEvent, RefObject, useCallback, useEffect, useRef, useState } from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { useLocation } from '@docusaurus/router';
import {
    HACKATHON_EVENT,
    HACKATHON_TASKS,
    HACKATHON_TRACK_B,
    hackathonTaskPath,
    hackathonTrackBPath,
} from './hackathonEvent';
import './HackathonCourseTrack.scss';

// The permanent "Hackathon" track inside the /course "Your Doris path" card.
// `#hackathon` on the URL selects it, so messages can link straight to it.

export type CourseTrack = 'course' | 'hackathon';

const TRACK_HASH = '#hackathon';
const TRACKS: CourseTrack[] = ['course', 'hackathon'];

export function useCourseTrack(): [CourseTrack, (track: CourseTrack) => void] {
    const location = useLocation();
    // Server HTML always shows the course; the hash is applied after hydration.
    const [track, setTrackState] = useState<CourseTrack>('course');

    useEffect(() => {
        if (location.hash === TRACK_HASH) {
            setTrackState('hackathon');
        }
    }, [location.hash]);

    const setTrack = useCallback((next: CourseTrack) => {
        setTrackState(next);
        // Not through the router: Docusaurus scrolls to the top whenever the hash is cleared.
        const { pathname, search } = window.location;
        window.history.replaceState(
            window.history.state,
            '',
            pathname + search + (next === 'hackathon' ? TRACK_HASH : ''),
        );
    }, []);

    return [track, setTrack];
}

/** On one-column layouts the card sits below the hero: bring it into view for `#hackathon` links. */
export function useRevealTrackCard(cardRef: RefObject<HTMLElement>): void {
    useEffect(() => {
        const card = cardRef.current;
        if (!card || window.location.hash !== TRACK_HASH || !window.matchMedia('(max-width: 900px)').matches) {
            return;
        }
        const navbarOffset = 72;
        window.scrollTo({ top: card.getBoundingClientRect().top + window.scrollY - navbarOffset });
    }, [cardRef]);
}

interface CourseTrackSwitchProps {
    track: CourseTrack;
    onSelect: (track: CourseTrack) => void;
}

export function CourseTrackSwitch({ track, onSelect }: CourseTrackSwitchProps): JSX.Element {
    const tabRefs = useRef<Partial<Record<CourseTrack, HTMLButtonElement | null>>>({});

    const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
            return;
        }
        event.preventDefault();
        let next = (index + (event.key === 'ArrowRight' ? 1 : -1) + TRACKS.length) % TRACKS.length;
        if (event.key === 'Home') {
            next = 0;
        } else if (event.key === 'End') {
            next = TRACKS.length - 1;
        }
        onSelect(TRACKS[next]);
        tabRefs.current[TRACKS[next]]?.focus();
    };

    const tabProps = (value: CourseTrack, index: number) => ({
        type: 'button' as const,
        role: 'tab',
        className: 'hk-switch__tab',
        id: `hk-tab-${value}`,
        'aria-selected': track === value,
        'aria-controls': `hk-panel-${value}`,
        tabIndex: track === value ? 0 : -1,
        ref: (element: HTMLButtonElement | null) => {
            tabRefs.current[value] = element;
        },
        onClick: () => onSelect(value),
        onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => onKeyDown(event, index),
    });

    return (
        <div className="hk-switch" role="tablist" aria-label={translate({id: "landing.HackathonCourseTrack.001", message: "Choose a track"})}>
            <button {...tabProps('course', 0)}>
                <strong>{translate({id: "landing.HackathonCourseTrack.002", message: "Doris 101"})}</strong>
                <small>{translate({id: "landing.HackathonCourseTrack.003", message: "Free course"})}</small>
            </button>
            <button {...tabProps('hackathon', 1)}>
                <strong>{translate({id: "landing.HackathonCourseTrack.004", message: "Hackathon"})}</strong>
                <small>
                    {translate({id: "landing.HackathonCourseTrack.005", message: "Open tasks ·"})} <span className="hk-nw">{translate({id: "landing.HackathonCourseTrack.006", message: "start anytime"})}</span>
                </small>
            </button>
        </div>
    );
}

export function HackathonTrackPanel({ hidden }: { hidden: boolean }): JSX.Element {
    const badgeUrl = useBaseUrl('/images/community-badges/badge-contributor.png');

    return (
        <section
            className="hk-track"
            id="hk-panel-hackathon"
            role="tabpanel"
            aria-labelledby="hk-tab-hackathon"
            hidden={hidden}
        >
            <div className="hk-track__event">
                <p className="hk-track__kicker">{translate({id: "landing.HackathonCourseTrack.007", message: "Apache Doris Hackathon"})}</p>
                <h3 className="hk-track__headline">{translate({id: "landing.HackathonCourseTrack.008", message: "Build something real on Apache Doris — at your own pace."})}</h3>
                <p className="hk-track__sub">
                    {translate({id: "landing.HackathonCourseTrack.009", message: "Start any time and work at your own pace: one sitting or a few evenings. No Doris experience needed."})}
                </p>
            </div>
            <div className="hk-track__head">
                <h4>{translate({id: "landing.HackathonCourseTrack.010", message: "Track A · Build on Doris"})}</h4>
                <span>{HACKATHON_TASKS.length} {translate({id: "landing.HackathonCourseTrack.011", message: "tasks"})}</span>
            </div>
            <ol className="hk-track__pads">
                {HACKATHON_TASKS.map(task => (
                    <li key={task.code}>
                        <Link className="hk-pad" to={hackathonTaskPath(task)}>
                            <span className="hk-pad__top">
                                <span className="hk-pad__code">{task.code}</span>
                                <em>{task.duration}</em>
                            </span>
                            <strong>{task.title}</strong>
                        </Link>
                    </li>
                ))}
            </ol>
            <Link className="hk-track__b" to={hackathonTrackBPath()}>
                <span className="hk-track__bkey" aria-hidden="true">
                    B
                </span>
                <span>
                    {translate({id: "landing.HackathonCourseTrack.013", message: "Track B ·"})} {HACKATHON_TRACK_B.title}{translate({id: "landing.HackathonCourseTrack.014", message: ": add a step-by-step demo to a docs page, with a pull request."})}{' '}
                    <span className="hk-nw">{translate({id: "landing.HackathonCourseTrack.015", message: "Open the brief →"})}</span>
                </span>
            </Link>
            <div className="hk-track__badge">
                <img src={badgeUrl} alt={translate({id: "landing.HackathonCourseTrack.016", message: "Apache Doris Contributor badge"})} width="52" height="52" />
                <p>
                    {translate({id: "landing.HackathonCourseTrack.017", message: "Take part in a task, share it in"})} <code>{HACKATHON_EVENT.slackChannel}</code> {translate({id: "landing.HackathonCourseTrack.018", message: "on Slack, collect your Contributor badge."})}
                </p>
            </div>
        </section>
    );
}
