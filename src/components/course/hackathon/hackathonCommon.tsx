import React from 'react';
import Link from '@docusaurus/Link';
import { HackathonChecklistItem, HackathonRow, HackathonStarterKit } from './HackathonTaskPage';
import {
    DORIS_PULL,
    DORIS_RUN,
    DORIS_SQL,
    HACKATHON_DORIS_DOWNLOAD,
    HACKATHON_EVENT,
    HACKATHON_SLACK_URL,
    getHackathonTask,
    hackathonTaskPath,
} from './hackathonEvent';

// Blocks shared by the four Track A pages (the "common" sections of the task
// outline). Each page picks the traps that match its own SQL.

export const BEFORE_IMAGE_PULLED: HackathonChecklistItem = {
    title: 'Docker is running and the Doris image is pulled.',
    body: (
        <>
            About {HACKATHON_DORIS_DOWNLOAD}, once. Pull it before you arrive: the venue Wi-Fi is shared. Docker Desktop
            (macOS, Windows) and Docker Engine (Linux) both work.
        </>
    ),
    command: DORIS_PULL,
};

export const BEFORE_DORIS_RUNNING: HackathonChecklistItem = {
    title: 'Doris is running.',
    body: (
        <>
            One container runs one FE and one BE. It is ready when <code>docker ps</code> shows <code>(healthy)</code>,
            about 30 seconds after it starts.{' '}
            <Link to="/community/developer-guide/all-in-one-image">About this image</Link>
        </>
    ),
    command: DORIS_RUN,
};

export const BEFORE_CAN_CONNECT: HackathonChecklistItem = {
    title: 'You can connect.',
    body: (
        <>
            The container ships a MySQL client, so you don&apos;t need one. Any MySQL client works too:{' '}
            <code>127.0.0.1:9030</code>, user <code>root</code>, no password.
        </>
    ),
    command: DORIS_SQL,
};

const KIT = HACKATHON_EVENT.starterKitFolder;

export const BEFORE_STARTER_KIT: HackathonChecklistItem = {
    title: 'You have the starter kit.',
    body: (
        <>
            Download and unzip <HackathonStarterKit />, then run the commands on this page from inside its{' '}
            <code>{KIT}</code> folder. Its <code>doris.sh</code> (macOS, Linux) and <code>doris.ps1</code> (Windows)
            wrap them: <code>start</code>, <code>load</code>, <code>sql</code>, <code>stop</code>.
        </>
    ),
    command: HACKATHON_EVENT.starterKitUrl
        ? `curl -LO ${HACKATHON_EVENT.starterKitUrl} && unzip ${KIT}.zip && cd ${KIT}`
        : undefined,
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
    BEFORE_IMAGE_PULLED,
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
        Point it at the <a href="#references">reference pages listed on this page</a> and at <code>AGENTS.md</code> in
        the starter kit. Many coding agents read that file on their own.
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
    scoreWrapped: {
        problem: (
            <>
                Rounding, joining or ranking <code>score()</code> in the same query
            </>
        ),
        fix: (
            <>
                Keep <code>score() AS relevance</code> plain in a single-table query. Round it, join it or{' '}
                <code>ROW_NUMBER()</code> it in an outer query, and use a subquery, not a <code>WITH</code> CTE
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
                Sorting by BM25 and vector distance in one <code>ORDER BY</code>, or selecting <code>score()</code> in a
                vector-ranked query
            </>
        ),
        fix: (
            <>
                Not supported. Hybrid = a <code>MATCH_*</code> pre-filter + vector <code>ORDER BY</code>, showing the
                distance; or fuse two ranked lists (RRF)
            </>
        ),
    },
    vectorParam: {
        problem: 'Passing the query vector as a driver parameter',
        fix: (
            <>
                A list becomes <code>(…)</code> in pymysql and 8 separate arguments in mysql2. Pass the string{' '}
                <code>&apos;[0.1, …]&apos;</code> and write <code>CAST(%s AS ARRAY&lt;FLOAT&gt;)</code>, or inline the
                literal
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
    variantDesc: {
        problem: (
            <>
                Expecting <code>DESC</code> to list the JSON paths
            </>
        ),
        fix: (
            <>
                Run <code>SET describe_extend_variant_column = true;</code> first; then <code>DESC</code> shows every
                inferred subcolumn and its type
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
                <code>docker: command not found</code> on macOS
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
    port: {
        problem: (
            <>
                <code>port is already allocated</code>
            </>
        ),
        fix: (
            <>
                Something else uses 9030, 8030 or 8040, often another Doris. Stop it (<code>docker ps</code>), or
                publish other host ports, e.g. <code>-p 19030:9030</code>, and connect to 19030
            </>
        ),
    },
    nameInUse: {
        problem: (
            <>
                <code>The container name &quot;/doris&quot; is already in use</code>
            </>
        ),
        fix: (
            <>
                You started it before: <code>docker start doris</code>. To start over, <code>docker rm -f doris</code>{' '}
                (this deletes its data)
            </>
        ),
    },
    unhealthy: {
        problem: (
            <>
                The container exits, or never turns <code>(healthy)</code>
            </>
        ),
        fix: (
            <>
                Read <code>docker logs doris</code>. Usually it is memory: give Docker Desktop 6 GB or more (Settings →
                Resources). On Apple Silicon, don&apos;t add <code>--platform linux/amd64</code>
            </>
        ),
    },
    noDatabase: {
        problem: (
            <>
                <code>Current database is not set</code>
            </>
        ),
        fix: (
            <>
                Run <code>USE hackathon;</code> first, or connect with <code>-Dhackathon</code>
            </>
        ),
    },
    score: {
        problem: <code>score() function requires WHERE clause with MATCH function, ORDER BY and LIMIT</code>,
        fix: (
            <>
                Add a <code>MATCH_*</code> predicate, <code>ORDER BY score() DESC</code> and a <code>LIMIT</code>, and
                keep <code>score()</code> unwrapped (see the traps above)
            </>
        ),
    },
    permission: {
        problem: (
            <>
                <code>permission denied: ./doris.sh</code>
            </>
        ),
        fix: (
            <>
                Your unzip tool dropped the executable bit: <code>chmod +x doris.sh</code>, or run{' '}
                <code>bash doris.sh start</code>
            </>
        ),
    },
    stuck: {
        problem: 'Stuck for more than 10 minutes',
        fix: (
            <>
                Come to the Doris table and ask Mingyu, or post in <code>{HACKATHON_EVENT.slackChannel}</code> on the{' '}
                <a href={HACKATHON_SLACK_URL}>Apache Doris Slack</a>
            </>
        ),
    },
} satisfies Record<string, HackathonRow>;

export const COMMON_TROUBLESHOOTING: HackathonRow[] = [
    TROUBLE.docker,
    TROUBLE.credentials,
    TROUBLE.port,
    TROUBLE.nameInUse,
    TROUBLE.unhealthy,
    TROUBLE.permission,
    TROUBLE.noDatabase,
    TROUBLE.score,
    TROUBLE.stuck,
];
