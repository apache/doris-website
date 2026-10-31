import React, { JSX, useEffect } from 'react';
import Head from '@docusaurus/Head';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { SlackIcon } from '@site/src/components/Icons/slack';
import { TelegramIcon } from '@site/src/components/Icons/telegram';
import {
    SLACK_EVENT_ACTION,
    SLACK_EVENT_CATEGORY,
    buildSlackEventName,
    getMatomoScriptUrl,
    resolveSlackAttribution,
    resolveTrackerState,
} from './slack-attribution.logic';
import type { MatomoThemeConfig } from './slack-attribution.logic';
import './SlackRedirect.scss';

// How the wait for Matomo works (see resolveTrackerState for the states):
//
// - The click event is queued in `_paq` right away with a callback that
//   performs the redirect, so as soon as matomo.js has handed the request to
//   navigator.sendBeacon we leave. matomo.js sends the automatic pageview
//   first and holds every later request for 800ms (+50ms per queued request)
//   to avoid creating a brand-new visitor twice, so with the tracker present
//   the redirect happens ~0.9s after this effect runs.
// - While matomo.js is still downloading we keep waiting, but no longer than
//   TRACKER_WAIT_MS. REDIRECT_MAX_WAIT_MS is the hard cap that also covers
//   a tracker that loaded late (TRACKER_WAIT_MS + the 800ms gap).
// - If the script fetch already finished without producing a tracker (ad
//   blocker, 404, network error) or no tracker is installed at all
//   (development builds), there is nothing to wait for and we leave at once.
//   Resource Timing tells the two apart from "still downloading".
const TRACKER_POLL_MS = 100;
const TRACKER_WAIT_MS = 1500;
const REDIRECT_MAX_WAIT_MS = 2500;

type MatomoWindow = Window & {
    _paq?: unknown[][];
    Matomo?: unknown;
};

function hasFinishedFetching(url: string): boolean {
    if (typeof performance === 'undefined' || typeof performance.getEntriesByName !== 'function') {
        return false;
    }
    return performance.getEntriesByName(url).length > 0;
}

function hasScriptElement(url: string): boolean {
    return Array.from(document.scripts).some(script => script.src === url);
}

function readCommunityInviteUrl(customFields: Record<string, unknown> | undefined, channel: 'Slack' | 'Telegram'): string {
    const field = channel === 'Telegram' ? 'telegramInviteUrl' : 'slackInviteUrl';
    const value = customFields?.[field];
    if (typeof value !== 'string' || value === '') {
        throw new Error(
            `customFields.${field} is missing from docusaurus.config.js; /${channel.toLowerCase()} cannot forward visitors without it.`,
        );
    }
    return value;
}

export default function CommunityRedirect({ channel = 'Slack' }: { channel?: 'Slack' | 'Telegram' }): JSX.Element {
    const { siteConfig } = useDocusaurusContext();
    const inviteUrl = readCommunityInviteUrl(siteConfig.customFields, channel);
    const eventAction = channel === 'Telegram' ? 'Telegram Click' : SLACK_EVENT_ACTION;
    const trackerScriptUrl = getMatomoScriptUrl(siteConfig.themeConfig.matomo as MatomoThemeConfig | undefined);

    useEffect(() => {
        const matomoWindow = window as MatomoWindow;
        const attribution = resolveSlackAttribution({
            search: window.location.search,
            referrer: document.referrer,
        });
        const eventName = buildSlackEventName(attribution);

        const startedAt = Date.now();
        const timers: number[] = [];
        let redirected = false;
        const redirect = () => {
            if (redirected) {
                return;
            }
            redirected = true;
            timers.forEach(id => window.clearTimeout(id));
            window.location.replace(inviteUrl);
        };

        if (process.env.NODE_ENV !== 'production') {
            // docusaurus-plugin-matomo only injects the tracker in production
            // builds, so surface what would have been sent.
            console.info(`[${channel.toLowerCase()}-redirect] Matomo event:`, SLACK_EVENT_CATEGORY, eventAction, eventName);
        }

        const queue = matomoWindow._paq || (matomoWindow._paq = []);
        // sendBeacon survives the navigation triggered below; the XHR the
        // tracker uses by default would be cancelled by it.
        queue.push(['alwaysUseSendBeacon']);
        queue.push([
            'trackEvent',
            SLACK_EVENT_CATEGORY,
            eventAction,
            eventName,
            undefined, // value
            undefined, // customData
            redirect, // invoked once the request has been handed to the browser
        ]);

        const waitForTracker = () => {
            const state = resolveTrackerState({
                trackerLoaded: typeof matomoWindow.Matomo === 'object' && matomoWindow.Matomo !== null,
                scriptPresent: trackerScriptUrl !== '' && hasScriptElement(trackerScriptUrl),
                fetchFinished: trackerScriptUrl !== '' && hasFinishedFetching(trackerScriptUrl),
            });

            if (state === 'loaded') {
                // The event callback takes it from here; the hard cap below
                // still applies in case the tracker never sends anything.
                return;
            }
            if (state === 'absent' || state === 'failed' || Date.now() - startedAt >= TRACKER_WAIT_MS) {
                redirect();
                return;
            }
            timers.push(window.setTimeout(waitForTracker, TRACKER_POLL_MS));
        };

        waitForTracker();
        timers.push(window.setTimeout(redirect, REDIRECT_MAX_WAIT_MS));

        return () => timers.forEach(id => window.clearTimeout(id));
    }, [inviteUrl, trackerScriptUrl, eventAction, channel]);

    return (
        <>
            <Head>
                <title>{`Join the Apache Doris ${channel} community`}</title>
                <meta name="robots" content="noindex, nofollow" />
                <meta name="description" content={`Forwarding you to the Apache Doris ${channel} community.`} />
            </Head>
            <main className="slack-redirect">
                {/* Browsers without JavaScript never run the effect above; the
                    server-rendered meta refresh forwards them straight away. */}
                <noscript>
                    <meta httpEquiv="refresh" content={`0;url=${inviteUrl}`} />
                </noscript>
                <div className="slack-redirect__card" role="status" aria-live="polite">
                    <div className="slack-redirect__icon" aria-hidden="true">
                        {channel === 'Telegram' ? <TelegramIcon /> : <SlackIcon />}
                    </div>
                    <p className="slack-redirect__eyebrow">Apache Doris Community</p>
                    <h1 className="slack-redirect__title">Taking you to {channel}…</h1>
                    <p className="slack-redirect__copy">
                        If nothing happens within a few seconds,{' '}
                        <a className="slack-redirect__link" href={inviteUrl}>
                            open the {channel} invite
                        </a>{' '}
                        directly.
                    </p>
                    <div className="slack-redirect__progress" aria-hidden="true">
                        <span className="slack-redirect__progress-bar" />
                    </div>
                </div>
            </main>
        </>
    );
}
