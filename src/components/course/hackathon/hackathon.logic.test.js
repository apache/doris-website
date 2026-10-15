const assert = require('node:assert/strict');
const test = require('node:test');

const { parseLineRanges, tokenizeCodeLine } = require('./hackathon.logic');

const join = tokens => tokens.map(token => token.text).join('');
const kinds = tokens => tokens.filter(token => token.kind).map(token => [token.text.trim(), token.kind]);

test('round-trips every line it tokenizes', () => {
    const samples = [
        ['sql', "WHERE body MATCH_ANY 'agent memory'        -- keyword pre-filter (inverted index)"],
        ['sql', '       l2_distance_approximate(embedding, [/* query vector */]) AS dist'],
        ['bash', 'curl -fsSL https://doris.apache.org/files/start-doris.sh | bash -s -- -v 4.1.4.1'],
        ['bash', 'which doris-mcp-server          # note the absolute path'],
        ['python', 'qvec = toy_embed("how do I store messy JSON from agents?")   # 8 floats, unit length'],
        ['json', '      "args": ["--transport", "stdio"],'],
        ['text', "1. Keyword search uses `body MATCH_ANY 'a b'` (OR). Never LIKE."],
        ['sql', ''],
    ];
    samples.forEach(([language, line]) => assert.equal(join(tokenizeCodeLine(line, language)), line));
});

test('highlights Doris SQL keywords, functions, strings and comments', () => {
    const tokens = tokenizeCodeLine(
        "SELECT id, score() AS relevance FROM doc_chunks WHERE body MATCH_ANY 'x' -- note",
        'sql',
    );
    assert.deepEqual(kinds(tokens), [
        ['SELECT', 'k'],
        ['score', 'f'],
        ['AS', 'k'],
        ['FROM', 'k'],
        ['WHERE', 'k'],
        ['MATCH_ANY', 'k'],
        ["'x'", 's'],
        ['-- note', 'c'],
    ]);
});

test('keeps lower-case identifiers plain even when they spell a keyword', () => {
    const tokens = tokenizeCodeLine('SELECT level, key FROM t', 'sql');
    assert.deepEqual(kinds(tokens), [
        ['SELECT', 'k'],
        ['FROM', 'k'],
    ]);
});

test('marks shell commands, flags, operators and trailing comments', () => {
    const tokens = tokenizeCodeLine('mysql -h127.0.0.1 -P9030 -uroot < seed/a3_app_logs.sql   # comment', 'bash');
    assert.deepEqual(kinds(tokens), [
        ['mysql', 'f'],
        ['-h127.0.0.1', 'k'],
        ['-P9030', 'k'],
        ['-uroot', 'k'],
        ['<', 'o'],
        ['# comment', 'c'],
    ]);
    const piped = tokenizeCodeLine('curl -fsSL https://x/start.sh | bash -s', 'bash');
    assert.deepEqual(
        kinds(piped).filter(([, kind]) => kind === 'f'),
        [
            ['curl', 'f'],
            ['bash', 'f'],
        ],
    );
});

test('separates JSON keys from string values', () => {
    const tokens = tokenizeCodeLine('{"latency_ms": 37, "status": "ok", "retry": false}', 'json');
    assert.deepEqual(kinds(tokens), [
        ['"latency_ms"', 'f'],
        ['37', 'n'],
        ['"status"', 'f'],
        ['"ok"', 's'],
        ['"retry"', 'f'],
        ['false', 'n'],
    ]);
});

test('parses line ranges', () => {
    assert.deepEqual(parseLineRanges('4-6'), [4, 5, 6]);
    assert.deepEqual(parseLineRanges('11-12, 3'), [3, 11, 12]);
    assert.deepEqual(parseLineRanges(' 5 '), [5]);
    assert.deepEqual(parseLineRanges('x, 2-'), []);
    assert.deepEqual(parseLineRanges(undefined), []);
});
