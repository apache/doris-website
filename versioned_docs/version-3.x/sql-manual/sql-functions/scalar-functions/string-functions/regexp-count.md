---
{
    "title": "REGEXP_COUNT",
    "language": "en",
    "description": "<!-- Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements."
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
This is a function to count the number of characters in a string that match a given regular expression pattern. The input consists of a user-provided string and a regular expression pattern. The return value is n the total count of matching characters; if no matches are found, it returns 0.

'str' paratemer is 'string' type,it is the string of usr want to match by a regexp expression.

'pattern' paratemer is 'string' type, it is the string of a regexp regular which will be used to match the string;

It should be noted that when handling character set matching, Utf-8 standard character classes should be used. This ensures that functions can correctly identify and process various characters from different languages.

Support character match classes : https://github.com/google/re2/wiki/Syntax

## Syntax

```sql
REGEXP_COUNT(<str>, <pattern>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<str>` | The parameter is 'string' type,it is the dest value which matched by the regexp expression. |
| `<pattern>` | The parameter is 'string' type, it is a regexp expression and it is used to match the string which meet the regular  of the pattern. |
## Return Value

- Returns number of matches for a regular expression 'pattern' within a 'str',it is 'int',if no character can be matched, return 0;
If pattern is NULL or str is NULL or both are NULL,return NULL;
If pattern is not allowed regexp regular , it will throw error,it`s a wrong for this action;

## Examples

The string region matching against an expression containing escape characters and return the result

```sql
SELECT regexp_count('a.b:c;d', '[\\\\.:;]');
```

```text
+--------------------------------------+
| regexp_count('a.b:c;d', '[\\\\.:;]') |
+--------------------------------------+
|                                    3 |
+--------------------------------------+
```

The string matching result of the regular expression for the ordinary character ':'.

```sql
SELECT regexp_count('a.b:c;d', ':');
```

```text
+------------------------------+
| regexp_count('a.b:c;d', ':') |
+------------------------------+
|                            1 |
+------------------------------+
```
The return result when matching a string against a regular expression containing two square brackets.

```sql
SELECT regexp_count('Hello, World!', '[[:punct:]]');
```

```text
+----------------------------------------------+
| regexp_count('Hello, World!', '[[:punct:]]') |
+----------------------------------------------+
|                                            2 |
+----------------------------------------------+
```


Pattern is NULL case

```sql
SELECT regexp_count("abc",NULL);
```
```text
+------------------------+
| regexp_count("abc",NULL) |
+------------------------+
|                   NULL |
+------------------------+
```


Str is NULL case

```sql
SELECT regexp_count(NULL,"abc");
```
```text
+------------------------+
| regexp_count(NULL,"abc") |
+------------------------+
|                   NULL |
+------------------------+
```

Both are NULL


```sql
SELECT regexp_count(NULL,NULL);
```
```text
+------------------------+
| regexp_count(NULL,NULL) |
+------------------------+
|                   NULL |
+------------------------+
```

The return result of inserting certain variable values and then retrieving the variables from the stored rows for matching.

```sql

CREATE TABLE test_table_for_regexp_count (
        id INT,
        text_data VARCHAR(500),
        pattern VARCHAR(100)
    ) PROPERTIES ("replication_num"="1");

INSERT INTO test_table_for_regexp_count VALUES
    (1, 'HelloWorld', '[A-Z][a-z]+'),    
    (2, 'apple123', '[a-z]{5}[0-9]'),    
    (3, 'aabbcc', '(aa|bb|cc)'),         
    (4, '123-456-7890', '[0-9][0-9][0-9]'), 
    (5, 'test,data', ','),              
    (6, 'a1b2c3', '[a-z][0-9]'),         
    (7, 'book keeper', 'oo|ee'),        
    (8, 'ababab', '(ab)(ab)(ab)'),       
    (9, 'aabbcc', '(aa|bb|cc)'),         
    (10, 'apple,banana', '[aeiou][a-z]+');

SELECT id, regexp_count(text_data, pattern) as count_result FROM test_table_for_regexp_count ORDER BY id;

```

```text
+------+--------------+
| id   | count_result |
+------+--------------+
|    1 |            2 |
|    2 |            1 |
|    3 |            3 |
|    4 |            3 |
|    5 |            1 |
|    6 |            3 |
|    7 |            2 |
|    8 |            1 |
|    9 |            3 |
|   10 |            2 |
+------+--------------+

```
The return result of inserting certain variable values, retrieving the variables from stored rows for matching, with the regular expression being a constant.

```sql
CREATE TABLE test_table_for_regexp_count (
        id INT,
        text_data VARCHAR(500),
        pattern VARCHAR(100)
    ) PROPERTIES ("replication_num"="1");

INSERT INTO test_table_for_regexp_count VALUES
    (1, 'HelloWorld', '[A-Z][a-z]+'),    
    (2, 'apple123', '[a-z]{5}[0-9]'),    
    (3, 'aabbcc', '(aa|bb|cc)'),         
    (4, '123-456-7890', '[0-9][0-9][0-9]'), 
    (5, 'test,data', ','),              
    (6, 'a1b2c3', '[a-z][0-9]'),         
    (7, 'book keeper', 'oo|ee'),        
    (8, 'ababab', '(ab)(ab)(ab)'),       
    (9, 'aabbcc', '(aa|bb|cc)'),         
    (10, 'apple,banana', '[aeiou][a-z]+');

SELECT id, regexp_count(text_data, 'e') as count_e FROM test_table_for_regexp_count WHERE text_data IS NOT NULL ORDER BY id;
```

```text
+------+---------+
| id   | count_e |
+------+---------+
|    1 |       1 |
|    2 |       1 |
|    3 |       0 |
|    4 |       0 |
|    5 |       1 |
|    6 |       0 |
|    7 |       3 |
|    8 |       0 |
|    9 |       0 |
|   10 |       1 |
+------+---------+
```

Emoji regexp count

```sql
SELECT regexp_count('🍔🍟🍕🌍', '🍔|🍟|🍕');
```

```text
+----------------------------------------------------+
| regexp_count('🍔🍟🍕🌍', '🍔|🍟|🍕')                             |
+----------------------------------------------------+
|                                                  3 |
+----------------------------------------------------+
```

If the 'pattern' is not allowed the regexp regular, thorw error

```sql

SELECT regexp_count('Hello, World!', '[[:punct:');
```

```text

ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[INVALID_ARGUMENT]Could not compile regexp pattern: [[:punct:
Error: missing ]: [[:punct:
```