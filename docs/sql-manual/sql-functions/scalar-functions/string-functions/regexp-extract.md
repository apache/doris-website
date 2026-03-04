---
{
    "title": "REGEXP_EXTRACT",
    "language": "en",
    "description": "This is a function used to perform a regular match on a given string STR and extract the POS-th matching part that conforms to the specified pattern."
}
---

## Description
This is a function used to perform a regular match on a given string `STR` and extract the `POS`-th matching part that conforms to the specified pattern. For the function to return a matching result, the pattern must exactly match some part of the `STR`. 

If no match is found, an empty string will be returned.
It should be noted that when handling character set matching, Utf-8 standard character classes should be used. This ensures that functions can correctly identify and process various characters from different languages.

The `str` parameter is of 'string' type, representing the string to be subjected to regular matching.
The `pattern` parameter is of 'string' type, representing the target regular expression pattern.
The `pos` parameter is of 'integer' type, used to specify the position in the string from which to start searching for the regular expression match. The position starts from 1, and this parameter must be specified.

If the `pattern` is not allowed regexp regular,throw error;

Default supported character match classes : https://github.com/google/re2/wiki/Syntax

Doris supports enabling more advanced regular expression features, such as look-around zero-width assertions, through the session variable `enable_extended_regex` (default is `false`).

Supported character matching types when the session variable `enable_extended_regex` is set to `true`: https://www.boost.org/doc/libs/latest/libs/regex/doc/html/boost_regex/syntax/perl_syntax.html

## Syntax
```sql
REGEXP_EXTRACT(<str>, <pattern>, <pos>)
```
## Parameters

| Parameter | Description |
| -- | -- |
| `<str>` | The column that needs to undergo regular matching. It is of 'string' type.|
| `<pattern>` | 	The target regular expression pattern. It is of 'string' type.|
| `<pos>` | The parameter used to specify the position in the string from which to start searching for the regular expression match. It is an integer value representing the character position in the string (starting from 1). `pos` must be specified. |

## Return Value

The matching part of the pattern. It is of Varchar type. If no match is found, an empty string will be returned.

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

Pattern modifiers only take effect when using the default regex engine. If `enable_extended_regex=true` is enabled while using zero-width assertions (e.g., `(?<=...)`, `(?=...)`), the query will be handled by the Boost.Regex engine, and modifier behavior may not work as expected. It is recommended not to mix them.

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

## Example

Extract the first matching part.In this example, the regular expression ([[:lower:]]+)C([[:lower:]]+) matches the part of the string where one or more lowercase letters are followed by 'C' and then one or more lowercase letters. The first capturing group ([[:lower:]]+) before 'C' matches 'b', so the result is 'b'.

```sql
mysql> SELECT regexp_extract('AbCdE', '([[:lower:]]+)C([[:lower:]]+)', 1);
+-------------------------------------------------------------+
| regexp_extract('AbCdE', '([[:lower:]]+)C([[:lower:]]+)', 1) |
+-------------------------------------------------------------+
| b                                                           |
+-------------------------------------------------------------+
```
Extract the second matching part.Here, the second capturing group ([[:lower:]]+) after 'C' matches 'd', so the result is 'd'.

```sql
mysql> SELECT regexp_extract('AbCdE', '([[:lower:]]+)C([[:lower:]]+)', 2);
+-------------------------------------------------------------+
| regexp_extract('AbCdE', '([[:lower:]]+)C([[:lower:]]+)', 2) |
+-------------------------------------------------------------+
| d                                                           |
+-------------------------------------------------------------+
```
Match Chinese characters.The pattern (\p{Han}+)(.+) first matches one or more Chinese characters (\p{Han}+) and then matches the remaining part of the string ((.+)). The second capturing group matches the non - Chinese part of the string, so the result is 'This is a passage in English 1234567'.

```sql
mysql> select regexp_extract('这是一段中文 This is a passage in English 1234567', '(\\p{Han}+)(.+)', 2);
+-----------------------------------------------------------------------------------------------+
| regexp_extract('这是一段中文 This is a passage in English 1234567', '(\p{Han}+)(.+)', 2)       |
+-----------------------------------------------------------------------------------------------+
| This is a passage in English 1234567                                                          |
+-----------------------------------------------------------------------------------------------+
```

Insert variable values and perform matching.This example inserts data into a table and then uses the REGEXP_EXTRACT function to extract matching parts from the stored strings based on the stored patterns and positions.

