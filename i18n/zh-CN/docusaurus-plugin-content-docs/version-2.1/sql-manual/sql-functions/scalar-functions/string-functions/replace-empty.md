---
{
    "title": "REPLACE_EMPTY",
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

REPLACE_EMPTY 函数用于将字符串中的一部分字符替换为其他字符。和 [REPLACE](./repeat.md) 函数不同的是，当 `old` 为空字符串时，会将 `new` 字符串插入到 `str` 字符串的每个字符前，以及 `str` 字符串的最后。

除此之外，其他行为和 `REPLACE()` 函数完全一致。

该函数主要用于兼容 Presto、Trino，其行为了 Presto、Trino 中的 `REPLACE()` 函数完全一致。

自 2.1.5 版本支持。

## 语法

```sql
REPLACE_EMPTY ( <str>, <old>, <new> )
```

## 参数

| 参数      | 说明                                                                                            |
|---------|-----------------------------------------------------------------------------------------------|
| `<str>` | 需要被替换的字符串                                                                                     |
| `<old>` | 需要被替换掉的子字符串，如果`<old>`不在`<str>`中，则不会进行替换，如果 `<old>` 为空字符串时，会将 `<new>` 字符串插入到 `<str>` 字符串的每个字符前 |
| `<new>` | 用于替换 `<old>` 的新子字符串                                                                           |

## 返回值

返回替换掉子字符串后的新字符串。特殊情况：

- 任意参数中有一个为 NULL，则返回 NULL
- 如果 `old` 为空字符串时，则返回将 `new` 字符串插入到 `str` 字符串的每个字符前的字符串

## 举例


```sql
SELECT replace('hello world', 'world', 'universe');
```

```text
+---------------------------------------------+
| replace('hello world', 'world', 'universe') |
+---------------------------------------------+
| hello universe                              |
+---------------------------------------------+
```

```sql
SELECT replace_empty("abc", '', 'xyz');
```

```text
+---------------------------------+
| replace_empty('abc', '', 'xyz') |
+---------------------------------+
| xyzaxyzbxyzcxyz                 |
+---------------------------------+
```

```sql
SELECT replace_empty("", "", "xyz");
```

```text
+------------------------------+
| replace_empty('', '', 'xyz') |
+------------------------------+
| xyz                          |
+------------------------------+
```
