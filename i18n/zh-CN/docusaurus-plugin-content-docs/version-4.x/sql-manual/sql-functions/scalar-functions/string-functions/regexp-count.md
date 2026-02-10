---
{
    "title": "REGEXP_COUNT",
    "language": "zh-CN",
    "description": "这是一个用于统计字符串中匹配给定正则表达式模式的字符数量的函数。输入包括用户提供的字符串和正则表达式模式。返回值为匹配字符的总数量；如果未找到匹配项，则返回 0。 需要注意的是，在处理字符集匹配时，应使用 Utf-8 标准字符类。这确保函数能够正确识别和处理来自不同语言的各种字符。"
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
## 描述
这是一个用于统计字符串中匹配给定正则表达式模式的字符数量的函数。输入包括用户提供的字符串和正则表达式模式。返回值为匹配字符的总数量；如果未找到匹配项，则返回 0。
需要注意的是，在处理字符集匹配时，应使用 Utf-8 标准字符类。这确保函数能够正确识别和处理来自不同语言的各种字符。

'str' 参数为 “string” 类型，是用户希望通过正则表达式进行匹配的字符串。

 'pattern' 参数为 “string” 类型，是用于匹配字符串的正则表达式模式字符串。

 返回值为 “int” 类型，表示成功匹配的字符数量。

如果 `pattern` 参数不符合正则表达式，则抛出错误

支持的字符匹配种类 : https://github.com/google/re2/wiki/Syntax

## 语法

```sql
REGEXP_COUNT(<str>, <pattern>)
```

## 参数

| 参数 | 描述 |
| --   | --  |
| `<str>` | 该参数为 “string” 类型，是通过正则表达式匹配得到的目标值。|
| `<pattern>` |该参数为 “string” 类型，是一个正则表达式，用于匹配符合该模式规则的字符串。|

## 返回值

- 返回正则表达式 “pattern” 在字符串 “str” 中的匹配字符数量，返回类型为 “int”。若没有字符匹配，则返回 0。
- 如果'str' 或者 'parttern' 为NULL ,或者他们都为NULL，返回NULL;
- 如果 'pattern' 不符合正则表达式规则，则是错误的用法，抛出error;

字符串区匹配包含转义字符的表达式返回结果

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

普通的字符':'的正则表达式的字符串匹配结果

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
字符串去匹配包含有两个中括号的正则表达式的返回结果

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


 'patter' 为 NULL值的情况

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


 'str' 为 NULL 值的情况

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

都为NULL值的情况


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


插入一定变量值，从存储行取出变量去匹配的返回结果

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
插入一定变量值，从存储行取出变量去匹配的返回结果，但正则表达式为常量

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

emoji字符匹配

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

如果 'pattern' 参数不符合正则表达式，则抛出错误

```sql

SELECT regexp_count('Hello, World!', '[[:punct:');
```

```text

ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[INVALID_ARGUMENT]Could not compile regexp pattern: [[:punct:
Error: missing ]: [[:punct:
```