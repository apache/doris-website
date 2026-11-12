import {translate} from '@docusaurus/Translate';
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
    title: translate({id: "landing.hackathonCommon.001", message: "Docker is running and the Doris image is pulled."}),
    body: (
        <>
            {translate({id: "landing.hackathonCommon.002", message: "About"})} {HACKATHON_DORIS_DOWNLOAD}{translate({id: "landing.hackathonCommon.003", message: ", once. Pull it ahead of time: it is a large download. Docker Desktop (macOS) and Docker Engine (Linux) both work."})}
        </>
    ),
    command: DORIS_PULL,
};

export const BEFORE_DORIS_RUNNING: HackathonChecklistItem = {
    title: translate({id: "landing.hackathonCommon.004", message: "Doris is running."}),
    body: (
        <>
            {translate({id: "landing.hackathonCommon.005", message: "One container runs one FE and one BE. It is ready when"})} <code>docker ps</code> {translate({id: "landing.hackathonCommon.006", message: "shows"})} <code>(healthy)</code>{translate({id: "landing.hackathonCommon.007", message: ", about 30 seconds after it starts."})}{' '}
            <Link to="/community/developer-guide/all-in-one-image">{translate({id: "landing.hackathonCommon.008", message: "About this image"})}</Link>
        </>
    ),
    command: DORIS_RUN,
};

export const BEFORE_CAN_CONNECT: HackathonChecklistItem = {
    title: translate({id: "landing.hackathonCommon.009", message: "You can connect."}),
    body: (
        <>
            {translate({id: "landing.hackathonCommon.010", message: "The container ships a MySQL client, so you don't need one. Any MySQL client works too:"})}{' '}
            <code>127.0.0.1:9030</code>{translate({id: "landing.hackathonCommon.011", message: ", user"})} <code>root</code>{translate({id: "landing.hackathonCommon.012", message: ", no password."})}
        </>
    ),
    command: DORIS_SQL,
};

const KIT = HACKATHON_EVENT.starterKitFolder;

export const BEFORE_STARTER_KIT: HackathonChecklistItem = {
    title: translate({id: "landing.hackathonCommon.013", message: "You have the starter kit."}),
    body: (
        <>
            {translate({id: "landing.hackathonCommon.014", message: "Download and unzip"})} <HackathonStarterKit />{translate({id: "landing.hackathonCommon.015", message: ", then run the commands on this page from inside its"})}{' '}
            <code>{KIT}</code> {translate({id: "landing.hackathonCommon.016", message: "folder. Its"})} <code>doris.sh</code> {translate({id: "landing.hackathonCommon.017", message: "wraps them:"})} <code>start</code>, <code>load</code>,{' '}
            <code>sql</code>, <code>stop</code>.
        </>
    ),
    command: HACKATHON_EVENT.starterKitUrl
        ? `curl -LO ${HACKATHON_EVENT.starterKitUrl} && unzip ${KIT}.zip && cd ${KIT}`
        : undefined,
};

