import React, { JSX, KeyboardEvent, RefObject, useCallback, useEffect, useRef, useState } from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { useLocation } from '@docusaurus/router';
import { HACKATHON_EVENT, HACKATHON_TASKS, hackathonTaskPath } from './hackathonEvent';
import './HackathonCourseTrack.scss';

// The temporary "Hackathon" track inside the /course "Your Doris path" card.
// `#hackathon` on the URL selects it, so posters and messages can link to it.

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
        <div className="hk-switch" role="tablist" aria-label="Choose a track">
            <button {...tabProps('course', 0)}>
                <strong>Doris 101</strong>
                <small>Free course</small>
            </button>
            <button {...tabProps('hackathon', 1)}>
                <strong>
                    Hackathon
                    <i className="hk-switch__led" aria-hidden="true" />
                </strong>
                <small>
                    {HACKATHON_EVENT.city} · <span className="hk-nw">{HACKATHON_EVENT.dateShort}</span>
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
                <p className="hk-track__kicker">
                    {HACKATHON_EVENT.conference} · {HACKATHON_EVENT.city} · Hackathon
                </p>
                <h3 className="hk-track__headline">Build something real on Apache Doris — in one afternoon.</h3>
                <a
                    className="hk-ticket"
                    href={HACKATHON_EVENT.eventUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${HACKATHON_EVENT.dateLong} · ${HACKATHON_EVENT.time} · ${HACKATHON_EVENT.room} (event page, opens in a new tab)`}
                >
                    <span>{HACKATHON_EVENT.dateLong}</span>
                    <span>{HACKATHON_EVENT.time}</span>
                    <span>
                        {HACKATHON_EVENT.room} <i aria-hidden="true">↗</i>
                    </span>
                </a>
                <p className="hk-track__sub">Drop in any time. No Doris experience needed.</p>
            </div>
            <div className="hk-track__head">
                <h4>Track A · Build on Doris</h4>
                <span>{HACKATHON_TASKS.length} tasks</span>
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
            <p className="hk-track__b">
                <span className="hk-track__bkey" aria-hidden="true">
                    B
                </span>
                Track B: turn a docs page into a demo and a PR.
            </p>
            <div className="hk-track__badge">
                <img src={badgeUrl} alt="Apache Doris Contributor badge" width="52" height="52" />
                <p>Done? Push it to a public repo, show us at the Doris table, collect your badge.</p>
            </div>
        </section>
    );
}
