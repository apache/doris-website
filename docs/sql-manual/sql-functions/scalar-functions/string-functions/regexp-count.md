---
{
    "title": "REGEXP_COUNT",
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
This is a function to count the number of characters in a string that match a given regular expression pattern. The input consists of a user-provided string and a regular expression pattern. The return value is n the total count of matching characters; if no matches are found, it returns 0.
return type is 'int',first parameter is 'string' type,second parameter is 'string' tyepe;



## Syntax

```sql
REGEXP_COUNT(<str>, <pattern>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<str>` | The parameter is 'string' type,it is the dest value which matched by the regexp expression
| `<pattern>` | The parameter is 'string' type, it is a regexp expression and it is used to match the string which meet the regular of the pattern
## Return Value

- Returns number of matches for a regular expression 'pattern' within a 'str',it is 'int',if no character can be matched, return 0;

## Examples

### test with  Escape Character 

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

### test with comman character match

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
### test with double Square Brackets

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

### test with insert value;

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
### test with insert value with one is const,one not;

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