export const BEFORE_TOOLS_READY: HackathonChecklistItem = {
    title: translate({id: "landing.hackathonCommon.018", message: "Your tools are ready."}),
    body: (
        <>
            {translate({id: "landing.hackathonCommon.019", message: "Any language with a MySQL driver (Python"})} <code>pymysql</code>{translate({id: "landing.hackathonCommon.020", message: ", Node"})} <code>mysql2</code>{translate({id: "landing.hackathonCommon.021", message: ", Go"})}{' '}
            <code>go-sql-driver/mysql</code>{translate({id: "landing.hackathonCommon.022", message: ", Java JDBC …). AI coding assistants are welcome."})}
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
        <strong>{translate({id: "landing.hackathonCommon.023", message: "Pair with your AI coding agent — that's encouraged."})}</strong> {translate({id: "landing.hackathonCommon.024", message: "Doris 4.x search and AI features are newer than what most models were trained on, so give your agent the right context before it writes SQL:"})}
    </p>
);

export const AI_STEPS = [
    <>
        {translate({id: "landing.hackathonCommon.025", message: "Paste the"})} <strong>{translate({id: "landing.hackathonCommon.026", message: "context prompt"})}</strong> {translate({id: "landing.hackathonCommon.027", message: "below into your agent."})}
    </>,
    <>
        {translate({id: "landing.hackathonCommon.028", message: "Point it at the"})} <a href="#references">{translate({id: "landing.hackathonCommon.029", message: "reference pages listed on this page"})}</a> {translate({id: "landing.hackathonCommon.030", message: "and at"})} <code>AGENTS.md</code> {translate({id: "landing.hackathonCommon.031", message: "in the starter kit. Many coding agents read that file on their own."})}
    </>,
    <>{translate({id: "landing.hackathonCommon.032", message: "Make it run every SQL statement against your live cluster before wiring it into code."})}</>,
    <>
        {translate({id: "landing.hackathonCommon.033", message: "Better still: connect the"})} <strong>{translate({id: "landing.hackathonCommon.034", message: "Doris MCP Server"})}</strong> {translate({id: "landing.hackathonCommon.035", message: "(see"})}{' '}
        <Link to={hackathonTaskPath(getHackathonTask('A2'))}>{translate({id: "landing.hackathonCommon.036", message: "Task A2"})}</Link>{translate({id: "landing.hackathonCommon.037", message: ") so your agent can inspect the schema and test queries itself."})}
    </>,
];

export const TRAPS = {
    like: {
        problem: (
            <>
                {translate({id: "landing.hackathonCommon.038", message: "Using"})} <code>LIKE &apos;%term%&apos;</code> {translate({id: "landing.hackathonCommon.039", message: "for text search"})}
            </>
        ),
        fix: (
            <>
                <code>col MATCH_ANY &apos;a b&apos;</code> {translate({id: "landing.hackathonCommon.040", message: "(OR),"})} <code>MATCH_ALL</code> {translate({id: "landing.hackathonCommon.041", message: "(AND),"})}{' '}
                <code>MATCH_PHRASE &apos;a b&apos;</code> {translate({id: "landing.hackathonCommon.042", message: "— they use the inverted index"})}
            </>
        ),
    },
    scoreAnywhere: {
        problem: (
            <>
                {translate({id: "landing.hackathonCommon.043", message: "Calling"})} <code>score()</code> {translate({id: "landing.hackathonCommon.044", message: "in an arbitrary query"})}
            </>
        ),
        fix: (
            <>
                <code>score()</code> {translate({id: "landing.hackathonCommon.045", message: "needs a"})} <code>MATCH_*</code> {translate({id: "landing.hackathonCommon.046", message: "predicate in"})} <code>WHERE</code> <strong>{translate({id: "landing.hackathonCommon.047", message: "and"})}</strong>{' '}
                <code>ORDER BY score() DESC LIMIT n</code>{translate({id: "landing.hackathonCommon.048", message: "; otherwise Doris rejects the query"})}
            </>
        ),
    },
    scoreWrapped: {
        problem: (
            <>
                {translate({id: "landing.hackathonCommon.049", message: "Rounding, joining or ranking"})} <code>score()</code> {translate({id: "landing.hackathonCommon.050", message: "in the same query"})}
            </>
        ),
        fix: (
            <>
                {translate({id: "landing.hackathonCommon.051", message: "Keep"})} <code>score() AS relevance</code> {translate({id: "landing.hackathonCommon.052", message: "plain in a single-table query. Round it, join it or"})}{' '}
                <code>ROW_NUMBER()</code> {translate({id: "landing.hackathonCommon.053", message: "it in an outer query, and use a subquery, not a"})} <code>WITH</code> {translate({id: "landing.hackathonCommon.054", message: "CTE"})}
            </>
        ),
    },
    scoreAggregate: {
        problem: (
            <>
                <code>score()</code> {translate({id: "landing.hackathonCommon.055", message: "inside"})} <code>GROUP BY</code> {translate({id: "landing.hackathonCommon.056", message: "/ aggregates"})}
            </>
        ),
        fix: (
            <>
                {translate({id: "landing.hackathonCommon.057", message: "Not allowed. For facet counts, reuse the same"})} <code>WHERE</code> {translate({id: "landing.hackathonCommon.058", message: "without"})} <code>score()</code>
            </>
        ),
    },
    bm25AndDistance: {
        problem: (
            <>
                {translate({id: "landing.hackathonCommon.059", message: "Sorting by BM25 and vector distance in one"})} <code>ORDER BY</code>{translate({id: "landing.hackathonCommon.060", message: ", or selecting"})} <code>score()</code> {translate({id: "landing.hackathonCommon.061", message: "in a vector-ranked query"})}
            </>
        ),
        fix: (
            <>
                {translate({id: "landing.hackathonCommon.062", message: "Not supported. Hybrid = a"})} <code>MATCH_*</code> {translate({id: "landing.hackathonCommon.063", message: "pre-filter + vector"})} <code>ORDER BY</code>{translate({id: "landing.hackathonCommon.064", message: ", showing the distance; or fuse two ranked lists (RRF)"})}
            </>
        ),
    },
    vectorParam: {
        problem: translate({id: "landing.hackathonCommon.065", message: "Passing the query vector as a driver parameter"}),
        fix: (
            <>
                {translate({id: "landing.hackathonCommon.066", message: "A list becomes"})} <code>(…)</code> {translate({id: "landing.hackathonCommon.067", message: "in pymysql and 8 separate arguments in mysql2. Pass the string"})}{' '}
                <code>&apos;[0.1, …]&apos;</code> {translate({id: "landing.hackathonCommon.068", message: "and write"})} <code>CAST(%s AS ARRAY&lt;FLOAT&gt;)</code>{translate({id: "landing.hackathonCommon.069", message: ", or inline the literal"})}
            </>
        ),
    },
    cosine: {
        problem: translate({id: "landing.hackathonCommon.070", message: "Looking for a cosine ANN metric"}),
        fix: (
            <>
                {translate({id: "landing.hackathonCommon.071", message: "ANN metrics are"})} <code>l2_distance</code> {translate({id: "landing.hackathonCommon.072", message: "and"})} <code>inner_product</code>{translate({id: "landing.hackathonCommon.073", message: ". Normalize vectors to unit length; ascending L2 distance has the same ranking as descending cosine similarity"})}
            </>
        ),
    },
    variantCast: {
        problem: translate({id: "landing.hackathonCommon.074", message: "Comparing VARIANT paths without a cast"}),
        fix: (
            <>
                <code>CAST(payload[&apos;latency_ms&apos;] AS INT)</code>{translate({id: "landing.hackathonCommon.075", message: "; VARIANT can't be a key or join column"})}
            </>
        ),
    },
    variantDesc: {
        problem: (
            <>
                {translate({id: "landing.hackathonCommon.076", message: "Expecting"})} <code>DESC</code> {translate({id: "landing.hackathonCommon.077", message: "to list the JSON paths"})}
            </>
        ),
        fix: (
            <>
                {translate({id: "landing.hackathonCommon.078", message: "Run"})} <code>SET describe_extend_variant_column = true;</code> {translate({id: "landing.hackathonCommon.079", message: "first; then"})} <code>DESC</code> {translate({id: "landing.hackathonCommon.080", message: "shows every inferred subcolumn and its type"})}
            </>
        ),
    },
    orm: {
        problem: translate({id: "landing.hackathonCommon.081", message: "Using an ORM"}),
        fix: translate({id: "landing.hackathonCommon.082", message: "Prefer a plain MySQL driver and raw SQL; ORMs may emit statements Doris doesn't support"}),
    },
} satisfies Record<string, HackathonRow>;

export const TROUBLE = {
    docker: {
        problem: (
            <>
                <code>docker: command not found</code> {translate({id: "landing.hackathonCommon.083", message: "on macOS"})}
            </>
        ),
        fix: (
            <>
                {translate({id: "landing.hackathonCommon.084", message: "Start Docker Desktop. If it is running, link the CLI:"})}{' '}
                <code>sudo ln -s /Applications/Docker.app/Contents/Resources/bin/docker /usr/local/bin/docker</code>
            </>
        ),
    },
    credentials: {
        problem: (
            <>
                <code>error getting credentials</code> {translate({id: "landing.hackathonCommon.085", message: "when pulling images"})}
            </>
        ),
        fix: (
            <>
                {translate({id: "landing.hackathonCommon.086", message: "Remove the"})} <code>credsStore</code> {translate({id: "landing.hackathonCommon.087", message: "field from"})} <code>~/.docker/config.json</code> {translate({id: "landing.hackathonCommon.088", message: "(local dev only)"})}
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
                {translate({id: "landing.hackathonCommon.089", message: "Something else uses 9030, 8030 or 8040, often another Doris. Inspect running containers ("})}<code>docker ps</code>{translate({id: "landing.hackathonCommon.090", message: "), or publish other host ports, e.g."})} <code>-p 19030:9030</code>{translate({id: "landing.hackathonCommon.091", message: ", and connect to 19030"})}
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
                {translate({id: "landing.hackathonCommon.092", message: "You started it before:"})} <code>docker start doris</code>{translate({id: "landing.hackathonCommon.093", message: ". To start over,"})} <code>docker rm -f doris</code>{' '}
                {translate({id: "landing.hackathonCommon.094", message: "(this deletes its data)"})}
            </>
        ),
    },
    unhealthy: {
        problem: (
            <>
                {translate({id: "landing.hackathonCommon.095", message: "The container exits, or never turns"})} <code>(healthy)</code>
            </>
        ),
        fix: (
            <>
                {translate({id: "landing.hackathonCommon.096", message: "Read"})} <code>docker logs doris</code>{translate({id: "landing.hackathonCommon.097", message: ". Usually it is memory: give Docker Desktop 6 GB or more (Settings → Resources). On Apple Silicon, don't add"})} <code>--platform linux/amd64</code>
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
                {translate({id: "landing.hackathonCommon.098", message: "Run"})} <code>USE hackathon;</code> {translate({id: "landing.hackathonCommon.099", message: "first, or connect with"})} <code>-Dhackathon</code>
            </>
        ),
    },
    score: {
        problem: <code>score() function requires WHERE clause with MATCH function, ORDER BY and LIMIT</code>,
        fix: (
            <>
                {translate({id: "landing.hackathonCommon.100", message: "Add a"})} <code>MATCH_*</code> {translate({id: "landing.hackathonCommon.101", message: "predicate,"})} <code>ORDER BY score() DESC</code> {translate({id: "landing.hackathonCommon.102", message: "and a"})} <code>LIMIT</code>{translate({id: "landing.hackathonCommon.103", message: ", and keep"})} <code>score()</code> {translate({id: "landing.hackathonCommon.104", message: "unwrapped (see the traps above)"})}
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
                {translate({id: "landing.hackathonCommon.105", message: "Your unzip tool dropped the executable bit:"})} <code>chmod +x doris.sh</code>{translate({id: "landing.hackathonCommon.106", message: ", or run"})}{' '}
                <code>bash doris.sh start</code>
            </>
        ),
    },
    stuck: {
        problem: translate({id: "landing.hackathonCommon.107", message: "Stuck for more than 10 minutes"}),
        fix: (
            <>
                {translate({id: "landing.hackathonCommon.108", message: "Post in"})} <code>{HACKATHON_EVENT.slackChannel}</code> {translate({id: "landing.hackathonCommon.109", message: "on the"})}{' '}
                <a href={HACKATHON_SLACK_URL}>{translate({id: "landing.hackathonCommon.110", message: "Apache Doris Slack"})}</a>
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
