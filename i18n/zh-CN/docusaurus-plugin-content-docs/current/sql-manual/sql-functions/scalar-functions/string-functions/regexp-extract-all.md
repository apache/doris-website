---
{
    "title": "REGEXP_EXTRACT_ALL",
    "language": "zh-CN",
    "description": "REGEXPEXTRACTALL 函数用于对给定字符串str执行正则表达式匹配，所有与指定 pattern 匹配的文本串当中的与第一个子模式匹配的部分。为了使函数返回表示模式匹配部分的字符串数组，该模式必须与输入字符串 str 的一部分完全匹配。如果没有匹配项，或模式不包含任何子模式，"
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

REGEXP_EXTRACT_ALL 函数用于对给定字符串str执行正则表达式匹配，所有与指定 pattern 匹配的文本串当中的与第一个子模式匹配的部分。为了使函数返回表示模式匹配部分的字符串数组，该模式必须与输入字符串 str 的一部分完全匹配。如果没有匹配项，或模式不包含任何子模式，则返回空字符串。

需要注意的是，在处理字符集匹配时，应使用 Utf-8 标准字符类。这确保函数能够正确识别和处理来自不同语言的各种字符。

如果 'pattern' 参数不符合正则表达式，则抛出错误

默认支持的字符匹配种类 : https://github.com/google/re2/wiki/Syntax

Doris 支持通过会话变量 `enable_extended_regex`（默认为 `false`）来启用更高级的正则表达式功能，例如 look-around 零宽断言。

会话变量`enable_extended_regex`设置为`true`时,
支持的字符匹配种类 : https://www.boost.org/doc/libs/latest/libs/regex/doc/html/boost_regex/syntax/perl_syntax.html

## 语法

```sql
REGEXP_EXTRACT_ALL(<str>, <pattern>)
```

## 参数

| 参数 | 描述 |
| -- | -- |
| `<str>` | 该参数为 String 类型。表示要执行正则表达式匹配的输入字符串。可以是字面值字符串或包含字符串数据的表列引用。|
| `<pattern>` | 该参数也为 String 类型。指定用于与输入字符串 <str> 匹配的正则表达式模式。该模式可以包含各种正则表达式构造，如字符类、量词和子模式。|

## 返回值

函数返回表示输入字符串中与指定正则表达式的第一个子模式匹配部分的字符串数组。返回类型为 String 值数组。如果未找到匹配项，或模式没有子模式，则返回空数组。

## 例子

围绕 'C' 的小写字母基本匹配,在这个示例中，模式([[:lower:]]+)C([[:lower:]]+)匹配字符串中一个或多个小写字母后跟 'C' 再跟一个或多个小写字母的部分。'C' 之前的第一个子模式([[:lower:]]+)匹配 'b'，因此结果为['b']。

```sql
mysql> SELECT regexp_extract_all('AbCdE', '([[:lower:]]+)C([[:lower:]]+)');
+--------------------------------------------------------------+
| regexp_extract_all('AbCdE', '([[:lower:]]+)C([[:lower:]]+)') |
+--------------------------------------------------------------+
| ['b']                                                        |
+--------------------------------------------------------------+
```
字符串中的多个匹配项,在这里，模式在字符串中匹配两个部分。第一个匹配的第一个子模式匹配 'b'，第二个匹配的第一个子模式匹配 'f'。因此结果为['b', 'f']。

```sql
mysql> SELECT regexp_extract_all('AbCdEfCg', '([[:lower:]]+)C([[:lower:]]+)');
+-----------------------------------------------------------------+
| regexp_extract_all('AbCdEfCg', '([[:lower:]]+)C([[:lower:]]+)') |
+-----------------------------------------------------------------+
| ['b','f']                                                       |
+-----------------------------------------------------------------+
```

从键值对中提取键, 该模式匹配字符串中的键值对。第一个子模式捕获键，因此结果为键的数组['abc', 'def', 'ghi']。

```sql
mysql> SELECT regexp_extract_all('abc=111, def=222, ghi=333','("[^"]+"|\\w+)=("[^"]+"|\\w+)');
+--------------------------------------------------------------------------------+
| regexp_extract_all('abc=111, def=222, ghi=333', '("[^"]+"|\w+)=("[^"]+"|\w+)') |
+--------------------------------------------------------------------------------+
| ['abc','def','ghi']                                                            |
+--------------------------------------------------------------------------------+
```
匹配汉字, 模式(\p{Han}+)(.+)首先通过第一个子模式(\p{Han}+)匹配一个或多个汉字，因此结果为['这是一段中文']。

```sql
mysql> select regexp_extract_all('这是一段中文 This is a passage in English 1234567', '(\\p{Han}+)(.+)');
+------------------------------------------------------------------------------------------------+
| regexp_extract_all('这是一段中文 This is a passage in English 1234567', '(\p{Han}+)(.+)')       |
+------------------------------------------------------------------------------------------------+
| ['这是一段中文']                                                                               |
+------------------------------------------------------------------------------------------------+
```

插入数据并使用 REGEXP_EXTRACT_ALL

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


没有匹配到，返回空字符串

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
emoji字符匹配

```sql
mysql> SELECT REGEXP_EXTRACT_ALL('👩‍💻,👨‍🚀', '(💻|🚀)');
+--------------------------------------------------------------+
| REGEXP_EXTRACT_ALL('👩‍💻,👨‍🚀', '(💻|🚀)')                     |
+--------------------------------------------------------------+
| ['💻','🚀']                                                  |
+--------------------------------------------------------------+
```

'Str' 是 NULL,返回 NULL

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

'pattern' 是 NULL,返回 NULL

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

全部参数都是 NULL，返回 NULL

```sql
SELECT regexp_extract_all(NULL,NULL);
```

```text
+-------------------------------+
| regexp_extract_all(NULL,NULL) |
+-------------------------------+
| NULL                          |
+--------
```


如果 'pattern' 参数不符合正则表达式，则抛出错误

```sql
SELECT regexp_extract_all('hello (world) 123', '([[:alpha:]+');
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[INVALID_ARGUMENT]Could not compile regexp pattern: ([[:alpha:]+
Error: missing ]: [[:alpha:]+
```

高级的正则表达式
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