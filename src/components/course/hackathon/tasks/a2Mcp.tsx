import {translate} from '@docusaurus/Translate';
import React from 'react';
import Link from '@docusaurus/Link';
import { HackathonTaskContent } from '../HackathonTaskPage';
import { McpSketch } from '../HackathonSketch';
import {
    BEFORE_CAN_CONNECT,
    BEFORE_DORIS_RUNNING,
    BEFORE_IMAGE_PULLED,
    BEFORE_STARTER_KIT,
    TRAPS,
    TROUBLE,
} from '../hackathonCommon';
import { dorisLoad, getHackathonTask } from '../hackathonEvent';

const QUESTIONS = [
    {
        level: '1',
        question: (
            <>
                {translate({id: "landing.a2Mcp.001", message: "How many log lines per service and level are in"})} <code>app_logs</code>?
            </>
        ),
        tests: translate({id: "landing.a2Mcp.002", message: "Basic aggregation"}),
    },
    {
        level: '2',
        question:
            translate({id: "landing.a2Mcp.003", message: "Show ERROR counts per service in 5-minute buckets between 11:00 and 12:30. Which service spiked first?"}),
        tests: translate({id: "landing.a2Mcp.004", message: "Time bucketing, reasoning"}),
    },
    {
        level: '3',
        question: translate({id: "landing.a2Mcp.005", message: "Find the 10 log lines most relevant to \"payment gateway timeout\", ranked by relevance."}),
        tests: (
            <>
                {translate({id: "landing.a2Mcp.006", message: "Doris full-text + BM25 (does it use"})} <code>MATCH_ANY</code> + <code>score()</code>{translate({id: "landing.a2Mcp.007", message: ", or fall back to"})}{' '}
                <code>LIKE</code>?)
            </>
        ),
    },
    {
        level: '4',
        question: translate({id: "landing.a2Mcp.008", message: "Which agent tool has the worst p95 latency, and how often does it fail?"}),
        tests: translate({id: "landing.a2Mcp.009", message: "VARIANT paths + casts"}),
    },
    {
        level: '5',
        question: translate({id: "landing.a2Mcp.010", message: "Which Doris docs sections explain pre-filtering for vector search?"}),
        tests: (
            <>
                {translate({id: "landing.a2Mcp.011", message: "Search over"})} <code>doc_chunks</code>
            </>
        ),
    },
];

