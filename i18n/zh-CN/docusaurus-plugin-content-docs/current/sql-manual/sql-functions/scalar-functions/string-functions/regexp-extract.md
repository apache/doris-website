---
{
    "title": "REGEXP_EXTRACT",
    "language": "zh-CN",
    "description": "此函数用于对给定字符串 STR 执行正则匹配，并提取符合指定模式的第 POS 个匹配部分。若函数要返回匹配结果，该模式必须与 STR 的某些部分完全匹配。"
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
此函数用于对给定字符串 STR 执行正则匹配，并提取符合指定模式的第 POS 个匹配部分。若函数要返回匹配结果，该模式必须与 STR 的某些部分完全匹配。

若未找到匹配项，将返回空字符串。
需要注意的是，在处理字符集匹配时，应使用 Utf-8 标准字符类。这确保函数能够正确识别和处理来自不同语言的各种字符。


str参数为'string' 类型，表示要进行正则匹配的字符串。
pattern参数为'string' 类型，表示目标正则表达式模式。
pos参数为 'integer' 类型，用于指定字符串中开始搜索正则表达式匹配的位置。位置从 1 开始，此参数必须指定。

如果 'pattern' 参数不符合正则表达式，则抛出错误

默认支持的字符匹配种类 : https://github.com/google/re2/wiki/Syntax

Doris 支持通过会话变量 `enable_extended_regex`（默认为 `false`）来启用更高级的正则表达式功能，例如 look-around 零宽断言。

会话变量`enable_extended_regex`设置为`true`时,
支持的字符匹配种类 : https://www.boost.org/doc/libs/latest/libs/regex/doc/html/boost_regex/syntax/perl_syntax.html

## 语法
```sql
REGEXP_EXTRACT(<str>, <pattern>, <pos>)
```
## 参数

| 参数 | 描述 |
| -- | -- |
| `<str>` | 需要进行正则匹配的列，类型为'string'。|
| `<pattern>` | 	目标正则表达式模式，类型为'string'。|
| `<pos>` | 用于指定字符串中开始搜索正则表达式匹配位置的参数，为整数值，表示字符串中的字符位置（从 1 开始）。pos必须指定。 |

## 返回值

模式的匹配部分，类型为 Varchar。若未找到匹配项，将返回空字符串

## 示例

提取第一个匹配部分,在此示例中，正则表达式([[:lower:]]+)C([[:lower:]]+)匹配字符串中一个或多个小写字母后跟 'C' 再跟一个或多个小写字母的部分。'C' 之前的第一个捕获组([[:lower:]]+)匹配 'b'，因此结果为 'b'

```sql
mysql> SELECT regexp_extract('AbCdE', '([[:lower:]]+)C([[:lower:]]+)', 1);
+-------------------------------------------------------------+
| regexp_extract('AbCdE', '([[:lower:]]+)C([[:lower:]]+)', 1) |
+-------------------------------------------------------------+
| b                                                           |
+-------------------------------------------------------------+
```
提取第二个匹配部分,这里，'C' 之后的第二个捕获组([[:lower:]]+)匹配 'd'，因此结果为 'd'。

```sql
mysql> SELECT regexp_extract('AbCdE', '([[:lower:]]+)C([[:lower:]]+)', 2);
+-------------------------------------------------------------+
| regexp_extract('AbCdE', '([[:lower:]]+)C([[:lower:]]+)', 2) |
+-------------------------------------------------------------+
| d                                                           |
+-------------------------------------------------------------+
```
匹配中文字符,模式(\p{Han}+)(.+)首先匹配一个或多个中文字符(\p{Han}+)，然后匹配字符串的剩余部分((.+))。第二个捕获组匹配字符串的非中文部分，因此结果为 'This is a passage in English 1234567'。

```sql
mysql> select regexp_extract('这是一段中文 This is a passage in English 1234567', '(\\p{Han}+)(.+)', 2);
+-----------------------------------------------------------------------------------------------+
| regexp_extract('这是一段中文 This is a passage in English 1234567', '(\p{Han}+)(.+)', 2)       |
+-----------------------------------------------------------------------------------------------+
| This is a passage in English 1234567                                                          |
+-----------------------------------------------------------------------------------------------+
```

插入变量值并执行匹配,此示例向表中插入数据，然后使用 REGEXP_EXTRACT 函数根据存储的模式和位置从存储的字符串中提取匹配部分。

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

无匹配的模式,由于模式([[:digit:]]+)（一个或多个数字）与字符串 'AbCdE' 的任何部分都不匹配，因此返回空字符串

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


emoji字符匹配

```sql
SELECT regexp_extract('Text 😊 More 😀', '😊|😀',0);

```

```text
+------------------------------------------------------+
| regexp_extract('Text 😊 More 😀', '😊|😀',0)                 |
+------------------------------------------------------+
| 😊                                                     |
+------------------------------------------------------+
1 row in set (0.02 sec)
```

'str' 是NULL,则返回NULL

```sql
mysql> SELECT REGEXP_EXTRACT(NULL, '([a-z]+)', 1);
+-------------------------------------+
| REGEXP_EXTRACT(NULL, '([a-z]+)', 1) |
+-------------------------------------+
| NULL                                |
+-------------------------------------+
```

'pattern' 是NULL,则返回NULL

```sql
mysql> SELECT REGEXP_EXTRACT('Hello World', NULL, 1);
+----------------------------------------+
| REGEXP_EXTRACT('Hello World', NULL, 1) |
+----------------------------------------+
| NULL                                   |
+----------------------------------------+
```

'pos' 是NULL,则返回NULL

```sql
mysql> SELECT REGEXP_EXTRACT('Hello World', '([a-z]+)', NULL);
+-------------------------------------------------+
| REGEXP_EXTRACT('Hello World', '([a-z]+)', NULL) |
+-------------------------------------------------+
| NULL                                            |
+-------------------------------------------------+
```

全部参数是NULL,则返回NULL

```sql
mysql> SELECT REGEXP_EXTRACT(NULL, NULL, NULL);
+----------------------------------+
| REGEXP_EXTRACT(NULL, NULL, NULL) |
+----------------------------------+
| NULL                             |
+----------------------------------+
```

如果 'pattern' 参数不符合正则表达式，则抛出错误

```sql
SELECT regexp_extract('AbCdE', '([[:digit:]]+', 1);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[INVALID_ARGUMENT]Could not compile regexp pattern: ([[:digit:]]+
Error: missing ): ([[:digit:]]+
```

高级的正则表达式
```sql
SELECT regexp_extract('foo123bar456baz', '(?<=foo)(\\d+)(?=bar)', 1);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]Invalid regex pattern: (?<=foo)(\d+)(?=bar). Error: invalid perl operator: (?<
```

```sql
SET enable_extended_regex = true;
SELECT regexp_extract('foo123bar456baz', '(?<=foo)(\\d+)(?=bar)', 1);
```
```text
+---------------------------------------------------------------+
| regexp_extract('foo123bar456baz', '(?<=foo)(\\d+)(?=bar)', 1) |
+---------------------------------------------------------------+
| 123                                                           |
+---------------------------------------------------------------+
```