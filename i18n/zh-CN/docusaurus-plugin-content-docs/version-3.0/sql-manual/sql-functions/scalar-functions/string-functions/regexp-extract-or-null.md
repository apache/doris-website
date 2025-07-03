---
{
    "title": "REGEXP_EXTRACT_OR_NULL",
    "language": "ZH-CN"
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

从文本字符串中提取与目标正则表达式模式匹配的第一个子字符串，并根据表达式组索引从中提取特定组。

需要注意的是，在处理字符集匹配时，应使用 Utf-8 标准字符类。这确保函数能够正确识别和处理来自不同语言的各种字符。


:::info
从 Apache Doris 3.0.2 版本开始支持
:::

## 语法

```sql
REGEXP_EXTRACT_OR_NULL(<str>, <pattern>, <pos>)
```

## 参数

| Parameter | Description |
| -- | -- |
| `<str>` | 字符串参数。表示要执行正则表达式匹配的文本字符串。此字符串可以包含任意字符组合，函数将在其中搜索与<pattern>匹配的子字符串。 |
| `<pattern>` |字符串参数。它是目标正则表达式模式。此模式可以包含各种正则表达式元字符和字符类，精确定义要匹配的子字符串规则。 |
| `<pos>` |整数参数。表示要提取的表达式组的索引。索引从 1 开始。如果<pos>设置为 0，则返回整个第一个匹配的子字符串。如果<pos>为负数或超过模式中表达式组的数量，函数将返回 NULL |

## 返回值

返回字符串类型，结果为与<pattern>匹配的部分。

 如果输入的<pos>为 0，则返回整个第一个匹配的子字符串。
 如果输入的<pos>无效（负数或超过表达式组数量），则返回 NULL。
 如果正则表达式匹配失败，则返回 NULL。

## 例子

从匹配中提取特定组,正则表达式([[:lower:]]+)C([[:lower:]]+)查找由 'C' 分隔的一个或多个小写字母序列。索引为 1 的组对应第一个小写字母序列，因此返回 'b'。

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

返回整个匹配的子字符串当<pos>为 0 时，返回匹配模式的整个第一个子字符串。

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

无效的组索引,由于模式只有 2 个组，索引 5 超出范围，因此返回 NULL。

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
不匹配的正则表达式,字符串 'AbCdE' 中没有部分完全匹配模式

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

中文字符匹配,模式(\p{Han}+)(.+)首先匹配一个或多个中文字符，然后匹配任何剩余字符。索引为 2 的组表示中文字符后的非中文部分。

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

向表中插入数据并执行提取
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

表情包例子

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

'str' 是NULL,返回NULL

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

'pattern' 是NULL,返回NULL

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

'pos' 是NULL,返回NULL

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

全部参数都是NULL,返回NULL

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