```sql

CREATE TABLE test_table_for_regexp_extract (
        id INT,
        text_data VARCHAR(500),
        pattern VARCHAR(100),
        pos INT
    ) PROPERTIES ("replication_num"="1");

INSERT INTO test_table_for_regexp_extract VALUES
    (1, 'AbCdE', '([[:lower:]]+)C([[:lower:]]+)', 1),    
    (2, 'AbCdE', '([[:lower:]]+)C([[:lower:]]+)', 2),    
    (3, '这是一段中文 This is a passage in English 1234567', '(\\p{Han}+)(.+)', 2);

SELECT id, regexp_extract(text_data, pattern, pos) as extract_result FROM test_table_for_regexp_extract ORDER BY id;

```
```text
+------+----------------+
| id   | extract_result |
+------+----------------+
|    1 | b              |
|    2 | d              |
|    3 | This is a passage in English 1234567 |
+------+----------------+
```

Test with a pattern that has no match.Since the pattern ([[:digit:]]+) (one or more digits) does not match any part of the string 'AbCdE', an empty string is returned.

```sql
SELECT regexp_extract('AbCdE', '([[:digit:]]+)', 1);
```

```text
+------------------------------------------------+
| regexp_extract('AbCdE', '([[:digit:]]+)', 1)  |
+------------------------------------------------+
|                                                |
+------------------------------------------------+
```
Emoji test case

```sql
SELECT regexp_extract('Text 😊 More 😀', '😊|😀',0);

```

```text
+------------------------------------------------------+
| regexp_extract('Text 😊 More 😀', '😊|😀',0)                 |
+------------------------------------------------------+
| 😊                                                     |
+------------------------------------------------------+

```

'str' is NULL, return NULL

```sql
mysql> SELECT REGEXP_EXTRACT(NULL, '([a-z]+)', 1);
+-------------------------------------+
| REGEXP_EXTRACT(NULL, '([a-z]+)', 1) |
+-------------------------------------+
| NULL                                |
+-------------------------------------+
```

'pattern' is NULL,return NULL

```sql
mysql> SELECT REGEXP_EXTRACT('Hello World', NULL, 1);
+----------------------------------------+
| REGEXP_EXTRACT('Hello World', NULL, 1) |
+----------------------------------------+
| NULL                                   |
+----------------------------------------+
```

'pos' is NULL,return NULL

```sql
mysql> SELECT REGEXP_EXTRACT('Hello World', '([a-z]+)', NULL);
+-------------------------------------------------+
| REGEXP_EXTRACT('Hello World', '([a-z]+)', NULL) |
+-------------------------------------------------+
| NULL                                            |
+-------------------------------------------------+
```

All parameters are NULL,return NULL

```sql
mysql> SELECT REGEXP_EXTRACT(NULL, NULL, NULL);
+----------------------------------+
| REGEXP_EXTRACT(NULL, NULL, NULL) |
+----------------------------------+
| NULL                             |
+----------------------------------+
```

If the `pattern` is not allowed regexp regular,throw error;

```sql
SELECT regexp_extract('AbCdE', '([[:digit:]]+', 1);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[INVALID_ARGUMENT]Could not compile regexp pattern: ([[:digit:]]+
Error: missing ): ([[:digit:]]+
```

Advanced regexp
```sql
SELECT regexp_extract('foo123bar456baz', '(?<=foo)(\\d+)(?=bar)', 1);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]Invalid regex pattern: (?<=foo)(\d+)(?=bar). Error: invalid perl operator: (?<
```

```sql
SET enable_extended_regex = true;
SELECT regexp_extract('foo123bar456baz', '(?<=foo)(\\d+)(?=bar)', 1);
```
```text
+---------------------------------------------------------------+
| regexp_extract('foo123bar456baz', '(?<=foo)(\\d+)(?=bar)', 1) |
+---------------------------------------------------------------+
| 123                                                           |
+---------------------------------------------------------------+
```

Pattern Modifiers

Case-insensitive matching: `(?i)` makes the match ignore case

```sql
SELECT REGEXP_EXTRACT('Hello World', '(hello)', 1) AS case_sensitive,
       REGEXP_EXTRACT('Hello World', '(?i)(hello)', 1) AS case_insensitive;
```

```text
+----------------+------------------+
| case_sensitive | case_insensitive |
+----------------+------------------+
|                | Hello            |
+----------------+------------------+
```

`.` matches newline by default; use `(?-s)` to prevent `.` from matching newline

```sql
SELECT REGEXP_EXTRACT('foo\nbar', '^(.+)$', 1) AS dot_match_nl,
       REGEXP_EXTRACT('foo\nbar', '(?-s)^(.+)$', 1) AS dot_not_match_nl;
```

```text
+--------------+------------------+
| dot_match_nl | dot_not_match_nl |
+--------------+------------------+
| foo
bar      |                  |
+--------------+------------------+
```

Multiline mode: `(?m)` makes `^` and `$` match start/end of each line

```sql
SELECT REGEXP_EXTRACT('foo\nbar', '^(bar)', 1) AS single_line,
       REGEXP_EXTRACT('foo\nbar', '(?m)^(bar)', 1) AS multi_line;
```

```text
+-------------+------------+
| single_line | multi_line |
+-------------+------------+
|             | bar        |
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