export const A2_MCP: HackathonTaskContent = {
    task: getHackathonTask('A2'),
    titleLead: translate({id: "landing.a2Mcp.012", message: "Ask Doris"}),
    titleTail: translate({id: "landing.a2Mcp.013", message: "with MCP"}),
    hook: translate({id: "landing.a2Mcp.014", message: "Plug Doris into the AI assistant you already use — and make it answer real questions with real SQL."}),
    chips: [translate({id: "landing.courseExtra.a2Mcp.010", message: "45–90 min"}), translate({id: "landing.courseExtra.a2Mcp.011", message: "Beginner-friendly"}), translate({id: "landing.courseExtra.a2Mcp.012", message: "Python 3.12+ · any MCP client"}), translate({id: "landing.courseExtra.a2Mcp.013", message: "AI tools welcome"})],
    build: {
        lead: translate({id: "landing.a2Mcp.015", message: "Turn your AI assistant into a Doris data analyst."}),
        body: (
            <>
                <p>
                    {translate({id: "landing.a2Mcp.016", message: "The Apache Doris MCP Server exposes your cluster to any MCP-capable assistant. Connect it, then make your assistant explore the hackathon data, write SQL, and answer questions you'd normally answer with a dashboard."})}
                </p>
                <p>
                    {translate({id: "landing.a2Mcp.017", message: "A working setup — your own MCP client talking to your local Doris through the official"})}{' '}
                    <strong>{translate({id: "landing.a2Mcp.018", message: "Doris MCP Server 1.0"})}</strong> {translate({id: "landing.a2Mcp.019", message: "— plus a short write-up showing your assistant:"})}
                </p>
                <ol className="hk-task__steps">
                    <li>
                        <p>
                            {translate({id: "landing.a2Mcp.020", message: "discovering the"})} <code>hackathon</code> {translate({id: "landing.a2Mcp.021", message: "tables on its own,"})}
                        </p>
                    </li>
                    <li>
                        <p>{translate({id: "landing.a2Mcp.022", message: "answering at least three data questions by writing and running SQL,"})}</p>
                    </li>
                    <li>
                        <p>{translate({id: "landing.a2Mcp.023", message: "refusing a destructive request (because the server and the user are read-only)."})}</p>
                    </li>
                </ol>
            </>
        ),
    },
    why: [
        <>
            <strong>{translate({id: "landing.a2Mcp.024", message: "Read-only by design."})}</strong> {translate({id: "landing.a2Mcp.025", message: "The Doris MCP Server 1.0 exposes read-only capabilities only; Doris RBAC stays the final authority."})}
        </>,
        <>
            <strong>{translate({id: "landing.a2Mcp.026", message: "Eight domains, not a flat tool dump."})}</strong> {translate({id: "landing.a2Mcp.027", message: "Catalog, query, cluster, pipeline,"})}{' '}
            <strong>{translate({id: "landing.a2Mcp.028", message: "search"})}</strong>{translate({id: "landing.a2Mcp.029", message: ", governance, lakehouse and semantic domains, disclosed progressively so the model sees only what it needs."})}
        </>,
        <>
            <strong>{translate({id: "landing.courseExtra.a2Mcp.001", message: "Search-aware."})}</strong> {translate({id: "landing.a2Mcp.030", message: "The"})} <code>doris_search</code> {translate({id: "landing.a2Mcp.031", message: "domain knows about text, vector and hybrid search, so your assistant can use Doris's search features instead of guessing."})}
        </>,
    ],
    before: [
        BEFORE_IMAGE_PULLED,
        BEFORE_DORIS_RUNNING,
        BEFORE_CAN_CONNECT,
        BEFORE_STARTER_KIT,
        {
            title: translate({id: "landing.a2Mcp.032", message: "Python 3.12 or later, with the server installed."}),
            body: (
                <>
                    {translate({id: "landing.a2Mcp.033", message: "Check with"})} <code>python3 --version</code>{translate({id: "landing.a2Mcp.034", message: ". Install the server ahead of time (milestone 2 has the commands): it pulls in about 80 packages."})}
                </>
            ),
        },
        {
            title: translate({id: "landing.a2Mcp.035", message: "An MCP-capable AI client you already use"}),
            body: translate({id: "landing.a2Mcp.036", message: "(and its account)."}),
        },
        {
            title: translate({id: "landing.a2Mcp.037", message: "All hackathon tables loaded."}),
            body: translate({id: "landing.a2Mcp.038", message: "From the starter-kit folder. It ends with the row count of each table."}),
            command: dorisLoad('seed/seed_all.sql'),
        },
    ],
    ai: {
        intro: (
            <p>
                <strong>{translate({id: "landing.a2Mcp.039", message: "This task is already an AI task."})}</strong> {translate({id: "landing.a2Mcp.040", message: "The text below teaches your assistant to write Doris SQL. It is the starting point for the instruction file in the first stretch goal."})}
            </p>
        ),
        steps: [],
        prompt: {
            label: translate({id: "landing.a2Mcp.041", message: "Instruction file"}),
            file: translate({id: "landing.a2Mcp.042", message: "paste into your client"}),
            language: 'text',
            wrap: true,
            code: `You are connected to Apache Doris 4.1 through the Doris MCP Server (read-only).
Database: hackathon. Tables: doc_chunks (docs search), app_logs (application logs),
agent_events (AI agent traces, JSON in a VARIANT column named payload).

Doris SQL rules:
- Text search: col MATCH_ANY 'a b' / MATCH_ALL / MATCH_PHRASE — never LIKE.
- Relevance: score() only with a MATCH_* predicate + ORDER BY score() DESC LIMIT n.
- Vectors: ORDER BY l2_distance_approximate(embedding, [...]) LIMIT n.
- VARIANT: CAST(payload['field'] AS <TYPE>) before comparing or aggregating;
  nested paths look like payload['error']['message'].
- Time buckets: minute_floor(ts, 5) or date_trunc(ts, 'hour').
Always show the SQL you ran together with the answer.`,
        },
        traps: [TRAPS.like, TRAPS.scoreAnywhere, TRAPS.scoreAggregate, TRAPS.variantCast],
    },
    milestones: [
        {
            code: 'M1',
            title: translate({id: "landing.a2Mcp.043", message: "Create a read-only user"}),
            short: translate({id: "landing.a2Mcp.044", message: "Read-only user"}),
            time: translate({id: "landing.courseExtra.a2Mcp.002", message: "5 min"}),
            blocks: [
                {
                    label: translate({id: "landing.a2Mcp.045", message: "M1 · Read-only user"}),
                    file: 'sql',
                    language: 'sql',
                    code: `CREATE USER 'mcp_reader'@'%' IDENTIFIED BY 'hackathon';
GRANT SELECT_PRIV ON internal.hackathon.* TO 'mcp_reader'@'%';`,
                },
                <p key="root">
                    {translate({id: "landing.a2Mcp.046", message: "Never hand an LLM your root account — even on a laptop. Run it in a SQL shell, or load"})}{' '}
                    <code>a2/create_reader.sql</code> {translate({id: "landing.a2Mcp.047", message: "from the starter kit."})}
                </p>,
            ],
            checkpoint: (
                <>
                    <code>SHOW GRANTS FOR &apos;mcp_reader&apos;@&apos;%&apos;</code> {translate({id: "landing.a2Mcp.048", message: "shows"})} <code>Select_priv</code> {translate({id: "landing.a2Mcp.049", message: "on"})}{' '}
                    <code>internal.hackathon</code>{translate({id: "landing.a2Mcp.050", message: ", and nothing that writes."})}
                </>
            ),
        },
        {
            code: 'M2',
            title: translate({id: "landing.a2Mcp.051", message: "Install and register the server"}),
            short: translate({id: "landing.a2Mcp.052", message: "Install the server"}),
            time: translate({id: "landing.courseExtra.a2Mcp.003", message: "15 min"}),
            blocks: [
                {
                    label: translate({id: "landing.a2Mcp.053", message: "M2 · Install"}),
                    file: 'bash',
                    language: 'bash',
                    code: `python3 -m venv .venv && . .venv/bin/activate   # Python 3.12+
pip install doris-mcp-server==1.0.0
which doris-mcp-server          # note the absolute path`,
                },
                <p key="config">
                    {translate({id: "landing.a2Mcp.054", message: "Add it to your client's MCP config (the file name and location depend on the client). The starter kit has this as"})} <code>a2/mcp-config.example.json</code>:
                </p>,
                {
                    label: translate({id: "landing.a2Mcp.055", message: "M2 · MCP config"}),
                    file: 'json',
                    language: 'json',
                    target: true,
                    code: `{
  "mcpServers": {
    "doris": {
      "command": "/absolute/path/to/doris-mcp-server",
      "args": ["--transport", "stdio"],
      "env": {
        "DORIS_HOST": "127.0.0.1",
        "DORIS_PORT": "9030",
        "DORIS_USER": "mcp_reader",
        "DORIS_PASSWORD": "hackathon",
        "DORIS_DATABASE": "hackathon"
      }
    }
  }
}`,
                },
            ],
            highlight: '4, 9-10',
            checkpoint: (
                <>
                    {translate({id: "landing.a2Mcp.056", message: "Your client lists the Doris server and its eight"})} <code>doris_*</code> {translate({id: "landing.a2Mcp.057", message: "domains (catalog, cluster, governance, lakehouse, pipeline, query, search, semantic)."})}
                </>
            ),
        },
        {
            code: 'M3',
            title: translate({id: "landing.a2Mcp.058", message: "Let it explore"}),
            time: translate({id: "landing.courseExtra.a2Mcp.004", message: "10 min"}),
            blocks: [
                <p key="ask">
                    {translate({id: "landing.a2Mcp.059", message: "Ask:"})} <em>{translate({id: "landing.a2Mcp.060", message: "\"What tables are in the hackathon database, and what is each one for?\""})}</em> {translate({id: "landing.a2Mcp.061", message: "Watch which capabilities it calls."})}
                </p>,
                {
                    label: translate({id: "landing.a2Mcp.062", message: "M3 · Ask your assistant"}),
                    file: translate({id: "landing.a2Mcp.063", message: "paste into your client"}),
                    language: 'text',
                    wrap: true,
                    panelOnly: true,
                    code: 'What tables are in the hackathon database, and what is each one for?',
                },
            ],
        },
        {
            code: 'M4',
            title: translate({id: "landing.a2Mcp.064", message: "Ask real questions"}),
            short: translate({id: "landing.a2Mcp.065", message: "Real questions"}),
            time: translate({id: "landing.courseExtra.a2Mcp.005", message: "20–40 min"}),
            blocks: [
                <p key="pick">{translate({id: "landing.a2Mcp.066", message: "Pick at least three:"})}</p>,
                <table className="hk-task__table hk-task__table--levels" key="questions">
                    <thead>
                        <tr>
                            <th>{translate({id: "landing.a2Mcp.067", message: "Level"})}</th>
                            <th>{translate({id: "landing.a2Mcp.068", message: "Question"})}</th>
                            <th>{translate({id: "landing.a2Mcp.069", message: "What it tests"})}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {QUESTIONS.map(item => (
                            <tr key={item.level}>
                                <td data-label={translate({id: "landing.a2Mcp.070", message: "Level"})}>{item.level}</td>
                                <td data-label={translate({id: "landing.a2Mcp.071", message: "Question"})}>{item.question}</td>
                                <td data-label={translate({id: "landing.a2Mcp.072", message: "What it tests"})}>{item.tests}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>,
                {
                    label: translate({id: "landing.a2Mcp.073", message: "M4 · Questions"}),
                    file: translate({id: "landing.a2Mcp.074", message: "paste into your client"}),
                    language: 'text',
                    wrap: true,
                    panelOnly: true,
                    code: `1. How many log lines per service and level are in app_logs?
2. Show ERROR counts per service in 5-minute buckets between 11:00 and 12:30. Which service spiked first?
3. Find the 10 log lines most relevant to "payment gateway timeout", ranked by relevance.
4. Which agent tool has the worst p95 latency, and how often does it fail?
5. Which Doris docs sections explain pre-filtering for vector search?`,
                },
                <p key="keep">{translate({id: "landing.a2Mcp.075", message: "For each answer, keep the SQL the assistant ran and check the result yourself."})}</p>,
            ],
        },
        {
            code: 'M5',
            title: translate({id: "landing.a2Mcp.076", message: "Try to break it"}),
            time: translate({id: "landing.courseExtra.a2Mcp.006", message: "5 min"}),
            blocks: [
                <p key="ask">
                    {translate({id: "landing.a2Mcp.077", message: "Ask:"})} <em>{translate({id: "landing.a2Mcp.078", message: "\"Delete all INFO logs to save space.\""})}</em> {translate({id: "landing.a2Mcp.079", message: "Record what happens. (Expected: refused — the server answers"})} <code>SQL operation DELETE is not read-only.</code>{translate({id: "landing.a2Mcp.080", message: ", and"})}{' '}
                    <code>mcp_reader</code> {translate({id: "landing.a2Mcp.081", message: "has no write privilege either.)"})}
                </p>,
                {
                    label: translate({id: "landing.a2Mcp.082", message: "M5 · Ask your assistant"}),
                    file: translate({id: "landing.a2Mcp.083", message: "paste into your client"}),
                    language: 'text',
                    wrap: true,
                    panelOnly: true,
                    code: 'Delete all INFO logs to save space.',
                },
            ],
        },
    ],
    done: [
        translate({id: "landing.courseExtra.a2Mcp.007", message: "Doris MCP Server connected to your AI client (screenshot of the tool list)."}),
        <>
            {translate({id: "landing.a2Mcp.084", message: "At least"})} <strong>{translate({id: "landing.a2Mcp.085", message: "three"})}</strong> {translate({id: "landing.a2Mcp.086", message: "questions answered, each with the SQL that ran and the result."})}
        </>,
        translate({id: "landing.courseExtra.a2Mcp.008", message: "One documented safety test (a refused write)."}),
        translate({id: "landing.courseExtra.a2Mcp.009", message: "A write-up (the README in your GitHub-ID folder) with your client, your config (no secrets), the Q&A, and one thing that was confusing or could be better."}),
    ],
    stretch: [
        <>
            <strong>{translate({id: "landing.a2Mcp.087", message: "Teach your assistant Doris."})}</strong> {translate({id: "landing.a2Mcp.088", message: "Write a reusable instruction file (rules / skill / system prompt for your client) covering"})} <code>MATCH_*</code>, <code>score()</code>{translate({id: "landing.a2Mcp.089", message: ", ANN distance functions and VARIANT casts. Re-ask the Level 3–4 questions and compare accuracy before and after."})}
        </>,
        <>
            <strong>{translate({id: "landing.a2Mcp.090", message: "HTTP transport."})}</strong> {translate({id: "landing.a2Mcp.091", message: "Run"})}{' '}
            <code>doris-mcp-server --transport http --host 127.0.0.1 --port 3000</code> {translate({id: "landing.a2Mcp.092", message: "and connect a second client to"})}{' '}
            <code>http://127.0.0.1:3000/mcp</code>.
        </>,
        <>
            <strong>{translate({id: "landing.a2Mcp.093", message: "Ask it why a query is slow."})}</strong> {translate({id: "landing.a2Mcp.094", message: "Explore the"})} <code>doris_query</code> {translate({id: "landing.a2Mcp.095", message: "domain (explain, profile)."})}
        </>,
        <>
            <strong>{translate({id: "landing.a2Mcp.096", message: "Improve the docs."})}</strong> {translate({id: "landing.a2Mcp.097", message: "Anything on the"})}{' '}
            <Link to="/docs/4.x/key-features/mcp-server">{translate({id: "landing.a2Mcp.098", message: "MCP Server page"})}</Link> {translate({id: "landing.a2Mcp.099", message: "that slowed you down? Open a PR that fixes it — that's a docs contribution too."})}
        </>,
    ],
    troubleshooting: [
        {
            problem: translate({id: "landing.a2Mcp.100", message: "Client can't start the server"}),
            fix: (
                <>
                    {translate({id: "landing.a2Mcp.101", message: "Use the absolute path from"})} <code>which doris-mcp-server</code>{translate({id: "landing.a2Mcp.102", message: "; GUI apps often don't inherit your shell"})} <code>PATH</code> {translate({id: "landing.a2Mcp.103", message: "or virtualenv"})}
                </>
            ),
        },
        {
            problem: (
                <>
                    <code>pip</code> {translate({id: "landing.a2Mcp.104", message: "refuses: Python too old"})}
                </>
            ),
            fix: (
                <>
                    {translate({id: "landing.a2Mcp.105", message: "The server needs Python 3.12+; create a venv with"})} <code>python3.12 -m venv .venv</code> {translate({id: "landing.a2Mcp.106", message: "(or use"})}{' '}
                    <code>uv</code>)
                </>
            ),
        },
        {
            problem: translate({id: "landing.a2Mcp.107", message: "Client shows the domains but can't call child capabilities"}),
            fix: (
                <>
                    {translate({id: "landing.a2Mcp.108", message: "Your client may not support progressive disclosure: add"})}{' '}
                    <code>&quot;MCP_TOOL_EXPOSURE_MODE&quot;: &quot;flat&quot;</code> {translate({id: "landing.a2Mcp.109", message: "to"})} <code>env</code>
                </>
            ),
        },
        {
            problem: translate({id: "landing.a2Mcp.110", message: "Access denied"}),
            fix: (
                <>
                    {translate({id: "landing.a2Mcp.111", message: "Check the"})} <code>GRANT</code> {translate({id: "landing.a2Mcp.112", message: "in M1 and the"})} <code>DORIS_USER</code> / <code>DORIS_PASSWORD</code>{' '}
                    {translate({id: "landing.a2Mcp.113", message: "pair"})}
                </>
            ),
        },
        TROUBLE.docker,
        TROUBLE.credentials,
        TROUBLE.unhealthy,
        TROUBLE.stuck,
    ],
    references: [
        {
            label: translate({id: "landing.a2Mcp.114", message: "Doris MCP Server repository"}),
            to: 'https://github.com/apache/doris-mcp-server',
            note: translate({id: "landing.a2Mcp.115", message: "README and quick start for 1.0"}),
        },
        {
            label: translate({id: "landing.a2Mcp.116", message: "MCP Server feature page"}),
            to: '/docs/4.x/key-features/mcp-server',
        },
        { label: translate({id: "landing.a2Mcp.117", message: "Model Context Protocol"}), to: 'https://modelcontextprotocol.io/' },
    ],
    Sketch: McpSketch,
};
