---
{
    "title": "REGEXP_REPLACE",
    "language": "zh-CN"
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

字符串 STR 进行正则匹配，将匹配 pattern 的部分替换为 repl。

- 字符集匹配需要使用 Unicode 标准字符类型。例如，匹配中文请使用 `\p{Han}`。

## 语法

```sql
REGEXP_REPLACE(<str>, <pattern>, <repl>, [flag])
```

## 参数

| 参数 | 描述 |
| -- | -- |
| `<str>` | 需要进行正则匹配的列。|
| `<pattern>` | 目标模式。|
| `<repl>` | 用于替换匹配模式的字符串。|
| `[flag]`| 可选参数，用于设置是否允许忽略不合法的转义字符。例如 `\{` 等价于 `{`。3.0.7版本开始支持｜

## 返回值

替换之后的结果。类型是 `Varchar`。

## 举例

```sql
mysql> SELECT regexp_replace('a b c', ' ', '-');
+-----------------------------------+
| regexp_replace('a b c', ' ', '-') |
+-----------------------------------+
| a-b-c                             |
+-----------------------------------+

mysql> SELECT regexp_replace('a b c', '(b)', '<\\1>');
+----------------------------------------+
| regexp_replace('a b c', '(b)', '<\1>') |
+----------------------------------------+
| a <b> c                                |
+----------------------------------------+

mysql> select regexp_replace('这是一段中文 This is a passage in English 1234567', '\\p{Han}+', '123');
+---------------------------------------------------------------------------------------------+
| regexp_replace('这是一段中文 This is a passage in English 1234567', '\p{Han}+', '123')       |
+---------------------------------------------------------------------------------------------+
| 123This is a passage in English 1234567                                                     |
+---------------------------------------------------------------------------------------------+

mysql> select regexp_replace('{"abc":5},{"def":78}', '\\}\\,\\{', '\\}&&\\{');
+-----------------------------------------------------------------+
| regexp_replace('{"abc":5},{"def":78}', '\\}\\,\\{', '\\}&&\\{') |
+-----------------------------------------------------------------+
| {"abc":5"def":78}                                               |
+-----------------------------------------------------------------+

mysql> select regexp_replace('{"abc":5},{"def":78}', '\\}\\,\\{', '\\}&&\\{', 'IGNORE_INVALID_ESCAPE');
+------------------------------------------------------------------------------------------+
| regexp_replace('{"abc":5},{"def":78}', '\\}\\,\\{', '\\}&&\\{', 'IGNORE_INVALID_ESCAPE') |
+------------------------------------------------------------------------------------------+
| {"abc":5}&&{"def":78}                                                                    |
+------------------------------------------------------------------------------------------+
```