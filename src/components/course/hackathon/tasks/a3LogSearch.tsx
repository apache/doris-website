import React from 'react';
import Link from '@docusaurus/Link';
import { HackathonTaskContent } from '../HackathonTaskPage';
import { LogSearchSketch } from '../HackathonSketch';
import { AI_INTRO, AI_STEPS, COMMON_BEFORE, COMMON_TROUBLESHOOTING, TRAPS } from '../hackathonCommon';
import { getHackathonTask } from '../hackathonEvent';

export const A3_LOG_SEARCH: HackathonTaskContent = {
    task: getHackathonTask('A3'),
    titleLead: 'Log Search',
    titleTail: 'Explorer',
    hook: 'A mini Kibana where everything is SQL — then use it to find what broke checkout at 11:40.',
    chips: ['60–120 min', 'Beginner-friendly', 'Any language · CLI or web', 'AI tools welcome'],
    build: {
        lead: 'Build a log explorer. Then solve an outage with it.',
        body: (
            <>
                <p>
                    200,000 log lines, six services, one bad morning. Search them by keyword with BM25 ranking, slice
                    them by service, level and time, and count everything as you go — all in plain SQL on one Doris
                    table.
                </p>
                <p>A small log explorer with:</p>
                <ul className="hk-task__bullets">
                    <li>
                        a <strong>search box</strong> (keywords, phrases) with relevance ranking,
                    </li>
                    <li>
                        <strong>filters</strong> for service, level and time range,
                    </li>
                    <li>
                        <strong>facet counts</strong> next to the results (hits per service / level),
                    </li>
                    <li>
                        optionally a <strong>timeline</strong> of errors per 5 minutes.
                    </li>
                </ul>
                <p>
                    Then the real test:{' '}
                    <strong>
                        at 11:40 checkout started failing. Which service caused it, and when did the trouble really
                        start?
                    </strong>{' '}
                    Your explorer should make the answer obvious.
                </p>
            </>
        ),
    },
    why: [
        <>
            <strong>Search and analytics on the same table.</strong> The inverted index answers the keyword query; the
            same <code>WHERE</code> clause feeds a <code>GROUP BY</code> for facets. No second system to keep in sync.
        </>,
        <>
            <strong>Real ranking.</strong> <code>score()</code> sorts hits by BM25, so the most relevant lines come
            first, not just the newest.
        </>,
        <>
            <strong>Filters are cheap.</strong> <code>service</code> and <code>level</code> have their own inverted
            indexes; time ranges prune by the sort key.
        </>,
    ],
    whyHighlight: '10-12',
    before: COMMON_BEFORE,
    data: [
        <p key="intro">
            <code>hackathon.app_logs</code> — one table for all six services:
        </p>,
        {
            label: 'Table',
            file: 'hackathon.app_logs · sql',
            language: 'sql',
            code: `CREATE TABLE app_logs (
  ts          DATETIME(3)  NOT NULL,
  service     VARCHAR(32)  NOT NULL,   -- api-gateway, auth, catalog, search, checkout, payment
  level       VARCHAR(8)   NOT NULL,   -- DEBUG / INFO / WARN / ERROR
  host        VARCHAR(32),
  trace_id    VARCHAR(32),
  status      INT,                     -- HTTP status, when relevant
  latency_ms  INT,
  message     STRING       NOT NULL,
  INDEX idx_msg (message) USING INVERTED PROPERTIES ("parser" = "english", "support_phrase" = "true"),
  INDEX idx_service (service) USING INVERTED,
  INDEX idx_level (level) USING INVERTED
)
DUPLICATE KEY(ts)
DISTRIBUTED BY HASH(trace_id) BUCKETS 1
PROPERTIES ("replication_num" = "1");`,
        },
        <p key="seed">
            <code>seed/a3_app_logs.sql</code> generates <strong>200,000 lines for 13 October 2026</strong> with a single{' '}
            <code>INSERT … SELECT … FROM numbers(&quot;number&quot; = &quot;200000&quot;)</code> — no download needed.
            Somewhere in there is the outage.
        </p>,
    ],
    ai: {
        intro: AI_INTRO,
        steps: AI_STEPS,
        prompt: {
            label: 'Context prompt',
            file: 'paste into your agent',
            language: 'text',
            wrap: true,
            code: `I'm building a log search explorer on Apache Doris 4.1 for a hackathon.

Connection: MySQL protocol, 127.0.0.1:9030, user root, empty password, database \`hackathon\`.
Use a plain MySQL driver and raw SQL.

Table \`app_logs\`: ts DATETIME(3), service, level, host, trace_id, status INT, latency_ms INT,
message STRING. Inverted indexes on message (english parser, phrase support), service, level.

Doris SQL rules:
1. Text search: \`message MATCH_ANY 'a b'\`, \`MATCH_ALL\`, \`MATCH_PHRASE 'a b'\`. Never LIKE.
2. BM25: \`score()\` only with a MATCH_* predicate + \`ORDER BY score() DESC LIMIT n\`.
3. score() cannot be used with GROUP BY. For facet counts run a second query with the
   same WHERE clause and GROUP BY service, level.
4. Time buckets: \`minute_floor(ts, 5)\`.

Build: search box, service/level/time filters, facet counts, and an error timeline.
Run every SQL statement against the live cluster first.`,
        },
        traps: [TRAPS.like, TRAPS.scoreAnywhere, TRAPS.scoreAggregate, TRAPS.orm],
    },
    milestones: [
        {
            code: 'M0',
            title: 'Generate the logs',
            time: '5 min',
            blocks: [
                {
                    label: 'M0 · Generate the logs',
                    file: 'bash',
                    language: 'bash',
                    code: 'mysql -h127.0.0.1 -P9030 -uroot < seed/a3_app_logs.sql',
                },
            ],
        },
        {
            code: 'M1',
            title: 'Keyword search with BM25',
            short: 'Keyword search',
            time: '15 min',
            blocks: [
                {
                    label: 'M1 · Keyword search with BM25',
                    file: 'sql',
                    language: 'sql',
                    code: `SELECT ts, service, level, message, score() AS relevance
FROM app_logs
WHERE message MATCH_ANY 'timeout refused'
ORDER BY relevance DESC
LIMIT 20;`,
                },
            ],
        },
        {
            code: 'M2',
            title: 'Filters',
            time: '15 min',
            highlight: '4-6',
            blocks: [
                {
                    label: 'M2 · Filters',
                    file: 'sql',
                    language: 'sql',
                    code: `SELECT ts, service, level, message, score() AS relevance
FROM app_logs
WHERE message MATCH_ANY 'timeout'
  AND level = 'ERROR'
  AND service IN ('checkout', 'payment')
  AND ts >= '2026-10-13 11:00:00' AND ts < '2026-10-13 12:30:00'
ORDER BY relevance DESC
LIMIT 20;`,
                },
            ],
        },
        {
            code: 'M3',
            title: 'Facet counts',
            time: '15 min',
            highlight: '1, 5',
            blocks: [
                <p key="why">
                    <code>score()</code> can&apos;t be aggregated, so facets reuse the same filter without it:
                </p>,
                {
                    label: 'M3 · Facet counts',
                    file: 'sql',
                    language: 'sql',
                    code: `SELECT service, level, COUNT(*) AS hits
FROM app_logs
WHERE message MATCH_ANY 'timeout'
  AND ts >= '2026-10-13 11:00:00' AND ts < '2026-10-13 12:30:00'
GROUP BY service, level
ORDER BY hits DESC;`,
                },
            ],
        },
        {
            code: 'M4',
            title: 'Error timeline',
            time: '15 min',
            highlight: '1, 5',
            blocks: [
                {
                    label: 'M4 · Error timeline',
                    file: 'sql',
                    language: 'sql',
                    code: `SELECT minute_floor(ts, 5) AS bucket, service, COUNT(*) AS errors
FROM app_logs
WHERE level = 'ERROR'
  AND ts >= '2026-10-13 11:00:00' AND ts < '2026-10-13 12:30:00'
GROUP BY bucket, service
ORDER BY bucket, service;`,
                },
            ],
        },
        {
            code: 'M5',
            title: 'Solve the outage',
            panelView: 'm4',
            blocks: [
                <p key="answer">
                    Use your explorer to answer:{' '}
                    <em>Which service caused the checkout failures, and at what minute did it start?</em> Put the answer
                    — and the query that proves it — in your README.
                </p>,
            ],
        },
    ],
    done: [
        <>
            Keyword search with BM25 ranking (<code>score()</code>).
        </>,
        'At least two structured filters (service, level) plus a time range.',
        'Facet counts that follow the current search.',
        'The outage solved: root-cause service + start time, with the supporting query.',
        'Public repo with a README (how to run + one screenshot).',
    ],
    stretch: [
        <>
            <strong>Phrase and type-ahead</strong>: <code>MATCH_PHRASE &apos;connection refused&apos;</code>,{' '}
            <code>MATCH_PHRASE_PREFIX</code> for search-as-you-type.
        </>,
        <>
            <strong>Trace view</strong>: click a line to show every log with the same <code>trace_id</code>, in time
            order.
        </>,
        <>
            <strong>Query-string search</strong>: try the <code>SEARCH()</code> DSL (Lucene-style{' '}
            <code>field:term AND …</code>) — see{' '}
            <Link to="/docs/4.x/table-design/index/inverted-index/search-function">SEARCH Function</Link>.
        </>,
        <>
            <strong>Live tail</strong>: insert a few new rows every second and auto-refresh.
        </>,
        <>
            <strong>Index vs. no index</strong>: compare <code>MATCH_ANY</code> with{' '}
            <code>LIKE &apos;%timeout%&apos;</code> on the full table and show the timing.
        </>,
    ],
    troubleshooting: COMMON_TROUBLESHOOTING,
    references: [
        { label: 'Full-text Search', to: '/docs/4.x/key-features/full-text-search' },
        { label: 'BM25', to: '/docs/4.x/key-features/bm25' },
        { label: 'Inverted Index', to: '/docs/4.x/key-features/inverted-index' },
        { label: 'SEARCH Function', to: '/docs/4.x/table-design/index/inverted-index/search-function' },
    ],
    Sketch: LogSearchSketch,
};
