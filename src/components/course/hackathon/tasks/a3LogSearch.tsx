import {translate} from '@docusaurus/Translate';
import React from 'react';
import Link from '@docusaurus/Link';
import { HackathonTaskContent } from '../HackathonTaskPage';
import { LogSearchSketch } from '../HackathonSketch';
import { AI_INTRO, AI_STEPS, COMMON_BEFORE, COMMON_TROUBLESHOOTING, TRAPS } from '../hackathonCommon';
import { dorisLoad, getHackathonTask } from '../hackathonEvent';

export const A3_LOG_SEARCH: HackathonTaskContent = {
    task: getHackathonTask('A3'),
    titleLead: translate({id: "landing.a3LogSearch.001", message: "Log Search"}),
    titleTail: translate({id: "landing.a3LogSearch.002", message: "Explorer"}),
    hook: translate({id: "landing.a3LogSearch.003", message: "A mini Kibana where everything is SQL — then use it to find what broke checkout at 11:40."}),
    chips: [translate({id: "landing.courseExtra.a3LogSearch.010", message: "60–120 min"}), translate({id: "landing.courseExtra.a3LogSearch.011", message: "Beginner-friendly"}), translate({id: "landing.courseExtra.a3LogSearch.012", message: "Any language · CLI or web"}), translate({id: "landing.courseExtra.a3LogSearch.013", message: "AI tools welcome"})],
    build: {
        lead: translate({id: "landing.a3LogSearch.004", message: "Build a log explorer. Then solve an outage with it."}),
        body: (
            <>
                <p>
                    {translate({id: "landing.a3LogSearch.005", message: "200,000 log lines, six services, one bad morning. Search them by keyword with BM25 ranking, slice them by service, level and time, and count everything as you go — all in plain SQL on one Doris table."})}
                </p>
                <p>{translate({id: "landing.a3LogSearch.006", message: "A small log explorer with:"})}</p>
                <ul className="hk-task__bullets">
                    <li>
                        {translate({id: "landing.a3LogSearch.007", message: "a"})} <strong>{translate({id: "landing.a3LogSearch.008", message: "search box"})}</strong> {translate({id: "landing.a3LogSearch.009", message: "(keywords, phrases) with relevance ranking,"})}
                    </li>
                    <li>
                        <strong>{translate({id: "landing.a3LogSearch.010", message: "filters"})}</strong> {translate({id: "landing.a3LogSearch.011", message: "for service, level and time range,"})}
                    </li>
                    <li>
                        <strong>{translate({id: "landing.a3LogSearch.012", message: "facet counts"})}</strong> {translate({id: "landing.a3LogSearch.013", message: "next to the results (hits per service / level),"})}
                    </li>
                    <li>
                        {translate({id: "landing.a3LogSearch.014", message: "optionally a"})} <strong>{translate({id: "landing.a3LogSearch.015", message: "timeline"})}</strong> {translate({id: "landing.a3LogSearch.016", message: "of errors per 5 minutes."})}
                    </li>
                </ul>
                <p>
                    {translate({id: "landing.a3LogSearch.017", message: "Then the real test:"})}{' '}
                    <strong>
                        {translate({id: "landing.a3LogSearch.018", message: "at 11:40 checkout started failing. Which service caused it, and when did the trouble really start?"})}
                    </strong>{' '}
                    {translate({id: "landing.a3LogSearch.019", message: "Your explorer should make the answer obvious."})}
                </p>
            </>
        ),
    },
    why: [
        <>
            <strong>{translate({id: "landing.a3LogSearch.020", message: "Search and analytics on the same table."})}</strong> {translate({id: "landing.a3LogSearch.021", message: "The inverted index answers the keyword query; the same"})} <code>WHERE</code> {translate({id: "landing.a3LogSearch.022", message: "clause feeds a"})} <code>GROUP BY</code> {translate({id: "landing.a3LogSearch.023", message: "for facets. No second system to keep in sync."})}
        </>,
        <>
            <strong>{translate({id: "landing.a3LogSearch.024", message: "Real ranking."})}</strong> <code>score()</code> {translate({id: "landing.a3LogSearch.025", message: "sorts hits by BM25, so the most relevant lines come first, not just the newest."})}
        </>,
        <>
            <strong>{translate({id: "landing.a3LogSearch.026", message: "Filters are cheap."})}</strong> <code>service</code> {translate({id: "landing.a3LogSearch.027", message: "and"})} <code>level</code> {translate({id: "landing.a3LogSearch.028", message: "have their own inverted indexes; time ranges prune by the sort key."})}
        </>,
    ],
    whyHighlight: '10-12',
    before: COMMON_BEFORE,
    data: [
        <p key="intro">
            <code>hackathon.app_logs</code> {translate({id: "landing.a3LogSearch.029", message: "— one table for all six services:"})}
        </p>,
        {
            label: translate({id: "landing.a3LogSearch.030", message: "Table"}),
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
            <code>seed/a3_app_logs.sql</code> {translate({id: "landing.a3LogSearch.032", message: "generates"})} <strong>{translate({id: "landing.a3LogSearch.033", message: "200,000 lines for 13 October 2026"})}</strong> {translate({id: "landing.a3LogSearch.034", message: "with a single"})}{' '}
            <code>INSERT … SELECT … FROM numbers(&quot;number&quot; = &quot;200000&quot;)</code> {translate({id: "landing.a3LogSearch.035", message: "— no download needed. Somewhere in there is the outage."})}
        </p>,
    ],
    ai: {
        intro: AI_INTRO,
        steps: AI_STEPS,
        prompt: {
            label: translate({id: "landing.a3LogSearch.036", message: "Context prompt"}),
            file: translate({id: "landing.a3LogSearch.037", message: "paste into your agent"}),
            language: 'text',
            wrap: true,
            code: `I'm building a log search explorer on Apache Doris 4.1 for a hackathon.

Connection: MySQL protocol, 127.0.0.1:9030, user root, empty password, database \`hackathon\`.
Use a plain MySQL driver and raw SQL.

Table \`app_logs\`: ts DATETIME(3), service, level, host, trace_id, status INT, latency_ms INT,
message STRING. Inverted indexes on message (english parser, phrase support), service, level.

Doris SQL rules:
1. Text search: \`message MATCH_ANY 'a b'\`, \`MATCH_ALL\`, \`MATCH_PHRASE 'a b'\`. Never LIKE.
2. BM25: \`score()\` only with a MATCH_* predicate + \`ORDER BY score() DESC LIMIT n\`,
   selected plain (\`score() AS relevance\`): no ROUND() or JOIN in that SELECT.
   Bind the user's search text as a driver parameter.
3. score() cannot be used with GROUP BY. For facet counts run a second query with the
   same WHERE clause and GROUP BY service, level.
4. Time buckets: \`minute_floor(ts, 5)\`.

Build: search box, service/level/time filters, facet counts, and an error timeline.
Run every SQL statement against the live cluster first.`,
        },
        traps: [TRAPS.like, TRAPS.scoreAnywhere, TRAPS.scoreWrapped, TRAPS.scoreAggregate, TRAPS.orm],
    },
    milestones: [
        {
            code: 'M0',
            title: translate({id: "landing.a3LogSearch.038", message: "Generate the logs"}),
            time: translate({id: "landing.courseExtra.a3LogSearch.001", message: "5 min"}),
            blocks: [
                <p key="where">{translate({id: "landing.a3LogSearch.039", message: "From inside the starter-kit folder:"})}</p>,
                {
                    label: translate({id: "landing.a3LogSearch.040", message: "M0 · Generate the logs"}),
                    file: 'bash',
                    language: 'bash',
                    code: dorisLoad('seed/a3_app_logs.sql'),
                },
            ],
            checkpoint: (
                <>
                    {translate({id: "landing.a3LogSearch.041", message: "A few seconds later:"})} <strong>200,000</strong> {translate({id: "landing.a3LogSearch.042", message: "log lines, from"})} <code>00:00:00</code> {translate({id: "landing.a3LogSearch.043", message: "to"})}{' '}
                    <code>23:59:59</code> {translate({id: "landing.a3LogSearch.044", message: "on 13 October."})}
                </>
            ),
        },
        {
            code: 'M1',
            title: translate({id: "landing.a3LogSearch.045", message: "Keyword search with BM25"}),
            short: translate({id: "landing.a3LogSearch.046", message: "Keyword search"}),
            time: translate({id: "landing.courseExtra.a3LogSearch.002", message: "15 min"}),
            blocks: [
                {
                    label: translate({id: "landing.a3LogSearch.047", message: "M1 · Keyword search with BM25"}),
                    file: 'sql',
                    language: 'sql',
                    code: `USE hackathon;

SELECT ts, service, level, message, score() AS relevance
FROM app_logs
WHERE message MATCH_ANY 'timeout refused'
ORDER BY relevance DESC
LIMIT 20;`,
                },
                <p key="wire">
                    {translate({id: "landing.a3LogSearch.048", message: "Wire it to a search box. Pass the user's text as a driver parameter ("})}<code>MATCH_ANY %s</code>
                    ); <code>a3/starter.py</code> {translate({id: "landing.a3LogSearch.049", message: "in the starter kit does exactly this."})}
                </p>,
            ],
            checkpoint: (
                <>
                    {translate({id: "landing.a3LogSearch.050", message: "All 20 hits are"})} <code>connection refused</code> {translate({id: "landing.a3LogSearch.051", message: "lines. BM25 weighs rare terms more:"})} <em>refused</em>{' '}
                    {translate({id: "landing.a3LogSearch.053", message: "appears in 68 lines,"})} <em>timeout</em> {translate({id: "landing.a3LogSearch.055", message: "in 347. Search"})} <code>timeout</code> {translate({id: "landing.a3LogSearch.056", message: "alone to see the others."})}
                </>
            ),
        },
        {
            code: 'M2',
            title: translate({id: "landing.a3LogSearch.057", message: "Filters"}),
            time: translate({id: "landing.courseExtra.a3LogSearch.003", message: "15 min"}),
            highlight: '4-6',
            blocks: [
                {
                    label: translate({id: "landing.a3LogSearch.058", message: "M2 · Filters"}),
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
            checkpoint: translate({id: "landing.a3LogSearch.059", message: "Every hit is an ERROR line that mentions a timeout. Only one of the two services shows up."}),
        },
        {
            code: 'M3',
            title: translate({id: "landing.a3LogSearch.060", message: "Facet counts"}),
            time: translate({id: "landing.courseExtra.a3LogSearch.004", message: "15 min"}),
            highlight: '1, 5',
            blocks: [
                <p key="why">
                    <code>score()</code> {translate({id: "landing.a3LogSearch.061", message: "can't be aggregated, so facets reuse the same filter without it:"})}
                </p>,
                {
                    label: translate({id: "landing.a3LogSearch.062", message: "M3 · Facet counts"}),
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
            checkpoint: (
                <>
                    {translate({id: "landing.a3LogSearch.063", message: "163 matching lines in that window, all"})} <code>ERROR</code>{translate({id: "landing.a3LogSearch.064", message: ". The counts must add up to the same search without"})} <code>GROUP BY</code>{translate({id: "landing.a3LogSearch.065", message: ": check with"})} <code>SELECT COUNT(*)</code> {translate({id: "landing.a3LogSearch.066", message: "and the same"})}{' '}
                    <code>WHERE</code>.
                </>
            ),
        },
        {
            code: 'M4',
            title: translate({id: "landing.a3LogSearch.067", message: "Error timeline"}),
            time: translate({id: "landing.courseExtra.a3LogSearch.005", message: "15 min"}),
            highlight: '1, 5',
            blocks: [
                {
                    label: translate({id: "landing.a3LogSearch.068", message: "M4 · Error timeline"}),
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
            checkpoint:
                translate({id: "landing.a3LogSearch.069", message: "Two services jump between 11:35 and 12:00. For the rest of the day no service logs more than 4 errors in a 5-minute bucket."}),
        },
        {
            code: 'M5',
            title: translate({id: "landing.a3LogSearch.070", message: "Solve the outage"}),
            panelView: 'm4',
            blocks: [
                <p key="answer">
                    {translate({id: "landing.a3LogSearch.071", message: "Use your explorer to answer:"})}{' '}
                    <em>{translate({id: "landing.a3LogSearch.072", message: "Which service caused the checkout failures, and at what minute did it start?"})}</em> {translate({id: "landing.a3LogSearch.073", message: "Put the answer — and the query that proves it — in your README."})}
                </p>,
            ],
        },
    ],
    done: [
        <>
            {translate({id: "landing.a3LogSearch.074", message: "Keyword search with BM25 ranking ("})}<code>score()</code>).
        </>,
        translate({id: "landing.courseExtra.a3LogSearch.006", message: "At least two structured filters (service, level) plus a time range."}),
        translate({id: "landing.courseExtra.a3LogSearch.007", message: "Facet counts that follow the current search."}),
        translate({id: "landing.courseExtra.a3LogSearch.008", message: "The outage solved: root-cause service + start time, with the supporting query."}),
        translate({id: "landing.courseExtra.a3LogSearch.009", message: "Submitted as a pull request: your GitHub-ID folder with the code and a README (how to run + one screenshot)."}),
    ],
    stretch: [
        <>
            <strong>{translate({id: "landing.a3LogSearch.075", message: "Phrase and type-ahead"})}</strong>: <code>MATCH_PHRASE &apos;connection refused&apos;</code>,{' '}
            <code>MATCH_PHRASE_PREFIX</code> {translate({id: "landing.a3LogSearch.076", message: "for search-as-you-type."})}
        </>,
        <>
            <strong>{translate({id: "landing.a3LogSearch.077", message: "Trace view"})}</strong>{translate({id: "landing.a3LogSearch.078", message: ": click a line to show every log with the same"})} <code>trace_id</code>{translate({id: "landing.a3LogSearch.079", message: ", in time order."})}
        </>,
        <>
            <strong>{translate({id: "landing.a3LogSearch.080", message: "Query-string search"})}</strong>{translate({id: "landing.a3LogSearch.081", message: ": try the"})} <code>SEARCH()</code> {translate({id: "landing.a3LogSearch.082", message: "DSL (Lucene-style"})}{' '}
            <code>field:term AND …</code>{translate({id: "landing.a3LogSearch.083", message: ") — see"})}{' '}
            <Link to="/docs/4.x/table-design/index/inverted-index/search-function">{translate({id: "landing.a3LogSearch.084", message: "SEARCH Function"})}</Link>.
        </>,
        <>
            <strong>{translate({id: "landing.a3LogSearch.085", message: "Live tail"})}</strong>{translate({id: "landing.a3LogSearch.086", message: ": insert a few new rows every second and auto-refresh."})}
        </>,
        <>
            <strong>{translate({id: "landing.a3LogSearch.087", message: "Index vs. no index"})}</strong>{translate({id: "landing.a3LogSearch.088", message: ": compare"})} <code>MATCH_ANY</code> {translate({id: "landing.a3LogSearch.089", message: "with"})}{' '}
            <code>LIKE &apos;%timeout%&apos;</code> {translate({id: "landing.a3LogSearch.090", message: "on the full table and show the timing."})}
        </>,
    ],
    troubleshooting: COMMON_TROUBLESHOOTING,
    references: [
        { label: translate({id: "landing.a3LogSearch.091", message: "Full-text Search"}), to: '/docs/4.x/key-features/full-text-search' },
        { label: translate({id: "landing.a3LogSearch.092", message: "BM25"}), to: '/docs/4.x/key-features/bm25' },
        { label: translate({id: "landing.a3LogSearch.093", message: "Inverted Index"}), to: '/docs/4.x/key-features/inverted-index' },
        { label: translate({id: "landing.a3LogSearch.094", message: "SEARCH Function"}), to: '/docs/4.x/table-design/index/inverted-index/search-function' },
    ],
    Sketch: LogSearchSketch,
};
