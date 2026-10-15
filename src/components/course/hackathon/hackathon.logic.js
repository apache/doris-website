// Token kinds map to CSS classes in HackathonTaskPage.scss:
// k = keyword or flag, f = function / command / JSON key, s = string,
// n = number or literal, o = shell operator, c = comment.
const SQL_KEYWORDS = new Set([
    'ADD',
    'ALL',
    'ALTER',
    'AND',
    'ANN',
    'ARRAY',
    'AS',
    'ASC',
    'BETWEEN',
    'BIGINT',
    'BUCKETS',
    'BY',
    'CASE',
    'CAST',
    'CREATE',
    'DATABASE',
    'DATE',
    'DATETIME',
    'DELETE',
    'DESC',
    'DESCRIBE',
    'DISTINCT',
    'DISTRIBUTED',
    'DOUBLE',
    'DROP',
    'DUPLICATE',
    'ELSE',
    'END',
    'EXISTS',
    'FLOAT',
    'FROM',
    'FULL',
    'GRANT',
    'GROUP',
    'HASH',
    'HAVING',
    'IDENTIFIED',
    'IF',
    'IN',
    'INDEX',
    'INNER',
    'INSERT',
    'INT',
    'INTO',
    'INVERTED',
    'IS',
    'JOIN',
    'KEY',
    'LEFT',
    'LIKE',
    'LIMIT',
    'MATCH_ALL',
    'MATCH_ANY',
    'MATCH_PHRASE',
    'MATCH_PHRASE_PREFIX',
    'NOT',
    'NULL',
    'ON',
    'OR',
    'ORDER',
    'OUTER',
    'OVER',
    'PARTITION',
    'PROPERTIES',
    'RIGHT',
    'SELECT',
    'SELECT_PRIV',
    'SET',
    'SHOW',
    'STRING',
    'TABLE',
    'THEN',
    'TO',
    'UNION',
    'UNIQUE',
    'UPDATE',
    'USER',
    'USING',
    'VALUES',
    'VARCHAR',
    'VARIANT',
    'WHEN',
    'WHERE',
    'WITH',
]);

const PYTHON_KEYWORDS = new Set([
    'and',
    'as',
    'def',
    'else',
    'for',
    'from',
    'if',
    'import',
    'in',
    'not',
    'or',
    'return',
    'with',
]);

const LITERALS = new Set(['true', 'false', 'null', 'None', 'True', 'False']);
const NO_KEYWORDS = new Set();

const SQL_PATTERN =
    /(--.*$)|(\/\*.*?\*\/)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)/g;
const PYTHON_PATTERN = /(#.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)/g;
const JSON_PATTERN = /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\b\d+(?:\.\d+)?\b)|\b(true|false|null)\b/g;
const SHELL_PATTERN = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\|\||&&|[|<>])|(\S+)/g;
const TEXT_PATTERN = /(`[^`]*`)/g;

function pushToken(tokens, text, kind) {
    if (!text) {
        return;
    }
    const last = tokens[tokens.length - 1];
    if (last && last.kind === kind) {
        last.text += text;
    } else {
        tokens.push(kind ? { text, kind } : { text });
    }
}

function scan(line, pattern, classify) {
    const tokens = [];
    let cursor = 0;
    pattern.lastIndex = 0;
    let match = pattern.exec(line);
    while (match) {
        pushToken(tokens, line.slice(cursor, match.index));
        const parts = classify(match, line);
        parts.forEach(([text, kind]) => pushToken(tokens, text, kind));
        cursor = match.index + match[0].length;
        if (match[0].length === 0) {
            pattern.lastIndex += 1;
        }
        match = pattern.exec(line);
    }
    pushToken(tokens, line.slice(cursor));
    return tokens;
}

function classifyWord(word, nextChar, keywords) {
    if (keywords.has(word)) {
        return 'k';
    }
    if (LITERALS.has(word)) {
        return 'n';
    }
    if (nextChar === '(') {
        return 'f';
    }
    return undefined;
}

function tokenizeSql(line) {
    return scan(line, SQL_PATTERN, (match, source) => {
        const [text, lineComment, blockComment, string, number, word] = match;
        if (lineComment || blockComment) {
            return [[text, 'c']];
        }
        if (string) {
            return [[text, 's']];
        }
        if (number) {
            return [[text, 'n']];
        }
        // Keywords are recognised only in upper case, the way every snippet on
        // these pages writes them, so lower-case column names stay plain.
        const keywords = word === word.toUpperCase() ? SQL_KEYWORDS : NO_KEYWORDS;
        return [[text, classifyWord(word, source[match.index + text.length], keywords)]];
    });
}

function tokenizePython(line) {
    return scan(line, PYTHON_PATTERN, (match, source) => {
        const [text, comment, string, number, word] = match;
        if (comment) {
            return [[text, 'c']];
        }
        if (string) {
            return [[text, 's']];
        }
        if (number) {
            return [[text, 'n']];
        }
        return [[text, classifyWord(word, source[match.index + text.length], PYTHON_KEYWORDS)]];
    });
}

function tokenizeJson(line) {
    return scan(line, JSON_PATTERN, match => {
        const [, string, colon, number, literal] = match;
        if (string) {
            return colon ? [[string, 'f'], [colon]] : [[string, 's']];
        }
        if (number || literal) {
            return [[number || literal, 'n']];
        }
        return [[match[0]]];
    });
}

function tokenizeShell(line) {
    const commentAt = line.search(/(^|\s)#/);
    const code = commentAt < 0 ? line : line.slice(0, commentAt + (line[commentAt] === '#' ? 0 : 1));
    const comment = commentAt < 0 ? '' : line.slice(code.length);
    let expectCommand = true;
    const tokens = scan(code, SHELL_PATTERN, match => {
        const [text, quoted, operator, word] = match;
        if (quoted) {
            expectCommand = false;
            return [[text, 's']];
        }
        if (operator) {
            expectCommand = operator === '|' || operator === '||' || operator === '&&';
            return [[text, 'o']];
        }
        if (expectCommand) {
            expectCommand = false;
            return [[word, 'f']];
        }
        return [[word, word.startsWith('-') ? 'k' : undefined]];
    });
    pushToken(tokens, comment, 'c');
    return tokens;
}

function tokenizeText(line) {
    return scan(line, TEXT_PATTERN, match => [[match[0], 's']]);
}

/**
 * Splits one line of a code sample into highlighted runs. Plain runs have no
 * `kind`. Joining every `text` always gives back the original line.
 */
function tokenizeCodeLine(line, language) {
    switch (language) {
        case 'sql':
            return tokenizeSql(line);
        case 'python':
            return tokenizePython(line);
        case 'json':
            return tokenizeJson(line);
        case 'bash':
            return tokenizeShell(line);
        case 'text':
            return tokenizeText(line);
        default:
            return line ? [{ text: line }] : [];
    }
}

/** Parses "4-6, 11" into [4, 5, 6, 11]. Malformed parts are ignored. */
function parseLineRanges(spec) {
    const lines = new Set();
    String(spec || '')
        .split(',')
        .forEach(part => {
            const range = part.trim().match(/^(\d+)(?:-(\d+))?$/);
            if (!range) {
                return;
            }
            const start = Number(range[1]);
            const end = Number(range[2] || range[1]);
            for (let line = start; line <= end; line += 1) {
                lines.add(line);
            }
        });
    return [...lines].sort((a, b) => a - b);
}

module.exports = {
    parseLineRanges,
    tokenizeCodeLine,
};
