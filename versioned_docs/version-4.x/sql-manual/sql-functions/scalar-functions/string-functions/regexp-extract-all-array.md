---
{
    "title": "REGEXP_EXTRACT_ALL_ARRAY",
    "language": "en",
    "description": "The REGEXP_EXTRACT_ALL_ARRAY function performs regular expression matching and returns all values captured by the first sub-pattern as an array."
}
---

## Description

The `REGEXP_EXTRACT_ALL_ARRAY` function performs regular expression matching on a given string `str` and returns all values captured by the first sub-pattern of `pattern` as an array.

If there is no match, or if the pattern has no sub-pattern, an empty array is returned.

Default supported character match classes: https://github.com/google/re2/wiki/Syntax

Doris supports enabling advanced regex features (such as look-around assertions) via session variable `enable_extended_regex` (default: `false`).

When `enable_extended_regex=true`, supported syntax follows Boost.Regex: https://www.boost.org/doc/libs/latest/libs/regex/doc/html/boost_regex/syntax/perl_syntax.html

## Syntax

```sql
REGEXP_EXTRACT_ALL_ARRAY(<str>, <pattern>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<str>` | Input string for regex matching. |
| `<pattern>` | Regex pattern. The first capturing group is used for extraction. |

## Return value

Returns `ARRAY<STRING>`.

If no matches are found, returns `[]`.

If any parameter is NULL, return NULL

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

Basic matching of lowercase letters around 'C'.

```sql
SELECT regexp_extract_all_array('AbCdE', '([[:lower:]]+)C([[:lower:]]+)') AS res;
+-------+
| res   |
+-------+
| ["b"] |
+-------+
```

```sql
SELECT 
    array_size(
        regexp_extract_all_array('AbCdE', '([[:lower:]]+)C([[:lower:]]+)') 
    )AS res_size;
+----------+
| res_size |
+----------+
|        1 |
+----------+
```

Multiple matches in a string.

```sql
SELECT regexp_extract_all_array('AbCdEfCg', '([[:lower:]]+)C([[:lower:]]+)') AS res;
+------------+
| res        |
+------------+
| ["b", "f"] |
+------------+
```

Extracting keys from key - value pairs.

```sql
SELECT regexp_extract_all_array('abc=111, def=222, ghi=333','("[^"]+"|\\w+)=("[^"]+"|\\w+)') AS res;
+-----------------------+
| res                   |
+-----------------------+
| ["abc", "def", "ghi"] |
+-----------------------+
```

Matching Chinese characters.

```sql
SELECT regexp_extract_all_array('这是一段中文 This is a passage in English 1234567', '(\\p{Han}+)(.+)') AS res;
+------------------------+
| res                    |
+------------------------+
| ["这是一段中文"]       |
+------------------------+
```

Inserting data and using REGEXP_EXTRACT_ALL_ARRAY.

```sql
CREATE TABLE test_regexp_extract_all_array (
    id INT,
    text_content VARCHAR(255),
    pattern VARCHAR(255)
) PROPERTIES ("replication_num"="1");

INSERT INTO test_regexp_extract_all_array VALUES
(1, 'apple1, banana2, cherry3', '([a-zA-Z]+)\\d'),
(2, 'red#123, blue#456, green#789', '([a-zA-Z]+)#\\d+'),
(3, 'hello@example.com, world@test.net', '([a-zA-Z]+)@');

SELECT id, regexp_extract_all_array(text_content, pattern) AS extracted_data
FROM test_regexp_extract_all_array;
+------+-------------------------------+
| id   | extracted_data                |
+------+-------------------------------+
|    1 | ["apple", "banana", "cherry"] |
|    2 | ["red", "blue", "green"]      |
|    3 | ["hello", "world"]            |
+------+-------------------------------+
```

No matched, return empty array.

```sql
SELECT REGEXP_EXTRACT_ALL_ARRAY('ABC', '(\\d+)');
+-------------------------------------------+
| REGEXP_EXTRACT_ALL_ARRAY('ABC', '(\\d+)') |
+-------------------------------------------+
| []                                        |
+-------------------------------------------+
```

Emoji match.

```sql
SELECT REGEXP_EXTRACT_ALL_ARRAY('👩‍💻,👨‍🚀', '(💻|🚀)') AS res;
+------------------+
| res              |
+------------------+
| ["💻", "🚀"]         |
+------------------+
```

'str' is NULL, return NULL.

```sql
SELECT regexp_extract_all_array(NULL, '([a-z]+)') AS res;
+------+
| res  |
+------+
| NULL |
+------+
```

'pattern' is NULL, return NULL.

```sql
SELECT regexp_extract_all_array('Hello World', NULL) AS res;
+------+
| res  |
+------+
| NULL |
+------+
```

All parameters are NULL, return NULL.

```sql
SELECT regexp_extract_all_array(NULL, NULL) AS res;
+------+
| res  |
+------+
| NULL |
+------+
```

If the `pattern` is not allowed regexp regular, throw error.

```sql
SELECT regexp_extract_all_array('hello (world) 123', '([[:alpha:]+') AS res;
-- ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]Invalid regex pattern: ([[:alpha:]+. Error: missing ]: [[:alpha:]+. If you need advanced regex features, try setting enable_extended_regex=true
```

Advanced regexp.

```sql
SELECT REGEXP_EXTRACT_ALL_ARRAY('ID:AA-1,ID:BB-2,ID:CC-3', '(?<=ID:)([A-Z]{2}-\\d)');
-- ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]Invalid regex pattern: (?<=ID:)([A-Z]{2}-\d). Error: invalid perl operator: (?<. If you need advanced regex features, try setting enable_extended_regex=true
```

```sql
SET enable_extended_regex = true;
SELECT REGEXP_EXTRACT_ALL_ARRAY('ID:AA-1,ID:BB-2,ID:CC-3', '(?<=ID:)([A-Z]{2}-\\d)') AS res;
+--------------------------+
| res                      |
+--------------------------+
| ["AA-1", "BB-2", "CC-3"] |
+--------------------------+
```

Pattern Modifiers

Case-insensitive matching: `(?i)` makes the match ignore case

```sql
SELECT REGEXP_EXTRACT_ALL_ARRAY('Hello hello HELLO', '(hello)') AS case_sensitive,
       REGEXP_EXTRACT_ALL_ARRAY('Hello hello HELLO', '(?i)(hello)') AS case_insensitive;
+----------------+-----------------------------+
| case_sensitive | case_insensitive            |
+----------------+-----------------------------+
| ["hello"]      | ["Hello", "hello", "HELLO"] |
+----------------+-----------------------------+
```

Multiline mode: `(?m)` makes `^` and `$` match start/end of each line
```sql
SELECT REGEXP_EXTRACT_ALL_ARRAY('foo\nbar\nbaz', '^([a-z]+)') AS single_line,
       REGEXP_EXTRACT_ALL_ARRAY('foo\nbar\nbaz', '(?m)^([a-z]+)') AS multi_line;
+-------------+---------------------+
| single_line | multi_line          |
+-------------+---------------------+
| ['foo']     | ['foo','bar','baz'] |
+-------------+---------------------+
```

Greedy vs non-greedy: `(?U)` makes quantifiers match as little as possible
```sql
SELECT REGEXP_EXTRACT_ALL('aXbXcXd', '(a.*X)') AS greedy,
       REGEXP_EXTRACT_ALL('aXbXcXd', '(?U)(a.*X)') AS non_greedy;
+----------+------------+
| greedy   | non_greedy |
+----------+------------+
| ['aXbXcX'] | ['aX']   |
+----------+------------+
```
