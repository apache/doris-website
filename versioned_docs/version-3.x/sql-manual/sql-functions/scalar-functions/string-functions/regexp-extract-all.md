---
{
    "title": "REGEXP_EXTRACT_ALL",
    "language": "en",
    "description": "The REGEXPEXTRACTALL function is used to perform a regular expression match on a given string str and extract all the parts that match the first sub "
}
---

## Description

The `REGEXP_EXTRACT_ALL` function is used to perform a regular expression match on a given string `str` and extract all the parts that match the first sub - pattern of the specified `pattern`. The function returns a string representing the matched part of the pattern, and the pattern must exactly match a portion of the input string `str`. If there is no match, or if the pattern does not contain any sub - patterns, an empty string is returned.

It should be noted that when handling character set matching, Utf-8 standard character classes should be used.  This ensures that functions can correctly identify and process various characters from different languages.

If the 'pattern' is not allowed regexp regular, throw error;

Support character match classes : https://github.com/google/re2/wiki/Syntax

## Syntax

```sql
REGEXP_EXTRACT_ALL(<str>, <pattern>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<str>` | This parameter is of type String. It represents the input string on which the regular expression matching will be performed. This can be a literal string value or a reference to a column in a table that contains string data.|
| `<pattern>` | This parameter is also of type String. It specifies the regular expression pattern that will be used to match against the input string <str>. The pattern can include various regular expression constructs such as character classes, quantifiers, and sub - patterns.|

## Return value

The function returns a string that represents the part of the input string that matches the first sub - pattern of the specified regular expression. The return type is String. If no matches are found, or if the pattern has no sub - patterns, an empty string is returned.

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

## Example

Basic matching of lowercase letters around 'C'.In this example, the pattern ([[:lower:]]+)C([[:lower:]]+) matches the part of the string where one or more lowercase letters are followed by 'C' and then one or more lowercase letters. The first sub - pattern ([[:lower:]]+) before 'C' matches 'b', so the result is ['b'].

```sql
mysql> SELECT regexp_extract_all('AbCdE', '([[:lower:]]+)C([[:lower:]]+)');
+--------------------------------------------------------------+
| regexp_extract_all('AbCdE', '([[:lower:]]+)C([[:lower:]]+)') |
+--------------------------------------------------------------+
| ['b']                                                        |
+--------------------------------------------------------------+
```

 Multiple matches in a string. Here, the pattern matches two parts in the string. The first match has the first sub - pattern matching 'b', and the second match has the first sub - pattern matching 'f'. So the result is ['b', 'f'].

```sql
mysql> SELECT regexp_extract_all('AbCdEfCg', '([[:lower:]]+)C([[:lower:]]+)');
+-----------------------------------------------------------------+
| regexp_extract_all('AbCdEfCg', '([[:lower:]]+)C([[:lower:]]+)') |
+-----------------------------------------------------------------+
| ['b','f']                                                       |
+-----------------------------------------------------------------+
```

Extracting keys from key - value pairs.The pattern matches key - value pairs in the string. The first sub - pattern captures the keys, so the result is ['abc', 'def', 'ghi'].

```sql
mysql> SELECT regexp_extract_all('abc=111, def=222, ghi=333','("[^"]+"|\\w+)=("[^"]+"|\\w+)');
+--------------------------------------------------------------------------------+
| regexp_extract_all('abc=111, def=222, ghi=333', '("[^"]+"|\w+)=("[^"]+"|\w+)') |
+--------------------------------------------------------------------------------+
| ['abc','def','ghi']                                                            |
+--------------------------------------------------------------------------------+
```
Matching Chinese characters.The pattern (\p{Han}+)(.+) first matches one or more Chinese characters with the first sub - pattern (\p{Han}+), so the result is ['这是一段中文'].

```sql
mysql> select regexp_extract_all('这是一段中文 This is a passage in English 1234567', '(\\p{Han}+)(.+)');
+------------------------------------------------------------------------------------------------+
| regexp_extract_all('这是一段中文 This is a passage in English 1234567', '(\p{Han}+)(.+)')       |
+------------------------------------------------------------------------------------------------+
| ['这是一段中文']                                                                               |
+------------------------------------------------------------------------------------------------+
```

