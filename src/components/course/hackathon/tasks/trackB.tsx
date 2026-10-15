import React, { ReactNode } from 'react';
import { CodeSnippet } from '../HackathonCodeBlock';

// Track B: one page, six tasks. Each task is one feature page of the docs: the
// participant runs it, writes a step-by-step demo, and adds the demo to that
// page with a pull request on apache/doris-website.

export interface TrackBDoc {
    label: string;
    to: string;
}

export interface TrackBTask {
    code: string;
    /** Section id on the page, e.g. "b1". */
    id: string;
    title: string;
    time: string;
    /** File name under docs/key-features/ and versioned_docs/version-4.x/key-features/. */
    page: string;
    doc: TrackBDoc;
    /** Further pages the task builds on. */
    alsoSee?: TrackBDoc[];
    /** What the demo has to show; also the numbered steps of the section template. */
    proves: string[];
    tip?: ReactNode;
    /** B6 loads a file with curl; the others are SQL only. */
    shell?: boolean;
    database: string;
}

const DOCS = '/docs/4.x/key-features';

export const TRACK_B_TASKS: TrackBTask[] = [
    {
        code: 'B1',
        id: 'b1',
        title: 'Full-text Search + BM25',
        time: '30–45 min',
        page: 'full-text-search',
        doc: { label: 'Full-text Search', to: `${DOCS}/full-text-search` },
        alsoSee: [{ label: 'BM25', to: `${DOCS}/bm25` }],
        proves: [
            'A table with an inverted index (english parser, phrase support) on a text column',
            'MATCH_ANY vs MATCH_ALL on the same words, with different row counts',
            'A MATCH_PHRASE query that only matches when the words are adjacent',
            'BM25 ranking: score() with ORDER BY … DESC LIMIT n, and why the top row wins',
        ],
        tip: (
            <>
                The page&apos;s operator table lists every <code>MATCH_*</code> form. Select <code>score()</code> as is
                and order by it: ordering by an expression around it, such as <code>ROUND(score())</code>, is rejected.
            </>
        ),
        database: 'fts_demo',
    },
    {
        code: 'B2',
        id: 'b2',
        title: 'Vector Search',
        time: '30–45 min',
        page: 'vector-index',
        doc: { label: 'Vector Index', to: `${DOCS}/vector-index` },
        proves: [
            'An ARRAY<FLOAT> NOT NULL column with an HNSW (ANN) index',
            'An ANN top-N query: ORDER BY l2_distance_approximate(…) LIMIT n',
            'The same query with a WHERE filter, and how the top-N changes',
            'EXPLAIN showing the ANN index at work (ANN SORT INFO)',
        ],
        tip: (
            <>
                Every vector needs exactly <code>dim</code> numbers, the query vector included; otherwise the query
                fails with a dimension error.
            </>
        ),
        database: 'vector_demo',
    },
    {
        code: 'B3',
        id: 'b3',
        title: 'Hybrid Search',
        time: '30–45 min',
        page: 'hybrid-search',
        doc: { label: 'Hybrid Search', to: `${DOCS}/hybrid-search` },
        alsoSee: [{ label: 'Reciprocal Rank Fusion', to: `${DOCS}/reciprocal-rank-fusion` }],
        proves: [
            'One table with an inverted index on text and an ANN index on vectors',
            'A MATCH_ANY pre-filter and vector ranking in one query',
            'The same question as keyword-only and vector-only queries, and where the lists differ',
            'Both rankings fused with Reciprocal Rank Fusion',
        ],
        tip: (
            <>
                <code>score()</code> can&apos;t be selected in a vector-ranked query, and it can&apos;t sit inside{' '}
                <code>ROW_NUMBER()</code>: rank the plain <code>score()</code> in an outer query, as the RRF page does.
            </>
        ),
        database: 'hybrid_demo',
    },
    {
        code: 'B4',
        id: 'b4',
        title: 'VARIANT',
        time: '30–45 min',
        page: 'variant-data-type',
        doc: { label: 'VARIANT Data Type', to: `${DOCS}/variant-data-type` },
        proves: [
            'JSON rows of different shapes in one VARIANT column',
            'Queries on nested paths, with CAST before comparing or aggregating',
            'The inferred subcolumns: SET describe_extend_variant_column = true; DESC',
            'A full-text search inside the JSON (MATCH on a path, backed by an inverted index)',
        ],
        tip: (
            <>
                <code>variant_type(payload)</code> shows the paths and types Doris inferred for one row; compare it with
                the <code>DESC</code> output.
            </>
        ),
        database: 'variant_demo',
    },
    {
        code: 'B5',
        id: 'b5',
        title: 'Unique Key + Sequence Column',
        time: '30–45 min',
        page: 'unique-key',
        doc: { label: 'Unique Key', to: `${DOCS}/unique-key` },
        proves: [
            'Three writes to the same key end as one row',
            'With a sequence column, a late (older) write does not overwrite the newest version',
            'Without one, the late write wins: the same writes into a second table without the sequence column',
        ],
        tip: 'Run the three writes as one INSERT and as three separate INSERTs: the result must not change.',
        database: 'unique_key_demo',
    },
    {
        code: 'B6',
        id: 'b6',
        title: 'Stream Load',
        time: '30–60 min',
        page: 'stream-load',
        doc: { label: 'Stream Load', to: `${DOCS}/stream-load` },
        proves: [
            'A target table, and a small CSV file written from the shell',
            'The CSV loaded with curl over HTTP, and the JSON response checked (Status, NumberLoadedRows)',
            'A query that shows the loaded rows',
            'Safe to rerun: sending the same load again loads nothing (same label, Label Already Exists)',
        ],
        tip: (
            <>
                Send the load to the FE at <code>127.0.0.1:8030</code> with <code>curl --location-trusted</code>: the FE
                redirects it to the BE, and the all-in-one container answers on both ports.
            </>
        ),
        shell: true,
        database: 'stream_load_demo',
    },
];

