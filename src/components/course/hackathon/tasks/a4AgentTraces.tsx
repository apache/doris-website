import {translate} from '@docusaurus/Translate';
import React from 'react';
import Link from '@docusaurus/Link';
import { HackathonTaskContent } from '../HackathonTaskPage';
import { AgentTraceSketch } from '../HackathonSketch';
import { AI_INTRO, AI_STEPS, COMMON_BEFORE, COMMON_TROUBLESHOOTING, TRAPS } from '../hackathonCommon';
import { dorisLoad, getHackathonTask, hackathonTaskPath } from '../hackathonEvent';

export const A4_AGENT_TRACES: HackathonTaskContent = {
    task: getHackathonTask('A4'),
    titleLead: translate({id: "landing.a4AgentTraces.001", message: "Agent Trace"}),
    titleTail: translate({id: "landing.a4AgentTraces.002", message: "Explorer"}),
    hook: translate({id: "landing.a4AgentTraces.003", message: "AI agents emit JSON that changes shape every release. Store it in VARIANT and query it like real columns."}),
    chips: [translate({id: "landing.courseExtra.a4AgentTraces.011", message: "60–120 min"}), translate({id: "landing.courseExtra.a4AgentTraces.012", message: "Intermediate"}), translate({id: "landing.courseExtra.a4AgentTraces.013", message: "Any language · CLI, notebook or web"}), translate({id: "landing.courseExtra.a4AgentTraces.014", message: "AI tools welcome"})],
    build: {
        lead: translate({id: "landing.a4AgentTraces.004", message: "Your agent's JSON is a mess. Query it anyway."}),
        body: (
            <>
                <p>
                    {translate({id: "landing.a4AgentTraces.005", message: "LLM calls, tool calls, errors, final answers — each with its own fields, and new fields every release. Doris"})} <code>VARIANT</code> {translate({id: "landing.a4AgentTraces.006", message: "turns that JSON into typed columns automatically, so you can filter, search and aggregate it with plain SQL. No schema migrations."})}
                </p>
                <p>
                    {translate({id: "landing.a4AgentTraces.007", message: "A trace explorer for"})} <strong>{translate({id: "landing.a4AgentTraces.008", message: "1,000 AI-agent sessions (about 20,000 events)"})}</strong>:
                </p>
                <ul className="hk-task__bullets">
                    <li>
                        {translate({id: "landing.a4AgentTraces.009", message: "a"})} <strong>{translate({id: "landing.a4AgentTraces.010", message: "sessions list"})}</strong> {translate({id: "landing.a4AgentTraces.011", message: "with event counts, errors, tokens and latency,"})}
                    </li>
                    <li>
                        {translate({id: "landing.a4AgentTraces.012", message: "a"})} <strong>{translate({id: "landing.a4AgentTraces.013", message: "session timeline"})}</strong>{translate({id: "landing.a4AgentTraces.014", message: ": click a session to replay what the agent did, step by step,"})}
                    </li>
                    <li>
                        <strong>{translate({id: "landing.a4AgentTraces.015", message: "tool and model stats"})}</strong>{translate({id: "landing.a4AgentTraces.016", message: ": p95 latency, error rate, token usage,"})}
                    </li>
                    <li>
                        <strong>{translate({id: "landing.a4AgentTraces.017", message: "search inside the JSON"})}</strong>{translate({id: "landing.a4AgentTraces.018", message: ": find every tool error that mentions \"timeout\"."})}
                    </li>
                </ul>
                <p>
                    {translate({id: "landing.a4AgentTraces.019", message: "Then answer:"})}{' '}
                    <strong>{translate({id: "landing.a4AgentTraces.020", message: "did the agent's v2 release (deployed at 13:00) make things better or worse?"})}</strong>
                </p>
            </>
        ),
    },
    why: [
        <>
            <strong>{translate({id: "landing.a4AgentTraces.021", message: "Schema-on-write, without the schema."})}</strong> {translate({id: "landing.a4AgentTraces.022", message: "VARIANT infers a type for every JSON path and stores frequent paths as real columnar subcolumns, so"})} <code>payload[&apos;latency_ms&apos;]</code> {translate({id: "landing.a4AgentTraces.023", message: "reads one column instead of parsing every document."})}
        </>,
        <>
            <strong>{translate({id: "landing.a4AgentTraces.024", message: "New fields just appear."})}</strong> {translate({id: "landing.a4AgentTraces.025", message: "When v2 events add"})} <code>cost_usd</code>{translate({id: "landing.a4AgentTraces.026", message: ", the new path shows up as a subcolumn on the next load, with no"})} <code>ALTER TABLE</code>.
        </>,
        <>
            <strong>{translate({id: "landing.a4AgentTraces.027", message: "Search inside JSON."})}</strong> {translate({id: "landing.a4AgentTraces.028", message: "An inverted index on the VARIANT column makes every text path searchable with"})} <code>MATCH_*</code>.
        </>,
    ],
    whyHighlight: '6-7',
    before: COMMON_BEFORE,
    data: [
        <p key="intro">
            <code>hackathon.agent_events</code> {translate({id: "landing.a4AgentTraces.029", message: "— one row per agent event, the event body in a VARIANT column:"})}
        </p>,
        {
            label: translate({id: "landing.a4AgentTraces.030", message: "Table"}),
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
        <p key="shapes">{translate({id: "landing.a4AgentTraces.032", message: "Example payloads — note how the shapes differ:"})}</p>,
        {
            label: translate({id: "landing.a4AgentTraces.033", message: "Example payloads"}),
            file: 'json',
            language: 'json',
            code: `{"text": "Why did checkout fail at 11:40?", "lang": "en", "agent_version": "v1"}
{"model": "model-large", "usage": {"input_tokens": 812, "output_tokens": 96}, "latency_ms": 1430, "agent_version": "v1"}
{"tool": "sql_query", "args": {"sql": "SELECT ..."}, "latency_ms": 37, "status": "ok", "agent_version": "v1"}
{"tool": "http_get", "args": {"url": "..."}, "latency_ms": 3012, "status": "error", "agent_version": "v1",
 "error": {"type": "Timeout", "message": "read timeout after 3000 ms calling https://api.internal/orders"}}`,
        },
        <p key="v2">
            {translate({id: "landing.a4AgentTraces.034", message: "Sessions that start at 13:00 or later run"})} <strong>{translate({id: "landing.a4AgentTraces.035", message: "agent v2"})}</strong>{translate({id: "landing.a4AgentTraces.036", message: ": their payloads say"})}{' '}
            <code>&quot;agent_version&quot;: &quot;v2&quot;</code>{translate({id: "landing.a4AgentTraces.037", message: ", and v2 LLM calls add a"})} <code>cache_hit</code> {translate({id: "landing.a4AgentTraces.038", message: "flag. Milestone 5 then loads events with fields the table has never seen."})}
        </p>,
    ],
    ai: {
        intro: AI_INTRO,
        steps: AI_STEPS,
        prompt: {
            label: translate({id: "landing.a4AgentTraces.039", message: "Context prompt"}),
            file: translate({id: "landing.a4AgentTraces.040", message: "paste into your agent"}),
            language: 'text',
            wrap: true,
            code: `I'm building an agent trace explorer on Apache Doris 4.1 for a hackathon.

Connection: MySQL protocol, 127.0.0.1:9030, user root, empty password, database \`hackathon\`.
Use a plain MySQL driver and raw SQL.

Table \`agent_events\`: session_id, ts DATETIME(3), event_id, event_type
(user_message / llm_call / tool_call / error / final_answer), payload VARIANT
(inverted index, english parser). Payload shapes differ by event_type. Every payload has
agent_version: "v1" before 13:00, "v2" from 13:00; v2 llm_calls add cache_hit.

Doris SQL rules:
1. Read JSON paths as payload['a']['b']. CAST to a concrete type before comparing,
   sorting or aggregating: CAST(payload['latency_ms'] AS DOUBLE).
2. VARIANT cannot be a key, a sort key or a join key.
3. Text search inside JSON: payload['error']['message'] MATCH_ANY 'timeout'. Never LIKE.
4. Percentiles: percentile_approx(expr, 0.95).
5. \`SET describe_extend_variant_column = true; DESC agent_events;\` lists inferred subcolumns.
6. To insert JSON yourself, CAST the text: CAST('{"a": 1}' AS JSON).

Build: sessions list, session timeline, tool/model stats, and JSON search.
Run every SQL statement against the live cluster first.`,
        },
        traps: [TRAPS.variantCast, TRAPS.variantDesc, TRAPS.like, TRAPS.orm],
    },
    milestones: [
        {
            code: 'M0',
            title: translate({id: "landing.a4AgentTraces.041", message: "Load and inspect"}),
            time: translate({id: "landing.courseExtra.a4AgentTraces.001", message: "10 min"}),
            blocks: [
                <p key="where">{translate({id: "landing.a4AgentTraces.042", message: "From inside the starter-kit folder:"})}</p>,
                {
                    label: translate({id: "landing.a4AgentTraces.043", message: "M0 · Load"}),
                    file: 'bash',
                    language: 'bash',
                    code: dorisLoad('seed/a4_agent_events.sql'),
                },
                <p key="shell">{translate({id: "landing.a4AgentTraces.044", message: "Then, in a SQL shell:"})}</p>,
                {
                    label: translate({id: "landing.a4AgentTraces.045", message: "M0 · Inspect"}),
                    file: 'sql',
                    language: 'sql',
                    target: true,
                    code: `USE hackathon;
SET describe_extend_variant_column = true;
DESC agent_events;     -- see the subcolumns Doris inferred: payload.tool, payload.usage.input_tokens, ...`,
                },
            ],
            checkpoint: (
                <>
                    {translate({id: "landing.a4AgentTraces.046", message: "The load reports"})} <strong>{translate({id: "landing.a4AgentTraces.047", message: "1,000 sessions and 20,401 events"})}</strong>; <code>DESC</code> {translate({id: "landing.a4AgentTraces.048", message: "lists about 20"})}{' '}
                    <code>payload.*</code> {translate({id: "landing.a4AgentTraces.049", message: "paths, each with an inferred type."})}
                </>
            ),
        },
        {
            code: 'M1',
            title: translate({id: "landing.a4AgentTraces.050", message: "Query JSON paths"}),
            time: translate({id: "landing.courseExtra.a4AgentTraces.002", message: "15 min"}),
            blocks: [
                {
                    label: translate({id: "landing.a4AgentTraces.051", message: "M1 · Query JSON paths"}),
                    file: 'sql',
                    language: 'sql',
                    code: `SELECT CAST(payload['tool'] AS STRING) AS tool, COUNT(*) AS calls
FROM agent_events
WHERE event_type = 'tool_call'
GROUP BY tool
ORDER BY calls DESC;`,
                },
            ],
            checkpoint: (
                <>
                    {translate({id: "landing.a4AgentTraces.052", message: "Five tools;"})} <code>sql_query</code> {translate({id: "landing.a4AgentTraces.053", message: "is called most (3,506 times)."})}
                </>
            ),
        },
        {
            code: 'M2',
            title: translate({id: "landing.a4AgentTraces.054", message: "Aggregate inferred subcolumns"}),
            short: translate({id: "landing.a4AgentTraces.055", message: "Aggregate subcolumns"}),
            time: translate({id: "landing.courseExtra.a4AgentTraces.003", message: "15 min"}),
            highlight: '3-4',
            blocks: [
                {
                    label: translate({id: "landing.a4AgentTraces.056", message: "M2 · Aggregate inferred subcolumns"}),
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
            checkpoint: (
                <>
                    <code>python_exec</code> {translate({id: "landing.a4AgentTraces.057", message: "has the worst p95 (about 2.1 s);"})} <code>http_get</code> {translate({id: "landing.a4AgentTraces.058", message: "fails most often (425 errors)."})}
                </>
            ),
        },
        {
            code: 'M3',
            title: translate({id: "landing.a4AgentTraces.059", message: "Search inside the JSON"}),
            short: translate({id: "landing.a4AgentTraces.060", message: "Search the JSON"}),
            time: translate({id: "landing.courseExtra.a4AgentTraces.004", message: "10 min"}),
            highlight: '3',
            blocks: [
                {
                    label: translate({id: "landing.a4AgentTraces.061", message: "M3 · Search inside the JSON"}),
                    file: 'sql',
                    language: 'sql',
                    code: `SELECT session_id, ts, CAST(payload['error']['message'] AS STRING) AS error_message
FROM agent_events
WHERE payload['error']['message'] MATCH_ANY 'timeout'
ORDER BY ts
LIMIT 20;`,
                },
            ],
            checkpoint: (
                <>{translate({id: "landing.a4AgentTraces.062", message: "398 events mention a timeout in total. Count them per hour: that is your first clue about v2."})}</>
            ),
        },
        {
            code: 'M4',
            title: translate({id: "landing.a4AgentTraces.063", message: "Session timeline"}),
            time: translate({id: "landing.courseExtra.a4AgentTraces.005", message: "20 min"}),
            blocks: [
                {
                    label: translate({id: "landing.a4AgentTraces.064", message: "M4 · Session timeline"}),
                    file: 'sql',
                    language: 'sql',
                    code: `SELECT ts, event_type,
       CAST(payload['tool'] AS STRING)      AS tool,
       CAST(payload['status'] AS STRING)    AS status,
       CAST(payload['latency_ms'] AS INT)   AS latency_ms,
       CAST(payload['text'] AS STRING)      AS text
FROM agent_events
WHERE session_id = 's-0042'
ORDER BY ts;`,
                },
                <p key="ui">{translate({id: "landing.a4AgentTraces.065", message: "Build the explorer UI around these queries: sessions list → timeline → stats."})}</p>,
            ],
            checkpoint: (
                <>
                    {translate({id: "landing.a4AgentTraces.066", message: "Session"})} <code>s-0042</code> {translate({id: "landing.a4AgentTraces.067", message: "has 25 events: a question, LLM and tool calls (one failed"})}{' '}
                    <code>sql_query</code>{translate({id: "landing.a4AgentTraces.068", message: ", retried), and a final answer."})}
                </>
            ),
        },
        {
            code: 'M5',
            title: translate({id: "landing.a4AgentTraces.069", message: "Watch the schema evolve"}),
            short: translate({id: "landing.a4AgentTraces.070", message: "Schema evolves"}),
            time: translate({id: "landing.courseExtra.a4AgentTraces.006", message: "10 min"}),
            blocks: [
                {
                    label: translate({id: "landing.a4AgentTraces.071", message: "M5 · Load the drift batch"}),
                    file: 'bash',
                    language: 'bash',
                    code: `${dorisLoad('a4/drift_batch.sql')}   # events with new fields`,
                },
                {
                    label: translate({id: "landing.a4AgentTraces.072", message: "M5 · Query the new fields"}),
                    file: 'sql',
                    language: 'sql',
                    target: true,
                    code: `SELECT CAST(payload['agent_version'] AS STRING) AS version,
       COUNT(*) AS llm_calls,
       ROUND(SUM(CAST(payload['cost_usd'] AS DOUBLE)), 2) AS cost_usd
FROM agent_events
WHERE event_type = 'llm_call'
GROUP BY version
ORDER BY version;`,
                },
                <p key="desc">
                    {translate({id: "landing.a4AgentTraces.073", message: "Run"})} <code>DESC agent_events</code> {translate({id: "landing.a4AgentTraces.074", message: "again: the new paths are there. No"})} <code>ALTER TABLE</code>{' '}
                    {translate({id: "landing.a4AgentTraces.075", message: "happened."})}
                </p>,
            ],
            checkpoint: (
                <>
                    {translate({id: "landing.a4AgentTraces.076", message: "A third version appears,"})} <code>v2.1</code>{translate({id: "landing.a4AgentTraces.077", message: ": only its LLM calls carry"})} <code>cost_usd</code>{translate({id: "landing.a4AgentTraces.078", message: ", and"})}{' '}
                    <code>DESC</code> {translate({id: "landing.a4AgentTraces.079", message: "now lists"})} <code>payload.cost_usd</code> {translate({id: "landing.a4AgentTraces.080", message: "and"})} <code>payload.retries</code>.
                </>
            ),
        },
    ],
    done: [
        translate({id: "landing.courseExtra.a4AgentTraces.007", message: "Heterogeneous events loaded into one VARIANT column (the seed plus the drift batch)."}),
        translate({id: "landing.courseExtra.a4AgentTraces.008", message: "At least three JSON-path queries, including one aggregation on an inferred numeric subcolumn (for example p95 latency per tool)."}),
        translate({id: "landing.courseExtra.a4AgentTraces.009", message: "A full-text search on a JSON text path."}),
        translate({id: "landing.courseExtra.a4AgentTraces.010", message: "A session timeline view (CLI, notebook or web)."}),
        <>
            {translate({id: "landing.a4AgentTraces.081", message: "A README with"})} <strong>{translate({id: "landing.a4AgentTraces.082", message: "three insights"})}</strong> {translate({id: "landing.a4AgentTraces.083", message: "from the data — including your verdict on the v2 release — plus how to run and one screenshot."})}
        </>,
    ],
    stretch: [
        <>
            <strong>{translate({id: "landing.a4AgentTraces.084", message: "Bring your own traces."})}</strong> {translate({id: "landing.a4AgentTraces.085", message: "Export your own AI coding agent's local session logs (JSONL) and load them, one"})} <code>CAST(&apos;…&apos; AS JSON)</code> {translate({id: "landing.a4AgentTraces.086", message: "per line. It is stored in your local Doris instance."})}
        </>,
        <>
            <strong>{translate({id: "landing.a4AgentTraces.087", message: "Schema Template."})}</strong> {translate({id: "landing.a4AgentTraces.088", message: "Pin hot paths with"})}{' '}
            <code>VARIANT&lt;&apos;latency_ms&apos;: INT, &apos;tool&apos;: STRING&gt;</code> {translate({id: "landing.a4AgentTraces.089", message: "in a copy of the table and compare"})} <code>DESC</code> {translate({id: "landing.a4AgentTraces.090", message: "output and query behaviour. Fill it with"})}{' '}
            <code>INSERT … SELECT …, CAST(payload AS JSON)</code>{translate({id: "landing.a4AgentTraces.091", message: ": a VARIANT does not cast straight into a templated one."})}
        </>,
        <>
            <strong>{translate({id: "landing.a4AgentTraces.092", message: "Let an assistant explore it."})}</strong> {translate({id: "landing.a4AgentTraces.093", message: "Connect the Doris MCP Server ("})}
            <Link to={hackathonTaskPath(getHackathonTask('A2'))}>{translate({id: "landing.a4AgentTraces.094", message: "Task A2"})}</Link>{translate({id: "landing.a4AgentTraces.095", message: ") and ask your assistant to find the worst session."})}
        </>,
        <>
            <strong>{translate({id: "landing.a4AgentTraces.096", message: "Classify errors with SQL"})}</strong> {translate({id: "landing.a4AgentTraces.097", message: "(bring your own API key):"})}{' '}
            <code>
                AI_CLASSIFY(CAST(payload[&apos;error&apos;][&apos;message&apos;] AS STRING), [&apos;timeout&apos;,
                &apos;auth&apos;, &apos;bad input&apos;, &apos;other&apos;])
            </code>
            {translate({id: "landing.a4AgentTraces.098", message: ". See"})} <Link to="/docs/4.x/key-features/llm-sql-functions">{translate({id: "landing.a4AgentTraces.099", message: "LLM SQL Functions"})}</Link>.
        </>,
    ],
    troubleshooting: COMMON_TROUBLESHOOTING,
    references: [
        { label: translate({id: "landing.a4AgentTraces.100", message: "VARIANT Data Type"}), to: '/docs/4.x/key-features/variant-data-type' },
        {
            label: translate({id: "landing.a4AgentTraces.101", message: "VARIANT SQL reference"}),
            to: '/docs/4.x/sql-manual/basic-element/sql-data-types/semi-structured/VARIANT',
        },
        { label: translate({id: "landing.a4AgentTraces.102", message: "Full-text Search"}), to: '/docs/4.x/key-features/full-text-search' },
        { label: translate({id: "landing.a4AgentTraces.103", message: "LLM SQL Functions"}), to: '/docs/4.x/key-features/llm-sql-functions' },
    ],
    Sketch: AgentTraceSketch,
};
