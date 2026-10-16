---
{
    "title": "REGEXP",
    "language": "en",
    "description": "~ Performs a regular expression match on the string str, returning true if the match succeeds, otherwise false."
}
---

## Description

Matches a regular expression against `<str>`, returning true for a match and false otherwise. A pattern does not need to match the whole string; use `^` and `$` for a full match. Returns NULL if either argument is NULL and reports an error for an invalid pattern. Strings are processed as UTF-8; use character classes such as `\p{Han}` to match Unicode character categories.

See [RE2 syntax](https://github.com/google/re2/wiki/Syntax) for ordinary patterns.

### Matching Engines and Session Variables

Ordinary `LIKE` and `REGEXP` matching can use Hyperscan acceleration. The following session variables control fallback behavior:

| Session variable | Default | Behavior |
| --- | --- | --- |
| `enable_hyperscan_fallback` | `true` | Supported in the Doris 4.1 series since 4.1.5. Allows a path that actually compiles with Hyperscan to fall back to RE2 if compilation fails or match scratch space cannot be allocated. When false, the corresponding error is returned. Simple-pattern optimizations and paths that use RE2 directly are unaffected. |
| `enable_extended_regex` | `false` | Allows `REGEXP` to try Boost.Regex when RE2 rejects the pattern, supporting extended syntax such as look-around. It does not extend RE2 syntax or add extended syntax to `LIKE`, `MATCH_REGEXP`, or `MULTI_MATCH_ANY`. |

In the Doris 4.1 series since 4.1.5, `enable_extended_regex=true` applies to both constant patterns and non-constant patterns read from columns. If a Hyperscan path uses `enable_hyperscan_fallback=false`, a Hyperscan failure still returns an error; enabling `enable_extended_regex` does not bypass that error.

See the [session variable reference](../../../basic-element/session-variables.md#enable_hyperscan_fallback) for the values and scope of `enable_hyperscan_fallback`.

See [Boost.Regex Perl syntax](https://www.boost.org/doc/libs/latest/libs/regex/doc/html/boost_regex/syntax/perl_syntax.html) for extended patterns. The matching overhead of Boost.Regex applies only when that engine is used. Complex backtracking patterns may also report `Failed to match regex expression`.

### Repetition Limit

In the Doris 4.1 series since 4.1.5, a regular expression submitted to Hyperscan skips Hyperscan compilation if a `{m}`, `{m,}`, or `{m,n}` form contains a number greater than 50. For example, `a{51}`, `a{51,}`, and `a{0,51}` trigger this check; `a{50}` and `a{0,50}` do not. This is a conservative text check, so the same forms inside character classes or comments may also trigger it.

| Matching path | Behavior when the check is triggered |
| --- | --- |
| Hyperscan path for ordinary `LIKE` or `REGEXP` | Tries fallback when `enable_hyperscan_fallback=true`; otherwise returns an error. The pattern must still satisfy the target engine's syntax and repetition limits. |
| Row matching for `MATCH_REGEXP` and inverted-index regular expression matching | Rejects the pattern directly; does not use `enable_hyperscan_fallback`. |
| Multi-pattern matching for `MULTI_MATCH_ANY` | Rejects the pattern directly; does not use `enable_hyperscan_fallback`. |

When the check is triggered without fallback, the error contains:

```text
Skip hyperscan compilation because bounded repetition exceeds 50
```

## Syntax

```sql
REGEXP(<str>, <pattern>)
<str> [NOT] REGEXP <pattern>
<str> [NOT] RLIKE <pattern>
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<str>` | String type. Represents the string to be matched against the regular expression, which can be a column in a table or a literal string.|
| `<pattern>` | String type. The regular expression pattern used to match against the string `<str>`. Regular expressions provide a powerful way to define complex search patterns, including character classes, quantifiers, and anchors.|

## Return Value

The REGEXP function returns a BOOLEAN value. If the string `<str>` matches the regular expression pattern `<pattern>`, the function returns true (represented as 1 in SQL); if not, it returns false (represented as 0 in SQL). Returns NULL if either argument is NULL.

In the Doris 4.1 series since 4.1.5, constant empty patterns behave consistently with column patterns: an empty pattern matches every non-NULL string, including the empty string.

**Default Behavior**:

| Default Setting                      | Behavior                                                                                  |
| ------------------------------------ | ----------------------------------------------------------------------------------------- |
| `.` matches newline                  | `.` can match `\n` (newline) by default.                                                  |
| Case-sensitive                       | Matching is case-sensitive.                                                               |
| `^`/`$` match full string boundaries | `^` matches only the start of the string, `$` matches only the end, not line starts/ends. |
| Greedy quantifiers                   | `*`, `+`, etc. match as much as possible by default.                                      |
| UTF-8                                | Strings are processed as UTF-8.                                                           |

**Pattern Modifiers**:

You can override the default behavior by prefixing the `pattern` with `(?flags)`. Multiple modifiers can be combined, e.g., `(?im)`; a `-` prefix disables the corresponding option, e.g., `(?-s)`.

The following table describes modifiers on the ordinary Hyperscan/RE2 path. If a pattern falls back to Boost.Regex because of syntax such as look-around, interpret modifiers according to Boost.Regex syntax; the engines do not necessarily behave identically.

| Flag    | Meaning                                                                      |
| ------- | ---------------------------------------------------------------------------- |
| `(?i)`  | Case-insensitive matching                                                    |
| `(?-i)` | Case-sensitive (default)                                                     |
| `(?s)`  | `.` matches newline (enabled by default)                                     |
| `(?-s)` | `.` does **not** match newline                                               |
| `(?m)`  | Multiline mode: `^` matches start of each line, `$` matches end of each line |
| `(?-m)` | Single-line mode: `^`/`$` match full string boundaries (default)             |
| `(?U)`  | Non-greedy quantifiers: `*`, `+`, etc. match as little as possible           |
| `(?-U)` | Greedy quantifiers (default): `*`, `+`, etc. match as much as possible       |

<a id="examples"></a>

## Example

```sql
CREATE TABLE test ( k1 VARCHAR(255) ) properties("replication_num"="1");

INSERT INTO test (k1) VALUES ('billie eillish'), ('It\'s ok'), ('billie jean'), ('hello world');
```


```sql
--- Find all data in the k1 column starting with 'billie'
SELECT k1 FROM test WHERE k1 REGEXP '^billie' ORDER BY k1;
```

```text
+----------------+
| k1             |
+----------------+
| billie eillish |
| billie jean    |
+----------------+
```

```sql
--- Find data in the k1 column ending with 'ok':
SELECT k1 FROM test WHERE k1 REGEXP 'ok$';
```

```text
+---------+
| k1      |
+---------+
| It's ok |
+---------+
```
Chinese Character Example

```sql
select regexp('这是一段中文 This is a passage in English 1234567', '\\p{Han}');
```

```text
+-----------------------------------------------------------------------------+
| ('这是一段中文 This is a passage in English 1234567' regexp '\p{Han}')         |
+-----------------------------------------------------------------------------+
|                                                                           1 |
+-----------------------------------------------------------------------------+
```

Insertion and Testing for Simple String Matching

```sql
CREATE TABLE test_regexp (
    id INT,
    name VARCHAR(255)
) PROPERTIES("replication_num"="1");

INSERT INTO test_regexp (id, name) VALUES
    (1, 'Alice'),
    (2, 'Bob'),
    (3, 'Charlie'),
    (4, 'David');

-- Find all names starting with 'A'
SELECT id, name FROM test_regexp WHERE name REGEXP '^A';
```

```text
+------+-------+
| id   | name  |
+------+-------+
|    1 | Alice |
+------+-------+
```

Special Character Matching Test

```sql
-- Insert names with special characters
INSERT INTO test_regexp (id, name) VALUES
    (5, 'Anna-Maria'),
    (6, 'John_Doe');

-- Find names containing the '-' character
SELECT id, name FROM test_regexp WHERE name REGEXP '-';
```
```text
+------+------------+
| id   | name       |
+------+------------+
|    5 | Anna-Maria |
+------+------------+
```

Test for Ending String Matching
```sql
-- Find names ending with 'e'
SELECT id, name FROM test_regexp WHERE name REGEXP 'e$' ORDER BY id;
```

```text
+------+----------+
| id   | name     |
+------+----------+
|    1 | Alice    |
|    3 | Charlie  |
|    6 | John_Doe |
+------+----------+
```

Emoji test

```sql
SELECT 'Hello' REGEXP '😀'; 
```

```text
+-----------------------+
| 'Hello' REGEXP '😀'     |
+-----------------------+
|                     0 |
+-----------------------+
```


An empty pattern matches every non-NULL string, including the empty string:

```sql
SELECT REGEXP('abc', ''), REGEXP('', ''), REGEXP(NULL, '');
```

```text
1    1    NULL
```

'str' is NULL,return NULL

```sql
SELECT REGEXP(NULL, '^billie');
```

```text
+-------------------------+
| REGEXP(NULL, '^billie') |
+-------------------------+
|                    NULL |
+-------------------------+
```

'pattern' is NULL, return NULL

```sql
SELECT REGEXP('billie eillish', NULL);
```

```text
+--------------------------------+
| REGEXP('billie eillish', NULL) |
+--------------------------------+
|                           NULL |
+--------------------------------+
```

All parameters are NULL,return NULL

```sql
SELECT REGEXP(NULL, NULL);
```

```text
+--------------------+
| REGEXP(NULL, NULL) |
+--------------------+
|               NULL |
+--------------------+
```

If the `pattern` is not allowed regexp regular,throw error;

```sql
SELECT REGEXP('Hello, World!', '([a-z');
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[INTERNAL_ERROR]Invalid regex expression: ([a-z
```

Advanced patterns require extended syntax. Ordinary RE2 fallback does not support look-around:

```sql
SET enable_hyperscan_fallback = true;
SET enable_extended_regex = true;
SELECT REGEXP('foobar', '(?<=foo)bar');
```

```text
1
```

Non-constant patterns also support extended syntax (in the Doris 4.1 series since 4.1.5):

```sql
CREATE TABLE regexp_patterns (
    id INT,
    s VARCHAR(32),
    p VARCHAR(64)
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO regexp_patterns VALUES
    (1, 'foobar', '(?<=foo)bar'),
    (2, 'fobar', '(?<=foo)bar'),
    (3, 'foo123bar', 'foo(?=123)'),
    (4, 'foo124bar', 'foo(?=123)');

SELECT id, REGEXP(s, p) FROM regexp_patterns ORDER BY id;
```

```text
1    1
2    0
3    1
4    0
```

Restore the session setting before running the ordinary syntax examples below:

```sql
SET enable_extended_regex = false;
```

Pattern Modifiers

Case-insensitive matching: `(?i)` makes the match ignore case

```sql
SELECT REGEXP('Hello World', 'hello') AS case_sensitive, REGEXP('Hello World', '(?i)hello') AS case_insensitive;
```

```text
+----------------+------------------+
| case_sensitive | case_insensitive |
+----------------+------------------+
|              0 |                1 |
+----------------+------------------+
```

`.` matches newline by default; use `(?-s)` to prevent `.` from matching newline

```sql
SELECT REGEXP('foo\nbar', '^.+$') AS dot_match_nl, REGEXP('foo\nbar', '(?-s)^.+$') AS dot_not_match_nl;
```

```text
+--------------+------------------+
| dot_match_nl | dot_not_match_nl |
+--------------+------------------+
|            1 |                0 |
+--------------+------------------+
```

Multiline mode: `(?m)` makes `^` and `$` match start/end of each line

```sql
SELECT REGEXP('foo\nbar', '^bar') AS single_line, REGEXP('foo\nbar', '(?m)^bar') AS multi_line;
```

```text
+-------------+------------+
| single_line | multi_line |
+-------------+------------+
|           0 |          1 |
+-------------+------------+
```

Greedy vs non-greedy: `(?U)` makes quantifiers match as little as possible

```sql
SELECT REGEXP_EXTRACT('aXbXc', '(a.*X)', 1) AS greedy, REGEXP_EXTRACT('aXbXc', '(?U)(a.*X)', 1) AS non_greedy;
```

```text
+--------+------------+
| greedy | non_greedy |
+--------+------------+
| aXbX   | aX         |
+--------+------------+
```