---
{
    "title": "REGEXP_EXTRACT_ALL",
    "language": "en"
}
---

## Description

The `REGEXP_EXTRACT_ALL` function is used to perform a regular expression match on a given string `str` and extract all the parts that match the first sub - pattern of the specified `pattern`. For the function to return an array of strings representing the matched parts of the pattern, the pattern must exactly match a portion of the input string `str`. If there is no match, or if the pattern does not contain any sub - patterns, an empty string is returned.

It should be noted that when handling character set matching, Utf-8 standard character classes should be used.  This ensures that functions can correctly identify and process various characters from different languages.

If the 'pattern' is not allowed regexp regular, throw error;

Default supported character match classes : https://github.com/google/re2/wiki/Syntax

Doris supports enabling more advanced regular expression features, such as look-around zero-width assertions, through the session variable `enable_extended_regex` (default is `false`).

Supported character matching types when the session variable `enable_extended_regex` is set to `true`: https://www.boost.org/doc/libs/latest/libs/regex/doc/html/boost_regex/syntax/perl_syntax.html

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

The function returns an array of strings that represent the parts of the input string that match the first sub - pattern of the specified regular expression. The return type is an array of String values. If no matches are found, or if the pattern has no sub - patterns, an empty array is returned.

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

Extracting keys from key - value pairs.The pattern matches key - value pairs in the string. The first sub - pattern captures the keys, so the result is an array of the keys ['abc', 'def', 'ghi'].

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

Advanced regexp
```sql
SELECT REGEXP_EXTRACT_ALL('ID:AA-1,ID:BB-2,ID:CC-3', '(?<=ID:)([A-Z]{2}-\\d)');
-- ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]Invalid regex pattern: (?<=ID:)([A-Z]{2}-\d). Error: invalid perl operator: (?<
```

```sql
SET enable_extended_regex = true;
SELECT REGEXP_EXTRACT_ALL('ID:AA-1,ID:BB-2,ID:CC-3', '(?<=ID:)([A-Z]{2}-\\d)');
```
```text
+-------------------------------------------------------------------------+
| REGEXP_EXTRACT_ALL('ID:AA-1,ID:BB-2,ID:CC-3', '(?<=ID:)([A-Z]{2}-\\d)') |
+-------------------------------------------------------------------------+
| ['AA-1','BB-2','CC-3']                                                  |
+-------------------------------------------------------------------------+
```