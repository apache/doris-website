import React from 'react';
import Link from '@docusaurus/Link';
import { HackathonTaskContent, HackathonTermList } from '../HackathonTaskPage';
import { HybridSearchSketch } from '../HackathonSketch';
import { AI_INTRO, AI_STEPS, COMMON_BEFORE, COMMON_TROUBLESHOOTING, TRAPS } from '../hackathonCommon';
import { getHackathonTask } from '../hackathonEvent';

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
                    <strong>~400 sections of the Apache Doris documentation</strong>. A user types a question such as{' '}
                    <em>&quot;how do I store messy JSON from agents?&quot;</em>, picks a category, and switches between
                    three modes:
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
                    Every result shows the page, the section, its score, and a link to the doc. A &quot;Show SQL&quot;
                    toggle reveals the exact query Doris ran.
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
            <strong>Filters are just SQL.</strong> Category, date, joins, aggregations — everything you already know
            works next to search.
        </>,
    ],
    whyHighlight: '11-14',
    before: COMMON_BEFORE,
    data: [
        <p key="intro">
            <code>hackathon.doc_chunks</code> — the Doris docs, split by section:
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
  category    VARCHAR(32)   NOT NULL,   -- search / ai / json / lakehouse / ingestion / ...
  updated     DATE          NOT NULL,
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
        <p key="vectors">
            <strong>About the vectors.</strong> To keep everything offline, the starter kit ships a tiny{' '}
            <strong>toy embedder</strong> (<code>toy_embed.py</code> / <code>toy_embed.js</code>). It maps text onto 8
            hand-defined concept dimensions —{' '}
            <em>search, vectors &amp; AI, JSON, lakehouse, ingestion, performance, data model, operations</em> — using
            synonym lists, then normalizes the result to unit length. The same function produced the vectors in the
            table, so your query vectors live in the same space. It is crude on purpose: the query{' '}
            <em>&quot;agent memory&quot;</em> lands near pages about LLMs and VARIANT even when the words differ, which
            is enough to see what vector search adds. The stretch goals swap it for a real model.
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

Table \`doc_chunks\`: id, page, page_title, section, category, updated (DATE), url,
body (STRING, inverted index, english parser, phrase support),
embedding (ARRAY<FLOAT> NOT NULL, 8 dims, unit length, HNSW index, l2_distance).

Doris SQL rules — follow them exactly:
1. Keyword search uses \`body MATCH_ANY 'a b'\` (OR), \`MATCH_ALL\` (AND), \`MATCH_PHRASE\`. Never LIKE.
2. BM25 relevance is \`score()\`. It only works with a MATCH_* predicate in WHERE
   and \`ORDER BY score() DESC LIMIT n\`.
3. Vector search: \`ORDER BY l2_distance_approximate(embedding, [f1,...,f8]) ASC LIMIT n\`.
   The query vector is a SQL array literal.
4. Do not order by score() and a distance in the same query. Hybrid = MATCH_* pre-filter
   + vector ORDER BY. For fusion, run two ranked lists and combine with RRF (k = 60).
5. Query vectors come from \`toy_embed(text)\` in toy_embed.py — do not invent embeddings.

Build: a CLI (or small web page) with keyword / vector / hybrid modes, a category filter,
and a "show SQL" option. Run every SQL statement against the live cluster first.`,
        },
        traps: [TRAPS.like, TRAPS.scoreAnywhere, TRAPS.bm25AndDistance, TRAPS.cosine],
    },
    milestones: [
        {
            code: 'M0',
            title: 'Load the data',
            time: '5 min',
            blocks: [
                {
                    label: 'M0 · Load the data',
                    file: 'bash',
                    language: 'bash',
                    code: `mysql -h127.0.0.1 -P9030 -uroot < seed/a1_doc_chunks.sql
mysql -h127.0.0.1 -P9030 -uroot -e "SELECT category, COUNT(*) FROM hackathon.doc_chunks GROUP BY category"`,
                },
            ],
            checkpoint: 'You should see ~400 rows spread across 8 categories.',
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
                    code: `SELECT id, page_title, section, score() AS relevance
FROM doc_chunks
WHERE body MATCH_ANY 'vector index recall'
ORDER BY relevance DESC
LIMIT 10;`,
                },
                <p key="then">
                    Then try <code>MATCH_ALL</code> (every term must appear) and{' '}
                    <code>MATCH_PHRASE &apos;inverted index&apos;</code> (adjacent, in order). Wire it up: input box →
                    SQL → result list.
                </p>,
            ],
            checkpoint: (
                <>
                    The top hits for <code>vector index recall</code> come from the Vector Index and Hybrid Search
                    pages.
                </>
            ),
        },
        {
            code: 'M2',
            title: 'Add filters',
            time: '10 min',
            highlight: '4-5',
            blocks: [
                {
                    label: 'M2 · Add filters',
                    file: 'sql',
                    language: 'sql',
                    code: `SELECT id, page_title, section, score() AS relevance
FROM doc_chunks
WHERE body MATCH_ANY 'vector index recall'
  AND category = 'search'
  AND updated >= '2026-01-01'
ORDER BY relevance DESC
LIMIT 10;`,
                },
                <p key="expose">Expose category (and optionally date) as dropdowns or CLI flags.</p>,
            ],
        },
        {
            code: 'M3',
            title: 'Vector search',
            time: '15 min',
            blocks: [
                {
                    label: 'M3 · Embed the query',
                    file: 'python',
                    language: 'python',
                    code: `from toy_embed import toy_embed
qvec = toy_embed("how do I store messy JSON from agents?")   # 8 floats, unit length`,
                },
                {
                    label: 'M3 · Vector search',
                    file: 'sql',
                    language: 'sql',
                    target: true,
                    code: `SELECT id, page_title, section,
       l2_distance_approximate(embedding, [0.05, 0.41, 0.77, 0.02, 0.10, 0.08, 0.31, 0.36]) AS dist
FROM doc_chunks
ORDER BY dist ASC
LIMIT 10;`,
                },
            ],
            checkpoint: 'VARIANT pages show up even though the query never says "variant".',
        },
        {
            code: 'M4',
            title: 'Hybrid',
            time: '20 min',
            highlight: '4-6',
            blocks: [
                {
                    label: 'M4 · Hybrid',
                    file: 'sql',
                    language: 'sql',
                    code: `SELECT id, page_title, section,
       l2_distance_approximate(embedding, [/* query vector */]) AS dist
FROM doc_chunks
WHERE body MATCH_ANY 'agent memory'        -- keyword pre-filter (inverted index)
  AND category IN ('ai', 'json')            -- structured filter
ORDER BY dist ASC                           -- vector ranking (ANN)
LIMIT 10;`,
                },
            ],
            legend: [
                { line: 4, code: "WHERE body MATCH_ANY 'agent memory'", note: 'keyword pre-filter (inverted index)' },
                { line: 5, code: "AND category IN ('ai', 'json')", note: 'structured filter' },
                { line: 6, code: 'ORDER BY dist ASC', note: 'vector ranking (ANN)' },
            ],
            after: (
                <p>
                    Add a mode switch (keyword / vector / hybrid) and a <strong>Show SQL</strong> toggle. Compare the
                    three lists for the same query — where do they disagree, and why?
                </p>
            ),
        },
    ],
    done: [
        'A user can type any free-text query (CLI argument, prompt, or text box).',
        <>
            Three modes work: <strong>keyword</strong> (BM25 via <code>score()</code>), <strong>vector</strong> (ANN),{' '}
            <strong>hybrid</strong> (keyword pre-filter + vector ranking).
        </>,
        'At least one structured filter (category or date).',
        'Results show page, section and score/distance; the executed SQL can be displayed.',
        'Public repo with a README (how to run + one screenshot).',
    ],
    stretch: [
        <>
            <strong>Reciprocal Rank Fusion.</strong> Fuse the BM25 list and the vector list with{' '}
            <code>1/(60 + rank)</code>. The <Link to="/docs/4.x/key-features/reciprocal-rank-fusion">RRF page</Link>{' '}
            shows a single-SQL pattern (two CTEs + <code>ROW_NUMBER()</code> + <code>FULL OUTER JOIN</code>). Try it; if
            your build rejects it, fuse the two lists in your app instead — and tell us what happened.
        </>,
        <>
            <strong>
                Real embeddings with <code>EMBED()</code>
            </strong>{' '}
            (bring your own API key): create an AI resource, build <code>doc_chunks_v2</code> with a higher{' '}
            <code>dim</code>, backfill with <code>EMBED(body)</code>, and embed the query in SQL too. See{' '}
            <Link to="/docs/4.x/key-features/embedding">Embedding</Link>.
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
    troubleshooting: COMMON_TROUBLESHOOTING,
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
