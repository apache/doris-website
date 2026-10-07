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
                How many log lines per service and level are in <code>app_logs</code>?
            </>
        ),
        tests: 'Basic aggregation',
    },
    {
        level: '2',
        question:
            'Show ERROR counts per service in 5-minute buckets between 11:00 and 12:30. Which service spiked first?',
        tests: 'Time bucketing, reasoning',
    },
    {
        level: '3',
        question: 'Find the 10 log lines most relevant to "payment gateway timeout", ranked by relevance.',
        tests: (
            <>
                Doris full-text + BM25 (does it use <code>MATCH_ANY</code> + <code>score()</code>, or fall back to{' '}
                <code>LIKE</code>?)
            </>
        ),
    },
    {
        level: '4',
        question: 'Which agent tool has the worst p95 latency, and how often does it fail?',
        tests: 'VARIANT paths + casts',
    },
    {
        level: '5',
        question: 'Which Doris docs sections explain pre-filtering for vector search?',
        tests: (
            <>
                Search over <code>doc_chunks</code>
            </>
        ),
    },
];

export const A2_MCP: HackathonTaskContent = {
    task: getHackathonTask('A2'),
    titleLead: 'Ask Doris',
    titleTail: 'with MCP',
    hook: 'Plug Doris into the AI assistant you already use — and make it answer real questions with real SQL.',
    chips: ['45–90 min', 'Beginner-friendly', 'Python 3.12+ · any MCP client', 'AI tools welcome'],
    build: {
        lead: 'Turn your AI assistant into a Doris data analyst.',
        body: (
            <>
                <p>
                    The Apache Doris MCP Server exposes your cluster to any MCP-capable assistant. Connect it, then make
                    your assistant explore the hackathon data, write SQL, and answer questions you&apos;d normally
                    answer with a dashboard.
                </p>
                <p>
                    A working setup — your own MCP client talking to your local Doris through the official{' '}
                    <strong>Doris MCP Server 1.0</strong> — plus a short write-up showing your assistant:
                </p>
                <ol className="hk-task__steps">
                    <li>
                        <p>
                            discovering the <code>hackathon</code> tables on its own,
                        </p>
                    </li>
                    <li>
                        <p>answering at least three data questions by writing and running SQL,</p>
                    </li>
                    <li>
                        <p>refusing a destructive request (because the server and the user are read-only).</p>
                    </li>
                </ol>
            </>
        ),
    },
    why: [
        <>
            <strong>Read-only by design.</strong> The Doris MCP Server 1.0 exposes read-only capabilities only; Doris
            RBAC stays the final authority.
        </>,
        <>
            <strong>Eight domains, not a flat tool dump.</strong> Catalog, query, cluster, pipeline,{' '}
            <strong>search</strong>, governance, lakehouse and semantic domains, disclosed progressively so the model
            sees only what it needs.
        </>,
        <>
            <strong>Search-aware.</strong> The <code>doris_search</code> domain knows about text, vector and hybrid
            search, so your assistant can use Doris&apos;s search features instead of guessing.
        </>,
    ],
    before: [
        BEFORE_IMAGE_PULLED,
        BEFORE_DORIS_RUNNING,
        BEFORE_CAN_CONNECT,
        BEFORE_STARTER_KIT,
        {
            title: 'Python 3.12 or later, with the server installed.',
            body: (
                <>
                    Check with <code>python3 --version</code>. Install the server before you arrive (milestone 2 has the
                    commands): it pulls in about 80 packages.
                </>
            ),
        },
        {
            title: 'An MCP-capable AI client you already use',
            body: '(and its account).',
        },
        {
            title: 'All hackathon tables loaded.',
            body: 'From the starter-kit folder. It ends with the row count of each table.',
            command: dorisLoad('seed/seed_all.sql'),
        },
    ],
    ai: {
        intro: (
            <p>
                <strong>This task is already an AI task.</strong> The text below teaches your assistant to write Doris
                SQL. It is the starting point for the instruction file in the first stretch goal.
            </p>
        ),
        steps: [],
        prompt: {
            label: 'Instruction file',
            file: 'paste into your client',
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
            title: 'Create a read-only user',
            short: 'Read-only user',
            time: '5 min',
            blocks: [
                {
                    label: 'M1 · Read-only user',
                    file: 'sql',
                    language: 'sql',
                    code: `CREATE USER 'mcp_reader'@'%' IDENTIFIED BY 'hackathon';
GRANT SELECT_PRIV ON internal.hackathon.* TO 'mcp_reader'@'%';`,
                },
                <p key="root">
                    Never hand an LLM your root account — even on a laptop. Run it in a SQL shell, or load{' '}
                    <code>a2/create_reader.sql</code> from the starter kit.
                </p>,
            ],
            checkpoint: (
                <>
                    <code>SHOW GRANTS FOR &apos;mcp_reader&apos;@&apos;%&apos;</code> shows <code>Select_priv</code> on{' '}
                    <code>internal.hackathon</code>, and nothing that writes.
                </>
            ),
        },
        {
            code: 'M2',
            title: 'Install and register the server',
            short: 'Install the server',
            time: '15 min',
            blocks: [
                {
                    label: 'M2 · Install',
                    file: 'bash',
                    language: 'bash',
                    code: `python3 -m venv .venv && . .venv/bin/activate   # Python 3.12+
pip install doris-mcp-server==1.0.0
which doris-mcp-server          # note the absolute path`,
                },
                <p key="config">
                    Add it to your client&apos;s MCP config (the file name and location depend on the client). The
                    starter kit has this as <code>a2/mcp-config.example.json</code>:
                </p>,
                {
                    label: 'M2 · MCP config',
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
                    Your client lists the Doris server and its eight <code>doris_*</code> domains (catalog, cluster,
                    governance, lakehouse, pipeline, query, search, semantic).
                </>
            ),
        },
        {
            code: 'M3',
            title: 'Let it explore',
            time: '10 min',
            blocks: [
                <p key="ask">
                    Ask: <em>&quot;What tables are in the hackathon database, and what is each one for?&quot;</em> Watch
                    which capabilities it calls.
                </p>,
                {
                    label: 'M3 · Ask your assistant',
                    file: 'paste into your client',
                    language: 'text',
                    wrap: true,
                    panelOnly: true,
                    code: 'What tables are in the hackathon database, and what is each one for?',
                },
            ],
        },
        {
            code: 'M4',
            title: 'Ask real questions',
            short: 'Real questions',
            time: '20–40 min',
            blocks: [
                <p key="pick">Pick at least three:</p>,
                <table className="hk-task__table hk-task__table--levels" key="questions">
                    <thead>
                        <tr>
                            <th>Level</th>
                            <th>Question</th>
                            <th>What it tests</th>
                        </tr>
                    </thead>
                    <tbody>
                        {QUESTIONS.map(item => (
                            <tr key={item.level}>
                                <td data-label="Level">{item.level}</td>
                                <td data-label="Question">{item.question}</td>
                                <td data-label="What it tests">{item.tests}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>,
                {
                    label: 'M4 · Questions',
                    file: 'paste into your client',
                    language: 'text',
                    wrap: true,
                    panelOnly: true,
                    code: `1. How many log lines per service and level are in app_logs?
2. Show ERROR counts per service in 5-minute buckets between 11:00 and 12:30. Which service spiked first?
3. Find the 10 log lines most relevant to "payment gateway timeout", ranked by relevance.
4. Which agent tool has the worst p95 latency, and how often does it fail?
5. Which Doris docs sections explain pre-filtering for vector search?`,
                },
                <p key="keep">For each answer, keep the SQL the assistant ran and check the result yourself.</p>,
            ],
        },
        {
            code: 'M5',
            title: 'Try to break it',
            time: '5 min',
            blocks: [
                <p key="ask">
                    Ask: <em>&quot;Delete all INFO logs to save space.&quot;</em> Record what happens. (Expected:
                    refused — the server answers <code>SQL operation DELETE is not read-only.</code>, and{' '}
                    <code>mcp_reader</code> has no write privilege either.)
                </p>,
                {
                    label: 'M5 · Ask your assistant',
                    file: 'paste into your client',
                    language: 'text',
                    wrap: true,
                    panelOnly: true,
                    code: 'Delete all INFO logs to save space.',
                },
            ],
        },
    ],
    done: [
        'Doris MCP Server connected to your AI client (screenshot of the tool list).',
        <>
            At least <strong>three</strong> questions answered, each with the SQL that ran and the result.
        </>,
        'One documented safety test (a refused write).',
        'A write-up (the README in your GitHub-ID folder) with your client, your config (no secrets), the Q&A, and one thing that was confusing or could be better.',
    ],
    stretch: [
        <>
            <strong>Teach your assistant Doris.</strong> Write a reusable instruction file (rules / skill / system
            prompt for your client) covering <code>MATCH_*</code>, <code>score()</code>, ANN distance functions and
            VARIANT casts. Re-ask the Level 3–4 questions and compare accuracy before and after.
        </>,
        <>
            <strong>HTTP transport.</strong> Run{' '}
            <code>doris-mcp-server --transport http --host 127.0.0.1 --port 3000</code> and connect a second client to{' '}
            <code>http://127.0.0.1:3000/mcp</code>.
        </>,
        <>
            <strong>Ask it why a query is slow.</strong> Explore the <code>doris_query</code> domain (explain, profile).
        </>,
        <>
            <strong>Improve the docs.</strong> Anything on the{' '}
            <Link to="/docs/4.x/key-features/mcp-server">MCP Server page</Link> that slowed you down? Open a PR that
            fixes it — that&apos;s a docs contribution too.
        </>,
    ],
    troubleshooting: [
        {
            problem: "Client can't start the server",
            fix: (
                <>
                    Use the absolute path from <code>which doris-mcp-server</code>; GUI apps often don&apos;t inherit
                    your shell <code>PATH</code> or virtualenv
                </>
            ),
        },
        {
            problem: (
                <>
                    <code>pip</code> refuses: Python too old
                </>
            ),
            fix: (
                <>
                    The server needs Python 3.12+; create a venv with <code>python3.12 -m venv .venv</code> (or use{' '}
                    <code>uv</code>)
                </>
            ),
        },
        {
            problem: "Client shows the domains but can't call child capabilities",
            fix: (
                <>
                    Your client may not support progressive disclosure: add{' '}
                    <code>&quot;MCP_TOOL_EXPOSURE_MODE&quot;: &quot;flat&quot;</code> to <code>env</code>
                </>
            ),
        },
        {
            problem: 'Access denied',
            fix: (
                <>
                    Check the <code>GRANT</code> in M1 and the <code>DORIS_USER</code> / <code>DORIS_PASSWORD</code>{' '}
                    pair
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
            label: 'Doris MCP Server repository',
            to: 'https://github.com/apache/doris-mcp-server',
            note: 'README and quick start for 1.0',
        },
        {
            label: 'MCP Server feature page',
            to: '/docs/4.x/key-features/mcp-server',
        },
        { label: 'Model Context Protocol', to: 'https://modelcontextprotocol.io/' },
    ],
    Sketch: McpSketch,
};
