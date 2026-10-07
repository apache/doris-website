import React from 'react';
import Link from '@docusaurus/Link';
import { HackathonChecklistItem, HackathonRow, HackathonStarterKit } from './HackathonTaskPage';
import { getHackathonTask, hackathonTaskPath } from './hackathonEvent';

// Blocks shared by the four Track A pages (the "common" sections of the task
// outline). Each page picks the traps that match its own SQL.

export const BEFORE_DORIS_RUNNING: HackathonChecklistItem = {
    title: 'Doris is running.',
    body: (
        <>
            (Docker must be running.) <Link to="/docs/4.x/getting-started/quick-start">Full quick start</Link>
        </>
    ),
    command: 'curl -fsSL https://doris.apache.org/files/start-doris.sh | bash -s -- -v 4.1.4.1',
};

export const BEFORE_CAN_CONNECT: HackathonChecklistItem = {
    title: 'You can connect.',
    body: 'Any MySQL-compatible client works; there is no password.',
    command: 'mysql -h127.0.0.1 -P9030 -uroot',
};

export const BEFORE_STARTER_KIT: HackathonChecklistItem = {
    title: 'You have the starter kit.',
    body: (
        <>
            <code>git clone</code> <HackathonStarterKit /> and load this task&apos;s seed file.
        </>
    ),
};

export const BEFORE_TOOLS_READY: HackathonChecklistItem = {
    title: 'Your tools are ready.',
    body: (
        <>
            Any language with a MySQL driver (Python <code>pymysql</code>, Node <code>mysql2</code>, Go{' '}
            <code>go-sql-driver/mysql</code>, Java JDBC …). AI coding assistants are welcome.
        </>
    ),
};

export const COMMON_BEFORE: HackathonChecklistItem[] = [
    BEFORE_DORIS_RUNNING,
    BEFORE_CAN_CONNECT,
    BEFORE_STARTER_KIT,
    BEFORE_TOOLS_READY,
];

export const AI_INTRO = (
    <p>
        <strong>Pair with your AI coding agent — that&apos;s encouraged.</strong> Doris 4.x search and AI features are
        newer than what most models were trained on, so give your agent the right context before it writes SQL:
    </p>
);

export const AI_STEPS = [
    <>
        Paste the <strong>context prompt</strong> below into your agent.
    </>,
    <>
        Point it at <a href="https://doris.apache.org/llms.txt">https://doris.apache.org/llms.txt</a> and the{' '}
        <a href="#references">reference pages listed on this page</a>.
    </>,
    <>Make it run every SQL statement against your live cluster before wiring it into code.</>,
    <>
        Better still: connect the <strong>Doris MCP Server</strong> (see{' '}
        <Link to={hackathonTaskPath(getHackathonTask('A2'))}>Task A2</Link>) so your agent can inspect the schema and
        test queries itself.
    </>,
];

export const TRAPS = {
    like: {
        problem: (
            <>
                Using <code>LIKE &apos;%term%&apos;</code> for text search
            </>
        ),
        fix: (
            <>
                <code>col MATCH_ANY &apos;a b&apos;</code> (OR), <code>MATCH_ALL</code> (AND),{' '}
                <code>MATCH_PHRASE &apos;a b&apos;</code> — they use the inverted index
            </>
        ),
    },
    scoreAnywhere: {
        problem: (
            <>
                Calling <code>score()</code> in an arbitrary query
            </>
        ),
        fix: (
            <>
                <code>score()</code> needs a <code>MATCH_*</code> predicate in <code>WHERE</code> <strong>and</strong>{' '}
                <code>ORDER BY score() DESC LIMIT n</code>; otherwise Doris rejects the query
            </>
        ),
    },
    scoreAggregate: {
        problem: (
            <>
                <code>score()</code> inside <code>GROUP BY</code> / aggregates
            </>
        ),
        fix: (
            <>
                Not allowed. For facet counts, reuse the same <code>WHERE</code> without <code>score()</code>
            </>
        ),
    },
    bm25AndDistance: {
        problem: (
            <>
                Sorting by BM25 and vector distance in one <code>ORDER BY</code>
            </>
        ),
        fix: (
            <>
                Not supported. Use a <code>MATCH_*</code> pre-filter + vector <code>ORDER BY</code>, or fuse two ranked
                lists (RRF)
            </>
        ),
    },
    cosine: {
        problem: 'Looking for a cosine ANN metric',
        fix: (
            <>
                ANN metrics are <code>l2_distance</code> and <code>inner_product</code>. Normalize vectors to unit
                length; then L2 order equals cosine order
            </>
        ),
    },
    variantCast: {
        problem: 'Comparing VARIANT paths without a cast',
        fix: (
            <>
                <code>CAST(payload[&apos;latency_ms&apos;] AS INT)</code>; VARIANT can&apos;t be a key or join column
            </>
        ),
    },
    replicas: {
        problem: 'Creating tables without a replica setting',
        fix: (
            <>
                The quick-start cluster has one BE: add{' '}
                <code>PROPERTIES (&quot;replication_num&quot; = &quot;1&quot;)</code>
            </>
        ),
    },
    orm: {
        problem: 'Using an ORM',
        fix: "Prefer a plain MySQL driver and raw SQL; ORMs may emit statements Doris doesn't support",
    },
} satisfies Record<string, HackathonRow>;

export const TROUBLE = {
    docker: {
        problem: (
            <>
                <code>Docker environment not detected</code> on macOS
            </>
        ),
        fix: (
            <>
                Start Docker Desktop. If it is running, link the CLI:{' '}
                <code>sudo ln -s /Applications/Docker.app/Contents/Resources/bin/docker /usr/local/bin/docker</code>
            </>
        ),
    },
    credentials: {
        problem: (
            <>
                <code>error getting credentials</code> when pulling images
            </>
        ),
        fix: (
            <>
                Remove the <code>credsStore</code> field from <code>~/.docker/config.json</code> (local dev only)
            </>
        ),
    },
    backends: {
        problem: (
            <>
                <code>CREATE TABLE</code> fails: not enough backends
            </>
        ),
        fix: (
            <>
                Add <code>PROPERTIES (&quot;replication_num&quot; = &quot;1&quot;)</code>
            </>
        ),
    },
    score: {
        problem: <code>score() function requires WHERE clause with MATCH function, ORDER BY and LIMIT</code>,
        fix: (
            <>
                Add a <code>MATCH_*</code> predicate, <code>ORDER BY score() DESC</code> and a <code>LIMIT</code>
            </>
        ),
    },
    stuck: {
        problem: 'Stuck for more than 10 minutes',
        fix: 'Come to the Doris table and ask Mingyu',
    },
} satisfies Record<string, HackathonRow>;

export const COMMON_TROUBLESHOOTING: HackathonRow[] = [
    TROUBLE.docker,
    TROUBLE.credentials,
    TROUBLE.backends,
    TROUBLE.score,
    TROUBLE.stuck,
];
