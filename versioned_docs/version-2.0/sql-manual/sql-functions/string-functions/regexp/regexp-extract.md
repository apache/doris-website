---
{
    "title": "REGEXP_EXTRACT",
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
This is a function used to perform a regular match on a given string `STR` and extract the `POS`-th matching part that conforms to the specified pattern. For the function to return a matching result, the pattern must exactly match some part of the `STR`. 

- If no match is found, an empty string will be returned.
- When performing character set matching, Unicode standard character classes should be used. For example, to match Chinese characters, use `\p{Han}`.

1. The `str` parameter is of 'string' type, representing the string to be subjected to regular matching.
2. The `pattern` parameter is of 'string' type, representing the target regular expression pattern.
3. The `pos` parameter is of 'integer' type, used to specify the position in the string from which to start searching for the regular expression match. The position starts from 1, and this parameter must be specified.

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

## Example

### Example 1: Extract the first matching part
Explain: In this example, the regular expression ([[:lower:]]+)C([[:lower:]]+) matches the part of the string where one or more lowercase letters are followed by 'C' and then one or more lowercase letters. The first capturing group ([[:lower:]]+) before 'C' matches 'b', so the result is 'b'.

```sql
mysql> SELECT regexp_extract('AbCdE', '([[:lower:]]+)C([[:lower:]]+)', 1);
+-------------------------------------------------------------+
| regexp_extract('AbCdE', '([[:lower:]]+)C([[:lower:]]+)', 1) |
+-------------------------------------------------------------+
| b                                                           |
+-------------------------------------------------------------+
```
### Example 2: Extract the second matching part
Explain: Here, the second capturing group ([[:lower:]]+) after 'C' matches 'd', so the result is 'd'.

```sql
mysql> SELECT regexp_extract('AbCdE', '([[:lower:]]+)C([[:lower:]]+)', 2);
+-------------------------------------------------------------+
| regexp_extract('AbCdE', '([[:lower:]]+)C([[:lower:]]+)', 2) |
+-------------------------------------------------------------+
| d                                                           |
+-------------------------------------------------------------+
```
### Example 3: Match Chinese characters
Explain: The pattern (\p{Han}+)(.+) first matches one or more Chinese characters (\p{Han}+) and then matches the remaining part of the string ((.+)). The second capturing group matches the non - Chinese part of the string, so the result is 'This is a passage in English 1234567'.

```sql
mysql> select regexp_extract('这是一段中文 This is a passage in English 1234567', '(\\p{Han}+)(.+)', 2);
+-----------------------------------------------------------------------------------------------+
| regexp_extract('这是一段中文 This is a passage in English 1234567', '(\p{Han}+)(.+)', 2)       |
+-----------------------------------------------------------------------------------------------+
| This is a passage in English 1234567                                                          |
+-----------------------------------------------------------------------------------------------+
```

### Example 4: Insert variable values and perform matching
Explain: This example inserts data into a table and then uses the REGEXP_EXTRACT function to extract matching parts from the stored strings based on the stored patterns and positions.

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

### Example 5: Test with a pattern that has no match
### Since the pattern ([[:digit:]]+) (one or more digits) does not match any part of the string 'AbCdE', an empty string is returned.

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
