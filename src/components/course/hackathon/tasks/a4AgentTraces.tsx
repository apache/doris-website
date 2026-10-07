import React from 'react';
import Link from '@docusaurus/Link';
import { HackathonTaskContent } from '../HackathonTaskPage';
import { AgentTraceSketch } from '../HackathonSketch';
import { AI_INTRO, AI_STEPS, COMMON_BEFORE, COMMON_TROUBLESHOOTING, TRAPS } from '../hackathonCommon';
import { getHackathonTask, hackathonTaskPath } from '../hackathonEvent';

export const A4_AGENT_TRACES: HackathonTaskContent = {
    task: getHackathonTask('A4'),
    titleLead: 'Agent Trace',
    titleTail: 'Explorer',
    hook: 'AI agents emit JSON that changes shape every release. Store it in VARIANT and query it like real columns.',
    chips: ['60–120 min', 'Intermediate', 'Any language · CLI, notebook or web', 'AI tools welcome'],
    build: {
        lead: "Your agent's JSON is a mess. Query it anyway.",
        body: (
            <>
                <p>
                    LLM calls, tool calls, errors, final answers — each with its own fields, and new fields every
                    release. Doris <code>VARIANT</code> turns that JSON into typed columns automatically, so you can
                    filter, search and aggregate it with plain SQL. No schema migrations.
                </p>
                <p>
                    A trace explorer for <strong>~1,000 AI-agent sessions (~25,000 events)</strong>:
                </p>
                <ul className="hk-task__bullets">
                    <li>
                        a <strong>sessions list</strong> with event counts, errors, tokens and latency,
                    </li>
                    <li>
                        a <strong>session timeline</strong>: click a session to replay what the agent did, step by step,
                    </li>
                    <li>
                        <strong>tool and model stats</strong>: p95 latency, error rate, token usage,
                    </li>
                    <li>
                        <strong>search inside the JSON</strong>: find every tool error that mentions
                        &quot;timeout&quot;.
                    </li>
                </ul>
                <p>
                    Then answer:{' '}
                    <strong>did the agent&apos;s v2 release (deployed at 13:00) make things better or worse?</strong>
                </p>
            </>
        ),
    },
    why: [
        <>
            <strong>Schema-on-write, without the schema.</strong> VARIANT infers a type for every JSON path and stores
            frequent paths as real columnar subcolumns, so <code>payload[&apos;latency_ms&apos;]</code> reads one column
            instead of parsing every document.
        </>,
        <>
            <strong>New fields just appear.</strong> When v2 events add <code>cost_usd</code>, the new path shows up as
            a subcolumn on the next load, with no <code>ALTER TABLE</code>.
        </>,
        <>
            <strong>Search inside JSON.</strong> An inverted index on the VARIANT column makes every text path
            searchable with <code>MATCH_*</code>.
        </>,
    ],
    whyHighlight: '6-7',
    before: COMMON_BEFORE,
    data: [
        <p key="intro">
            <code>hackathon.agent_events</code> — one row per agent event, the event body in a VARIANT column:
        </p>,
        {
            label: 'Table',
            file: 'hackathon.agent_events · sql',
            language: 'sql',
            code: `CREATE TABLE agent_events (
  session_id  VARCHAR(40)  NOT NULL,
  ts          DATETIME(3)  NOT NULL,
  event_id    BIGINT       NOT NULL,
  event_type  VARCHAR(32)  NOT NULL,   -- user_message / llm_call / tool_call / error / final_answer
  payload     VARIANT      NOT NULL,
  INDEX idx_payload (payload) USING INVERTED PROPERTIES ("parser" = "english")
)
DUPLICATE KEY(session_id, ts)
DISTRIBUTED BY HASH(session_id) BUCKETS 1
PROPERTIES ("replication_num" = "1", "storage_format" = "V3");`,
        },
        <p key="shapes">Example payloads — note how the shapes differ:</p>,
        {
            label: 'Example payloads',
            file: 'json',
            language: 'json',
            code: `{"text": "Why did checkout fail at 11:40?", "lang": "en"}
{"model": "model-large", "usage": {"input_tokens": 812, "output_tokens": 96}, "latency_ms": 1430}
{"tool": "sql_query", "args": {"sql": "SELECT ..."}, "latency_ms": 37, "status": "ok"}
{"tool": "http_get", "args": {"url": "..."}, "status": "error",
 "error": {"type": "Timeout", "message": "upstream timed out after 3000 ms"}}`,
        },
        <p key="v2">
            From 13:00 on, events come from <strong>agent v2</strong> and carry extra fields such as{' '}
            <code>agent_version</code> and <code>cost_usd</code>.
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
            code: `I'm building an agent trace explorer on Apache Doris 4.1 for a hackathon.

Connection: MySQL protocol, 127.0.0.1:9030, user root, empty password, database \`hackathon\`.
Use a plain MySQL driver and raw SQL.

Table \`agent_events\`: session_id, ts DATETIME(3), event_id, event_type
(user_message / llm_call / tool_call / error / final_answer), payload VARIANT
(inverted index, english parser). Payload shapes differ by event_type; v2 events
(from 13:00) add agent_version and cost_usd.

Doris SQL rules:
1. Read JSON paths as payload['a']['b']. CAST to a concrete type before comparing,
   sorting or aggregating: CAST(payload['latency_ms'] AS DOUBLE).
2. VARIANT cannot be a key, a sort key or a join key.
3. Text search inside JSON: payload['error']['message'] MATCH_ANY 'timeout'. Never LIKE.
4. Percentiles: percentile_approx(expr, 0.95).
5. \`SET describe_extend_variant_column = true; DESC agent_events;\` lists inferred subcolumns.

Build: sessions list, session timeline, tool/model stats, and JSON search.
Run every SQL statement against the live cluster first.`,
        },
        traps: [TRAPS.variantCast, TRAPS.like, TRAPS.replicas, TRAPS.orm],
    },
    milestones: [
        {
            code: 'M0',
            title: 'Load and inspect',
            time: '10 min',
            blocks: [
                {
                    label: 'M0 · Load',
                    file: 'bash',
                    language: 'bash',
                    code: 'mysql -h127.0.0.1 -P9030 -uroot < seed/a4_agent_events.sql',
                },
                {
                    label: 'M0 · Inspect',
                    file: 'sql',
                    language: 'sql',
                    target: true,
                    code: `SET describe_extend_variant_column = true;
DESC agent_events;     -- see the subcolumns Doris inferred: payload.tool, payload.usage.input_tokens, ...`,
                },
            ],
        },
        {
            code: 'M1',
            title: 'Query JSON paths',
            time: '15 min',
            blocks: [
                {
                    label: 'M1 · Query JSON paths',
                    file: 'sql',
                    language: 'sql',
                    code: `SELECT CAST(payload['tool'] AS STRING) AS tool, COUNT(*) AS calls
FROM agent_events
WHERE event_type = 'tool_call'
GROUP BY tool
ORDER BY calls DESC;`,
                },
            ],
        },
        {
            code: 'M2',
            title: 'Aggregate inferred subcolumns',
            short: 'Aggregate subcolumns',
            time: '15 min',
            highlight: '3-4',
            blocks: [
                {
                    label: 'M2 · Aggregate inferred subcolumns',
                    file: 'sql',
                    language: 'sql',
                    code: `SELECT CAST(payload['tool'] AS STRING) AS tool,
       COUNT(*) AS calls,
       percentile_approx(CAST(payload['latency_ms'] AS DOUBLE), 0.95) AS p95_ms,
       SUM(CASE WHEN CAST(payload['status'] AS STRING) = 'error' THEN 1 ELSE 0 END) AS errors
FROM agent_events
WHERE event_type = 'tool_call'
GROUP BY tool
ORDER BY p95_ms DESC;`,
                },
            ],
        },
        {
            code: 'M3',
            title: 'Search inside the JSON',
            short: 'Search the JSON',
            time: '10 min',
            highlight: '3',
            blocks: [
                {
                    label: 'M3 · Search inside the JSON',
                    file: 'sql',
                    language: 'sql',
                    code: `SELECT session_id, ts, CAST(payload['error']['message'] AS STRING) AS error_message
FROM agent_events
WHERE payload['error']['message'] MATCH_ANY 'timeout'
ORDER BY ts
LIMIT 20;`,
                },
            ],
        },
        {
            code: 'M4',
            title: 'Session timeline',
            time: '20 min',
            blocks: [
                {
                    label: 'M4 · Session timeline',
                    file: 'sql',
                    language: 'sql',
                    code: `SELECT ts, event_type,
       CAST(payload['tool'] AS STRING)   AS tool,
       CAST(payload['status'] AS STRING) AS status,
       CAST(payload['text'] AS STRING)   AS text
FROM agent_events
WHERE session_id = 's-0042'
ORDER BY ts;`,
                },
                <p key="ui">Build the explorer UI around these queries: sessions list → timeline → stats.</p>,
            ],
        },
        {
            code: 'M5',
            title: 'Watch the schema evolve',
            short: 'Schema evolves',
            time: '10 min',
            blocks: [
                {
                    label: 'M5 · Load the drift batch',
                    file: 'bash',
                    language: 'bash',
                    code: 'mysql -h127.0.0.1 -P9030 -uroot < a4/drift_batch.sql   # events with new fields',
                },
                {
                    label: 'M5 · Query the new fields',
                    file: 'sql',
                    language: 'sql',
                    target: true,
                    code: `SELECT CAST(payload['agent_version'] AS STRING) AS version,
       SUM(CAST(payload['cost_usd'] AS DOUBLE)) AS cost_usd
FROM agent_events
WHERE event_type = 'llm_call'
GROUP BY version;`,
                },
                <p key="desc">
                    Run <code>DESC agent_events</code> again: the new paths are there. No <code>ALTER TABLE</code>{' '}
                    happened.
                </p>,
            ],
        },
    ],
    done: [
        'Heterogeneous events loaded into one VARIANT column (the seed plus the drift batch).',
        'At least three JSON-path queries, including one aggregation on an inferred numeric subcolumn (for example p95 latency per tool).',
        'A full-text search on a JSON text path.',
        'A session timeline view (CLI, notebook or web).',
        <>
            A README with <strong>three insights</strong> from the data — including your verdict on the v2 release —
            plus how to run and one screenshot.
        </>,
    ],
    stretch: [
        <>
            <strong>Bring your own traces.</strong> Export your own AI coding agent&apos;s local session logs (JSONL)
            and load them. It all stays on your laptop.
        </>,
        <>
            <strong>Schema Template.</strong> Pin hot paths with{' '}
            <code>VARIANT&lt;&apos;latency_ms&apos;: INT, &apos;tool&apos;: STRING&gt;</code> and compare{' '}
            <code>DESC</code> output and query behaviour.
        </>,
        <>
            <strong>Let an assistant explore it.</strong> Connect the Doris MCP Server (
            <Link to={hackathonTaskPath(getHackathonTask('A2'))}>Task A2</Link>) and ask your assistant to find the
            worst session.
        </>,
        <>
            <strong>Classify errors with SQL</strong> (bring your own API key):{' '}
            <code>
                AI_CLASSIFY(CAST(payload[&apos;error&apos;][&apos;message&apos;] AS STRING), [&apos;timeout&apos;,
                &apos;auth&apos;, &apos;bad input&apos;, &apos;other&apos;])
            </code>
            . See <Link to="/docs/4.x/key-features/llm-sql-functions">LLM SQL Functions</Link>.
        </>,
    ],
    troubleshooting: COMMON_TROUBLESHOOTING,
    references: [
        { label: 'VARIANT Data Type', to: '/docs/4.x/key-features/variant-data-type' },
        {
            label: 'VARIANT SQL reference',
            to: '/docs/4.x/sql-manual/basic-element/sql-data-types/semi-structured/VARIANT',
        },
        { label: 'Full-text Search', to: '/docs/4.x/key-features/full-text-search' },
        { label: 'LLM SQL Functions', to: '/docs/4.x/key-features/llm-sql-functions' },
    ],
    Sketch: AgentTraceSketch,
};
