// Attribution helpers shared by the /slack tracking page
// (src/components/slack-redirect/SlackRedirect.tsx) and every Slack entry
// point the website renders itself (hero, footer, docs TOC, mascot nudge,
// community docs).
//
// Plain CommonJS on purpose: the same file runs in the browser bundle and
// under `node --test` (see slack-attribution.logic.test.js), and the sibling
// .d.ts provides the TypeScript surface. Same pattern as
// SlackCommunityNudge.logic.js. The naming rules are documented in
// developer_docs/slack-utm-convention.md.

// Public entry point every channel links to. The real Slack invite URL lives
// in docusaurus.config.js (customFields.slackInviteUrl) so it can be rotated
// in one place without touching any channel.
const SLACK_ENTRY_URL = 'https://doris.apache.org/slack';

// Matomo event taxonomy. The Events report groups on category/action, so
// renaming either one splits the history - keep them stable.
const SLACK_EVENT_CATEGORY = 'Community Acquisition';
const SLACK_EVENT_ACTION = 'Slack Click';

// Event name layout: source|medium|campaign|content. Values are sanitised so
// the separator can never appear inside a field.
const ATTRIBUTION_FIELD_SEPARATOR = '|';
const ATTRIBUTION_VALUE_MAX_LENGTH = 64;

// utm_source carried by every link the website renders itself.
const WEBSITE_UTM_SOURCE = 'website';

// Synthetic values used when a click carried no utm_source.
const REFERRAL_MEDIUM = 'referral';
const DIRECT_SOURCE = 'direct';
const DIRECT_MEDIUM = 'none';

function sanitizeAttributionValue(value) {
    if (typeof value !== 'string') {
        return '';
    }

    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, ATTRIBUTION_VALUE_MAX_LENGTH);
}

function getReferrerHost(referrer) {
    if (typeof referrer !== 'string' || referrer === '') {
        return '';
    }

    try {
        return new URL(referrer).hostname.toLowerCase().replace(/^www\./, '');
    } catch (error) {
        return '';
    }
}

function parseUtmParams(search) {
    const params = new URLSearchParams(typeof search === 'string' ? search : '');

    return {
        source: sanitizeAttributionValue(params.get('utm_source')),
        medium: sanitizeAttributionValue(params.get('utm_medium')),
        campaign: sanitizeAttributionValue(params.get('utm_campaign')),
        content: sanitizeAttributionValue(params.get('utm_content')),
    };
}

// Attribution priority: utm_source > document.referrer > direct. Campaign and
// content are passed through whenever they are present so a link that forgot
// utm_source still keeps whatever it did carry.
function resolveSlackAttribution({ search, referrer }) {
    const utm = parseUtmParams(search);
    const referrerHost = sanitizeAttributionValue(getReferrerHost(referrer));

    if (utm.source) {
        return {
            attributedBy: 'utm',
            source: utm.source,
            medium: utm.medium,
            campaign: utm.campaign,
            content: utm.content,
            referrerHost,
        };
    }

    if (referrerHost) {
        return {
            attributedBy: 'referrer',
            source: referrerHost,
            medium: utm.medium || REFERRAL_MEDIUM,
            campaign: utm.campaign,
            content: utm.content,
            referrerHost,
        };
    }

    return {
        attributedBy: 'direct',
        source: DIRECT_SOURCE,
        medium: utm.medium || DIRECT_MEDIUM,
        campaign: utm.campaign,
        content: utm.content,
        referrerHost,
    };
}

function buildSlackEventName({ source, medium, campaign, content }) {
    return [source, medium, campaign, content]
        .map(value => sanitizeAttributionValue(value))
        .join(ATTRIBUTION_FIELD_SEPARATOR);
}

// Where docusaurus-plugin-matomo loads the tracker from. Mirrors the plugin's
// own string concatenation so the result matches the injected <script src>.
function getMatomoScriptUrl(matomoConfig) {
    if (!matomoConfig || typeof matomoConfig.matomoUrl !== 'string' || matomoConfig.matomoUrl === '') {
        return '';
    }

    return `${matomoConfig.matomoUrl}${matomoConfig.jsLoader || 'matomo.js'}`;
}

// What the /slack page is waiting for:
//   loaded  - matomo.js has executed; the queued event goes out and its
//             callback performs the redirect
//   absent  - no tracker script on this page (development builds); nothing
//             to wait for
//   failed  - the script fetch finished without producing a tracker (ad
//             blocker, 404, network error); nothing to wait for either
//   pending - the script is still being fetched
function resolveTrackerState({ trackerLoaded, scriptPresent, fetchFinished }) {
    if (trackerLoaded) {
        return 'loaded';
    }
    if (!scriptPresent) {
        return 'absent';
    }
    if (fetchFinished) {
        return 'failed';
    }
    return 'pending';
}

function buildSlackEntryUrl({ medium, content, campaign }) {
    const params = new URLSearchParams();
    params.set('utm_source', WEBSITE_UTM_SOURCE);
    params.set('utm_medium', medium);
    if (campaign) {
        params.set('utm_campaign', campaign);
    }
    params.set('utm_content', content);

    return `${SLACK_ENTRY_URL}?${params.toString()}`;
}

module.exports = {
    SLACK_ENTRY_URL,
    SLACK_EVENT_ACTION,
    SLACK_EVENT_CATEGORY,
    buildSlackEntryUrl,
    buildSlackEventName,
    getMatomoScriptUrl,
    getReferrerHost,
    resolveSlackAttribution,
    resolveTrackerState,
    sanitizeAttributionValue,
};
