const assert = require('node:assert/strict');
const test = require('node:test');

const {
    SLACK_ENTRY_URL,
    buildSlackEntryUrl,
    buildSlackEventName,
    getMatomoScriptUrl,
    getReferrerHost,
    resolveSlackAttribution,
    resolveTrackerState,
    sanitizeAttributionValue,
} = require('./slack-attribution.logic');

test('builds website entry links with the documented parameter order', () => {
    assert.equal(
        buildSlackEntryUrl({ medium: 'website', content: 'homepage_hero' }),
        `${SLACK_ENTRY_URL}?utm_source=website&utm_medium=website&utm_content=homepage_hero`,
    );
    assert.equal(
        buildSlackEntryUrl({ medium: 'docs', content: 'docs_toc', campaign: 'release_4_1' }),
        `${SLACK_ENTRY_URL}?utm_source=website&utm_medium=docs&utm_campaign=release_4_1&utm_content=docs_toc`,
    );
});

test('prefers UTM parameters over the referrer', () => {
    const attribution = resolveSlackAttribution({
        search: '?utm_source=github&utm_medium=community&utm_content=github_readme',
        referrer: 'https://github.com/apache/doris',
    });

    assert.deepEqual(attribution, {
        attributedBy: 'utm',
        source: 'github',
        medium: 'community',
        campaign: '',
        content: 'github_readme',
        referrerHost: 'github.com',
    });
    assert.equal(buildSlackEventName(attribution), 'github|community||github_readme');
});

test('keeps every UTM field in the event name', () => {
    const attribution = resolveSlackAttribution({
        search: '?utm_source=linkedin&utm_medium=social&utm_campaign=community_growth_h2_2026&utm_content=post_01',
        referrer: '',
    });

    assert.equal(buildSlackEventName(attribution), 'linkedin|social|community_growth_h2_2026|post_01');
});

test('falls back to the referrer host when no utm_source is present', () => {
    const attribution = resolveSlackAttribution({
        search: '',
        referrer: 'https://www.reddit.com/r/dataengineering/comments/abc/apache_doris/',
    });

    assert.equal(attribution.attributedBy, 'referrer');
    assert.equal(attribution.source, 'reddit.com');
    assert.equal(attribution.medium, 'referral');
    assert.equal(buildSlackEventName(attribution), 'reddit.com|referral||');
});

test('records direct traffic when neither UTM nor referrer is available', () => {
    const attribution = resolveSlackAttribution({ search: '', referrer: '' });

    assert.equal(attribution.attributedBy, 'direct');
    assert.equal(buildSlackEventName(attribution), 'direct|none||');
});

test('keeps campaign and content from a link that forgot utm_source', () => {
    const withReferrer = resolveSlackAttribution({
        search: '?utm_campaign=iceberg_webinar_202609&utm_content=closing_slide',
        referrer: 'https://zoom.us/webinar/123',
    });
    assert.equal(buildSlackEventName(withReferrer), 'zoom.us|referral|iceberg_webinar_202609|closing_slide');

    const direct = resolveSlackAttribution({
        search: '?utm_medium=offline&utm_campaign=awsug_uzbekistan_2026',
        referrer: '',
    });
    assert.equal(buildSlackEventName(direct), 'direct|offline|awsug_uzbekistan_2026|');
});

test('ignores referrers that are not valid URLs', () => {
    assert.equal(getReferrerHost('not a url'), '');
    assert.equal(getReferrerHost(''), '');
    assert.equal(getReferrerHost(undefined), '');
    assert.equal(resolveSlackAttribution({ search: '', referrer: 'not a url' }).attributedBy, 'direct');
});

test('normalises referrer hosts', () => {
    assert.equal(getReferrerHost('https://WWW.Medium.com/@someone/post'), 'medium.com');
    assert.equal(getReferrerHost('android-app://com.slack/'), 'com.slack');
});

test('sanitises values so the separator and stray characters never leak into the event name', () => {
    assert.equal(sanitizeAttributionValue('  Git Hub|README  '), 'git_hub_readme');
    assert.equal(sanitizeAttributionValue('Doris Summit 2026!'), 'doris_summit_2026');
    assert.equal(sanitizeAttributionValue('__already-clean.value__'), 'already-clean.value');
    assert.equal(sanitizeAttributionValue(null), '');
    assert.equal(sanitizeAttributionValue(42), '');
    assert.equal(sanitizeAttributionValue('a'.repeat(100)).length, 64);

    const attribution = resolveSlackAttribution({
        search: '?utm_source=Some%20Blog%7Ctest&utm_medium=CONTENT',
        referrer: '',
    });
    const eventName = buildSlackEventName(attribution);
    assert.equal(eventName, 'some_blog_test|content||');
    assert.equal(eventName.split('|').length, 4);
});

test('buildSlackEventName sanitises raw input as well', () => {
    assert.equal(
        buildSlackEventName({ source: 'Web|Site', medium: 'Docs ', campaign: '', content: 'Footer' }),
        'web_site|docs||footer',
    );
});

test('derives the tracker script URL the way docusaurus-plugin-matomo does', () => {
    assert.equal(getMatomoScriptUrl({ matomoUrl: 'https://analytics.apache.org/', jsLoader: 'matomo.js' }), 'https://analytics.apache.org/matomo.js');
    assert.equal(getMatomoScriptUrl({ matomoUrl: 'https://analytics.apache.org/' }), 'https://analytics.apache.org/matomo.js');
    assert.equal(getMatomoScriptUrl({ matomoUrl: 'https://analytics.apache.org/', jsLoader: 'piwik.js' }), 'https://analytics.apache.org/piwik.js');
    assert.equal(getMatomoScriptUrl(undefined), '');
    assert.equal(getMatomoScriptUrl({}), '');
});

test('classifies what the redirect page is waiting for', () => {
    assert.equal(resolveTrackerState({ trackerLoaded: true, scriptPresent: true, fetchFinished: true }), 'loaded');
    assert.equal(resolveTrackerState({ trackerLoaded: false, scriptPresent: false, fetchFinished: false }), 'absent');
    assert.equal(resolveTrackerState({ trackerLoaded: false, scriptPresent: true, fetchFinished: true }), 'failed');
    assert.equal(resolveTrackerState({ trackerLoaded: false, scriptPresent: true, fetchFinished: false }), 'pending');
    // A tracker that is already up wins regardless of the other signals.
    assert.equal(resolveTrackerState({ trackerLoaded: true, scriptPresent: false, fetchFinished: false }), 'loaded');
});
