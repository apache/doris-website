---
{
    "title": "REGEXP",
    "language": "en",
    "description": "Performs a regular expression match on the string str, returning true if the match succeeds, otherwise false."
}
---

## Description

Performs a regular expression match on the string str, returning true if the match succeeds, otherwise false. pattern is the regular expression pattern.
It should be noted that when handling character set matching, Utf-8 standard character classes should be used. This ensures that functions can correctly identify and process various characters from different languages.

If the `pattern` is not allowed regexp regular,throw error;

Support character match classes : https://github.com/google/re2/wiki/Syntax

## Syntax

```sql
REGEXP(<str>, <pattern>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<str>` | String type. Represents the string to be matched against the regular expression, which can be a column in a table or a literal string.|
| `<pattern>` | String type. The regular expression pattern used to match against the string <str>. Regular expressions provide a powerful way to define complex search patterns, including character classes, quantifiers, and anchors.|

## Return Value

The REGEXP function returns a BOOLEAN value. If the string <str> matches the regular expression pattern <pattern>, the function returns true (represented as 1 in SQL); if not, it returns false (represented as 0 in SQL).

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

## Examples

```sql
CREATE TABLE test ( k1 VARCHAR(255) ) properties("replication_num"="1")

INSERT INTO test (k1) VALUES ('billie eillish'), ('It\'s ok'), ('billie jean'), ('hello world');
```


```sql
--- Find all data in the k1 column starting with 'billie'
SELECT k1 FROM test WHERE k1 REGEXP '^billie'
--------------

+----------------+
| k1             |
+----------------+
| billie eillish |
| billie jean    |
+----------------+
2 rows in set (0.02 sec)

--- Find data in the k1 column ending with 'ok':
SELECT k1 FROM test WHERE k1 REGEXP 'ok$'
--------------

+---------+
| k1      |
+---------+
| It's ok |
+---------+
1 row in set (0.03 sec)
```
Chinese Character Example

```sql
mysql> select regexp('这是一段中文 This is a passage in English 1234567', '\\p{Han}');
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
SELECT id, name FROM test_regexp WHERE name REGEXP 'e$';
```

```text
+------+---------+
| id   | name    |
+------+---------+
|    1 | Alice   |
|    3 | Charlie |
+------+---------+
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


'str' is NULL,return NULL

```sql
mysql> SELECT REGEXP(NULL, '^billie');
+-------------------------+
| REGEXP(NULL, '^billie') |
+-------------------------+
|                    NULL |
+-------------------------+
```

'pattern' is NULL, return NULL

```sql
mysql> SELECT REGEXP('billie eillish', NULL);
+--------------------------------+
| REGEXP('billie eillish', NULL) |
+--------------------------------+
|                           NULL |
+--------------------------------+
```

All parameters are NULL,return NULL

```sql
mysql> SELECT REGEXP(NULL, NULL);
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

`.` matches newline by default; with `(?-s)`, `.` does not match newline

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
SELECT REGEXP_EXTRACT('aXbXc', '(a.*X)', 1) AS greedy,
       REGEXP_EXTRACT('aXbXc', '(?U)(a.*X)', 1) AS non_greedy;
```

```text
+--------+------------+
| greedy | non_greedy |
+--------+------------+
| aXbX   | aX         |
+--------+------------+
```