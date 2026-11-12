import {translate} from '@docusaurus/Translate';
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
    titleLead: translate({id: "landing.a1HybridSearch.001", message: "Hybrid Search"}),
    titleTail: translate({id: "landing.a1HybridSearch.002", message: "App"}),
    hook: translate({id: "landing.a1HybridSearch.003", message: "Keywords, meaning and filters — in one SQL query. Build a search box over the Apache Doris docs."}),
    chips: [translate({id: "landing.courseExtra.a1HybridSearch.011", message: "60–120 min"}), translate({id: "landing.courseExtra.a1HybridSearch.012", message: "Beginner-friendly"}), translate({id: "landing.courseExtra.a1HybridSearch.013", message: "Any language · CLI or web"}), translate({id: "landing.courseExtra.a1HybridSearch.014", message: "AI tools welcome"})],
    build: {
        lead: translate({id: "landing.a1HybridSearch.004", message: "Build a search box that understands both words and meaning."}),
        body: (
            <>
                <p>
                    {translate({id: "landing.a1HybridSearch.005", message: "Exact keyword matches ranked by BM25, semantic neighbours from a vector index, and structured filters — served by one Doris table and one SQL statement. No Elasticsearch, no separate vector database."})}
                </p>
                <p>
                    {translate({id: "landing.a1HybridSearch.006", message: "A small search app (CLI, notebook, or web page — your call) over"})}{' '}
                    <strong>{translate({id: "landing.a1HybridSearch.007", message: "299 sections of the Apache Doris documentation"})}</strong>{translate({id: "landing.a1HybridSearch.008", message: ". A user types a question such as"})}{' '}
                    <em>&quot;how do I store messy JSON?&quot;</em>{translate({id: "landing.a1HybridSearch.010", message: ", picks a category, and switches between three modes:"})}
                </p>
                <HackathonTermList
                    items={[
                        { term: translate({id: "landing.a1HybridSearch.011", message: "Keyword"}), text: translate({id: "landing.a1HybridSearch.012", message: "BM25-ranked full-text matches."}) },
                        { term: translate({id: "landing.a1HybridSearch.013", message: "Vector"}), text: translate({id: "landing.a1HybridSearch.014", message: "nearest neighbours by embedding similarity."}) },
                        {
                            term: translate({id: "landing.a1HybridSearch.015", message: "Hybrid"}),
                            text: translate({id: "landing.a1HybridSearch.016", message: "keyword pre-filter, then vector ranking (and, as a stretch, Reciprocal Rank Fusion)."}),
                        },
                    ]}
                />
                <p>
                    {translate({id: "landing.a1HybridSearch.017", message: "Every result shows the page, the section, its score (keyword) or distance (vector, hybrid), and a link to the doc. A \"Show SQL\" toggle reveals the exact query Doris ran."})}
                </p>
            </>
        ),
    },
    why: [
        <>
            <strong>{translate({id: "landing.a1HybridSearch.018", message: "One table, two indexes."})}</strong> {translate({id: "landing.a1HybridSearch.019", message: "An inverted index on the text and an HNSW ANN index on the vectors live in the same table. The planner pre-filters with the inverted index, then ranks the survivors with the ANN index."})}
        </>,
        <>
            <strong>{translate({id: "landing.a1HybridSearch.020", message: "Search-engine ranking in SQL."})}</strong> <code>score()</code> {translate({id: "landing.a1HybridSearch.021", message: "gives you BM25 — the same relevance function Lucene uses — inside a normal"})} <code>SELECT</code>.
        </>,
        <>
            <strong>{translate({id: "landing.a1HybridSearch.022", message: "Filters are just SQL."})}</strong> {translate({id: "landing.a1HybridSearch.023", message: "Category, page,"})} <code>IN</code> {translate({id: "landing.a1HybridSearch.024", message: "lists, ranges — written next to"})}{' '}
            <code>MATCH_ANY</code> {translate({id: "landing.a1HybridSearch.025", message: "in the same"})} <code>WHERE</code> {translate({id: "landing.a1HybridSearch.026", message: "clause."})}
        </>,
    ],
    whyHighlight: '10-13',
    before: COMMON_BEFORE,
    data: [
        <p key="intro">
            <code>hackathon.doc_chunks</code> {translate({id: "landing.a1HybridSearch.027", message: "— the 47 key-features pages of the Doris 4.x docs, one row per section:"})}
        </p>,
        {
            label: translate({id: "landing.a1HybridSearch.028", message: "Table"}),
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
                <code>category</code> {translate({id: "landing.a1HybridSearch.030", message: "values"})}
            </strong>{' '}
            {translate({id: "landing.a1HybridSearch.031", message: "(for your filter dropdown):"})} <code>search</code>, <code>ai</code>, <code>lakehouse</code>,{' '}
            <code>ingestion</code>, <code>performance</code>, <code>table-design</code>, <code>operations</code>.
        </p>,
        <p key="vectors">
            <strong>{translate({id: "landing.a1HybridSearch.032", message: "About the vectors."})}</strong> {translate({id: "landing.a1HybridSearch.033", message: "To keep everything offline, the starter kit ships a tiny English-only"})}{' '}
            <strong>{translate({id: "landing.a1HybridSearch.034", message: "toy embedder"})}</strong>, <code>a1/toy_embed.py</code> {translate({id: "landing.a1HybridSearch.035", message: "and"})} <code>a1/toy_embed.js</code> {translate({id: "landing.a1HybridSearch.036", message: "(same output, digit for digit). It maps text onto 8 hand-defined concept dimensions —"})}{' '}
            <em>{translate({id: "landing.a1HybridSearch.037", message: "search, vectors & AI, JSON, lakehouse, ingestion, performance, data model, operations"})}</em> {translate({id: "landing.a1HybridSearch.038", message: "— using synonym lists, then normalizes the result to unit length. The same function produced the vectors in the table, so your query vectors live in the same space. It is crude on purpose, yet it already shows what vector search adds:"})} <em>&quot;store messy nested records whose schema keeps changing&quot;</em> {translate({id: "landing.a1HybridSearch.040", message: "lands on the VARIANT pages without saying JSON or VARIANT. The stretch goals swap it for a real model."})}
        </p>,
    ],
    ai: {
        intro: AI_INTRO,
        steps: AI_STEPS,
        prompt: {
            label: translate({id: "landing.a1HybridSearch.041", message: "Context prompt"}),
            file: translate({id: "landing.a1HybridSearch.042", message: "paste into your agent"}),
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
            title: translate({id: "landing.a1HybridSearch.043", message: "Load the data"}),
            time: translate({id: "landing.courseExtra.a1HybridSearch.001", message: "5 min"}),
            blocks: [
                <p key="where">{translate({id: "landing.a1HybridSearch.044", message: "From inside the starter-kit folder:"})}</p>,
                {
                    label: translate({id: "landing.a1HybridSearch.045", message: "M0 · Load the data"}),
                    file: 'bash',
                    language: 'bash',
                    code: dorisLoad('seed/a1_doc_chunks.sql'),
                },
            ],
            checkpoint: (
                <>
                    {translate({id: "landing.a1HybridSearch.046", message: "The load ends with a count per category:"})} <strong>{translate({id: "landing.a1HybridSearch.047", message: "7 categories, 299 sections"})}</strong> {translate({id: "landing.a1HybridSearch.048", message: "in total."})}
                </>
            ),
        },
        {
            code: 'M1',
            title: translate({id: "landing.a1HybridSearch.049", message: "Keyword search with BM25"}),
            short: translate({id: "landing.a1HybridSearch.050", message: "Keyword search"}),
            time: translate({id: "landing.courseExtra.a1HybridSearch.002", message: "15 min"}),
            blocks: [
                <p key="shell">
                    {translate({id: "landing.a1HybridSearch.051", message: "Open a SQL shell ("})}<code>./doris.sh sql</code>{translate({id: "landing.a1HybridSearch.052", message: ", or the"})} <code>docker exec</code> {translate({id: "landing.a1HybridSearch.053", message: "command above) and run:"})}
                </p>,
                {
                    label: translate({id: "landing.a1HybridSearch.054", message: "M1 · Keyword search with BM25"}),
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
                    {translate({id: "landing.a1HybridSearch.055", message: "Then try"})} <code>MATCH_ALL</code> {translate({id: "landing.a1HybridSearch.056", message: "(every term must appear) and"})}{' '}
                    <code>MATCH_PHRASE &apos;inverted index&apos;</code> {translate({id: "landing.a1HybridSearch.057", message: "(adjacent, in order). Wire it up: input box → SQL → result list. Pass the user's text as a driver parameter ("})}<code>MATCH_ANY %s</code>{translate({id: "landing.a1HybridSearch.058", message: "), never by pasting it into the SQL: the first apostrophe breaks the query."})} <code>a1/starter.py</code>{' '}
                    {translate({id: "landing.a1HybridSearch.059", message: "and"})} <code>a1/starter.js</code> {translate({id: "landing.a1HybridSearch.060", message: "do exactly this."})}
                </p>,
                <p key="stopwords">
                    {translate({id: "landing.a1HybridSearch.061", message: "Typed a whole question? The english parser keeps stopwords, so"})} <code>&apos;how do I …&apos;</code>{' '}
                    {translate({id: "landing.a1HybridSearch.062", message: "matches a third of the table. Pass"})} <code>keywords(text)</code> {translate({id: "landing.a1HybridSearch.063", message: "from the toy embedder instead: it drops stopwords, plus"})} <em>apache</em> {translate({id: "landing.a1HybridSearch.065", message: "and"})} <em>doris</em>{translate({id: "landing.a1HybridSearch.067", message: ", which nearly every section mentions."})}
                </p>,
            ],
            checkpoint: (
                <>
                    {translate({id: "landing.a1HybridSearch.068", message: "The top hits for"})} <code>vector index recall</code> {translate({id: "landing.a1HybridSearch.069", message: "come from the Vector Index and Hybrid Search pages; the first is"})} <em>How does the Apache Doris vector index work?</em>
                </>
            ),
        },
        {
            code: 'M2',
            title: translate({id: "landing.a1HybridSearch.071", message: "Add filters"}),
            time: translate({id: "landing.courseExtra.a1HybridSearch.003", message: "10 min"}),
            highlight: '4',
            blocks: [
                {
                    label: translate({id: "landing.a1HybridSearch.072", message: "M2 · Add filters"}),
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
                    {translate({id: "landing.a1HybridSearch.073", message: "Expose the category as a dropdown or a CLI flag (the 7 values are listed under The data). Extra conditions are plain SQL:"})} <code>category IN (…)</code>, <code>page = …</code>.
                </p>,
            ],
            checkpoint: (
                <>
                    {translate({id: "landing.a1HybridSearch.074", message: "The Vector Index sections disappear — that page is filed under"})} <code>ai</code> {translate({id: "landing.a1HybridSearch.075", message: "— and Hybrid Search moves to the top."})}
                </>
            ),
        },
        {
            code: 'M3',
            title: translate({id: "landing.a1HybridSearch.076", message: "Vector search"}),
            time: translate({id: "landing.courseExtra.a1HybridSearch.004", message: "15 min"}),
            blocks: [
                <p key="embed">{translate({id: "landing.a1HybridSearch.077", message: "Embed the question with the toy embedder, from code or from the command line:"})}</p>,
                {
                    label: translate({id: "landing.a1HybridSearch.078", message: "M3 · Embed the question"}),
                    file: 'python',
                    language: 'python',
                    code: `from toy_embed import toy_embed, to_sql_array
vec = to_sql_array(toy_embed("store messy nested records whose schema keeps changing"))
# '[0.005740, 0.005740, 0.999885, ...]'  ·  CLI: python a1/toy_embed.py "..."`,
                },
                {
                    label: translate({id: "landing.a1HybridSearch.079", message: "M3 · Vector search"}),
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
                    {translate({id: "landing.a1HybridSearch.080", message: "From code, keep the SQL fixed and pass the vector string as a parameter:"})}{' '}
                    <code>l2_distance_approximate(embedding, CAST(%s AS ARRAY&lt;FLOAT&gt;))</code>{translate({id: "landing.a1HybridSearch.081", message: ". A Python list or a JavaScript array as the parameter does not work."})}
                </p>,
            ],
            checkpoint: (
                <>
                    {translate({id: "landing.a1HybridSearch.082", message: "The first six hits are all VARIANT sections, although the question says neither JSON nor VARIANT. Keyword mode on the same words mixes in Metadata Cache and Binlog sections."})}
                </>
            ),
        },
        {
            code: 'M4',
            title: translate({id: "landing.a1HybridSearch.083", message: "Hybrid"}),
            time: translate({id: "landing.courseExtra.a1HybridSearch.005", message: "20 min"}),
            highlight: '4-6',
            blocks: [
                <p key="question">
                    {translate({id: "landing.a1HybridSearch.084", message: "Question:"})} <em>&quot;stream kafka changes into doris exactly once&quot;</em>{translate({id: "landing.a1HybridSearch.086", message: ". The vector is its toy embedding; the keyword filter keeps only sections that say"})} <em>kafka</em>:
                </p>,
                {
                    label: translate({id: "landing.a1HybridSearch.088", message: "M4 · Hybrid"}),
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
                { line: 4, code: "WHERE body MATCH_ANY 'kafka'", note: translate({id: "landing.a1HybridSearch.089", message: "keyword pre-filter (inverted index)"}) },
                { line: 5, code: "AND category IN ('ingestion', 'lakehouse')", note: translate({id: "landing.a1HybridSearch.090", message: "structured filter"}) },
                { line: 6, code: 'ORDER BY dist ASC', note: translate({id: "landing.a1HybridSearch.091", message: "vector ranking (ANN)"}) },
            ],
            after: (
                <>
                    <p>
                        {translate({id: "landing.a1HybridSearch.092", message: "In your app, one input feeds both halves:"})} <code>keywords(text)</code> {translate({id: "landing.a1HybridSearch.093", message: "for the"})}{' '}
                        <code>MATCH_ANY</code>, <code>toy_embed(text)</code> {translate({id: "landing.a1HybridSearch.094", message: "for the vector."})} <code>MATCH_ANY</code> {translate({id: "landing.a1HybridSearch.095", message: "on several words is a loose filter; offer a \"must contain\" box or"})} <code>MATCH_ALL</code>{' '}
                        {translate({id: "landing.a1HybridSearch.096", message: "when users want it strict. Don't select"})} <code>score()</code> {translate({id: "landing.a1HybridSearch.097", message: "here: show the distance."})}
                    </p>
                    <p>
                        {translate({id: "landing.a1HybridSearch.098", message: "Add a mode switch (keyword / vector / hybrid) and a"})} <strong>{translate({id: "landing.a1HybridSearch.099", message: "Show SQL"})}</strong> {translate({id: "landing.a1HybridSearch.100", message: "toggle. Compare the three lists for the same question — where do they disagree, and why?"})}
                    </p>
                </>
            ),
            checkpoint: (
                <>
                    {translate({id: "landing.a1HybridSearch.101", message: "Every hit mentions Kafka, led by"})} <em>How does the Apache Doris Kafka and CDC integration work?</em>{' '}
                    {translate({id: "landing.a1HybridSearch.103", message: "Vector mode alone ranks"})} <em>Pipeline Execution Engine › Overview</em> {translate({id: "landing.a1HybridSearch.105", message: "first for the same question."})}
                </>
            ),
        },
    ],
    done: [
        translate({id: "landing.courseExtra.a1HybridSearch.006", message: "A user can type any free-text query (CLI argument, prompt, or text box)."}),
        <>
            {translate({id: "landing.a1HybridSearch.106", message: "Three modes work:"})} <strong>{translate({id: "landing.a1HybridSearch.107", message: "keyword"})}</strong> {translate({id: "landing.a1HybridSearch.108", message: "(BM25 via"})} <code>score()</code>), <strong>{translate({id: "landing.a1HybridSearch.109", message: "vector"})}</strong> {translate({id: "landing.a1HybridSearch.110", message: "(ANN),"})}{' '}
            <strong>{translate({id: "landing.a1HybridSearch.111", message: "hybrid"})}</strong> {translate({id: "landing.a1HybridSearch.112", message: "(keyword pre-filter + vector ranking)."})}
        </>,
        translate({id: "landing.courseExtra.a1HybridSearch.007", message: "At least one structured filter (category)."}),
        translate({id: "landing.courseExtra.a1HybridSearch.008", message: "Results show page, section and score or distance; the executed SQL can be displayed."}),
        translate({id: "landing.courseExtra.a1HybridSearch.009", message: "Submitted as a pull request: your GitHub-ID folder with the code and a README (how to run + one screenshot)."}),
    ],
    stretch: [
        <>
            <strong>{translate({id: "landing.a1HybridSearch.113", message: "Reciprocal Rank Fusion."})}</strong> {translate({id: "landing.a1HybridSearch.114", message: "Fuse the BM25 list and the vector list with"})}{' '}
            <code>1/(60 + rank)</code> {translate({id: "landing.a1HybridSearch.115", message: "in one statement:"})} <code>a1/rrf.sql</code> {translate({id: "landing.a1HybridSearch.116", message: "in the starter kit ranks each list with"})}{' '}
            <code>ROW_NUMBER()</code> {translate({id: "landing.a1HybridSearch.117", message: "one level above the plain"})} <code>score()</code> {translate({id: "landing.a1HybridSearch.118", message: "query and merges them with a"})}{' '}
            <code>FULL OUTER JOIN</code>{translate({id: "landing.a1HybridSearch.119", message: ". The"})} <Link to="/docs/4.x/key-features/reciprocal-rank-fusion">{translate({id: "landing.a1HybridSearch.120", message: "RRF page"})}</Link>{' '}
            {translate({id: "landing.a1HybridSearch.121", message: "walks through the same pattern on a four-row example."})}
        </>,
        <>
            <strong>
                {translate({id: "landing.a1HybridSearch.122", message: "Real embeddings with"})} <code>EMBED()</code>
            </strong>{' '}
            {translate({id: "landing.a1HybridSearch.123", message: "(bring your own API key): create an AI resource, create"})} <code>doc_chunks_v2</code> {translate({id: "landing.a1HybridSearch.124", message: "with the model's"})}{' '}
            <code>dim</code>{translate({id: "landing.a1HybridSearch.125", message: ", fill it with"})} <code>INSERT INTO doc_chunks_v2 SELECT …, EMBED(body) FROM doc_chunks</code>{' '}
            {translate({id: "landing.a1HybridSearch.126", message: "(the vector column is"})} <code>NOT NULL</code>{translate({id: "landing.a1HybridSearch.127", message: ", so insert rather than update), and embed the query in SQL too. See"})} <Link to="/docs/4.x/key-features/embedding">{translate({id: "landing.a1HybridSearch.128", message: "Embedding"})}</Link>.
        </>,
        <>
            <strong>{translate({id: "landing.courseExtra.a1HybridSearch.010", message: "Search-as-you-type"})}</strong> {translate({id: "landing.a1HybridSearch.129", message: "with"})} <code>MATCH_PHRASE_PREFIX</code>.
        </>,
        <>
            <strong>{translate({id: "landing.a1HybridSearch.130", message: "Highlight matched terms"})}</strong> {translate({id: "landing.a1HybridSearch.131", message: "in the results (Doris returns scores, not highlights — render them in your app)."})}
        </>,
        <>
            <strong>{translate({id: "landing.a1HybridSearch.132", message: "Latency badge"})}</strong>{translate({id: "landing.a1HybridSearch.133", message: ": show how many milliseconds each mode takes."})}
        </>,
    ],
    troubleshooting: [
        ...COMMON_TROUBLESHOOTING.slice(0, -1),
        {
            problem: <code>Ann topn query vector cannot be empty</code>,
            fix: (
                <>
                    {translate({id: "landing.a1HybridSearch.134", message: "The vector literal is empty or still a placeholder: paste the output of"})}{' '}
                    <code>python a1/toy_embed.py &quot;…&quot;</code>
                </>
            ),
        },
        {
            problem: <code>Can not found function &apos;l2_distance_approximate&apos; which has 9 arity</code>,
            fix: (
                <>
                    {translate({id: "landing.a1HybridSearch.135", message: "Your driver expanded an array parameter into 8 values: pass the vector as a string with"})}{' '}
                    <code>CAST(? AS ARRAY&lt;FLOAT&gt;)</code>
                </>
            ),
        },
        COMMON_TROUBLESHOOTING[COMMON_TROUBLESHOOTING.length - 1],
    ],
    references: [
        { label: translate({id: "landing.a1HybridSearch.136", message: "Hybrid Search"}), to: '/docs/4.x/key-features/hybrid-search' },
        { label: translate({id: "landing.a1HybridSearch.137", message: "BM25"}), to: '/docs/4.x/key-features/bm25' },
        { label: translate({id: "landing.a1HybridSearch.138", message: "Full-text Search"}), to: '/docs/4.x/key-features/full-text-search' },
        { label: translate({id: "landing.a1HybridSearch.139", message: "Vector Index"}), to: '/docs/4.x/key-features/vector-index' },
        { label: translate({id: "landing.a1HybridSearch.140", message: "Reciprocal Rank Fusion"}), to: '/docs/4.x/key-features/reciprocal-rank-fusion' },
        { label: translate({id: "landing.a1HybridSearch.141", message: "Embedding"}), to: '/docs/4.x/key-features/embedding' },
    ],
    Sketch: HybridSearchSketch,
};