Inserting data and using REGEXP_EXTRACT_ALL

```sql

CREATE TABLE test_regexp_extract_all (
    id INT,
    text_content VARCHAR(255),
    pattern VARCHAR(255)
) PROPERTIES ("replication_num"="1");


INSERT INTO test_regexp_extract_all VALUES
(1, 'apple1, banana2, cherry3', '([a-zA-Z]+)\\d'),
(2, 'red#123, blue#456, green#789', '([a-zA-Z]+)#\\d+'),
(3, 'hello@example.com, world@test.net', '([a-zA-Z]+)@');


SELECT id, regexp_extract_all(text_content, pattern) AS extracted_data
FROM test_regexp_extract_all;
```
```text
+------+----------------------+
| id   | extracted_data       |
+------+----------------------+
|    1 | ['apple', 'banana', 'cherry'] |
|    2 | ['red', 'blue', 'green']     |
|    3 | ['hello', 'world']           |
+------+----------------------+
```

No matched,return empty string

```sql
SELECT REGEXP_EXTRACT_ALL('ABC', '(\\d+)');
```
```text
+-------------------------------------+
| REGEXP_EXTRACT_ALL('ABC', '(\\d+)') |
+-------------------------------------+
|                                     |
+-------------------------------------+
```


emoji match
```sql
mysql> SELECT REGEXP_EXTRACT_ALL('👩‍💻,👨‍🚀', '(💻|🚀)');
+--------------------------------------------------------------+
| REGEXP_EXTRACT_ALL('👩‍💻,👨‍🚀', '(💻|🚀)')                      |
+--------------------------------------------------------------+
| ['💻','🚀']                                                 |
+--------------------------------------------------------------+
```


'Str' is NULL,return NULL

```sql
SELECT regexp_extract_all(NULL, '([a-z]+)');
```

```text
+--------------------------------------+
| regexp_extract_all(NULL, '([a-z]+)') |
+--------------------------------------+
| NULL                                 |
+--------------------------------------+
```

'pattern' is NULL, return NULL

```sql
SELECT regexp_extract_all('Hello World', NULL);
```

```text
+-----------------------------------------+
| regexp_extract_all('Hello World', NULL) |
+-----------------------------------------+
| NULL                                    |
+-----------------------------------------+
```

All parameters are NULL,return NULL

```sql
SELECT regexp_extract_all(NULL,NULL);
```

```text
+-------------------------------+
| regexp_extract_all(NULL,NULL) |
+-------------------------------+
| NULL                          |
+-------------------------------+
```

If the `pattern` is not allowed regexp regular,throw error;

```sql
SELECT regexp_extract_all('hello (world) 123', '([[:alpha:]+');
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[INVALID_ARGUMENT]Could not compile regexp pattern: ([[:alpha:]+
Error: missing ]: [[:alpha:]+
```

Pattern Modifiers

Case-insensitive: `(?i)` makes the match ignore case

```sql
SELECT REGEXP_EXTRACT_ALL('Hello hello HELLO', '(hello)') AS case_sensitive,
       REGEXP_EXTRACT_ALL('Hello hello HELLO', '(?i)(hello)') AS case_insensitive;
```

```text
+----------------+---------------------------+
| case_sensitive | case_insensitive          |
+----------------+---------------------------+
| ['hello']      | ['Hello','hello','HELLO'] |
+----------------+---------------------------+
```

Multiline mode: `(?m)` makes `^` and `$` match start/end of each line

```sql
SELECT REGEXP_EXTRACT_ALL('foo\nbar\nbaz', '^([a-z]+)') AS single_line,
       REGEXP_EXTRACT_ALL('foo\nbar\nbaz', '(?m)^([a-z]+)') AS multi_line;
```

```text
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
```

```text
+----------+------------+
| greedy   | non_greedy |
+----------+------------+
| ['aXbXcX'] | ['aX']   |
+----------+------------+
```