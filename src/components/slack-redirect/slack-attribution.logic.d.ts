export const SLACK_ENTRY_URL: string;
export const SLACK_EVENT_CATEGORY: string;
export const SLACK_EVENT_ACTION: string;

/** utm_medium values the website itself is allowed to emit. */
export type SlackEntryMedium = 'website' | 'docs';

export interface SlackEntryUrlOptions {
    medium: SlackEntryMedium;
    /** Which CTA the visitor clicked, e.g. `homepage_hero`, `footer`, `docs_toc`. */
    content: string;
    campaign?: string;
}

export type SlackAttributionOrigin = 'utm' | 'referrer' | 'direct';

export interface SlackAttributionInput {
    /** `window.location.search`, including the leading `?`. */
    search: string;
    /** `document.referrer`; may be empty. */
    referrer: string;
}

export interface SlackAttribution {
    attributedBy: SlackAttributionOrigin;
    source: string;
    medium: string;
    campaign: string;
    content: string;
    /** Referrer hostname without `www.`, or an empty string. */
    referrerHost: string;
}

export function sanitizeAttributionValue(value: unknown): string;

export function getReferrerHost(referrer: string): string;

export function resolveSlackAttribution(input: SlackAttributionInput): SlackAttribution;

export function buildSlackEventName(
    attribution: Pick<SlackAttribution, 'source' | 'medium' | 'campaign' | 'content'>,
): string;

export function buildSlackEntryUrl(options: SlackEntryUrlOptions): string;

export interface MatomoThemeConfig {
    matomoUrl?: string;
    jsLoader?: string;
}

export function getMatomoScriptUrl(matomoConfig: MatomoThemeConfig | undefined): string;

export type TrackerState = 'loaded' | 'absent' | 'failed' | 'pending';

export interface TrackerStateInput {
    /** `window.Matomo` exists, i.e. matomo.js has executed. */
    trackerLoaded: boolean;
    /** A `<script src=matomo.js>` element is on the page. */
    scriptPresent: boolean;
    /** Resource Timing reports the script fetch as finished (success or failure). */
    fetchFinished: boolean;
}

export function resolveTrackerState(input: TrackerStateInput): TrackerState;