export const docFiles = (task: TrackBTask) => [
    `docs/key-features/${task.page}.mdx`,
    `versioned_docs/version-4.x/key-features/${task.page}.mdx`,
];

const FENCE = '```';
const RESULT = ['**Expected result**', '', FENCE, '+----+-------+', '| id | title |', '+----+-------+', FENCE];

/** The section the participant's pull request adds after Quick start; the checklist gives its steps. */
export function sectionTemplate(task: TrackBTask): CodeSnippet {
    const first = task.shell
        ? [
              `${FENCE}sql`,
              `CREATE DATABASE IF NOT EXISTS ${task.database};`,
              `CREATE TABLE ${task.database}.… (…);`,
              FENCE,
              '',
              `${FENCE}shell`,
              "cat > example.csv <<'CSV'",
              '…',
              'CSV',
              FENCE,
          ]
        : [
              `${FENCE}sql`,
              `CREATE DATABASE IF NOT EXISTS ${task.database};`,
              `USE ${task.database};`,
              '',
              'CREATE TABLE … ;',
              FENCE,
          ];
    const later = (index: number) =>
        task.shell && index === 1
            ? [
                  `${FENCE}shell`,
                  'curl --location-trusted -u root: -H "label:…" -T example.csv \\',
                  '  -XPUT http://127.0.0.1:8030/api/…/_stream_load',
                  FENCE,
                  '',
                  '**Expected result**',
                  '',
                  `${FENCE}json`,
                  '{ "Status": "Success", … }',
                  FENCE,
              ]
            : [`${FENCE}sql`, 'SELECT … ;', FENCE, '', ...RESULT];
    return {
        label: `${task.code} · page section`,
        file: `${task.page}.mdx · template`,
        language: 'text',
        code: [
            '## Step-by-step demo {#demo}',
            '',
            'One or two sentences: what this demo shows, from an empty cluster.',
            '',
            ...task.proves.flatMap((line, index) => [
                `### ${index + 1}. ${line}`,
                '',
                ...(index === 0 ? first : later(index)),
                '',
            ]),
        ].join('\n'),
    };
}

/** Title and description for the pull request, following the repo's template. */
export function prTemplate(task: TrackBTask): CodeSnippet {
    return {
        label: `${task.code} · pull request`,
        file: 'title + description · template',
        language: 'text',
        wrap: true,
        code: [
            `[docs] Add a step-by-step demo to the ${task.doc.label} page`,
            '',
            '## Versions',
            '',
            '- [x] dev',
            '- [x] 4.x',
            '- [ ] 3.x',
            '- [ ] 2.1 or older (not covered by version/language sync gate)',
            '',
            '## Languages',
            '',
            '- [ ] Chinese',
            '- [x] English',
            '',
            '(Keep the Docs Checklist from the template and tick what applies.)',
            '',
            `CoC 2026 Glasgow hackathon · Track B · ${task.code} ${task.title}`,
            '',
            'The key-features pages exist only in English; both copies get the same change:',
            ...docFiles(task).map(file => `- ${file}`),
            '',
            '## What this PR changes',
            '',
            '- Adds a "Step-by-step demo" section after Quick start that shows: …',
            '- Fixes on the page: … (or "none")',
            '',
            '## What I found in the docs',
            '',
            '- Where: … / The page says: … / What happened: … / What it should say: …',
            '',
            '## Validation',
            '',
            'Ran every statement from an empty cluster on apache/doris:all-in-one-4.1.3; every Expected result is the real output.',
        ].join('\n'),
    };
}
