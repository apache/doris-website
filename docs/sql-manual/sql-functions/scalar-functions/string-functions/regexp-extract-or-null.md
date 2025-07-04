---
{
    "title": "REGEXP_EXTRACT_OR_NULL",
    "language": "en"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at
  http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## Description

Extract the first substring that matches the target regular expression pattern from the text string, and extract a specific group from it based on the expression group index.

It should be noted that when handling character set matching, Utf-8 standard character classes should be used. This ensures that functions can correctly identify and process various characters from different languages.
:::info
Support since Apache Doris 3.0.2
:::

## Syntax

```sql
REGEXP_EXTRACT_OR_NULL(<str>, <pattern>, <pos>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<str>` | A string parameter. It represents the text string in which the regular expression matching will be performed. This string can contain any combination of characters, and the function will search within it for substrings that match the <pattern>. |
| `<pattern>` |A string parameter. It is the target regular expression pattern. This pattern can include various regular expression metacharacters and character classes, which precisely define the rules for the substring to be matched |
| `<pos>` | An integer parameter. It indicates the index of the expression group to be extracted. The indexing starts from 1. If <pos> is set to 0, the entire first matching substring will be returned. If <pos> is a negative number or exceeds the number of expression groups in the pattern, the function will return NULL. |

## Return Value

Return a string type, with the result being the part that matches `<pattern>`.

 If the input `<pos>` is 0, return the entire first matching substring.
 If the input `<pos>` is invalid (negative or exceeds the number of expression groups), return NULL.
 If the regular expression fails to match, return NULL.
 If the `<pos>` < 0,return NULL;
 If the `pos` > the length of `<str>`,return NULL;

## Example

Extracting a specific group from a match. Explanation: The regular expression ([[:lower:]]+)C([[:lower:]]+) looks for sequences of one or more lowercase letters separated by 'C'. The group with index 1 corresponds to the first sequence of lowercase letters, so 'b' is returned.

```sql
SELECT REGEXP_EXTRACT_OR_NULL('123AbCdExCx', '([[:lower:]]+)C([[:lower:]]+)', 1);
```

```text
+---------------------------------------------------------------------------+
| REGEXP_EXTRACT_OR_NULL('123AbCdExCx', '([[:lower:]]+)C([[:lower:]]+)', 1) |
+---------------------------------------------------------------------------+
| b                                                                         |
+---------------------------------------------------------------------------+
```

Returning the entire matched substring.When <pos> is 0, the whole first substring that matches the pattern is returned.

```sql
SELECT REGEXP_EXTRACT_OR_NULL('123AbCdExCx', '([[:lower:]]+)C([[:lower:]]+)', 0);
```

```text
+---------------------------------------------------------------------------+
| REGEXP_EXTRACT_OR_NULL('123AbCdExCx', '([[:lower:]]+)C([[:lower:]]+)', 0) |
+---------------------------------------------------------------------------+
| bCd                                                                       |
+---------------------------------------------------------------------------+
```

An invalid group index.Since the pattern has only 2 groups, an index of 5 is out of range, so NULL is returned.

```sql
SELECT REGEXP_EXTRACT_OR_NULL('123AbCdExCx', '([[:lower:]]+)C([[:lower:]]+)', 5);
```

```text
+---------------------------------------------------------------------------+
| REGEXP_EXTRACT_OR_NULL('123AbCdExCx', '([[:lower:]]+)C([[:lower:]]+)', 5) |
+---------------------------------------------------------------------------+
| NULL                                                                      |
+---------------------------------------------------------------------------+
```
A non - matching regular expression.There is no part of the string 'AbCdE' that fully matches the pattern

```sql
SELECT REGEXP_EXTRACT_OR_NULL('AbCdE', '([[:lower:]]+)C([[:upper:]]+)', 1);
```

```text
+---------------------------------------------------------------------+
| REGEXP_EXTRACT_OR_NULL('AbCdE', '([[:lower:]]+)C([[:upper:]]+)', 1) |
+---------------------------------------------------------------------+
| NULL                                                                |
+---------------------------------------------------------------------+
```

Chinese character matching.The pattern (\p{Han}+)(.+) first matches one or more Chinese characters and then any remaining characters. The group with index 2 represents the non - Chinese part of the string after the Chinese characters.

```sql
select REGEXP_EXTRACT_OR_NULL('这是一段中文 This is a passage in English 1234567', '(\\p{Han}+)(.+)', 2);
```

```text
+---------------------------------------------------------------------------------------------------------+
| REGEXP_EXTRACT_OR_NULL('这是一段中文 This is a passage in English 1234567', '(\\p{Han}+)(.+)', 2)       |
+---------------------------------------------------------------------------------------------------------+
|  This is a passage in English 1234567                                                                   |
+---------------------------------------------------------------------------------------------------------+
```

Inserting data into a table and performing extraction
```sql

CREATE TABLE test_regexp_extract_or_null (
    id INT,
    text_column VARCHAR(255),
    pattern_column VARCHAR(255),
    position_column INT
) PROPERTIES ("replication_num"="1");

INSERT INTO test_regexp_extract_or_null VALUES
(1, 'abc123def', '([a-z]+)([0-9]+)([a-z]+)', 2),
(2, 'Hello World', '([A-Z][a-z]+) ([A-Z][a-z]+)', 0),
(3, '123-456-789', '([0-9]{3})-([0-9]{3})-([0-9]{3})', 3),
(4, 'example@example.com', '([a-z]+)@([a-z]+)\\.([a-z]+)', 1),
(5, '测试文本 test text', '(\\p{Han}+) (.+)', 1);

SELECT id, REGEXP_EXTRACT_OR_NULL(text_column, pattern_column, position_column) AS extracted_result
FROM test_regexp_extract_or_null
ORDER BY id;

```
```text
+------+-----------------+
| id   | extracted_result|
+------+-----------------+
|    1 | 123             |
|    2 | Hello World     |
|    3 | 789             |
|    4 | example         |
|    5 | 测试文本          |
+------+-----------------+
```

Emoji  case

```sql
SELECT regexp_extract_or_null('😀😊😎', '😀|😊|😎',0);
```

```text
+------------------------------------------------------------+
| regexp_extract_or_null('😀😊😎', '😀|😊|😎',0)           |
+------------------------------------------------------------+
| 😀                                                          |
+------------------------------------------------------------+
```

'str' is NULL,return NULL

```sql
SELECT REGEXP_EXTRACT_OR_NULL(NULL, '([a-z]+)', 1);
```

```text
+---------------------------------------------+
| REGEXP_EXTRACT_OR_NULL(NULL, '([a-z]+)', 1) |
+---------------------------------------------+
| NULL                                        |
+---------------------------------------------+
```

'pattern' is NULL,return NULL

```sql
SELECT REGEXP_EXTRACT_OR_NULL('Hello World', NULL, 1);
```

```text
+------------------------------------------------+
| REGEXP_EXTRACT_OR_NULL('Hello World', NULL, 1) |
+------------------------------------------------+
| NULL                                           |
+------------------------------------------------+
```

'pos' is NULL ,return NULL

```sql
SELECT REGEXP_EXTRACT_OR_NULL('Hello World', '([a-z]+)', NULL);
```

```text
+---------------------------------------------------------+
| REGEXP_EXTRACT_OR_NULL('Hello World', '([a-z]+)', NULL) |
+---------------------------------------------------------+
| NULL                                                    |
+---------------------------------------------------------+
```

ALL parameters are NULL,return NULL;

```sql
SELECT REGEXP_EXTRACT_OR_NULL(NULL,NULL,NULL);
```

```text
+----------------------------------------+
| REGEXP_EXTRACT_OR_NULL(NULL,NULL,NULL) |
+----------------------------------------+
| NULL                                   |
+----------------------------------------+
```