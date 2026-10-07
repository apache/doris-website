import React from 'react';
import Link from '@docusaurus/Link';
import { HackathonTaskContent, HackathonTermList } from '../HackathonTaskPage';
import { HybridSearchSketch } from '../HackathonSketch';
import { AI_INTRO, AI_STEPS, COMMON_BEFORE, COMMON_TROUBLESHOOTING, TRAPS } from '../hackathonCommon';
import { dorisLoad, getHackathonTask } from '../hackathonEvent';

// Vectors printed by `python a1/toy_embed.py "<question>"` from the starter kit.
const VEC_SCHEMA = '[0.005740, 0.005740, 0.999885, 0.005740, 0.005740, 0.005740, 0.005740, 0.005740]';
const VEC_KAFKA = '[0.007020, 0.007020, 0.007020, 0.007020, 0.999827, 0.007020, 0.007020, 0.007020]';

export const A1_HYBRID_SEARCH: HackathonTaskContent = {
    task: getHackathonTask('A1'),
    titleLead: 'Hybrid Search',
    titleTail: 'App',
    hook: 'Keywords, meaning and filters — in one SQL query. Build a search box over the Apache Doris docs.',
    chips: ['60–120 min', 'Beginner-friendly', 'Any language · CLI or web', 'AI tools welcome'],
    build: {
        lead: 'Build a search box that understands both words and meaning.',
        body: (
            <>
                <p>
                    Exact keyword matches ranked by BM25, semantic neighbours from a vector index, and structured
                    filters — served by one Doris table and one SQL statement. No Elasticsearch, no separate vector
                    database.
                </p>
                <p>
                    A small search app (CLI, notebook, or web page — your call) over{' '}
                    <strong>299 sections of the Apache Doris documentation</strong>. A user types a question such as{' '}
                    <em>&quot;how do I store messy JSON?&quot;</em>, picks a category, and switches between three modes:
                </p>
                <HackathonTermList
                    items={[
                        { term: 'Keyword', text: 'BM25-ranked full-text matches.' },
                        { term: 'Vector', text: 'nearest neighbours by embedding similarity.' },
                        {
                            term: 'Hybrid',
                            text: 'keyword pre-filter, then vector ranking (and, as a stretch, Reciprocal Rank Fusion).',
                        },
                    ]}
                />
                <p>
                    Every result shows the page, the section, its score (keyword) or distance (vector, hybrid), and a
                    link to the doc. A &quot;Show SQL&quot; toggle reveals the exact query Doris ran.
                </p>
            </>
        ),
    },
    why: [
        <>
            <strong>One table, two indexes.</strong> An inverted index on the text and an HNSW ANN index on the vectors
            live in the same table. The planner pre-filters with the inverted index, then ranks the survivors with the
            ANN index.
        </>,
        <>
            <strong>Search-engine ranking in SQL.</strong> <code>score()</code> gives you BM25 — the same relevance
            function Lucene uses — inside a normal <code>SELECT</code>.
        </>,
        <>
            <strong>Filters are just SQL.</strong> Category, page, <code>IN</code> lists, ranges — written next to{' '}
            <code>MATCH_ANY</code> in the same <code>WHERE</code> clause.
        </>,
    ],
    whyHighlight: '10-13',
    before: COMMON_BEFORE,
    data: [
        <p key="intro">
            <code>hackathon.doc_chunks</code> — the 47 key-features pages of the Doris 4.x docs, one row per section:
        </p>,
        {
            label: 'Table',
            file: 'hackathon.doc_chunks · sql',
            language: 'sql',
            code: `CREATE TABLE doc_chunks (
  id          INT           NOT NULL,
  page        VARCHAR(64)   NOT NULL,   -- doc slug, e.g. 'hybrid-search'
  page_title  VARCHAR(128)  NOT NULL,
  section     VARCHAR(256)  NOT NULL,
  category    VARCHAR(32)   NOT NULL,   -- see the 7 values below
  url         VARCHAR(256)  NOT NULL,
  body        STRING        NOT NULL,
  embedding   ARRAY<FLOAT>  NOT NULL,   -- 8-dim toy vector, unit length
  INDEX idx_body (body) USING INVERTED PROPERTIES ("parser" = "english", "support_phrase" = "true"),
  INDEX idx_category (category) USING INVERTED,
  INDEX idx_emb (embedding) USING ANN PROPERTIES (
    "index_type" = "hnsw", "metric_type" = "l2_distance", "dim" = "8")
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");`,
        },
        <p key="categories">
            <strong>
                <code>category</code> values
            </strong>{' '}
            (for your filter dropdown): <code>search</code>, <code>ai</code>, <code>lakehouse</code>,{' '}
            <code>ingestion</code>, <code>performance</code>, <code>table-design</code>, <code>operations</code>.
        </p>,
        <p key="vectors">
            <strong>About the vectors.</strong> To keep everything offline, the starter kit ships a tiny{' '}
            <strong>toy embedder</strong>, <code>a1/toy_embed.py</code> and <code>a1/toy_embed.js</code> (same output,
            digit for digit). It maps text onto 8 hand-defined concept dimensions —{' '}
            <em>search, vectors &amp; AI, JSON, lakehouse, ingestion, performance, data model, operations</em> — using
            synonym lists, then normalizes the result to unit length. The same function produced the vectors in the
            table, so your query vectors live in the same space. It is crude on purpose, yet it already shows what
            vector search adds: <em>&quot;store messy nested records whose schema keeps changing&quot;</em> lands on the
            VARIANT pages without saying JSON or VARIANT. The stretch goals swap it for a real model.
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
            code: `I'm building a hybrid search app on Apache Doris 4.1 for a hackathon.

Connection: MySQL protocol, host 127.0.0.1, port 9030, user root, empty password,
database \`hackathon\`. Use a plain MySQL driver and raw SQL (no ORM).

Table \`doc_chunks\` (299 rows): id, page, page_title, section, url,
category (search / ai / lakehouse / ingestion / performance / table-design / operations),
body (STRING, inverted index, english parser, phrase support),
embedding (ARRAY<FLOAT> NOT NULL, 8 dims, unit length, HNSW index, l2_distance).

Doris SQL rules — follow them exactly:
1. Keyword search uses \`body MATCH_ANY 'a b'\` (OR), \`MATCH_ALL\` (AND), \`MATCH_PHRASE\`. Never LIKE.
   The parser keeps stopwords, so pass keywords(text) from toy_embed, not the raw question.
   Bind the user's text as a driver parameter.
2. BM25 relevance is \`score()\`. It only works with a MATCH_* predicate in WHERE and
   \`ORDER BY score() DESC LIMIT n\`, selected plain (\`score() AS relevance\`): no ROUND(),
   no window function, no JOIN in that SELECT. Round, rank or join it in an outer query.
3. Vector search: \`ORDER BY l2_distance_approximate(embedding, <vector>) ASC LIMIT n\`.
   Pass the vector as a string and cast it: CAST(%s AS ARRAY<FLOAT>) with '[f1, ..., f8]'.
   Never pass a list/array as a driver parameter.
4. Hybrid = MATCH_* pre-filter + vector ORDER BY; show the distance, do not select score()
   in that query. For fusion, rank two lists in subqueries and combine with RRF (k = 60);
   a1/rrf.sql in the starter kit shows the pattern.
5. Query vectors come from toy_embed(text) in a1/toy_embed.py (toyEmbed in a1/toy_embed.js).
   Do not invent embeddings.

Build: a CLI (or small web page) with keyword / vector / hybrid modes, a category filter,
and a "show SQL" option. Run every SQL statement against the live cluster first.`,
        },
        traps: [
            TRAPS.like,
            TRAPS.scoreAnywhere,
            TRAPS.scoreWrapped,
            TRAPS.bm25AndDistance,
            TRAPS.vectorParam,
            TRAPS.cosine,
        ],
    },
    milestones: [
        {
            code: 'M0',
            title: 'Load the data',
            time: '5 min',
            blocks: [
                <p key="where">From inside the starter-kit folder:</p>,
                {
                    label: 'M0 · Load the data',
                    file: 'bash',
                    language: 'bash',
                    code: dorisLoad('seed/a1_doc_chunks.sql'),
                },
                <p key="windows">
                    On Windows PowerShell, <code>&lt;</code> doesn&apos;t work: run{' '}
                    <code>.\doris.ps1 load seed\a1_doc_chunks.sql</code> instead.
                </p>,
            ],
            checkpoint: (
                <>
                    The load ends with a count per category: <strong>7 categories, 299 sections</strong> in total.
                </>
            ),
        },
        {
            code: 'M1',
            title: 'Keyword search with BM25',
            short: 'Keyword search',
            time: '15 min',
            blocks: [
                <p key="shell">
                    Open a SQL shell (<code>./doris.sh sql</code>, or the <code>docker exec</code> command above) and
                    run:
                </p>,
                {
                    label: 'M1 · Keyword search with BM25',
                    file: 'sql',
                    language: 'sql',
                    code: `USE hackathon;

SELECT page_title, section, score() AS relevance
FROM doc_chunks
WHERE body MATCH_ANY 'vector index recall'
ORDER BY relevance DESC
LIMIT 10;`,
                },
                <p key="then">
                    Then try <code>MATCH_ALL</code> (every term must appear) and{' '}
                    <code>MATCH_PHRASE &apos;inverted index&apos;</code> (adjacent, in order). Wire it up: input box →
                    SQL → result list. Pass the user&apos;s text as a driver parameter (<code>MATCH_ANY %s</code>),
                    never by pasting it into the SQL: the first apostrophe breaks the query. <code>a1/starter.py</code>{' '}
                    and <code>a1/starter.js</code> do exactly this.
                </p>,
                <p key="stopwords">
                    Typed a whole question? The english parser keeps stopwords, so <code>&apos;how do I …&apos;</code>{' '}
                    matches a third of the table. Pass <code>keywords(text)</code> from the toy embedder instead: it
                    drops stopwords, plus <em>apache</em> and <em>doris</em>, which nearly every section mentions.
                </p>,
            ],
            checkpoint: (
                <>
                    The top hits for <code>vector index recall</code> come from the Vector Index and Hybrid Search
                    pages; the first is <em>How does the Apache Doris vector index work?</em>
                </>
            ),
        },
        {
            code: 'M2',
            title: 'Add filters',
            time: '10 min',
            highlight: '4',
            blocks: [
                {
                    label: 'M2 · Add filters',
                    file: 'sql',
                    language: 'sql',
                    code: `SELECT page_title, section, category, score() AS relevance
FROM doc_chunks
WHERE body MATCH_ANY 'vector index recall'
  AND category = 'search'
ORDER BY relevance DESC
LIMIT 10;`,
                },
                <p key="expose">
                    Expose the category as a dropdown or a CLI flag (the 7 values are listed under The data). Extra
                    conditions are plain SQL: <code>category IN (…)</code>, <code>page = …</code>.
                </p>,
            ],
            checkpoint: (
                <>
                    The Vector Index sections disappear — that page is filed under <code>ai</code> — and Hybrid Search
                    moves to the top.
                </>
            ),
        },
        {
            code: 'M3',
            title: 'Vector search',
            time: '15 min',
            blocks: [
                <p key="embed">Embed the question with the toy embedder, from code or from the command line:</p>,
                {
                    label: 'M3 · Embed the question',
                    file: 'python',
                    language: 'python',
                    code: `from toy_embed import toy_embed, to_sql_array
vec = to_sql_array(toy_embed("store messy nested records whose schema keeps changing"))
# '[0.005740, 0.005740, 0.999885, ...]'  ·  CLI: python a1/toy_embed.py "..."`,
                },
                {
                    label: 'M3 · Vector search',
                    file: 'sql',
                    language: 'sql',
                    target: true,
                    code: `SELECT page_title, section,
       l2_distance_approximate(embedding,
         ${VEC_SCHEMA}) AS dist
FROM doc_chunks
ORDER BY dist ASC
LIMIT 10;`,
                },
                <p key="code">
                    From code, keep the SQL fixed and pass the vector string as a parameter:{' '}
                    <code>l2_distance_approximate(embedding, CAST(%s AS ARRAY&lt;FLOAT&gt;))</code>. A Python list or a
                    JavaScript array as the parameter does not work.
                </p>,
            ],
            checkpoint: (
                <>
                    The first six hits are all VARIANT sections, although the question says neither JSON nor VARIANT.
                    Keyword mode on the same words mixes in Metadata Cache and Binlog sections.
                </>
            ),
        },
        {
            code: 'M4',
            title: 'Hybrid',
            time: '20 min',
            highlight: '4-6',
            blocks: [
                <p key="question">
                    Question: <em>&quot;stream kafka changes into doris exactly once&quot;</em>. The vector is its toy
                    embedding; the keyword filter keeps only sections that say <em>kafka</em>:
                </p>,
                {
                    label: 'M4 · Hybrid',
                    file: 'sql',
                    language: 'sql',
                    code: `SELECT page_title, section,
       l2_distance_approximate(embedding, ${VEC_KAFKA}) AS dist
FROM doc_chunks
WHERE body MATCH_ANY 'kafka'                     -- keyword pre-filter (inverted index)
  AND category IN ('ingestion', 'lakehouse')     -- structured filter
ORDER BY dist ASC                                -- vector ranking (ANN)
LIMIT 10;`,
                },
            ],
            legend: [
                { line: 4, code: "WHERE body MATCH_ANY 'kafka'", note: 'keyword pre-filter (inverted index)' },
                { line: 5, code: "AND category IN ('ingestion', 'lakehouse')", note: 'structured filter' },
                { line: 6, code: 'ORDER BY dist ASC', note: 'vector ranking (ANN)' },
            ],
            after: (
                <>
                    <p>
                        In your app, one input feeds both halves: <code>keywords(text)</code> for the{' '}
                        <code>MATCH_ANY</code>, <code>toy_embed(text)</code> for the vector. <code>MATCH_ANY</code> on
                        several words is a loose filter; offer a &quot;must contain&quot; box or <code>MATCH_ALL</code>{' '}
                        when users want it strict. Don&apos;t select <code>score()</code> here: show the distance.
                    </p>
                    <p>
                        Add a mode switch (keyword / vector / hybrid) and a <strong>Show SQL</strong> toggle. Compare
                        the three lists for the same question — where do they disagree, and why?
                    </p>
                </>
            ),
            checkpoint: (
                <>
                    Every hit mentions Kafka, led by <em>How does the Apache Doris Kafka and CDC integration work?</em>{' '}
                    Vector mode alone ranks <em>Pipeline Execution Engine › Overview</em> second for the same question.
                </>
            ),
        },
    ],
    done: [
        'A user can type any free-text query (CLI argument, prompt, or text box).',
        <>
            Three modes work: <strong>keyword</strong> (BM25 via <code>score()</code>), <strong>vector</strong> (ANN),{' '}
            <strong>hybrid</strong> (keyword pre-filter + vector ranking).
        </>,
        'At least one structured filter (category).',
        'Results show page, section and score or distance; the executed SQL can be displayed.',
        'Submitted as a pull request: your GitHub-ID folder with the code and a README (how to run + one screenshot).',
    ],
    stretch: [
        <>
            <strong>Reciprocal Rank Fusion.</strong> Fuse the BM25 list and the vector list with{' '}
            <code>1/(60 + rank)</code> in one statement: <code>a1/rrf.sql</code> in the starter kit ranks each list with{' '}
            <code>ROW_NUMBER()</code> one level above the plain <code>score()</code> query and merges them with a{' '}
            <code>FULL OUTER JOIN</code>. The <Link to="/docs/4.x/key-features/reciprocal-rank-fusion">RRF page</Link>{' '}
            walks through the same pattern on a four-row example.
        </>,
        <>
            <strong>
                Real embeddings with <code>EMBED()</code>
            </strong>{' '}
            (bring your own API key): create an AI resource, create <code>doc_chunks_v2</code> with the model&apos;s{' '}
            <code>dim</code>, fill it with <code>INSERT INTO doc_chunks_v2 SELECT …, EMBED(body) FROM doc_chunks</code>{' '}
            (the vector column is <code>NOT NULL</code>, so insert rather than update), and embed the query in SQL too.
            See <Link to="/docs/4.x/key-features/embedding">Embedding</Link>.
        </>,
        <>
            <strong>Search-as-you-type</strong> with <code>MATCH_PHRASE_PREFIX</code>.
        </>,
        <>
            <strong>Highlight matched terms</strong> in the results (Doris returns scores, not highlights — render them
            in your app).
        </>,
        <>
            <strong>Latency badge</strong>: show how many milliseconds each mode takes.
        </>,
    ],
    troubleshooting: [
        ...COMMON_TROUBLESHOOTING.slice(0, -1),
        {
            problem: <code>Ann topn query vector cannot be empty</code>,
            fix: (
                <>
                    The vector literal is empty or still a placeholder: paste the output of{' '}
                    <code>python a1/toy_embed.py &quot;…&quot;</code>
                </>
            ),
        },
        {
            problem: <code>Can not found function &apos;l2_distance_approximate&apos; which has 9 arity</code>,
            fix: (
                <>
                    Your driver expanded an array parameter into 8 values: pass the vector as a string with{' '}
                    <code>CAST(? AS ARRAY&lt;FLOAT&gt;)</code>
                </>
            ),
        },
        COMMON_TROUBLESHOOTING[COMMON_TROUBLESHOOTING.length - 1],
    ],
    references: [
        { label: 'Hybrid Search', to: '/docs/4.x/key-features/hybrid-search' },
        { label: 'BM25', to: '/docs/4.x/key-features/bm25' },
        { label: 'Full-text Search', to: '/docs/4.x/key-features/full-text-search' },
        { label: 'Vector Index', to: '/docs/4.x/key-features/vector-index' },
        { label: 'Reciprocal Rank Fusion', to: '/docs/4.x/key-features/reciprocal-rank-fusion' },
        { label: 'Embedding', to: '/docs/4.x/key-features/embedding' },
    ],
    Sketch: HybridSearchSketch,
};
