---
{
    "title": "CONCAT_WS",
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

使用第一个参数 sep 作为连接符，将第二个参数以及后续所有参数 (或 ARRAY 中的所有字符串) 拼接成一个字符串。特殊情况：

- 如果分隔符是 NULL，返回 NULL。

`CONCAT_WS`函数不会跳过空字符串，会跳过 NULL 值。

## 语法

```sql
CONCAT_WS ( <sep> , <str> [ , <str> ] )
CONCAT_WS ( <sep> , <array> )
```

## 参数

| 参数    | 说明              |
|-------|-----------------|
| `<sep>` | 拼接字符串的连接符       |
| `<str>` | 需要被拼接的字符串       |
| `<array>` | 需要被拼接的 array 数组 |


## 返回值

参数 `<sep>` 或者 `<array>` 数组使用 `<str>` 拼接后字符串。特殊情况：

- 如果分隔符是 NULL，返回 NULL。

## 举例

将字符串通过 or 拼接到一起

```sql
SELECT CONCAT_WS("or", "d", "is"),CONCAT_WS(NULL, "d", "is"),CONCAT_WS('or', 'd', NULL, 'is')
```

```text
+----------------------------+----------------------------+------------------------------------------+
| concat_ws('or', 'd', 'is') | concat_ws(NULL, 'd', 'is') | concat_ws('or', 'd', NULL, 'is') |
+----------------------------+----------------------------+------------------------------------------+
| doris                      | NULL                       | doris                              |
+----------------------------+----------------------------+------------------------------------------+
```

将 array 数组通过 or 拼接到一起

```sql
SELECT CONCAT_WS("or", ["d", "is"]),CONCAT_WS(NULL, ["d", "is"]),CONCAT_WS("or", ["d", NULL,"is"])
```

```text
+------------------------------+------------------------------+------------------------------------+
| concat_ws('or', ['d', 'is']) | concat_ws(NULL, ['d', 'is']) | concat_ws('or', ['d', NULL, 'is']) |
+------------------------------+------------------------------+------------------------------------+
| doris                        | NULL                         | doris                              |
+------------------------------+------------------------------+------------------------------------+
```