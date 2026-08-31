# Slack Link Attribution (UTM Convention)

`https://doris.apache.org/slack` is the only Slack link we publish. It is a
small tracking page (`src/pages/slack.tsx`) that records the click in the ASF
Matomo instance and then forwards the visitor to the real invite link kept in
`docusaurus.config.js` under `customFields.slackInviteUrl`. When the invite
link is rotated, change it there and nothing else.

Every channel keeps linking to `/slack`; what differs per channel is the UTM
query string. Use these four standard parameters and nothing else:

| Parameter | Question it answers | Allowed values |
|---|---|---|
| `utm_source` | Where does the visitor come from? | `website`, `github`, `linkedin`, `reddit`, `youtube`, `medium`, `newsletter`, `webinar`, `conference`, `partner`, or a specific organiser such as `awsug` |
| `utm_medium` | What kind of traffic is it? | `website`, `docs`, `social`, `community`, `content`, `event`, `offline`, `email` |
| `utm_campaign` | Which campaign? (optional for permanent entry points) | e.g. `doris_summit_2026`, `iceberg_webinar_202609`, `release_4_1` |
| `utm_content` | Which exact CTA / placement? | e.g. `homepage_hero`, `footer`, `docs_toc`, `github_readme`, `post_01`, `closing_slide`, `qr_code` |

Value rules (the page enforces them, but write links this way so reports stay
clean):

- lowercase ASCII letters, digits, `.`, `_`, `-`; anything else becomes `_`
- at most 64 characters per value
- never use `|`, it is the field separator in the Matomo event name

## Examples

```text
Website header       https://doris.apache.org/slack?utm_source=website&utm_medium=website&utm_content=homepage_hero
Website footer       https://doris.apache.org/slack?utm_source=website&utm_medium=website&utm_content=footer
Docs TOC             https://doris.apache.org/slack?utm_source=website&utm_medium=docs&utm_content=docs_toc
GitHub README        https://doris.apache.org/slack?utm_source=github&utm_medium=community&utm_content=github_readme
LinkedIn post        https://doris.apache.org/slack?utm_source=linkedin&utm_medium=social&utm_campaign=community_growth_h2_2026&utm_content=post_01
Webinar              https://doris.apache.org/slack?utm_source=webinar&utm_medium=event&utm_campaign=iceberg_webinar_202609
Conference QR code   https://doris.apache.org/slack?utm_source=awsug&utm_medium=offline&utm_campaign=awsug_uzbekistan_2026&utm_content=closing_slide
```

Links rendered by the website itself are generated with
`buildSlackEntryUrl()` from `src/components/slack-redirect/slack-attribution.logic.js`;
do not hand-write them in React code.

Markdown content on the site uses these fixed values:

| Where | `utm_medium` | `utm_content` |
|---|---|---|
| Blog posts (`blog/`) | `content` | `blog_<file-name-in-lowercase>`, cut to 64 characters |
| Community docs (`community/`) | `docs` | `community_join_page`, `contribute_guide` |
| Release notes (`releasenotes/`) | `docs` | `release_notes_<version>`, e.g. `release_notes_3_0_0` |

Never link to `join.slack.com` directly from content: the invite link
rotates, and a direct link skips the tracking page entirely.

## What the page records

One Matomo event per click:

```text
Category: Community Acquisition
Action:   Slack Click
Name:     source|medium|campaign|content
```

Attribution priority is `utm_source` > `document.referrer` > direct:

| Situation | Event name |
|---|---|
| UTM present | `github\|community\|\|github_readme` |
| No `utm_source`, referrer available | `reddit.com\|referral\|\|` (host without `www.`) |
| Neither | `direct\|none\|\|` |

Empty fields stay empty (`github|||` means the link only carried
`utm_source=github`). Matomo also stores the full page URL and the referrer
with the automatic page view, so the Referrers report can be used to discover
sites that link to `/slack` without any UTM.

Note that links rendered inside doris.apache.org use `rel="noreferrer"`, so a
click from our own pages without UTM shows up as `direct`. That is why every
in-site entry point carries UTM parameters.

## Reading the numbers

In Matomo (`https://analytics.apache.org/`, site id 43):

1. Behaviour → Events → Event Names, category `Community Acquisition`.
2. Split the name on `|` to aggregate by source, medium, campaign or content.
3. Compare daily unique clicks with new Slack members for a rough
   click-to-join rate.

Clicks are not joins: once the visitor lands on `join.slack.com` we cannot see
whether they completed the sign-up, so only aggregate trends are meaningful.

## Timing

The page queues the event in `_paq` immediately and redirects from the
event's callback, i.e. as soon as matomo.js has handed the request to
`navigator.sendBeacon`. matomo.js sends its automatic page view first and
holds later requests for 800ms, so with the tracker present the redirect
happens roughly 0.9s after the page has rendered.

While matomo.js is still downloading the page waits up to 1.5s for it; if the
script fetch already failed (ad blocker, 404) or no tracker is installed
(development builds) it redirects at once - Resource Timing is used to tell
the two apart. A hard cap of 2.5s applies in every case. Browsers without
JavaScript are forwarded by a `<noscript>` meta refresh. The constants live at
the top of `src/components/slack-redirect/SlackRedirect.tsx`.
